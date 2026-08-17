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
import { createGooglePlayPublishingAdapter, type GoogleCredentials } from "@agsos/integrations";
import { downloadObjectRange, getObjectSizeViaRange } from "@agsos/storage";
import { env } from "../../env";
import { providerUploadEvent } from "../../domain-events";
import { MAX_PROVIDER_UPLOAD_SIZE_BYTES } from "../../provider-upload-limits";
import type { IntegrationJobProcessor, JobStepResult } from "../types";

// Sprint 2.11d-2c — processor real do Google Play. Roda dentro de
// `/api/jobs/tick` (2.11d-2a), nunca dentro de uma Server Action. Um chunk
// por invocação (backpressure — decisão do 2.11d-1: "1 chunk lido → 1
// chunk enviado → libera memória → checkpoint → próximo chunk"), nunca
// paraleliza upload de chunks.
//
// GATE 25 — 8MB por chunk: múltiplo de 256KB (exigência da Android
// Publisher API para chunks intermediários — só o último chunk pode ter
// tamanho livre), grande o suficiente para não desperdiçar round-trips,
// pequeno o suficiente para manter RSS bounded independente do tamanho
// do artifact (ver benchmark do 2.11d-2e).
const CHUNK_SIZE_BYTES = 8 * 1024 * 1024;
const UPLOAD_MIME_TYPE = "application/octet-stream";

type GooglePlayCheckpoint = {
  editId?: string;
  totalBytes?: number;
  bytesUploaded?: number;
};

function readCheckpoint(raw: Record<string, unknown>): GooglePlayCheckpoint {
  return {
    editId: typeof raw.editId === "string" ? raw.editId : undefined,
    totalBytes: typeof raw.totalBytes === "number" ? raw.totalBytes : undefined,
    bytesUploaded: typeof raw.bytesUploaded === "number" ? raw.bytesUploaded : undefined,
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
    // GATE 26 — evento de domínio emitido pelo worker (não por um usuário
    // interativo): `actor_type: "SYSTEM"`, nunca inventar um `USER` que não
    // agiu neste instante. Distinto de telemetria interna do dispatcher
    // (`JobStarted`/`JobClaimed`), que nunca vira Domain Event.
    actor_type: "SYSTEM",
    actor_id: null,
  });
}

