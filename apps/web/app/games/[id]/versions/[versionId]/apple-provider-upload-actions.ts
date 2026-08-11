"use server";

// Sprint 2.11c — Apple IPA / Build Uploads API. `maxDuration=120` já
// declarado em `layout.tsx` desta rota (Sprint 2.11b) cobre este arquivo
// também — mesma pasta de rota, mesmo route segment. Reaproveita
// `provider_uploads` (nunca `apple_provider_uploads`) e o mesmo padrão de
// Server Action síncrona do fluxo Google — sem worker/queue/polling
// infinito (fora de escopo, reservado ao Sprint 2.11d).

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
import { createApplePublishingAdapter, type AppleCredentials, type AppleUploadOperation } from "@agsos/integrations";
import { downloadObject } from "@agsos/storage";
import { providerUploadEvent } from "../../../../../lib/domain-events";
import { MAX_PROVIDER_UPLOAD_SIZE_BYTES } from "../../../../../lib/provider-upload-limits";

// Polling limitado (nunca infinito, nunca cron/worker) do estado do
// BuildUpload após o commit — Apple processa de forma assíncrona
// (AWAITING_UPLOAD → PROCESSING → COMPLETE/FAILED). 5 tentativas × 3s =
// 15s de espera, bem dentro do orçamento de `maxDuration=120` mesmo somado
// ao download do IPA e ao upload dos chunks. Se a Apple ainda não tiver
// terminado de processar depois disso, o estado intermediário é
// persistido honestamente (ver `pollBuildUpload` abaixo) — nunca fingimos
// que terminou.
const POLL_MAX_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 3_000;

