"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@agsos/database";
import type { ConnectionHealthSummary } from "../lib/integration-health";
import { getIntegrationHealthSummary } from "../app/settings/store-connections/health-actions";

// Sprint 2.10.1 — só leitura (Server Action agrega `studio_events`, nunca
// chama Apple/Google). `refresh()` é chamado depois de todo `validate()`
// bem-sucedido ou não (ver `page.tsx`), para o painel refletir a chamada
// que acabou de acontecer sem esperar um poll.
export function useIntegrationHealth(session: Session | null | undefined) {
  const [summaries, setSummaries] = useState<ConnectionHealthSummary[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    const result = await getIntegrationHealthSummary();
    if (result.error) {
      setError(result.error);
      return;
    }
    setSummaries(result.connections ?? []);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  return { summaries, error, refresh: load };
}
