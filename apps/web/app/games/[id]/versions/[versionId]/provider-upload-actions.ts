"use server";

// Sprint 2.11b — Google Play AAB Upload. Este fluxo baixa o AAB do
// Storage e reenvia à Google dentro do mesmo request (sem worker/queue,
// fora de escopo — reservado ao Sprint 2.11d), o que pode exceder o
// timeout padrão de Server Action da Vercel. `maxDuration=120` — alinhado
// ao timeout de "Upload" já congelado em AGSOS-SPEC-008 §10, não um
// número novo inventado por este sprint (ver DECISIONS.md) — está
// declarado no `layout.tsx` desta rota, não aqui: um arquivo `"use server"`
// só pode exportar funções async (regra do Next.js), route segment config
// só é lido de Server Components (page/layout), nunca de um módulo de
// Server Actions importado por um Client Component.

import { cookies } from "next/headers";
import {
  createAdminClient,
  createBuildArtifactsRepository,
  createBuildsRepository,
  createGameVersionsRepository,
  createGamesRepository,
  createProviderUploadsRepository,
  createServerClient,
  createStoreConnectionsRepository,
  createStudioEventsRepository,
} from "@agsos/database";
import { createGooglePlayPublishingAdapter, type GoogleCredentials } from "@agsos/integrations";
import { downloadObject } from "@agsos/storage";
import { providerUploadEvent } from "../../../../../lib/domain-events";

async function getAuthorizedServerClient() {
  const cookieStore = await cookies();
  return createServerClient({
    getAll: () => cookieStore.getAll(),
    set: (name, value, options) => cookieStore.set(name, value, options),
  });
}

// Resolve o `packageName` do Game a partir do BuildArtifact — mesmo padrão
// de consultas separadas (não join aninhado) já usado em
// `builds-repository.ts::listByGame`.
async function resolveGamePackageName(
  serverClient: Awaited<ReturnType<typeof getAuthorizedServerClient>>,
  buildId: string,
): Promise<{ gameId: string; packageName: string | null } | null> {
  const build = await createBuildsRepository(serverClient).getById(buildId);
  if (!build) return null;
  const version = await createGameVersionsRepository(serverClient).getById(build.game_version_id);
  if (!version) return null;
  const game = await createGamesRepository(serverClient).getById(version.game_id);
  if (!game) return null;
  return { gameId: game.id, packageName: game.package_name };
}

export async function setGamePackageName(gameId: string, packageName: string): Promise<{ error?: string }> {
  const serverClient = await getAuthorizedServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const trimmed = packageName.trim();
  if (!/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(trimmed)) {
    return { error: "Package name inválido (formato esperado: com.exemplo.jogo)." };
  }

  try {
    await createGamesRepository(serverClient).update(gameId, {
      package_name: trimmed,
      updated_actor_type: "USER",
      updated_actor_id: user.id,
    });
    return {};
  } catch {
    return { error: "Não foi possível salvar o package name. Verifique sua permissão neste Studio." };
  }
}

