"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReleaseReadiness, Session } from "@agsos/database";
import { getReleaseReadinessAction } from "../app/publishing/readiness-actions";

// Sprint 2.12b (GATE 7/10) — busca Release Readiness via Server Action.
// `readiness === undefined` → carregando; `null` → falhou ou ainda não há
// releaseId. GATE 10: nenhum polling contínuo — `reload()` é chamado
// explicitamente pela UI depois de uma ação que pode ter mudado o estado
// subjacente (ex.: Submission criada), mesmo padrão de refetch pós-ação já
// usado no projeto (ver hooks/use-provider-uploads.ts para o caso que usa
// polling, não aplicável aqui: readiness só muda por ação explícita do
// usuário, nunca por um processo em segundo plano que a UI precise
// observar continuamente).
export function useReleaseReadiness(session: Session | null | undefined, releaseId: string | undefined) {
  const [readiness, setReadiness] = useState<ReleaseReadiness | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!session || !releaseId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: actionError } = await getReleaseReadinessAction(releaseId);
      if (actionError) {
        setError(actionError);
        setReadiness(null);
        return;
      }
      setReadiness(data ?? null);
    } catch {
      setError("Não foi possível calcular o readiness deste Release.");
      setReadiness(null);
    } finally {
      setLoading(false);
    }
  }, [session, releaseId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { readiness, error, loading, reload };
}
