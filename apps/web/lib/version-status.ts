import type { VersionStatus } from "@agsos/database";

// Rótulos em português para o enum `version_status` do banco (Sprint 2.5) —
// mesmo padrão de apps/web/lib/game-status.ts.
const LABELS: Record<VersionStatus, string> = {
  DRAFT: "Rascunho",
  IN_DEVELOPMENT: "Em desenvolvimento",
  TESTING: "Em testes",
  READY: "Pronta",
  RELEASED: "Lançada",
  DEPRECATED: "Descontinuada",
};

const VARIANTS: Record<VersionStatus, "default" | "warning" | "success" | "destructive" | "outline"> = {
  DRAFT: "outline",
  IN_DEVELOPMENT: "default",
  TESTING: "default",
  READY: "warning",
  RELEASED: "success",
  DEPRECATED: "destructive",
};

export function versionStatusLabel(status: VersionStatus): string {
  return LABELS[status];
}

export function versionStatusVariant(status: VersionStatus): "default" | "warning" | "success" | "destructive" | "outline" {
  return VARIANTS[status];
}
