import type { JobErrorClass } from "@agsos/database";
import type { IntegrationJobProcessor } from "../types";

// Sprint 2.11d-2 — processor de teste, sem chamada de rede real. Existe só
// para provar o dispatcher (claim → running → checkpoint/continue → lease
// heartbeat → succeeded/failed) de ponta a ponta ANTES de qualquer
// integração real (Google/Apple) existir no worker — essas ficam para os
// sub-sprints 2.11d-2c/2.11d-2d. Nunca registrar isto fora de ambiente de
// teste (ver `registry.ts`).
//
// Checkpoint esperado: `{ step?: number; targetSteps?: number;
// forceErrorClass?: JobErrorClass }`. Sem `targetSteps`, assume 3 passos.
export const testEchoProcessor: IntegrationJobProcessor = async (job, ctx) => {
  const checkpoint = job.checkpoint as { step?: number; targetSteps?: number; forceErrorClass?: JobErrorClass };

  if (checkpoint.forceErrorClass) {
    return { outcome: "failed", errorCode: "TEST_FORCED_ERROR", errorClass: checkpoint.forceErrorClass };
  }

  // Prova o heartbeat (GATE 10) — chamado incondicionalmente aqui porque
  // este é o único propósito deste processor: exercitar o mecanismo, não
  // simular a decisão real de "essa operação específica é longa o
  // suficiente para justificar renovar o lease" (isso é responsabilidade
  // de cada processor real).
  await ctx.renewLease();

  const targetSteps = checkpoint.targetSteps ?? 3;
  const nextStep = (checkpoint.step ?? 0) + 1;

  if (nextStep >= targetSteps) {
    return { outcome: "succeeded", checkpoint: { step: nextStep } };
  }
  return { outcome: "continue", checkpoint: { ...checkpoint, step: nextStep } };
};
