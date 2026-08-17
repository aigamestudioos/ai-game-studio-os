import { createAdminClient, createStoreConnectionsRepository } from "@agsos/database";
import { createApplePublishingAdapter, type AppleCredentials, type ApplePlatform } from "@agsos/integrations";
import { checkStoreMutationGuard } from "../store-mutation-guard";
import type { IntegrationJobProcessor, JobStepResult } from "../types";

// Sprint 2.16b — processor de EXECUÇÃO de Submission para App Store.
// Distinto do processor de TRANSPORTE (`apple-app-store.ts`, Sprint
// 2.11d-2d): aquele sobe o binário via Build Upload
// (`createBuildUpload`/`commitBuildUploadFile`) e grava
// `apple_build_upload_id` em `provider_uploads`. Documentação oficial da
// App Store Connect API confirma: Build Upload é a entrega do binário —
// Review Submission é uma entidade separada, o objeto que de fato inicia
// uma avaliação de review. Este processor assume o transporte já
// concluído (`provider_uploads.status = SUCCEEDED` com
// `apple_build_upload_id` presente) e cobre o passo que falta: criar a
// Review Submission associada ao Build e submetê-la.
//
// GATE 25/16 — PRODUCTION GUARD (duas camadas), mesmo padrão do processor
// Google: nenhuma chamada real que crie/envie uma Review Submission
// acontece a menos que `env.allowStoreMutation === true` E o `baseUrl` de
// destino esteja na allowlist (`checkStoreMutationGuard`).
const REAL_BASE_URL = "https://api.appstoreconnect.apple.com/v1";
const DEFAULT_PLATFORM: ApplePlatform = "IOS";

// GATE 15 — reconciliation state machine (estado técnico do job, mesma
// semântica do processor Google): `UNKNOWN_EXTERNAL_RESULT` nunca vira
// SUCCESS/FAILED sem confirmação via `listReviewSubmissions`/
// `getReviewSubmission`.
type ExternalResultState = "NOT_ATTEMPTED" | "ATTEMPTED" | "CONFIRMED" | "UNKNOWN_EXTERNAL_RESULT";

type AppleSubmitCheckpoint = {
  provider: "APPLE_APP_STORE";
  reviewSubmissionId?: string;
  reviewSubmissionItemId?: string;
  submitAttempted?: boolean;
  submitConfirmed?: boolean;
  providerState?: string | null;
  externalResultState?: ExternalResultState;
  simulated?: boolean;
};

function readCheckpoint(raw: Record<string, unknown>): AppleSubmitCheckpoint {
  return {
    provider: "APPLE_APP_STORE",
    reviewSubmissionId: typeof raw.reviewSubmissionId === "string" ? raw.reviewSubmissionId : undefined,
    reviewSubmissionItemId: typeof raw.reviewSubmissionItemId === "string" ? raw.reviewSubmissionItemId : undefined,
    submitAttempted: raw.submitAttempted === true,
    submitConfirmed: raw.submitConfirmed === true,
    providerState: typeof raw.providerState === "string" ? raw.providerState : null,
    externalResultState: (raw.externalResultState as ExternalResultState | undefined) ?? "NOT_ATTEMPTED",
  };
}

