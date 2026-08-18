import { createAdminClient, createStoreConnectionsRepository } from "@agsos/database";
import { createGooglePlayPublishingAdapter, type GoogleCredentials, type GoogleTrack } from "@agsos/integrations";
import { checkStoreMutationGuard } from "../store-mutation-guard";
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
// GATE 25/16 — PRODUCTION GUARD (duas camadas): nenhuma chamada real de
// `edits.tracks.update`/`edits.commit` acontece a menos que
// `env.allowStoreMutation === true` E o `baseUrl` de destino esteja na
// allowlist (`checkStoreMutationGuard`). Por padrão nenhuma das duas está
// ligada — o processor ainda percorre toda a orquestração real até o
// ponto do guard, produzindo um resultado SIMULADO quando bloqueado
// (`simulated: true` no checkpoint), permitindo provar o lifecycle
// DRAFT → READY_TO_SUBMIT → SUBMITTING → SUBMITTED de ponta a ponta sem
// nenhuma mutação real de loja.
//
// GATE 8 — Track strategy: não existe, no domínio atual, nenhum campo em
// Submission/Release/StoreConnection que represente "canal" (track) —
// auditado em `submissions`, `releases`, `store_connections` (Sprint
// 2.16a). Política MVP explícita (não uma escolha silenciosa de
// produção): track `internal`, o canal de menor risco suportado pela
// Android Publisher API, sem exigir nenhum revisor/aprovação adicional do
// Google. Documentado aqui e em DECISIONS.md; tornar isto configurável por
// Release/StoreConnection é trabalho de um sprint de produto futuro, não
// deste sub-sprint técnico.
const DEFAULT_TRACK = "internal";
const REAL_BASE_URL = "https://androidpublisher.googleapis.com/androidpublisher/v3";

// GATE 11 — reconciliation state machine (estado TÉCNICO do job, não um
// novo estado de Submission): distingue se o `edits.commit` foi de fato
// tentado e se o resultado pôde ser confirmado. `UNKNOWN_EXTERNAL_RESULT`
// nunca é convertido automaticamente em SUCCESS/FAILED — só reconciliado
// via `edits.get` (se o Edit não existe mais, o commit ocorreu; se ainda
// existe, não ocorreu e é seguro tentar de novo).
type ExternalResultState = "NOT_ATTEMPTED" | "ATTEMPTED" | "CONFIRMED" | "UNKNOWN_EXTERNAL_RESULT";

type GoogleSubmitCheckpoint = {
  provider: "GOOGLE_PLAY";
  editId?: string;
  track?: string;
  versionCode?: number;
  trackUpdated?: boolean;
  commitAttempted?: boolean;
  commitConfirmed?: boolean;
  externalResultState?: ExternalResultState;
  simulated?: boolean;
};