async function performUpload(
  serverClient: Awaited<ReturnType<typeof getAuthorizedServerClient>>,
  providerUploadId: string,
  userId: string,
  attempt: number,
): Promise<{ error?: string; versionCode?: number }> {
  const repo = createProviderUploadsRepository(serverClient);
  const providerUpload = await repo.getById(providerUploadId).catch(() => null);
  if (!providerUpload) return { error: "Envio não encontrado." };

  const artifact = await createBuildArtifactsRepository(serverClient).getById(providerUpload.build_artifact_id);
  if (!artifact) return { error: "Artefato não encontrado." };

  const resolved = await resolveGamePackageName(serverClient, artifact.build_id);
  if (!resolved || !resolved.packageName) {
    return { error: "Este Game ainda não tem um Package Name configurado — defina antes de enviar." };
  }

  const connection = await createStoreConnectionsRepository(serverClient).getById(providerUpload.store_connection_id);
  if (!connection) return { error: "Store Connection não encontrada." };

  const eventsRepo = createStudioEventsRepository(serverClient);
  const metadata = { build_artifact_id: artifact.id, store_connection_id: connection.id };
  const startedAt = Date.now();

  await repo.update(providerUploadId, {
    status: "UPLOADING",
    started_at: new Date().toISOString(),
    attempt,
    updated_actor_type: "USER",
    updated_actor_id: userId,
  });
  await eventsRepo.create({
    studio_id: providerUpload.studio_id,
    ...providerUploadEvent("ProviderUploadStarted", {
      provider: "GOOGLE_PLAY",
      buildArtifactId: artifact.id,
      storeConnectionId: connection.id,
      attempt,
    }),
    event_version: 1,
    aggregate_type: "provider_upload",
    aggregate_id: providerUploadId,
    metadata,
    actor_type: "USER",
    actor_id: userId,
  });

  const admin = createAdminClient();
  let secret: string | null;
  try {
    secret = await createStoreConnectionsRepository(admin).getSecret(connection.id);
  } catch {
    secret = null;
  }
  if (!secret) {
    return await fail(repo, eventsRepo, providerUpload.studio_id, providerUploadId, artifact.id, connection.id, null, "MISSING_CREDENTIAL", startedAt, attempt, userId, "Nenhuma credencial cadastrada para esta Store Connection.");
  }

  let credentials: GoogleCredentials;
  try {
    credentials = JSON.parse(secret) as GoogleCredentials;
  } catch {
    return await fail(repo, eventsRepo, providerUpload.studio_id, providerUploadId, artifact.id, connection.id, null, "INVALID_CREDENTIAL", startedAt, attempt, userId, "Credencial armazenada em formato inválido.");
  }
  // packageName da credencial é o "dono" da Store Connection (validado no
  // momento da conexão, Sprint 2.9/2.10); usamos o do Game só como destino
  // do upload em si — se algum dia divergirem, o erro real do Google
  // (403/404) aparece de forma sanitizada, nunca escondido.
  const adapter = createGooglePlayPublishingAdapter({ ...credentials, packageName: resolved.packageName });

  const editResult = await adapter.createEdit();
  if (!editResult.ok) {
    return await fail(repo, eventsRepo, providerUpload.studio_id, providerUploadId, artifact.id, connection.id, null, editResult.code ?? "UNKNOWN", startedAt, attempt, userId, editResult.error);
  }
  const editId = editResult.item.editId;

  try {
    // Mesmo padrão de 2.11a (débito conhecido, registrado em
    // IMPLEMENTATION_LOG.md): baixa o objeto inteiro em memória — dentro do
    // limite de `maxDuration=120` para artefatos de tamanho razoável;
    // arquivos muito grandes são um caso de falha recuperável via Retry,
    // não um bug (ver DECISIONS.md).
    const blob = await downloadObject(admin, { bucket: artifact.storage_bucket, path: artifact.storage_path });
    const buffer = Buffer.from(await blob.arrayBuffer());

    const uploadResult = await adapter.uploadBundle(editId, buffer);
    if (!uploadResult.ok) {
      return await fail(repo, eventsRepo, providerUpload.studio_id, providerUploadId, artifact.id, connection.id, editId, uploadResult.code ?? "UNKNOWN", startedAt, attempt, userId, uploadResult.error);
    }

    const durationMs = Date.now() - startedAt;
    await repo.update(providerUploadId, {
      status: "SUCCEEDED",
      edit_id: editId,
      version_code: uploadResult.item.versionCode,
      completed_at: new Date().toISOString(),
      updated_actor_type: "USER",
      updated_actor_id: userId,
    });
    await eventsRepo.create({
      studio_id: providerUpload.studio_id,
      ...providerUploadEvent("ProviderUploadSucceeded", {
        provider: "GOOGLE_PLAY",
        buildArtifactId: artifact.id,
        storeConnectionId: connection.id,
        editId,
        versionCode: uploadResult.item.versionCode,
        durationMs,
        attempt,
      }),
      event_version: 1,
      aggregate_type: "provider_upload",
      aggregate_id: providerUploadId,
      metadata,
      actor_type: "USER",
      actor_id: userId,
    });
    return { versionCode: uploadResult.item.versionCode };
  } catch {
    return await fail(repo, eventsRepo, providerUpload.studio_id, providerUploadId, artifact.id, connection.id, editId, "UNEXPECTED_ERROR", startedAt, attempt, userId, "Erro inesperado ao enviar o artefato ao Google Play.");
  } finally {
    // Nunca deixar o Edit pendurado (DECISIONS.md) — best-effort, nunca
    // lança, nunca mascara o resultado real do upload já capturado acima.
    await adapter.deleteEdit(editId);
  }
}