export const submissionAppleProcessor: IntegrationJobProcessor = async (job) => {
  const admin = createAdminClient();

  if (!job.submission_id) {
    return terminalFailure(admin, job, "SUBMISSION_ID_MISSING", "NON_RETRYABLE");
  }

  const { data: submission } = await admin.from("submissions").select("*").eq("id", job.submission_id).maybeSingle();
  if (!submission) return terminalFailure(admin, job, "SUBMISSION_NOT_FOUND", "NON_RETRYABLE");

  const { data: build } = await admin.from("builds").select("*").eq("id", submission.build_id).maybeSingle();
  if (!build) return terminalFailure(admin, job, "BUILD_NOT_FOUND", "NON_RETRYABLE");

  const { data: artifacts } = await admin
    .from("build_artifacts")
    .select("id")
    .eq("build_id", build.id)
    .is("archived_at", null);
  const artifactIds = (artifacts ?? []).map((a) => a.id);
  if (artifactIds.length === 0) return terminalFailure(admin, job, "ARTIFACT_MISSING", "NON_RETRYABLE");

  const { data: providerUpload } = await admin
    .from("provider_uploads")
    .select("*")
    .in("build_artifact_id", artifactIds)
    .eq("status", "SUCCEEDED")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!providerUpload || !providerUpload.apple_build_upload_id) {
    return terminalFailure(admin, job, "PROVIDER_UPLOAD_MISSING", "NON_RETRYABLE");
  }

  const storeConnectionsRepo = createStoreConnectionsRepository(admin);
  const connection = await storeConnectionsRepo.getById(providerUpload.store_connection_id);
  if (!connection) return terminalFailure(admin, job, "STORE_CONNECTION_MISSING", "NON_RETRYABLE");

  // GATE 13 — auditado: nem `store_connections` nem `provider_uploads`
  // guardam o `appId` (resource id da App Store Connect) diretamente; o
  // dado de domínio disponível é `games.bundle_identifier` (usado pelo
  // processor de transporte, `apple-app-store.ts`, para criar o
  // BuildUpload). Não é um dado ausente sem lookup possível: a própria
  // Apple client já implementada (`fetchAppleApps`, Sprint 2.9) resolve
  // `bundleId → appId`. Nenhum identificador é inventado.
  const { data: version } = await admin.from("game_versions").select("game_id").eq("id", build.game_version_id).maybeSingle();
  const { data: game } = version
    ? await admin.from("games").select("bundle_identifier").eq("id", version.game_id).maybeSingle()
    : { data: null };
  const bundleIdentifier = game?.bundle_identifier ?? null;
  if (!bundleIdentifier) return terminalFailure(admin, job, "MISSING_BUNDLE_IDENTIFIER", "NON_RETRYABLE");

  // `AGSOS_APPLE_TEST_BASE_URL` só existe para apontar ao fake provider
  // server em testes de integração.
  const baseUrl = process.env.AGSOS_APPLE_TEST_BASE_URL || REAL_BASE_URL;
  const guard = checkStoreMutationGuard(baseUrl);

  if (!guard.allowed) {
    await admin.rpc("complete_submission_job", {
      p_job_id: job.id,
      p_submission_id: submission.id,
      p_result: "SUBMITTED",
      p_error_code: null,
      p_duration_ms: 0,
    });
    return {
      outcome: "succeeded",
      checkpoint: { simulated: true, buildUploadId: providerUpload.apple_build_upload_id },
    };
  }

  const secret = await storeConnectionsRepo.getSecret(connection.id).catch(() => null);
  if (!secret) return terminalFailure(admin, job, "MISSING_CREDENTIAL", "NON_RETRYABLE");
  let credentials: AppleCredentials;
  try {
    credentials = JSON.parse(secret) as AppleCredentials;
  } catch {
    return terminalFailure(admin, job, "INVALID_CREDENTIAL", "NON_RETRYABLE");
  }

  const adapter = createApplePublishingAdapter(credentials);
  const checkpoint = readCheckpoint(job.checkpoint);

  // Resolve `appId` a partir de `bundleIdentifier` — sempre reconsultado
  // (nunca cacheado no checkpoint) porque é barato (uma chamada `GET
  // /apps`) e não é um dado sensível.
  const apps = await adapter.listApps();
  if (!apps.ok) return classifiedFailure(admin, job, apps.code, checkpoint);
  const matchedApp = apps.items.find((a) => a.bundleId === bundleIdentifier);
  if (!matchedApp) return terminalFailure(admin, job, "APPLE_APP_NOT_FOUND_FOR_BUNDLE_IDENTIFIER", "NON_RETRYABLE");
  const appId = matchedApp.id;

  // Etapa 1 — sem Review Submission ainda: antes de criar, reconcilia
  // (GATE 15) contra `listReviewSubmissions` para evitar duplicata se um
  // attempt anterior criou a entidade mas perdeu a resposta antes de
  // persistir o checkpoint.
  if (!checkpoint.reviewSubmissionId) {
    const existing = await adapter.listReviewSubmissions({ appId, platform: DEFAULT_PLATFORM }, guard.baseUrl);
    if (!existing.ok) return classifiedFailure(admin, job, existing.code, checkpoint);
    const reusable = existing.items.find((rs) => rs.state && rs.state !== "COMPLETE" && rs.state !== "CANCELED");
    if (reusable) {
      return {
        outcome: "continue",
        checkpoint: {
          provider: "APPLE_APP_STORE",
          reviewSubmissionId: reusable.id,
          providerState: reusable.state,
          externalResultState: "NOT_ATTEMPTED",
        },
      };
    }
    const created = await adapter.createReviewSubmission({ appId, platform: DEFAULT_PLATFORM }, guard.baseUrl);
    if (!created.ok) return classifiedFailure(admin, job, created.code, checkpoint);
    return {
      outcome: "continue",
      checkpoint: {
        provider: "APPLE_APP_STORE",
        reviewSubmissionId: created.item.reviewSubmissionId,
        providerState: created.item.state,
        externalResultState: "NOT_ATTEMPTED",
      },
    };
  }

  // Etapa 2 — Review Submission existe, item (o Build revisável) ainda não
  // associado.
  if (!checkpoint.reviewSubmissionItemId) {
    const item = await adapter.createReviewSubmissionItem(
      { reviewSubmissionId: checkpoint.reviewSubmissionId, buildId: providerUpload.apple_build_upload_id },
      guard.baseUrl,
    );
    if (!item.ok) return classifiedFailure(admin, job, item.code, checkpoint);
    return {
      outcome: "continue",
      checkpoint: { ...checkpoint, reviewSubmissionItemId: item.item.reviewSubmissionItemId },
    };
  }

  // Etapa 3 — submit tentado mas não confirmado (reentrada após crash):
  // reconciliar via `getReviewSubmission` antes de tentar de novo — nunca
  // reenviar `submitted: true` às cegas.
  if (checkpoint.submitAttempted && !checkpoint.submitConfirmed) {
    const reconciled = await adapter.getReviewSubmission(checkpoint.reviewSubmissionId, guard.baseUrl);
    if (!reconciled.ok) {
      return {
        outcome: "failed",
        errorCode: "UNKNOWN_EXTERNAL_RESULT",
        errorClass: "RETRYABLE",
        checkpoint: { ...checkpoint, externalResultState: "UNKNOWN_EXTERNAL_RESULT" },
      };
    }
    const state = reconciled.item.state;
    if (state && state !== "READY_FOR_REVIEW" && state !== "COMPLETE_PENDING") {
      // Estado já avançou (ex.: WAITING_FOR_REVIEW/IN_REVIEW) → submit
      // anterior de fato ocorreu.
      await admin.rpc("complete_submission_job", {
        p_job_id: job.id,
        p_submission_id: submission.id,
        p_result: "SUBMITTED",
        p_error_code: null,
        p_duration_ms: 0,
      });
      return {
        outcome: "succeeded",
        checkpoint: { ...checkpoint, submitConfirmed: true, providerState: state, externalResultState: "CONFIRMED" },
      };
    }
    // Ainda em estado pré-submit → seguro repetir.
    checkpoint.submitAttempted = false;
  }

  const attemptedCheckpoint = { ...checkpoint, submitAttempted: true, externalResultState: "ATTEMPTED" as const };
  const submitted = await adapter.submitReviewSubmission(checkpoint.reviewSubmissionId, guard.baseUrl);
  if (!submitted.ok) {
    const retryable = submitted.code === "RATE_LIMITED" || submitted.code === "SERVER_ERROR" || submitted.code === "UNKNOWN";
    return {
      outcome: "failed",
      errorCode: submitted.code ?? "PROVIDER_ERROR",
      errorClass: retryable ? "RETRYABLE" : "NON_RETRYABLE",
      checkpoint: { ...attemptedCheckpoint, externalResultState: retryable ? "UNKNOWN_EXTERNAL_RESULT" : "ATTEMPTED" },
    };
  }

  await admin.rpc("complete_submission_job", {
    p_job_id: job.id,
    p_submission_id: submission.id,
    p_result: "SUBMITTED",
    p_error_code: null,
    p_duration_ms: 0,
  });
  return {
    outcome: "succeeded",
    checkpoint: {
      ...attemptedCheckpoint,
      submitConfirmed: true,
      providerState: submitted.item.state,
      externalResultState: "CONFIRMED",
    },
  };
};

