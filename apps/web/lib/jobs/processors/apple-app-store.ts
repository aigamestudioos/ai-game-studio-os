import {
  createAdminClient,
  createBuildArtifactsRepository,
  createBuildsRepository,
  createGameVersionsRepository,
  createGamesRepository,
  createProviderUploadsRepository,
  createStoreConnectionsRepository,
  createStudioEventsRepository,
} from "@agsos/database";
import { createApplePublishingAdapter, type AppleCredentials, type AppleUploadOperation } from "@agsos/integrations";
import { downloadObjectRange } from "@agsos/storage";
import { env } from "../../env";
import { providerUploadEvent } from "../../domain-events";
import { MAX_PROVIDER_UPLOAD_SIZE_BYTES } from "../../provider-upload-limits";
import type { IntegrationJobProcessor, JobStepResult } from "../types";

// Sprint 2.11d-2d — processor real da Apple. Mesma disciplina do worker
// Google (2.11d-2c): 1 `uploadOperation` por invocação (nunca a IPA
// inteira em memória — cada operação já vem com `offset`/`length`
// próprios, lidos via Range read do Storage), checkpoint nunca contém
// segredo (as `uploadOperations` — URLs presignadas/headers — vivem só no
// Vault, `apple_operations_ref`, mesmo padrão da session URI do Google).

type ApplePlayCheckpoint = {
  buildUploadId?: string;
  buildUploadFileId?: string;
  totalOperations?: number;
  completedOperationIndex?: number; // -1 = nenhuma operação concluída ainda
  committed?: boolean;
};

function readCheckpoint(raw: Record<string, unknown>): ApplePlayCheckpoint {
  return {
    buildUploadId: typeof raw.buildUploadId === "string" ? raw.buildUploadId : undefined,
    buildUploadFileId: typeof raw.buildUploadFileId === "string" ? raw.buildUploadFileId : undefined,
    totalOperations: typeof raw.totalOperations === "number" ? raw.totalOperations : undefined,
    completedOperationIndex: typeof raw.completedOperationIndex === "number" ? raw.completedOperationIndex : undefined,
    committed: raw.committed === true,
  };
}

async function emitEvent(
  eventsRepo: ReturnType<typeof createStudioEventsRepository>,
  studioId: string,
  providerUploadId: string,
  metadata: Record<string, unknown>,
  event: ReturnType<typeof providerUploadEvent>,
) {
  await eventsRepo.create({
    studio_id: studioId,
    ...event,
    event_version: 1,
    aggregate_type: "provider_upload",
    aggregate_id: providerUploadId,
    metadata,
    actor_type: "SYSTEM",
    actor_id: null,
  });
}

function classifyAppleError(code: string | undefined): "AUTH" | "NON_RETRYABLE" | "RATE_LIMIT" | "RETRYABLE" | "INTERNAL" {
  switch (code) {
    case "UNAUTHORIZED":
      return "AUTH";
    case "FORBIDDEN":
    case "NOT_FOUND":
      return "NON_RETRYABLE";
    case "RATE_LIMITED":
      return "RATE_LIMIT";
    case "SERVER_ERROR":
      return "RETRYABLE";
    default:
      return "INTERNAL";
  }
}