async function fail(
  repo: ReturnType<typeof createProviderUploadsRepository>,
  eventsRepo: ReturnType<typeof createStudioEventsRepository>,
  studioId: string,
  providerUploadId: string,
  buildArtifactId: string,
  storeConnectionId: string,
  editId: string | null,
  errorCode: string,
  startedAt: number,
  attempt: number,
  userId: string,
  errorMessage: string,
): Promise<{ error: string }> {
  await repo.update(providerUploadId, {
    status: "FAILED",
    edit_id: editId,
    error_code: errorCode,
    completed_at: new Date().toISOString(),
    updated_actor_type: "USER",
    updated_actor_id: userId,
  });
  await eventsRepo.create({
    studio_id: studioId,
    ...providerUploadEvent("ProviderUploadFailed", {
      provider: "GOOGLE_PLAY",
      buildArtifactId,
      storeConnectionId,
      editId,
      durationMs: Date.now() - startedAt,
      errorCode,
      attempt,
    }),
    event_version: 1,
    aggregate_type: "provider_upload",
    aggregate_id: providerUploadId,
    metadata: { build_artifact_id: buildArtifactId, store_connection_id: storeConnectionId },
    actor_type: "USER",
    actor_id: userId,
  });
  return { error: errorMessage };
}

export async function sendArtifactToGooglePlay(
  buildArtifactId: string,
  storeConnectionId: string,
): Promise<{ error?: string; providerUploadId?: string; versionCode?: number }> {
  const serverClient = await getAuthorizedServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  let providerUpload;
  try {
    providerUpload = await createProviderUploadsRepository(serverClient).createPending({
      buildArtifactId,
      storeConnectionId,
      actorId: user.id,
    });
  } catch {
    return { error: "Não foi possível iniciar o envio — confira se o artefato está válido e sua permissão neste Studio." };
  }

  const result = await performUpload(serverClient, providerUpload.id, user.id, 1);
  return { ...result, providerUploadId: providerUpload.id };
}

export async function retryProviderUpload(providerUploadId: string): Promise<{ error?: string; versionCode?: number }> {
  const serverClient = await getAuthorizedServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const repo = createProviderUploadsRepository(serverClient);
  const existing = await repo.getById(providerUploadId).catch(() => null);
  if (!existing) return { error: "Envio não encontrado." };

  const nextAttempt = existing.attempt + 1;
  const eventsRepo = createStudioEventsRepository(serverClient);
  await eventsRepo.create({
    studio_id: existing.studio_id,
    ...providerUploadEvent("ProviderUploadRetried", {
      provider: "GOOGLE_PLAY",
      buildArtifactId: existing.build_artifact_id,
      storeConnectionId: existing.store_connection_id,
      attempt: nextAttempt,
    }),
    event_version: 1,
    aggregate_type: "provider_upload",
    aggregate_id: providerUploadId,
    metadata: { build_artifact_id: existing.build_artifact_id, store_connection_id: existing.store_connection_id },
    actor_type: "USER",
    actor_id: user.id,
  });

  // Nunca reenvia o arquivo ao AGSOS — o retry só refaz a etapa
  // AGSOS→Google, lendo o mesmo objeto já armazenado em `build_artifacts`.
  return performUpload(serverClient, providerUploadId, user.id, nextAttempt);
}
