import type { GameStatus as GameStatusEnum } from "@agsos/database";

// Rótulos em português para o enum `game_status` do banco (Sprint 2.1) —
// mesmo padrão de apps/web/lib/project-status.ts.
const LABELS: Record<GameStatusEnum, string> = {
  DRAFT: "Rascunho",
  IN_DEVELOPMENT: "Em desenvolvimento",
  TESTING: "Em testes",
  READY_FOR_RELEASE: "Pronto para lançar",
  PUBLISHED: "Publicado",
  SUSPENDED: "Suspenso",
  ARCHIVED: "Arquivado",
};

export function gameStatusLabel(status: GameStatusEnum): string {
  return LABELS[status];
}