async function getAuthorizedServerClient() {
  const cookieStore = await cookies();
  return createServerClient({
    getAll: () => cookieStore.getAll(),
    set: (name, value, options) => cookieStore.set(name, value, options),
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Resolve `bundle_identifier`/versão a partir do BuildArtifact — mesmo
// padrão de `provider-upload-actions.ts::resolveGamePackageName` (Sprint
// 2.11b), consultas separadas em vez de join aninhado.
async function resolveGameContext(
  serverClient: Awaited<ReturnType<typeof getAuthorizedServerClient>>,
  buildId: string,
): Promise<{ gameId: string; bundleIdentifier: string | null; versionNumber: string; buildNumber: number | null } | null> {
  const build = await createBuildsRepository(serverClient).getById(buildId);
  if (!build) return null;
  const version = await createGameVersionsRepository(serverClient).getById(build.game_version_id);
  if (!version) return null;
  const game = await createGamesRepository(serverClient).getById(version.game_id);
  if (!game) return null;
  return { gameId: game.id, bundleIdentifier: game.bundle_identifier, versionNumber: version.version_number, buildNumber: build.build_number };
}

export async function setGameBundleIdentifier(gameId: string, bundleIdentifier: string): Promise<{ error?: string }> {
  const serverClient = await getAuthorizedServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const trimmed = bundleIdentifier.trim();
  if (!/^[a-zA-Z][a-zA-Z0-9-]*(\.[a-zA-Z][a-zA-Z0-9-]*)+$/.test(trimmed)) {
    return { error: "Bundle Identifier inválido (formato esperado: com.exemplo.jogo)." };
  }

  try {
    await createGamesRepository(serverClient).update(gameId, {
      bundle_identifier: trimmed,
      updated_actor_type: "USER",
      updated_actor_id: user.id,
    });
    return {};
  } catch {
    return { error: "Não foi possível salvar o Bundle Identifier. Verifique sua permissão neste Studio." };
  }
}

async function fail(
  repo: ReturnType<typeof createProviderUploadsRepository>,
  eventsRepo: ReturnType<typeof createStudioEventsRepository>,
  studioId: string,
  providerUploadId: string,
  buildArtifactId: string,
  storeConnectionId: string,
  appleBuildUploadId: string | null,
  errorCode: string,
  startedAt: number,
  attempt: number,
  userId: string,
  errorMessage: string,
): Promise<{ error: string }> {
  await repo.update(providerUploadId, {
    status: "FAILED",
    apple_build_upload_id: appleBuildUploadId,
    error_code: errorCode,
    completed_at: new Date().toISOString(),
    updated_actor_type: "USER",
    updated_actor_id: userId,
  });
  await eventsRepo.create({
    studio_id: studioId,
    ...providerUploadEvent("ProviderUploadFailed", {
      provider: "APPLE_APP_STORE",
      buildArtifactId,
      storeConnectionId,
      appleBuildUploadId,
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

async function performAppleUpload(
  serverClient: Awaited<ReturnType<typeof getAuthorizedServerClient>>,
  providerUploadId: string,
  userId: string,
  attempt: number,
): Promise<{ error?: string; appleUploadState?: string }> {
  const repo = createProviderUploadsRepository(serverClient);
  const providerUpload = await repo.getById(providerUploadId).catch(() => null);
  if (!providerUpload) return { error: "Envio não encontrado." };

  const artifact = await createBuildArtifactsRepository(serverClient).getById(providerUpload.build_artifact_id);
  if (!artifact) return { error: "Artefato não encontrado." };

  const eventsRepo = createStudioEventsRepository(serverClient);
  const metadata = { build_artifact_id: artifact.id, store_connection_id: providerUpload.store_connection_id };
  const startedAt = Date.now();

  if (artifact.size_bytes > MAX_PROVIDER_UPLOAD_SIZE_BYTES) {
    return await fail(
      repo,
      eventsRepo,
      providerUpload.studio_id,
      providerUploadId,
      artifact.id,
      providerUpload.store_connection_id,
      null,
      "ARTIFACT_TOO_LARGE",
      startedAt,
      attempt,
      userId,
      "Artefato acima do limite temporário de 150MB para envio à App Store (suporte a arquivos maiores chega no Sprint 2.11d).",
    );
  }

  const context = await resolveGameContext(serverClient, artifact.build_id);
  if (!context || !context.bundleIdentifier) {
    return { error: "Este Game ainda não tem um Bundle Identifier configurado — defina antes de enviar." };
  }

  const connection = await createStoreConnectionsRepository(serverClient).getById(providerUpload.store_connection_id);
  if (!connection) return { error: "Store Connection não encontrada." };

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
      provider: "APPLE_APP_STORE",
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

  let credentials: AppleCredentials;
  try {
    credentials = JSON.parse(secret) as AppleCredentials;
  } catch {
    return await fail(repo, eventsRepo, providerUpload.studio_id, providerUploadId, artifact.id, connection.id, null, "INVALID_CREDENTIAL", startedAt, attempt, userId, "Credencial armazenada em formato inválido.");
  }

  const adapter = createApplePublishingAdapter(credentials);

  // A App Store Connect API não tem "GET app by bundleId" direto — o
  // mesmo padrão já usado por `listApps()`/`getApp()` (Sprint 2.9):
  // listar e casar por `bundleId`, nunca persistir o App ID da Apple como
  // campo novo (não pedido neste sprint; `bundle_identifier` já é a fonte
  // de verdade em `games`).
  const appsResult = await adapter.listApps();
  if (!appsResult.ok) {
    return await fail(repo, eventsRepo, providerUpload.studio_id, providerUploadId, artifact.id, connection.id, null, appsResult.code ?? "UNKNOWN", startedAt, attempt, userId, appsResult.error);
  }
  const matchedApp = appsResult.items.find((app) => app.bundleId === context.bundleIdentifier);
  if (!matchedApp) {
    return await fail(
      repo,
      eventsRepo,
      providerUpload.studio_id,
      providerUploadId,
      artifact.id,
      connection.id,
      null,
      "NOT_FOUND",
      startedAt,
      attempt,
      userId,
      "Nenhum app no App Store Connect corresponde ao Bundle Identifier configurado.",
    );
  }

  // cfBundleVersion: usa builds.build_number quando disponível; nenhuma UI
  // de criação de Build preenche esse campo ainda (mesmo gap do
  // `package_name` do Google antes deste sprint) — fallback documentado,
  // nunca inventado silenciosamente: usa o timestamp da tentativa como
  // valor sintético só para o campo obrigatório da Apple aceitar a
  // requisição; não afeta a classificação TRANSPORTE VALIDADO/FUNCIONAL
  // PENDENTE deste sprint (sem credencial real, o valor exato nunca chega
  // a ser validado de verdade pela Apple).
  const cfBundleVersion = context.buildNumber != null ? String(context.buildNumber) : String(Date.now());
  const cfBundleShortVersionString = context.versionNumber;

  const buildUploadResult = await adapter.createBuildUpload({
    appId: matchedApp.id,
    platform: "IOS",
    cfBundleVersion,
    cfBundleShortVersionString,
  });
  if (!buildUploadResult.ok) {
    return await fail(repo, eventsRepo, providerUpload.studio_id, providerUploadId, artifact.id, connection.id, null, buildUploadResult.code ?? "UNKNOWN", startedAt, attempt, userId, buildUploadResult.error);
  }
  const { buildUploadId } = buildUploadResult.item;

  await repo.update(providerUploadId, { apple_build_upload_id: buildUploadId, apple_upload_state: buildUploadResult.item.state });

  // A partir daqui, qualquer falha antes de um commit bem-sucedido deve
  // descartar o BuildUpload (nunca deixar órfão) — commit bem-sucedido
  // NUNCA é descartado (é a entrega em si, diferente do Edit descartável
  // do Google — decisão registrada em DECISIONS.md).
  let committed = false;
  try {
    const reserveResult = await adapter.reserveBuildUploadFile({
      buildUploadId,
      fileName: artifact.original_filename,
      fileSize: artifact.size_bytes,
      uti: "com.apple.ipa",
    });
    if (!reserveResult.ok) {
      return await fail(repo, eventsRepo, providerUpload.studio_id, providerUploadId, artifact.id, connection.id, buildUploadId, reserveResult.code ?? "UNKNOWN", startedAt, attempt, userId, reserveResult.error);
    }
    const { buildUploadFileId, uploadOperations } = reserveResult.item;
    await repo.update(providerUploadId, { apple_build_upload_file_id: buildUploadFileId });

    // Mesmo débito de memória do Sprint 2.11b/2.11a (baixa o objeto
    // inteiro em memória) — o chunking da Apple reduz o tamanho de cada
    // request de rede individual, mas NÃO resolve esse débito: o IPA
    // inteiro ainda precisa estar em `Buffer` antes de cortar por
    // offset/length. Sprint 2.11d resolve de verdade.
    const blob = await downloadObject(admin, { bucket: artifact.storage_bucket, path: artifact.storage_path });
    const buffer = Buffer.from(await blob.arrayBuffer());

    const uploadResult = await uploadOperationsSequentially(adapter, uploadOperations, buffer);
    if (!uploadResult.ok) {
      return await fail(repo, eventsRepo, providerUpload.studio_id, providerUploadId, artifact.id, connection.id, buildUploadId, uploadResult.code ?? "UNKNOWN", startedAt, attempt, userId, uploadResult.error);
    }

    const commitResult = await adapter.commitBuildUploadFile(buildUploadFileId);
    if (!commitResult.ok) {
      return await fail(repo, eventsRepo, providerUpload.studio_id, providerUploadId, artifact.id, connection.id, buildUploadId, commitResult.code ?? "UNKNOWN", startedAt, attempt, userId, commitResult.error);
    }
    committed = true;

    const pollResult = await pollBuildUpload(adapter, buildUploadId);
    const durationMs = Date.now() - startedAt;

    if (pollResult.state === "COMPLETE") {
      await repo.update(providerUploadId, {
        status: "SUCCEEDED",
        apple_upload_state: pollResult.state,
        completed_at: new Date().toISOString(),
        updated_actor_type: "USER",
        updated_actor_id: userId,
      });
      await eventsRepo.create({
        studio_id: providerUpload.studio_id,
        ...providerUploadEvent("ProviderUploadSucceeded", {
          provider: "APPLE_APP_STORE",
          buildArtifactId: artifact.id,
          storeConnectionId: connection.id,
          appleBuildUploadId: buildUploadId,
          appleUploadState: pollResult.state,
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
      return { appleUploadState: pollResult.state };
    }

    if (pollResult.state === "FAILED") {
      return await fail(repo, eventsRepo, providerUpload.studio_id, providerUploadId, artifact.id, connection.id, buildUploadId, "APPLE_PROCESSING_FAILED", startedAt, attempt, userId, "A Apple rejeitou o build durante o processamento pós-upload.");
    }

    // Commit terminou mas o polling não viu COMPLETE/FAILED dentro do
    // orçamento — NUNCA finge que terminou (instrução explícita do
    // sprint). Persiste o estado intermediário real; usuário pode
    // consultar de novo depois (fora de escopo deste sprint reimplementar
    // polling automático — isso é 2.11d).
    await repo.update(providerUploadId, {
      status: "UPLOADING",
      apple_upload_state: pollResult.state,
      updated_actor_type: "USER",
      updated_actor_id: userId,
    });
    return { appleUploadState: pollResult.state };
  } catch {
    return await fail(repo, eventsRepo, providerUpload.studio_id, providerUploadId, artifact.id, connection.id, buildUploadId, "UNEXPECTED_ERROR", startedAt, attempt, userId, "Erro inesperado ao enviar o artefato à App Store.");
  } finally {
    if (!committed) {
      // Órfão só é possível aqui (falha antes do commit) — best-effort,
      // nunca lança, nunca mascara o resultado real já capturado acima.
      await adapter.deleteBuildUpload(buildUploadId);
    }
  }
}

async function uploadOperationsSequentially(
  adapter: ReturnType<typeof createApplePublishingAdapter>,
  operations: AppleUploadOperation[],
  buffer: Buffer,
) {
  return adapter.uploadBuildUploadFileOperations(operations, buffer);
}

async function pollBuildUpload(
  adapter: ReturnType<typeof createApplePublishingAdapter>,
  buildUploadId: string,
): Promise<{ state: string }> {
  let lastState = "PROCESSING";
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    const result = await adapter.getBuildUpload(buildUploadId);
    if (result.ok) {
      lastState = result.item.state;
      if (lastState === "COMPLETE" || lastState === "FAILED") return { state: lastState };
    }
    if (i < POLL_MAX_ATTEMPTS - 1) await sleep(POLL_INTERVAL_MS);
  }
  return { state: lastState };
}

export async function sendArtifactToAppStore(
  buildArtifactId: string,
  storeConnectionId: string,
): Promise<{ error?: string; providerUploadId?: string; appleUploadState?: string }> {
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
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("Store Connection incompatível")) {
      return { error: "Esta Store Connection não é da App Store — selecione uma conexão Apple." };
    }
    return { error: "Não foi possível iniciar o envio — confira se o artefato está válido e sua permissão neste Studio." };
  }

  const result = await performAppleUpload(serverClient, providerUpload.id, user.id, 1);
  return { ...result, providerUploadId: providerUpload.id };
}

export async function retryAppleProviderUpload(providerUploadId: string): Promise<{ error?: string; appleUploadState?: string }> {
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
      provider: "APPLE_APP_STORE",
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

  // Idempotência (auditada em DECISIONS.md, casos A-E): não há forma
  // documentada de retomar uploadOperations parcialmente enviadas depois
  // de uma falha do cliente — retry reinicia explicitamente do zero
  // (novo BuildUpload). Nunca reenvia o arquivo ao AGSOS (mesmo padrão do
  // Google): lê de novo o mesmo objeto já em `build_artifacts`.
  return performAppleUpload(serverClient, providerUploadId, user.id, nextAttempt);
}
