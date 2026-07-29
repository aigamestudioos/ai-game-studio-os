import type { KnowledgeDocumentType } from "@agsos/database";

// Rótulos em português para o enum `knowledge_document_type` do banco
// (Sprint 2.2) — mock tinha 6 opções ("Documento" incluído como genérico);
// enum real tem 9, sem um valor "genérico" — TECHNICAL_DOCUMENT é o mais
// próximo e vira o default do formulário.
export const KNOWLEDGE_TYPES: KnowledgeDocumentType[] = [
  "TECHNICAL_DOCUMENT",
  "GUIDE",
  "PLAYBOOK",
  "SOP",
  "ADR",
  "SPEC",
  "TEMPLATE",
  "POLICY",
  "LESSON_LEARNED",
];

const LABELS: Record<KnowledgeDocumentType, string> = {
  TECHNICAL_DOCUMENT: "Documento",
  GUIDE: "Guia",
  PLAYBOOK: "Playbook",
  SOP: "SOP",
  ADR: "ADR",
  SPEC: "SPEC",
  TEMPLATE: "Template",
  POLICY: "Política",
  LESSON_LEARNED: "Lição Aprendida",
};

export function knowledgeTypeLabel(type: KnowledgeDocumentType): string {
  return LABELS[type];
}