export const googlePlayProcessor: IntegrationJobProcessor = async (job, ctx) => {
  const admin = createAdminClient();
  const providerUploadsRepo = createProviderUploadsRepository(admin);
  const eventsRepo = createStudioEventsRepository(admin);

  // Sprint 2.16a: `provider_upload_id` passou a ser nullable em
  // `integration_jobs` (jobs de Submission usam `submission_id` em vez
  // disso — ver `integration_jobs_exactly_one_target`). Este processor só
  // é registrado sob `integration_name = "google_play"`
  // (`registry.ts`), que `enqueue_provider_upload_job` sempre preenche com
  // `provider_upload_id` — nunca chamado para um job de Submission.
  if (!job.provider_upload_id) {
    return { outcome: "failed", errorCode: "PROVIDER_UPLOAD_ID_MISSING", errorClass: "NON_RETRYABLE" };
  }
  const providerUpload = await providerUploadsRepo.getById(job.provider_upload_id);
  if (!providerUpload) {
    return { outcome: "failed", errorCode: "PROVIDER_UPLOAD_NOT_FOUND", errorClass: "NON_RETRYABLE" };
  }

  const artifact = await createBuildArtifactsRepository(admin).getById(providerUpload.build_artifact_id);
  if (!artifact) {
    return { outcome: "failed", errorCode: "ARTIFACT_NOT_FOUND", errorClass: "NON_RETRYABLE" };
  }
  // Defesa em profundidade — a Server Action já rejeita antes do enqueue
  // (GATE 25), mas o worker nunca deveria confiar só nisso.
  if (artifact.size_bytes > MAX_PROVIDER_UPLOAD_SIZE_BYTES) {
    return { outcome: "failed", errorCode: "ARTIFACT_TOO_LARGE", errorClass: "NON_RETRYABLE" };
  }

  const build = await createBuildsRepository(admin).getById(artifact.build_id);
  const version = build ? await createGameVersionsRepository(admin).getById(build.game_version_id) : null;
  const game = version ? await createGamesRepository(admin).getById(version.game_id) : null;
  if (!game?.package_name) {
    return { outcome: "failed", errorCode: "MISSING_PACKAGE_NAME", errorClass: "NON_RETRYABLE" };
  }

  const connection = await createStoreConnectionsRepository(admin).getById(providerUpload.store_connection_id);
  if (!connection) {
    return { outcome: "failed", errorCode: "STORE_CONNECTION_NOT_FOUND", errorClass: "NON_RETRYABLE" };
  }
  const secret = await createStoreConnectionsRepository(admin).getSecret(connection.id).catch(() => null);
  if (!secret) {
    return { outcome: "failed", errorCode: "MISSING_CREDENTIAL", errorClass: "NON_RETRYABLE" };
  }
  let credentials: GoogleCredentials;
  try {
    credentials = JSON.parse(secret) as GoogleCredentials;
  } catch {
    return { outcome: "failed", errorCode: "INVALID_CREDENTIAL", errorClass: "NON_RETRYABLE" };
  }

  const adapter = createGooglePlayPublishingAdapter({ ...credentials, packageName: game.package_name });
  const checkpoint = readCheckpoint(job.checkpoint);
  const metadata = { build_artifact_id: artifact.id, store_connection_id: connection.id };

  // Primeira invocação deste job de verdade (nenhum checkpoint ainda) — só
  // aqui o `ProviderUploadStarted` é emitido (distinto de
  // `ProviderUploadQueued`, emitido pela Server Action no momento do
  // enqueue — ver DECISIONS.md 2.11d-2b).
  if (!checkpoint.editId) {
    await providerUploadsRepo.update(providerUpload.id, {
      status: "UPLOADING",
      started_at: providerUpload.started_at ?? new Date().toISOString(),
    });
    await emitEvent(eventsRepo, providerUpload.studio_id, providerUpload.id, metadata, providerUploadEvent("ProviderUploadStarted", {
      provider: "GOOGLE_PLAY",
      buildArtifactId: artifact.id,
      storeConnectionId: connection.id,
      attempt: job.attempt,
    }));

    const editResult = await adapter.createEdit();
    if (!editResult.ok) {
      return { outcome: "failed", errorCode: editResult.code ?? "UNKNOWN", errorClass: classifyGoogleError(editResult.code) };
    }
    checkpoint.editId = editResult.item.editId;
  }

  if (checkpoint.totalBytes === undefined) {
    try {
      checkpoint.totalBytes = await getObjectSizeViaRange({
        supabaseUrl: env.supabaseUrl,
        serviceRoleKey: env.supabaseSecretKey,
        bucket: artifact.storage_bucket,
        path: artifact.storage_path,
      });
    } catch {
      return { outcome: "failed", errorCode: "STORAGE_SIZE_UNAVAILABLE", errorClass: "RETRYABLE", checkpoint: { ...checkpoint } };
    }
  }
  const totalBytes = checkpoint.totalBytes;

  // GATE 5/14 — sessão resumível é reconciliada, nunca assumida. Se ainda
  // não existe (primeiro chunk deste job) cria; se existe, consulta o
  // progresso real ANTES de enviar o próximo chunk — cobre tanto "crash
  // depois de enviar, resposta perdida" (a Apple/Google já pode ter
  // recebido mais bytes do que o checkpoint local registra) quanto "sessão
  // expirou" (a consulta falha de um jeito reconhecível, tratado abaixo).
  let sessionUri = await admin.rpc("get_provider_upload_resumable_session", { p_provider_upload_id: providerUpload.id }).then((r) => r.data ?? null);

  if (!sessionUri) {
    const sessionResult = await adapter.createResumableSession(checkpoint.editId, totalBytes, UPLOAD_MIME_TYPE);
    if (!sessionResult.ok) {
      // Edit pode ter expirado/sido invalidado — reseta para recriar no
      // próximo attempt em vez de reusar um editId morto para sempre.
      const shouldResetEdit = sessionResult.code === "NOT_FOUND";
      return {
        outcome: "failed",
        errorCode: sessionResult.code ?? "UNKNOWN",
        errorClass: classifyGoogleError(sessionResult.code),
        checkpoint: shouldResetEdit ? {} : { ...checkpoint },
      };
    }
    sessionUri = sessionResult.item.sessionUri;
    await admin.rpc("set_provider_upload_resumable_session", { p_provider_upload_id: providerUpload.id, p_session_uri: sessionUri });
  }

  const progressResult = await adapter.queryResumableProgress(sessionUri, totalBytes);
  if (!progressResult.ok) {
    // Sessão expirada/inválida (GATE 14, "sessão expirada") — nunca
    // reenvia bytes sobre uma sessão morta. Limpa a referência no Vault e
    // reseta só o progresso do checkpoint (mantém o `editId`: o Edit em si
    // normalmente sobrevive mais tempo que a sessão resumível, decisão
    // documentada em DECISIONS.md) para que a próxima invocação recrie a
    // sessão do zero.
    await admin.rpc("clear_provider_upload_resumable_session", { p_provider_upload_id: providerUpload.id });
    return {
      outcome: "continue",
      checkpoint: { editId: checkpoint.editId, totalBytes, bytesUploaded: 0 },
    };
  }

  await ctx.renewLease();

  if (progressResult.item.status === "complete") {
    return finalizeSuccess(adapter, providerUploadsRepo, eventsRepo, providerUpload, artifact, connection, checkpoint, metadata, progressResult.item.versionCode, job.attempt);
  }

  const bytesUploaded = progressResult.item.bytesReceived;
  const start = bytesUploaded;
  const end = Math.min(start + CHUNK_SIZE_BYTES, totalBytes) - 1;

  let chunk;
  try {
    chunk = await downloadObjectRange({
      supabaseUrl: env.supabaseUrl,
      serviceRoleKey: env.supabaseSecretKey,
      bucket: artifact.storage_bucket,
      path: artifact.storage_path,
      start,
      end,
    });
  } catch {
    return { outcome: "failed", errorCode: "STORAGE_READ_FAILED", errorClass: "RETRYABLE", checkpoint: { ...checkpoint, bytesUploaded } };
  }

  const uploadResult = await adapter.uploadResumableChunk(sessionUri, chunk, start, totalBytes);
  if (!uploadResult.ok) {
    return {
      outcome: "failed",
      errorCode: uploadResult.code ?? "UNKNOWN",
      errorClass: classifyGoogleError(uploadResult.code),
      checkpoint: { ...checkpoint, bytesUploaded },
    };
  }

  if (uploadResult.item.status === "complete") {
    return finalizeSuccess(adapter, providerUploadsRepo, eventsRepo, providerUpload, artifact, connection, checkpoint, metadata, uploadResult.item.versionCode, job.attempt);
  }

  return {
    outcome: "continue",
    checkpoint: { editId: checkpoint.editId, totalBytes, bytesUploaded: uploadResult.item.bytesReceived },
  };
};

