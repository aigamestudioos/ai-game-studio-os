import type { SubmissionStatus as SubmissionStatusEnum } from "@agsos/database";

// Rótulos em português para o enum `submission_status` do banco (Sprint 2.3)
// — mesmo padrão de apps/web/lib/game-status.ts.
// Sprint 2.16a — READY_TO_SUBMIT/SUBMITTING/FAILED adicionados para o
// lifecycle real (ver DECISIONS.md, GATE 0/6). "Enviado" (SUBMITTED) nunca
// deve ser confundido com "Publicado" (PUBLISHED) — SUBMITTED prova só que
// a Submission passou pelo envio local com sucesso, nunca aprovação real
// de loja (ver GATE 15/27 do Sprint 2.16 em IMPLEMENTATION_LOG.md).
const LABELS: Record<SubmissionStatusEnum, string> = {
  DRAFT: "Rascunho",
  WAITING: "Aguardando",
  READY_TO_SUBMIT: "Pronto para enviar",
  SUBMITTING: "Enviando…",
  SUBMITTED: "Enviado",
  IN_REVIEW: "Em análise",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
  PUBLISHED: "Publicado",
  CANCELLED: "Cancelado",
  FAILED: "Falhou",
};

const VARIANTS: Record<SubmissionStatusEnum, "default" | "warning" | "success" | "destructive"> = {
  DRAFT: "default",
  WAITING: "default",
  READY_TO_SUBMIT: "default",
  SUBMITTING: "warning",
  SUBMITTED: "success",
  IN_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  PUBLISHED: "success",
  CANCELLED: "destructive",
  FAILED: "destructive",
};

export function submissionStatusLabel(status: SubmissionStatusEnum): string {
  return LABELS[status];
}

export function submissionStatusVariant(status: SubmissionStatusEnum): "default" | "warning" | "success" | "destructive" {
  return VARIANTS[status];
}
