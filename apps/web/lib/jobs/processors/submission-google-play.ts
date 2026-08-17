import { createAdminClient, createStoreConnectionsRepository } from "@agsos/database";
import type { GoogleCredentials } from "@agsos/integrations";
import { env } from "../../env";
import type { IntegrationJobProcessor, JobStepResult } from "../types";

// Sprint 2.16b — processor de EXECUÇÃO de Submission para Google Play.
// Distinto do processor de TRANSPORTE (`google-play.ts`, Sprint 2.11d-2c):
// aquele move o artifact para um Google Play Edit e grava `versionCode` em
// `provider_uploads` (fato: "o binário chegou ao Google"); este assume que
// o transporte já terminou com SUCCEEDED e completa o passo que a
// documentação oficial da Android Publisher API define como o que torna
// as mudanças efetivas: atribuir o `versionCode` a uma track e comitar o
// Edit (`edits.commit`).
//
// GATE 25 — PRODUCTION GUARD: nenhuma chamada real de `edits.tracks.update`
// / `edits.commit` acontece a menos que `env.allowStoreMutation === true`.
// Por padrão (nenhum sprint até agora define `AGSOS_ALLOW_STORE_MUTATION`),
// o processor ainda percorre toda a orquestração real — busca a
// Submission, a Release, o `provider_upload` SUCCEEDED, a Store
// Connection, monta o payload de track — e produz um resultado SIMULADO
// (`simulated: true` no checkpoint), permitindo provar o lifecycle
// DRAFT → READY_TO_SUBMIT → SUBMITTING → SUBMITTED de ponta a ponta sem
// nenhuma mutação real de loja. Ligar a flag é decisão de Production
// Validation, fora deste sprint.
const DEFAULT_TRACK = "internal";

export const submissionGooglePlayProcessor: IntegrationJobProcessor = async (job) => {
  const admin = createAdminClient();

  if (!job.submission_id) {
    return terminalFailure(admin, job, "SUBMISSION_ID_MISSING", "NON_RETRYABLE");
  }

  const { data: submission } = await admin.from("submissions").select("*").eq("id", job.submission_id).maybeSingle();
  if (!submission) return terminalFailure(admin, job, "SUBMISSION_NOT_FOUND", "NON_RETRYABLE");

  const { data: build } = await admin.from("builds").select("*").eq("id", submission.build_id).maybeSingle();
  if (!build) return terminalFailure(admin, job, "BUILD_NOT_FOUND", "NON_RETRYABLE");

  // O `provider_upload` SUCCEEDED mais recente para este Build é o mesmo
  // que `get_release_readiness` exige como pré-condição (readiness já foi
  // revalidada no servidor por `transition_submission` antes deste job
  // existir — aqui só localizamos o registro, não repetimos a decisão).
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
  if (!providerUpload || providerUpload.version_code == null) {
    return terminalFailure(admin, job, "PROVIDER_UPLOAD_MISSING", "NON_RETRYABLE");
  }

  const storeConnectionsRepo = createStoreConnectionsRepository(admin);
  const connection = await storeConnectionsRepo.getById(providerUpload.store_connection_id);
  if (!connection) return terminalFailure(admin, job, "STORE_CONNECTION_MISSING", "NON_RETRYABLE");

  if (!env.allowStoreMutation) {
    // Simulado: nenhuma chamada de rede real. Prova o design ("attach
    // versionCode to track → commit") sem executar a parte irreversível.
    await admin.rpc("complete_submission_job", {
      p_job_id: job.id,
      p_submission_id: submission.id,
      p_result: "SUBMITTED",
      p_error_code: null,
      p_duration_ms: 0,
    });
    return {
      outcome: "succeeded",
      checkpoint: { simulated: true, track: DEFAULT_TRACK, versionCode: providerUpload.version_code },
    };
  }

  // Guard ligado (nunca acontece neste sprint) — chamada real ficaria
  // aqui: createGooglePlayPublishingAdapter(...).commitEdit(...). Marcado
  // como NON_RETRYABLE/INTERNAL de propósito: nenhum sprint atual liga a
  // flag, então este ramo nunca deveria ser exercitado em produção agora.
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

export type { GoogleCredentials };
export { classifyGoogleCommitError } from "./submission-error-classification";