async function finalizeSuccess(
  adapter: ReturnType<typeof createGooglePlayPublishingAdapter>,
  providerUploadsRepo: ReturnType<typeof createProviderUploadsRepository>,
  eventsRepo: ReturnType<typeof createStudioEventsRepository>,
  providerUpload: { id: string; studio_id: string; started_at: string | null },
  artifact: { id: string },
  connection: { id: string },
  checkpoint: GooglePlayCheckpoint,
  metadata: Record<string, unknown>,
  versionCode: number,
  attempt: number,
): Promise<JobStepResult> {
  // Edit sempre descartado após o upload — decisão congelada desde o
  // 2.11b (Play Console só permite 1 Edit ativo por app), best-effort,
  // nunca mascara o sucesso já capturado.
  if (checkpoint.editId) await adapter.deleteEdit(checkpoint.editId).catch(() => undefined);

  await providerUploadsRepo.update(providerUpload.id, {
    status: "SUCCEEDED",
    edit_id: checkpoint.editId ?? null,
    version_code: versionCode,
    completed_at: new Date().toISOString(),
  });

  const durationMs = providerUpload.started_at ? Date.now() - new Date(providerUpload.started_at).getTime() : 0;
  await emitEvent(eventsRepo, providerUpload.studio_id, providerUpload.id, metadata, providerUploadEvent("ProviderUploadSucceeded", {
    provider: "GOOGLE_PLAY",
    buildArtifactId: artifact.id,
    storeConnectionId: connection.id,
    editId: checkpoint.editId,
    versionCode,
    durationMs,
    attempt,
  }));

  return { outcome: "succeeded", checkpoint: { editId: checkpoint.editId, versionCode } };
}

function classifyGoogleError(code: string | undefined): "AUTH" | "NON_RETRYABLE" | "RATE_LIMIT" | "RETRYABLE" | "INTERNAL" {
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