export const appleAppStoreProcessor: IntegrationJobProcessor = async (job, ctx) => {
  const admin = createAdminClient();
  const providerUploadsRepo = createProviderUploadsRepository(admin);
  const eventsRepo = createStudioEventsRepository(admin);

  // Sprint 2.16a: ver comentário equivalente em `google-play.ts`.
  if (!job.provider_upload_id) {
    return { outcome: "failed", errorCode: "PROVIDER_UPLOAD_ID_MISSING", errorClass: "NON_RETRYABLE" };
  }
  const providerUpload = await providerUploadsRepo.getById(job.provider_upload_id);
  if (!providerUpload) return { outcome: "failed", errorCode: "PROVIDER_UPLOAD_NOT_FOUND", errorClass: "NON_RETRYABLE" };

  const artifact = await createBuildArtifactsRepository(admin).getById(providerUpload.build_artifact_id);
  if (!artifact) return { outcome: "failed", errorCode: "ARTIFACT_NOT_FOUND", errorClass: "NON_RETRYABLE" };
  if (artifact.size_bytes > MAX_PROVIDER_UPLOAD_SIZE_BYTES) {
    return { outcome: "failed", errorCode: "ARTIFACT_TOO_LARGE", errorClass: "NON_RETRYABLE" };
  }

  const build = await createBuildsRepository(admin).getById(artifact.build_id);
  const version = build ? await createGameVersionsRepository(admin).getById(build.game_version_id) : null;
  const game = version ? await createGamesRepository(admin).getById(version.game_id) : null;
  if (!game?.bundle_identifier) {
    return { outcome: "failed", errorCode: "MISSING_BUNDLE_IDENTIFIER", errorClass: "NON_RETRYABLE" };
  }

  const connection = await createStoreConnectionsRepository(admin).getById(providerUpload.store_connection_id);
  if (!connection) return { outcome: "failed", errorCode: "STORE_CONNECTION_NOT_FOUND", errorClass: "NON_RETRYABLE" };
  const secret = await createStoreConnectionsRepository(admin).getSecret(connection.id).catch(() => null);
  if (!secret) return { outcome: "failed", errorCode: "MISSING_CREDENTIAL", errorClass: "NON_RETRYABLE" };
  let credentials: AppleCredentials;
  try {
    credentials = JSON.parse(secret) as AppleCredentials;
  } catch {
    return { outcome: "failed", errorCode: "INVALID_CREDENTIAL", errorClass: "NON_RETRYABLE" };
  }

  const adapter = createApplePublishingAdapter(credentials);
  const checkpoint = readCheckpoint(job.checkpoint);
  const metadata = { build_artifact_id: artifact.id, store_connection_id: connection.id };

  // Etapa 1 — sem BuildUpload ainda: cria BuildUpload + reserva o arquivo.
  // `uploadOperations` (sensível) vai pro Vault; só os IDs (não-sensíveis)
  // vão pro checkpoint.
  if (!checkpoint.buildUploadId) {
    await providerUploadsRepo.update(providerUpload.id, {
      status: "UPLOADING",
      started_at: providerUpload.started_at ?? new Date().toISOString(),
    });
    await emitEvent(eventsRepo, providerUpload.studio_id, providerUpload.id, metadata, providerUploadEvent("ProviderUploadStarted", {
      provider: "APPLE_APP_STORE",
      buildArtifactId: artifact.id,
      storeConnectionId: connection.id,
      attempt: job.attempt,
    }));

    const appsResult = await adapter.listApps();
    if (!appsResult.ok) {
      return { outcome: "failed", errorCode: appsResult.code ?? "UNKNOWN", errorClass: classifyAppleError(appsResult.code) };
    }
    const matchedApp = appsResult.items.find((app) => app.bundleId === game.bundle_identifier);
    if (!matchedApp) {
      return { outcome: "failed", errorCode: "NOT_FOUND", errorClass: "NON_RETRYABLE" };
    }

    const cfBundleVersion = build?.build_number != null ? String(build.build_number) : String(Date.now());
    const cfBundleShortVersionString = version?.version_number ?? "1.0.0";

    const buildUploadResult = await adapter.createBuildUpload({
      appId: matchedApp.id,
      platform: "IOS",
      cfBundleVersion,
      cfBundleShortVersionString,
    });
    if (!buildUploadResult.ok) {
      return { outcome: "failed", errorCode: buildUploadResult.code ?? "UNKNOWN", errorClass: classifyAppleError(buildUploadResult.code) };
    }
    const { buildUploadId } = buildUploadResult.item;
    await providerUploadsRepo.update(providerUpload.id, { apple_build_upload_id: buildUploadId, apple_upload_state: buildUploadResult.item.state });

    const reserveResult = await adapter.reserveBuildUploadFile({
      buildUploadId,
      fileName: artifact.original_filename,
      fileSize: artifact.size_bytes,
      uti: "com.apple.ipa",
    });
    if (!reserveResult.ok) {
      // BuildUpload já existe mas a reserva falhou — órfão, descarta
      // (best-effort) antes de retornar a falha; próximo attempt cria tudo
      // de novo (checkpoint vazio, nunca reaproveita este buildUploadId).
      await adapter.deleteBuildUpload(buildUploadId).catch(() => undefined);
      return { outcome: "failed", errorCode: reserveResult.code ?? "UNKNOWN", errorClass: classifyAppleError(reserveResult.code) };
    }
    const { buildUploadFileId, uploadOperations } = reserveResult.item;
    await providerUploadsRepo.update(providerUpload.id, { apple_build_upload_file_id: buildUploadFileId });
    await admin.rpc("set_provider_upload_apple_operations", {
      p_provider_upload_id: providerUpload.id,
      p_operations_json: JSON.stringify(uploadOperations),
    });

    return {
      outcome: "continue",
      checkpoint: { buildUploadId, buildUploadFileId, totalOperations: uploadOperations.length, completedOperationIndex: -1 },
    };
  }

  const buildUploadId = checkpoint.buildUploadId;
  const buildUploadFileId = checkpoint.buildUploadFileId as string;
  const totalOperations = checkpoint.totalOperations ?? 0;
  const completedIndex = checkpoint.completedOperationIndex ?? -1;

  // Etapa 2 — ainda há operações pendentes.
  if (completedIndex + 1 < totalOperations) {
    const operationsJson = await admin
      .rpc("get_provider_upload_apple_operations", { p_provider_upload_id: providerUpload.id })
      .then((r) => r.data ?? null);
    if (!operationsJson) {
      return { outcome: "failed", errorCode: "APPLE_OPERATIONS_MISSING", errorClass: "INTERNAL" };
    }
    const operations = JSON.parse(operationsJson) as AppleUploadOperation[];
    const nextIndex = completedIndex + 1;
    const operation = operations[nextIndex];
    if (!operation || operation.offset === null || operation.length === null) {
      return { outcome: "failed", errorCode: "APPLE_OPERATION_INVALID", errorClass: "NON_RETRYABLE" };
    }

    let chunk;
    try {
      chunk = await downloadObjectRange({
        supabaseUrl: env.supabaseUrl,
        serviceRoleKey: env.supabaseSecretKey,
        bucket: artifact.storage_bucket,
        path: artifact.storage_path,
        start: operation.offset,
        end: operation.offset + operation.length - 1,
      });
    } catch {
      return { outcome: "failed", errorCode: "STORAGE_READ_FAILED", errorClass: "RETRYABLE", checkpoint: { ...checkpoint } };
    }

    await ctx.renewLease();

    // `chunk` já É o byte range exato da operação (lido via Range read) —
    // passar `offset: 0` faz `uploadBuildUploadFileOperations` cortar o
    // buffer já-recortado em si mesmo (0..length), nunca tenta reindexar
    // pelo `offset` absoluto original (que só fazia sentido contra o IPA
    // inteiro em memória — exatamente o que este worker evita).
    const result = await adapter.uploadBuildUploadFileOperations([{ ...operation, offset: 0 }], chunk);
    if (!result.ok) {
      return { outcome: "failed", errorCode: result.code ?? "UNKNOWN", errorClass: classifyAppleError(result.code), checkpoint: { ...checkpoint } };
    }

    return { outcome: "continue", checkpoint: { ...checkpoint, completedOperationIndex: nextIndex } };
  }

  // Etapa 3 — todas as operações concluídas, falta commit (ou reconciliar
  // um commit anterior cuja resposta se perdeu — GATE 16).
  if (!checkpoint.committed) {
    const commitResult = await adapter.commitBuildUploadFile(buildUploadFileId);
    if (commitResult.ok) {
      // `uploadOperations` (Vault) não são mais necessárias depois do
      // commit confirmado — nunca deixa a URL presignada/headers
      // pendurados no Vault além do necessário.
      try {
        await admin.rpc("clear_provider_upload_apple_operations", { p_provider_upload_id: providerUpload.id });
      } catch {
        // best-effort — nunca bloqueia a transição de estado por isso.
      }
      return { outcome: "continue", checkpoint: { ...checkpoint, committed: true } };
    }

    // Commit falhou OU a resposta se perdeu — NUNCA assume nem sucesso nem
    // falha: consulta o estado real do BuildUpload antes de decidir.
    // `AWAITING_UPLOAD` = commit genuinamente não aconteceu (seguro tentar
    // de novo). Qualquer outro estado = a Apple já processou o commit
    // (reconciliado) — nunca cria um BuildUpload novo nem repete o PATCH.
    const reconcile = await adapter.getBuildUpload(buildUploadId);
    if (!reconcile.ok) {
      return { outcome: "failed", errorCode: commitResult.code ?? "UNKNOWN", errorClass: classifyAppleError(commitResult.code), checkpoint: { ...checkpoint } };
    }
    if (reconcile.item.state === "AWAITING_UPLOAD") {
      return { outcome: "continue", checkpoint: { ...checkpoint } };
    }
    await providerUploadsRepo.update(providerUpload.id, { apple_upload_state: reconcile.item.state });
    if (reconcile.item.state === "FAILED") {
      return { outcome: "failed", errorCode: "APPLE_PROCESSING_FAILED", errorClass: "NON_RETRYABLE" };
    }
    return { outcome: "continue", checkpoint: { ...checkpoint, committed: true } };
  }

  // Etapa 4 — commit confirmado, aguardando processamento assíncrono da
  // Apple. GATE 16 — nunca mantém a função viva fazendo polling: 1 consulta
  // por invocação, persiste o estado real, deixa o próximo tick do
  // dispatcher (pg_cron, ~1min depois) reconciliar de novo se ainda não
  // tiver terminado.
  const pollResult = await adapter.getBuildUpload(buildUploadId);
  if (!pollResult.ok) {
    return { outcome: "continue", checkpoint: { ...checkpoint } };
  }
  await providerUploadsRepo.update(providerUpload.id, { apple_upload_state: pollResult.item.state });

  if (pollResult.item.state === "COMPLETE") {
    return finalizeSuccess(providerUploadsRepo, eventsRepo, providerUpload, artifact, connection, buildUploadId, metadata, pollResult.item.state, job.attempt);
  }
  if (pollResult.item.state === "FAILED") {
    return { outcome: "failed", errorCode: "APPLE_PROCESSING_FAILED", errorClass: "NON_RETRYABLE" };
  }
  return { outcome: "continue", checkpoint: { ...checkpoint } };
};

async function finalizeSuccess(
  providerUploadsRepo: ReturnType<typeof createProviderUploadsRepository>,
  eventsRepo: ReturnType<typeof createStudioEventsRepository>,
  providerUpload: { id: string; studio_id: string; started_at: string | null },
  artifact: { id: string },
  connection: { id: string },
  buildUploadId: string,
  metadata: Record<string, unknown>,
  appleUploadState: string,
  attempt: number,
): Promise<JobStepResult> {
  await providerUploadsRepo.update(providerUpload.id, {
    status: "SUCCEEDED",
    apple_upload_state: appleUploadState,
    completed_at: new Date().toISOString(),
  });

  const durationMs = providerUpload.started_at ? Date.now() - new Date(providerUpload.started_at).getTime() : 0;
  await emitEvent(eventsRepo, providerUpload.studio_id, providerUpload.id, metadata, providerUploadEvent("ProviderUploadSucceeded", {
    provider: "APPLE_APP_STORE",
    buildArtifactId: artifact.id,
    storeConnectionId: connection.id,
    appleBuildUploadId: buildUploadId,
    appleUploadState,
    durationMs,
    attempt,
  }));

  return { outcome: "succeeded" };
}
