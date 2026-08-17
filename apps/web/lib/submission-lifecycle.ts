import type { SubmissionStatus } from "@agsos/database";

// Sprint 2.16a (GATE 22) — espelho, do lado do client, da state machine
// que `transition_submission` valida de verdade no servidor. Usado só para
// decidir QUAL botão mostrar na UI (GATE 15) — nunca é a fonte da
// verdade: mesmo que este helper erre, o RPC no servidor sempre revalida
// tudo de novo (permissão, readiness, estado atual) antes de qualquer
// efeito. Mantido puro e sem I/O para ser testável sem mocks.
export type SubmissionAction = "PREPARE" | "SUBMIT" | "RETRY";

export function allowedSubmissionAction(status: SubmissionStatus): SubmissionAction | null {
  switch (status) {
    case "DRAFT":
      return "PREPARE";
    case "READY_TO_SUBMIT":
      return "SUBMIT";
    case "FAILED":
      return "RETRY";
    default:
      return null;
  }
}

export function isSubmissionInFlight(status: SubmissionStatus): boolean {
  return status === "SUBMITTING";
}

export function isSubmissionTerminalSuccess(status: SubmissionStatus): boolean {
  // Deliberadamente restrito a SUBMITTED — nunca inclui APPROVED/PUBLISHED
  // aqui: esses estados são DEFINED_BUT_UNREACHABLE neste sprint (nenhum
  // mecanismo real os produz), incluí-los faria este helper mentir sobre
  // o que o sistema de fato provou.
  return status === "SUBMITTED";
}
