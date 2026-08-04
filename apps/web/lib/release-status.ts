import type { ReleaseChannel, ReleaseStatus } from "@agsos/database";

// Rótulos em português para os enums `release_status`/`release_channel`
// (Sprint 2.4/2.5) — mesmo padrão de apps/web/lib/game-status.ts.
const STATUS_LABELS: Record<ReleaseStatus, string> = {
  DRAFT: "Rascunho",
  READY_FOR_SUBMISSION: "Pronto para submissão",
  SUBMISSION_IN_PROGRESS: "Submissão em andamento",
  PARTIALLY_PUBLISHED: "Parcialmente publicado",
  PUBLISHED: "Publicado",
  REJECTED: "Rejeitado",
  CANCELLED: "Cancelado",
  ARCHIVED: "Arquivado",
};

const STATUS_VARIANTS: Record<ReleaseStatus, "default" | "warning" | "success" | "destructive" | "outline"> = {
  DRAFT: "outline",
  READY_FOR_SUBMISSION: "warning",
  SUBMISSION_IN_PROGRESS: "default",
  PARTIALLY_PUBLISHED: "warning",
  PUBLISHED: "success",
  REJECTED: "destructive",
  CANCELLED: "destructive",
  ARCHIVED: "outline",
};

const CHANNEL_LABELS: Record<ReleaseChannel, string> = {
  INTERNAL: "Interno",
  ALPHA: "Alpha",
  BETA: "Beta",
  PRODUCTION: "Produção",
};

export function releaseStatusLabel(status: ReleaseStatus): string {
  return STATUS_LABELS[status];
}

export function releaseStatusVariant(status: ReleaseStatus): "default" | "warning" | "success" | "destructive" | "outline" {
  return STATUS_VARIANTS[status];
}

export function releaseChannelLabel(channel: ReleaseChannel): string {
  return CHANNEL_LABELS[channel];
}
