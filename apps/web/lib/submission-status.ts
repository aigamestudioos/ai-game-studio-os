import type { SubmissionStatus as SubmissionStatusEnum } from "@agsos/database";

// Rótulos em português para o enum `submission_status` do banco (Sprint 2.3)
// — mesmo padrão de apps/web/lib/game-status.ts.
const LABELS: Record<SubmissionStatusEnum, string> = {
  DRAFT: "Rascunho",
  WAITING: "Aguardando",
  SUBMITTED: "Enviado",
  IN_REVIEW: "Em análise",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
  PUBLISHED: "Publicado",
  CANCELLED: "Cancelado",
};

const VARIANTS: Record<SubmissionStatusEnum, "default" | "warning" | "success" | "destructive"> = {
  DRAFT: "default",
  WAITING: "default",
  SUBMITTED: "default",
  IN_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  PUBLISHED: "success",
  CANCELLED: "destructive",
};

export function submissionStatusLabel(status: SubmissionStatusEnum): string {
  return LABELS[status];
}

export function submissionStatusVariant(status: SubmissionStatusEnum): "default" | "warning" | "success" | "destructive" {
  return VARIANTS[status];
}
