"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createKnowledgeDocumentsRepository,
  type KnowledgeDocumentType,
  type KnowledgeDocumentsRow,
  type Session,
} from "@agsos/database";
import { getBrowserClient } from "../lib/supabase-client";

export type DocumentWithSummary = { document: KnowledgeDocumentsRow; summary: string | null };

// Substitui apps/web/lib/knowledge-store.ts (mock) — Sprint 2.2. `summary`/
// `content` vivem em `knowledge_document_versions` (imutável), não no
// documento — criar um documento cria a versão 1 junto, com o resumo como
// conteúdo inicial (mesmo comportamento do mock: `content: input.summary`).
export function useKnowledgeDocuments(session: Session | null | undefined, studioId: string | undefined) {
  const [documents, setDocuments] = useState<DocumentWithSummary[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session || !studioId) return;
    try {
      const client = getBrowserClient();
      const repo = createKnowledgeDocumentsRepository(client);
      const rows = await repo.listWithLatestSummary();
      setDocuments(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar os documentos.");
    }
  }, [session, studioId]);

  useEffect(() => {
    load();
  }, [load]);

  async function createDocument(input: {
    title: string;
    summary: string;
    type: KnowledgeDocumentType;
  }): Promise<KnowledgeDocumentsRow> {
    if (!session || !studioId) throw new Error("Sessão ou Studio não carregados ainda.");
    const client = getBrowserClient();
    const repo = createKnowledgeDocumentsRepository(client);

    const created = await repo.create({
      studio_id: studioId,
      title: input.title,
      type: input.type,
      created_actor_type: "USER",
      created_actor_id: session.user.id,
      updated_actor_type: "USER",
      updated_actor_id: session.user.id,
    });

    await repo.createVersion({
      studio_id: studioId,
      document_id: created.id,
      version_number: 1,
      content: input.summary,
      summary: input.summary,
      created_actor_type: "USER",
      created_actor_id: session.user.id,
    });

    setDocuments((prev) => {
      const entry = { document: created, summary: input.summary };
      return prev ? [entry, ...prev] : [entry];
    });
    return created;
  }

  return { documents, error, refresh: load, createDocument };
}