function readCheckpoint(raw: Record<string, unknown>): GoogleSubmitCheckpoint {
  return {
    provider: "GOOGLE_PLAY",
    editId: typeof raw.editId === "string" ? raw.editId : undefined,
    track: typeof raw.track === "string" ? raw.track : undefined,
    versionCode: typeof raw.versionCode === "number" ? raw.versionCode : undefined,
    trackUpdated: raw.trackUpdated === true,
    commitAttempted: raw.commitAttempted === true,
    commitConfirmed: raw.commitConfirmed === true,
    externalResultState: (raw.externalResultState as ExternalResultState | undefined) ?? "NOT_ATTEMPTED",
  };
}

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

  // `AGSOS_GOOGLE_PLAY_TEST_BASE_URL` só existe para apontar ao fake
  // provider server em testes de integração — nunca setado em `.env` de
  // produção/deploy. O guard (`checkStoreMutationGuard`) valida
  // independentemente se este host está autorizado.
  const baseUrl = process.env.AGSOS_GOOGLE_PLAY_TEST_BASE_URL || REAL_BASE_URL;
  const guard = checkStoreMutationGuard(baseUrl);

  if (!guard.allowed) {
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

  const secret = await storeConnectionsRepo.getSecret(connection.id).catch(() => null);
  if (!secret) return terminalFailure(admin, job, "MISSING_CREDENTIAL", "NON_RETRYABLE");
  let credentials: GoogleCredentials;
  try {
    credentials = JSON.parse(secret) as GoogleCredentials;
  } catch {
    return terminalFailure(admin, job, "INVALID_CREDENTIAL", "NON_RETRYABLE");
  }

  const adapter = createGooglePlayPublishingAdapter(credentials);
  const checkpoint = readCheckpoint(job.checkpoint);
  const versionCode = checkpoint.versionCode ?? providerUpload.version_code;
  const track = checkpoint.track ?? DEFAULT_TRACK;

  // Etapa 1 — sem Edit ainda: cria um Edit novo dedicado a esta submissão.
  if (!checkpoint.editId) {
    const created = await adapter.createEdit(guard.baseUrl);
    if (!created.ok) return classifiedFailure(admin, job, created.code, created.error);
    return {
      outcome: "continue",
      checkpoint: { provider: "GOOGLE_PLAY", editId: created.item.editId, track, versionCode, externalResultState: "NOT_ATTEMPTED" },
    };
  }

  // Etapa 2 — Edit existe, track ainda não atualizada: lê o Track atual,
  // adiciona o `versionCode` como um novo `TrackRelease` "completed"
  // (política MVP: 100% rollout imediato dentro da track `internal`, sem
  // staged rollout — fora de escopo de produto deste sprint) e faz PUT.
  if (!checkpoint.trackUpdated) {
    const current = await adapter.getTrack(checkpoint.editId, track, guard.baseUrl);
    if (!current.ok) return classifiedFailure(admin, job, current.code, current.error, checkpoint);
    const nextTrack: GoogleTrack = {
      track,
      releases: [{ status: "completed", versionCodes: [String(versionCode)] }],
    };
    const updated = await adapter.updateTrack(checkpoint.editId, nextTrack, guard.baseUrl);
    if (!updated.ok) return classifiedFailure(admin, job, updated.code, updated.error, checkpoint);
    return {
      outcome: "continue",
      checkpoint: { ...checkpoint, trackUpdated: true },
    };
  }

  // Etapa 3 — track atualizada, commit ainda não tentado (ou já tentado
  // mas não confirmado — reconciliation, GATE 11).
  if (checkpoint.commitAttempted && !checkpoint.commitConfirmed) {
    // Estado ao reentrar depois de um crash/timeout entre o envio do
    // commit e a leitura da resposta: NUNCA reenviar `edits.commit` às
    // cegas. Consulta `edits.get` — se o Edit não existe mais (404), o
    // commit consumiu o Edit (ocorreu); se ainda existe, não ocorreu e é
    // seguro tentar de novo.
    const reconciled = await adapter.getEdit(checkpoint.editId, guard.baseUrl);
    if (reconciled.ok) {
      // Edit ainda existe → commit anterior não aconteceu → seguro repetir.
      checkpoint.commitAttempted = false;
    } else if (reconciled.code === "NOT_FOUND") {
      // Edit consumido → commit anterior de fato ocorreu.
      await admin.rpc("complete_submission_job", {
        p_job_id: job.id,
        p_submission_id: submission.id,
        p_result: "SUBMITTED",
        p_error_code: null,
        p_duration_ms: 0,
      });
      return { outcome: "succeeded", checkpoint: { ...checkpoint, commitConfirmed: true, externalResultState: "CONFIRMED" } };
    } else {
      // Nem confirmado nem descartável — preserva UNKNOWN_EXTERNAL_RESULT,
      // nunca converte em SUCCESS/FAILED arbitrariamente.
      return {
        outcome: "failed",
        errorCode: "UNKNOWN_EXTERNAL_RESULT",
        errorClass: "RETRYABLE",
        checkpoint: { ...checkpoint, externalResultState: "UNKNOWN_EXTERNAL_RESULT" },
      };
    }
  }

  const attemptedCheckpoint = { ...checkpoint, commitAttempted: true, externalResultState: "ATTEMPTED" as const };
  const committed = await adapter.commitEdit(checkpoint.editId, guard.baseUrl);
  if (!committed.ok) {
    // Sprint 2.16c — bugfix (achado pelo teste de integração de lost-response):
    // `UNEXPECTED_ERROR` cobre timeout/conexão perdida/exceção não tratada no
    // client — nunca uma rejeição definitiva do provider. Classificar como
    // NON_RETRYABLE quebrava a reconciliation do GATE 11: o job ia direto
    // para FAILED terminal sem nunca reentrar no processor para consultar
    // `edits.get` e descobrir se o commit perdido de fato ocorreu.
    const retryable = committed.code === "RATE_LIMITED" || committed.code === "SERVER_ERROR" || committed.code === "UNKNOWN" || committed.code === "UNEXPECTED_ERROR";
    return {
      outcome: "failed",
      errorCode: committed.code ?? "PROVIDER_ERROR",
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
    checkpoint: { ...attemptedCheckpoint, commitConfirmed: true, externalResultState: "CONFIRMED" },
  };
};

async function classifiedFailure(
  admin: ReturnType<typeof createAdminClient>,
  job: { id: string; submission_id: string | null; checkpoint?: unknown },
  code: string | undefined,
  _error: string | undefined,
  checkpoint?: GoogleSubmitCheckpoint,
): Promise<JobStepResult> {
  // Sprint 2.16c — mesmo bugfix do commit final (ver comentário acima):
  // UNEXPECTED_ERROR (timeout/erro de rede) é ambíguo, não uma rejeição
  // definitiva — precisa poder tentar de novo.
  const retryable = code === "RATE_LIMITED" || code === "SERVER_ERROR" || code === "UNKNOWN" || code === "UNEXPECTED_ERROR";
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

export type { GoogleCredentials };
export { classifyGoogleCommitError } from "./submission-error-classification";
