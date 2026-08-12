import type { IntegrationJobsRow, JobErrorClass } from "@agsos/database";

// Sprint 2.11d-2 — contrato que todo processor de provider (Google/Apple,
// implementados nos sub-sprints 2.11d-2c/2.11d-2d) precisa satisfazer.
// Definido aqui, sem provider real ainda, para que o dispatcher (GATEs
// 6/9/10) seja testável de ponta a ponta com um processor de teste antes
// de qualquer chamada de rede real existir.

// `continue`: ainda há trabalho a fazer (ex.: mais chunks) — mesma
// tentativa (`attempt` não incrementa), o job volta para QUEUED com o
// checkpoint atualizado, pronto pra próxima invocation retomar dele.
// `succeeded`/`failed`: transição terminal ou retry — ver
// `classifyJobError` para como `failed` se traduz em RETRY_WAIT vs.
// FAILED/DEAD.
export type JobStepResult =
  | { outcome: "continue"; checkpoint: Record<string, unknown> }
  | { outcome: "succeeded"; checkpoint?: Record<string, unknown> }
  | { outcome: "failed"; errorCode: string; errorClass: JobErrorClass; retryAfterSeconds?: number };

// `deadline`: timestamp (ms epoch) depois do qual o processor deve parar de
// pedir mais trabalho e retornar `continue` com o que já tiver — o
// dispatcher decide separadamente se ainda cabe outra chamada ao
// processor (GATE 9), mas o processor também precisa respeitar o deadline
// dentro de uma única chamada (ex.: não tentar enviar um chunk gigante
// perto do limite).
// `renewLease`: heartbeat (GATE 10) — o processor chama isso antes de uma
// operação individual que pode ultrapassar o lease original (ex.: um
// upload de chunk lento). Nunca chamado incondicionalmente em loop —
// só quando a operação em questão justifica.
export type JobStepContext = {
  deadline: number;
  renewLease: () => Promise<void>;
};

export type IntegrationJobProcessor = (job: IntegrationJobsRow, ctx: JobStepContext) => Promise<JobStepResult>;
