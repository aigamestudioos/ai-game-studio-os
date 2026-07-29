import type { ProjectStatus as ProjectStatusEnum } from "@agsos/database";

// Rótulos em português para o enum `project_status` do banco (Sprint 2.0) —
// separado do `ProjectStatus` (string livre) de components/dashboard/cards.tsx,
// que só estiliza o que recebe.
const LABELS: Record<ProjectStatusEnum, string> = {
  DRAFT: "Rascunho",
  PLANNING: "Planejamento",
  ACTIVE: "Em desenvolvimento",
  ON_HOLD: "Em pausa",
  COMPLETED: "Concluído",
  ARCHIVED: "Arquivado",
};

export function projectStatusLabel(status: ProjectStatusEnum): string {
  return LABELS[status];
}
