"use client";

import { useCallback, useEffect, useState } from "react";
import { createSubmissionsRepository, type SubmissionWithDetails, type Session } from "@agsos/database";
import { getBrowserClient } from "../lib/supabase-client";

// Substitui apps/web/lib/publishing-store.ts (mock) — Sprint 2.3. Submission
// exige um Release real (release_id/build_id NOT NULL) e não há, ainda,
// nenhuma UI para criar Release/Build (mesma decisão do Sprint 2.1 para
// Games) — este sprint é somente leitura: lista as Submissions reais do
// banco, sem formulário de criação.
export function useSubmissions(session: Session | null | undefined, studioId: string | undefined) {
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session || !studioId) return;
    try {
      const client = getBrowserClient();
      const repo = createSubmissionsRepository(client);
      const rows = await repo.listWithDetails();
      setSubmissions(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar as submissões.");
    }
  }, [session, studioId]);

  useEffect(() => {
    load();
  }, [load]);

  return { submissions, error, refresh: load };
}
