import { randomUUID } from "node:crypto";
import { createAdminClient, createIntegrationJobsRepository, type IntegrationJobsRow } from "@agsos/database";
import { decideRetry } from "./retry-policy";
import { getIntegrationJobProcessor } from "./registry";

// Sprint 2.11d-2 (GATEs 6/9/10) — execução bounded de uma invocation do
// dispatcher. NUNCA esvazia a fila inteira; para antes do `deadline` e
// deixa o resto para a próxima invocation do `pg_cron` (a cada minuto,
// ver GATE 8) — a durabilidade vive em `integration_jobs`, não nesta
// função. Não depende da função sobreviver depois de retornar: cada job
// é liberado/completado antes de seguir para o próximo, nunca deixado
// "em voo" ao final da invocation.
const DEFAULT_MAX_JOBS = 5;
const DEFAULT_TIME_BUDGET_MS = 45_000;
const DEFAULT_SAFETY_MARGIN_MS = 5_000;
const DEFAULT_LEASE_SECONDS = 120;

export type DispatcherTickOptions = {
  maxJobs?: number;
  timeBudgetMs?: number;
  safetyMarginMs?: number;
  leaseSeconds?: number;
};

export type JobTickOutcome = {
  jobId: string;
  integrationName: string;
  operation: string;
  outcome: "continue" | "succeeded" | "retry_wait" | "failed" | "dead" | "processor_not_found" | "processor_error";
  errorCode?: string;
};

export type DispatcherTickSummary = {
  workerId: string;
  requeuedStaleJobs: number;
  claimedJobs: number;
  processedJobs: number;
  stoppedByDeadline: boolean;
  jobs: JobTickOutcome[];
};

export async function runDispatcherTick(options?: DispatcherTickOptions): Promise<DispatcherTickSummary> {
  const workerId = `tick-${randomUUID()}`;
  const leaseSeconds = options?.leaseSeconds ?? DEFAULT_LEASE_SECONDS;
  const deadline = Date.now() + (options?.timeBudgetMs ?? DEFAULT_TIME_BUDGET_MS) - (options?.safetyMarginMs ?? DEFAULT_SAFETY_MARGIN_MS);

  const admin = createAdminClient();
  const jobsRepo = createIntegrationJobsRepository(admin);

  // GATE 10 (metade "worker morto perde o lease") — antes de reivindicar
  // qualquer job novo, recupera o que outros workers abandonaram.
  const requeuedStaleJobs = await jobsRepo.requeueStale();

  const claimed = await jobsRepo.claim({ workerId, limit: options?.maxJobs ?? DEFAULT_MAX_JOBS, leaseSeconds });

  const jobs: JobTickOutcome[] = [];
  let stoppedByDeadline = false;

  for (const job of claimed) {
    if (Date.now() >= deadline) {
      // GATE 9 — para antes do orçamento acabar. Os jobs claimed e ainda
      // não processados mantêm o lease até expirar naturalmente;
      // `requeue_stale_jobs()` na próxima invocation os recupera — nunca
      // ficam perdidos, só esperam mais um ciclo.
      stoppedByDeadline = true;
      break;
    }

    jobs.push(await processOneJob(job, jobsRepo, workerId, leaseSeconds, deadline));
  }

  return { workerId, requeuedStaleJobs, claimedJobs: claimed.length, processedJobs: jobs.length, stoppedByDeadline, jobs };
}

async function processOneJob(
  job: IntegrationJobsRow,
  jobsRepo: ReturnType<typeof createIntegrationJobsRepository>,
  workerId: string,
  leaseSeconds: number,
  deadline: number,
): Promise<JobTickOutcome> {
  const base = { jobId: job.id, integrationName: job.integration_name, operation: job.operation };

  const processor = getIntegrationJobProcessor(job.integration_name);
  if (!processor) {
    await jobsRepo.complete({
      jobId: job.id,
      workerId,
      status: "FAILED",
      errorCode: "UNKNOWN_INTEGRATION",
      errorClass: "NON_RETRYABLE",
    });
    return { ...base, outcome: "processor_not_found" };
  }

  const running = await jobsRepo.startRunning({ jobId: job.id, workerId });

  let result;
  try {
    result = await processor(running, {
      deadline,
      renewLease: async () => {
        await jobsRepo.renewLease({ jobId: job.id, workerId, leaseSeconds });
      },
    });
  } catch {
    // Erro não classificado do processor (bug, exceção não tratada) —
    // nunca deixa o job travado em RUNNING; classificado como INTERNAL
    // retryable, mesma política de qualquer outra falha classificada.
    const decision = decideRetry(running, "INTERNAL");
    await jobsRepo.complete({
      jobId: job.id,
      workerId,
      status: decision.status,
      errorCode: "PROCESSOR_UNHANDLED_EXCEPTION",
      errorClass: "INTERNAL",
      nextAttemptAt: decision.status === "RETRY_WAIT" ? decision.nextAttemptAt.toISOString() : null,
    });
    return { ...base, outcome: "processor_error", errorCode: "PROCESSOR_UNHANDLED_EXCEPTION" };
  }

  if (result.outcome === "continue") {
    await jobsRepo.checkpointAndRelease({ jobId: job.id, workerId, checkpoint: result.checkpoint });
    return { ...base, outcome: "continue" };
  }

  if (result.outcome === "succeeded") {
    await jobsRepo.complete({ jobId: job.id, workerId, status: "SUCCEEDED", checkpoint: result.checkpoint });
    return { ...base, outcome: "succeeded" };
  }

  const decision = decideRetry(running, result.errorClass, result.retryAfterSeconds);
  await jobsRepo.complete({
    jobId: job.id,
    workerId,
    status: decision.status,
    errorCode: result.errorCode,
    errorClass: result.errorClass,
    nextAttemptAt: decision.status === "RETRY_WAIT" ? decision.nextAttemptAt.toISOString() : null,
  });
  return {
    ...base,
    outcome: decision.status === "RETRY_WAIT" ? "retry_wait" : decision.status === "DEAD" ? "dead" : "failed",
    errorCode: result.errorCode,
  };
}
