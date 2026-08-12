"use server";

// Sprint 2.11d-2b — reescrita do fluxo síncrono do Sprint 2.11b: esta
// Server Action NUNCA mais chama o Google diretamente nem baixa o
// artefato do Storage. Ela só valida, cria/atualiza o `provider_upload`
// (fato de domínio) e enfileira um `integration_job` (mecanismo de
// execução, ver ADR-006) — a transferência de verdade acontece no worker
// (`/api/jobs/tick`, Sprint 2.11d-2a), fora do ciclo de vida deste request.
// O processor real do Google (`integration_name = "google_play"`) chega
// no Sprint 2.11d-2c; até lá, o job fica legitimamente `QUEUED` sem ser
// reivindicado — não é um bug, é o estado esperado entre sub-sprints.

import { cookies } from "next/headers";
import {
  createBuildArtifactsRepository,
  createBuildsRepository,
  createGameVersionsRepository,
  createGamesRepository,
  createProviderUploadsRepository,
  createServerClient,
  createStoreConnectionsRepository,
  createStudioEventsRepository,
} from "@agsos/database";
import { providerUploadEvent } from "../../../../../lib/domain-events";
import { MAX_PROVIDER_UPLOAD_SIZE_BYTES } from "../../../../../lib/provider-upload-limits";

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

// GATE 25 — o limite de 150MB continua sendo aplicado ANTES do enqueue,
// não dentro do worker: um artifact grande demais nunca deveria nem
// ocupar uma vaga de job (o worker real de streaming, quando existir,
// pode até suportar mais, mas mudar o limite é decisão explícita
// separada — ver DECISIONS.md/IMPLEMENTATION_LOG.md do 2.11d-1).
async function rejectIfTooLarge(
  repo: ReturnType<typeof createProviderUploadsRepository>,
  eventsRepo: ReturnType<typeof createStudioEventsRepository>,
  providerUploadId: string,
  studioId: string,
  buildArtifactId: string,
  storeConnectionId: string,
  sizeBytes: number,
  userId: string,
): Promise<{ error: string } | null> {
  if (sizeBytes <= MAX_PROVIDER_UPLOAD_SIZE_BYTES) return null;

  await repo.update(providerUploadId, {
    status: "FAILED",
    error_code: "ARTIFACT_TOO_LARGE",
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
      durationMs: 0,
      errorCode: "ARTIFACT_TOO_LARGE",
      attempt: 1,
    }),
    event_version: 1,
    aggregate_type: "provider_upload",
    aggregate_id: providerUploadId,
    metadata: { build_artifact_id: buildArtifactId, store_connection_id: storeConnectionId },
    actor_type: "USER",
    actor_id: userId,
  });
  return { error: "Artefato acima do limite temporário de 150MB para envio ao Google Play." };
}

export async function sendArtifactToGooglePlay(
  buildArtifactId: string,
  storeConnectionId: string,
): Promise<{ error?: string; providerUploadId?: string }> {
  const serverClient = await getAuthorizedServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const artifact = await createBuildArtifactsRepository(serverClient).getById(buildArtifactId);
  if (!artifact) return { error: "Artefato não encontrado." };

  const resolved = await resolveGamePackageName(serverClient, artifact.build_id);
  if (!resolved || !resolved.packageName) {
    return { error: "Este Game ainda não tem um Package Name configurado — defina antes de enviar." };
  }

  const connection = await createStoreConnectionsRepository(serverClient).getById(storeConnectionId);
  if (!connection) return { error: "Store Connection não encontrada." };

  const repo = createProviderUploadsRepository(serverClient);
  let providerUpload;
  try {
    providerUpload = await repo.createPending({ buildArtifactId, storeConnectionId, actorId: user.id });
  } catch {
    return { error: "Não foi possível iniciar o envio — confira se o artefato está válido e sua permissão neste Studio." };
  }

  const eventsRepo = createStudioEventsRepository(serverClient);

  const tooLarge = await rejectIfTooLarge(
    repo,
    eventsRepo,
    providerUpload.id,
    providerUpload.studio_id,
    artifact.id,
    connection.id,
    artifact.size_bytes,
    user.id,
  );
  if (tooLarge) return { ...tooLarge, providerUploadId: providerUpload.id };

  try {
    await serverClient.rpc("enqueue_provider_upload_job", {
      p_provider_upload_id: providerUpload.id,
      p_integration_name: "google_play",
      p_operation: "upload_bundle",
      p_actor_id: user.id,
    });
  } catch {
    return { error: "Não foi possível enfileirar o envio.", providerUploadId: providerUpload.id };
  }

  await eventsRepo.create({
    studio_id: providerUpload.studio_id,
    ...providerUploadEvent("ProviderUploadQueued", {
      provider: "GOOGLE_PLAY",
      buildArtifactId: artifact.id,
      storeConnectionId: connection.id,
      attempt: 1,
    }),
    event_version: 1,
    aggregate_type: "provider_upload",
    aggregate_id: providerUpload.id,
    metadata: { build_artifact_id: artifact.id, store_connection_id: connection.id },
    actor_type: "USER",
    actor_id: user.id,
  });

  // Nunca espera o worker — retorna assim que o job existe. A UI passa a
  // acompanhar o estado real via polling (ver `use-provider-upload-status.ts`).
  return { providerUploadId: providerUpload.id };
}

export async function retryProviderUpload(providerUploadId: string): Promise<{ error?: string }> {
  const serverClient = await getAuthorizedServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const repo = createProviderUploadsRepository(serverClient);
  const existing = await repo.getById(providerUploadId).catch(() => null);
  if (!existing) return { error: "Envio não encontrado." };

  const nextAttempt = existing.attempt + 1;

  // GATE 12/18 — `enqueue_provider_upload_job` bloqueia sozinho (no banco,
  // não só na UI) se já existir job ativo (QUEUED/CLAIMED/RUNNING/
  // RETRY_WAIT) para este provider_upload; a mensagem de erro do Postgres
  // já é segura de expor (não vaza nada sensível).
  try {
    await serverClient.rpc("enqueue_provider_upload_job", {
      p_provider_upload_id: providerUploadId,
      p_integration_name: "google_play",
      p_operation: "upload_bundle",
      p_actor_id: user.id,
    });
  } catch {
    return { error: "Já existe um envio em andamento para este artefato — aguarde terminar antes de tentar de novo." };
  }

  await repo.update(providerUploadId, {
    attempt: nextAttempt,
    updated_actor_type: "USER",
    updated_actor_id: user.id,
  });

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

  return {};
}
