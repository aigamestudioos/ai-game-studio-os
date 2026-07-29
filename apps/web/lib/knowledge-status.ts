import type { KnowledgeDocumentStatus } from "@agsos/database";

// Rótulos em português para o enum `knowledge_document_status` do banco
// (Sprint 2.2) — mesmo padrão de project-status.ts/game-status.ts.
const LABELS: Record<KnowledgeDocumentStatus, string> = {
  DRAFT: "Rascunho",
  IN_REVIEW: "Em revisão",
  APPROVED: "Aprovado",
  PUBLISHED: "Publicado",
  OBSOLETE: "Obsoleto",
  ARCHIVED: "Arquivado",
};

export function knowledgeStatusLabel(status: KnowledgeDocumentStatus): string {
  return LABELS[status];
}