async function classifiedFailure(
  admin: ReturnType<typeof createAdminClient>,
  job: { id: string; submission_id: string | null },
  code: string | undefined,
  checkpoint?: AppleSubmitCheckpoint,
): Promise<JobStepResult> {
  const retryable = code === "RATE_LIMITED" || code === "SERVER_ERROR" || code === "UNKNOWN";
  if (job.submission_id && !retryable) {
    await admin.rpc("complete_submission_job", {
      p_job_id: job.id,
      p_submission_id: job.submission_id,
      p_result: "FAILED",
      p_error_code: code ?? "PROVIDER_ERROR",
      p_duration_ms: null,
    });
  }
  return {
    outcome: "failed",
    errorCode: code ?? "PROVIDER_ERROR",
    errorClass: retryable ? "RETRYABLE" : "NON_RETRYABLE",
    checkpoint,
  };
}

async function terminalFailure(
  admin: ReturnType<typeof createAdminClient>,
  job: { id: string; submission_id: string | null },
  errorCode: string,
  errorClass: "NON_RETRYABLE" | "RETRYABLE",
): Promise<JobStepResult> {
  if (job.submission_id) {
    await admin.rpc("complete_submission_job", {
      p_job_id: job.id,
      p_submission_id: job.submission_id,
      p_result: "FAILED",
      p_error_code: errorCode,
      p_duration_ms: null,
    });
  }
  return { outcome: "failed", errorCode, errorClass };
}
