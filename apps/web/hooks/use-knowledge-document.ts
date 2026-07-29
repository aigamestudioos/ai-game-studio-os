"use client";

import { useEffect, useState } from "react";
import { createKnowledgeDocumentsRepository, type KnowledgeDocumentVersionsRow, type KnowledgeDocumentsRow } from "@agsos/database";
import { getBrowserClient } from "../lib/supabase-client";

// Documento + versão mais recente (conteúdo/resumo) para a tela de detalhes
// (Sprint 2.2). `document === undefined` → carregando; `null` → não encontrado.
export function useKnowledgeDocument(id: string) {
  const [document, setDocument] = useState<KnowledgeDocumentsRow | null | undefined>(undefined);
  const [version, setVersion] = useState<KnowledgeDocumentVersionsRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const client = getBrowserClient();
        const repo = createKnowledgeDocumentsRepository(client);

        const documentRow = await repo.getById(id);
        if (cancelled) return;
        setDocument(documentRow);

        if (documentRow) {
          const versionRow = await repo.getLatestVersion(documentRow.id);
          if (!cancelled) setVersion(versionRow);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Falha ao carregar o documento.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { document, version, error };
}
