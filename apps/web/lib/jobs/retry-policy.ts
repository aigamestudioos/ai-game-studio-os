import type { IntegrationJobsRow, JobErrorClass } from "@agsos/database";

// Sprint 2.11d-2 (GATE 17) — política de retry automático. Classes já
// definidas no Sprint 2.11d-1 (`job_error_class`, ver `database.types.ts`);
// esta é a primeira vez que elas de fato decidem uma transição de estado.
//
// RETRYABLE/RATE_LIMIT/AUTH/INTERNAL podem tentar de novo (respeitando
// `max_attempts` — nunca infinito); NON_RETRYABLE/PROVIDER_REJECTED vão
// direto para FAILED terminal, independente de quantas tentativas restam —
// tentar de novo uma rejeição definitiva do provider (ex.: arquivo
// corrompido, app não encontrado) não vai mudar de resultado.
const RETRYABLE_CLASSES: ReadonlySet<JobErrorClass> = new Set(["RETRYABLE", "RATE_LIMIT", "AUTH", "INTERNAL"]);

const BASE_BACKOFF_SECONDS = 30;
const MAX_BACKOFF_SECONDS = 30 * 60;

export type RetryDecision =
  | { status: "FAILED" }
  | { status: "DEAD" }
  | { status: "RETRY_WAIT"; nextAttemptAt: Date };

// `attempt` no momento desta decisão ainda é o attempt ATUAL (antes do
// incremento que `complete_integration_job` faz internamente quando o
// status resultante é RETRY_WAIT) — por isso a checagem de exaustão usa
// `attempt >= max_attempts` diretamente, sem +1: se este já era a última
// tentativa permitida, não há próxima.
export function decideRetry(
  job: Pick<IntegrationJobsRow, "attempt" | "max_attempts">,
  errorClass: JobErrorClass,
  retryAfterSeconds?: number,
): RetryDecision {
  if (!RETRYABLE_CLASSES.has(errorClass)) {
    return { status: "FAILED" };
  }

  if (job.attempt >= job.max_attempts) {
    return { status: "DEAD" };
  }

  // Backoff exponencial (30s, 60s, 120s, ...), capado — mas nunca abaixo do
  // `Retry-After` que o provider mandou de verdade (GATE 17: "respeitar
  // Retry-After quando aplicável" — o provider sabe melhor que um backoff
  // genérico quando ele estará disponível de novo).
  const exponentialSeconds = Math.min(BASE_BACKOFF_SECONDS * 2 ** (job.attempt - 1), MAX_BACKOFF_SECONDS);
  const waitSeconds = retryAfterSeconds !== undefined ? Math.max(retryAfterSeconds, exponentialSeconds) : exponentialSeconds;

  return { status: "RETRY_WAIT", nextAttemptAt: new Date(Date.now() + waitSeconds * 1000) };
}
