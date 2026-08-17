import { createAdminClient, createStoreConnectionsRepository } from "@agsos/database";
import { env } from "../../env";
import type { IntegrationJobProcessor, JobStepResult } from "../types";

// Sprint 2.16c — processor de EXECUÇÃO de Submission para App Store.
// Distinto do processor de TRANSPORTE (`apple-app-store.ts`, Sprint
// 2.11d-2d): aquele sobe o binário via Build Upload
// (`createBuildUpload`/`commitBuildUploadFile`) e grava
// `apple_build_upload_id` em `provider_uploads`. Documentação oficial da
// App Store Connect API confirma: Build Upload é a entrega do binário —
// Review Submission é uma entidade separada, o objeto que de fato inicia
// uma avaliação de review. Este processor assume o transporte já
// concluído (`provider_uploads.status = SUCCEEDED` com
// `apple_build_upload_id` presente) e cobre o passo que falta: criar a
// Review Submission associada ao Build.
//
// GATE 25 — PRODUCTION GUARD: nenhuma chamada real que crie/envie uma
// Review Submission acontece a menos que `env.allowStoreMutation ===
// true`. Por padrão (nenhum sprint até agora define
// `AGSOS_ALLOW_STORE_MUTATION`), o processor localiza os dados reais e
// produz um resultado SIMULADO, provando o lifecycle sem qualquer review
// real disparado contra a Apple.
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

  if (!env.allowStoreMutation) {
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

  // Guard ligado (nunca acontece neste sprint) — a criação real de Review
  // Submission ficaria aqui (createApplePublishingAdapter(...) estendido
  // com createReviewSubmission, fora de escopo de implementação real
  // neste sprint — GATE 11 pede só tipos/client/adapter/orchestration
  // interface, não a chamada destrutiva).
  return terminalFailure(admin, job, "REAL_STORE_MUTATION_NOT_IMPLEMENTED", "NON_RETRYABLE");
};

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
