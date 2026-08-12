"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createProviderUploadsRepository, type ProviderUploadsRow, type Session } from "@agsos/database";
import { getBrowserClient } from "../lib/supabase-client";

// Lista de envios a provider de um BuildArtifact (Sprint 2.11b) — entidade
// própria (`provider_uploads`), nunca misturada com `build_artifacts.
// upload_status/validation_status` (que são sobre "chegou ao AGSOS").
//
// Sprint 2.11d-2b (GATE 20) — a Server Action não espera mais a
// transferência (worker assíncrono, ver ADR-006), então esta é a única
// forma da UI saber que o estado avançou: polling leve, só enquanto
// existir upload em estado não-terminal, parado automaticamente ao
// desmontar ou quando tudo chegar a SUCCEEDED/FAILED — nunca infraestrutura
// realtime nova (decisão do sprint), nunca tempestade de requests (um
// intervalo fixo, não recursivo/backoff-livre).
const POLL_INTERVAL_MS = 4_000;
const NON_TERMINAL_STATUSES = new Set(["PENDING", "QUEUED", "UPLOADING", "PROCESSING"]);

function hasNonTerminalUpload(rows: ProviderUploadsRow[]): boolean {
  return rows.some((row) => NON_TERMINAL_STATUSES.has(row.status));
}

export function useProviderUploads(session: Session | null | undefined, buildArtifactId: string | undefined) {
  const [uploads, setUploads] = useState<ProviderUploadsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reload = useCallback(async () => {
    if (!session || !buildArtifactId) return;
    setLoading(true);
    try {
      const rows = await createProviderUploadsRepository(getBrowserClient()).listByBuildArtifact(buildArtifactId);
      setUploads(rows);
      return rows;
    } finally {
      setLoading(false);
    }
  }, [session, buildArtifactId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Efeito separado do `reload()` inicial: reage ao conteúdo de `uploads`
  // (não a `reload` em si) para decidir se o polling deve continuar —
  // evita recriar o intervalo a cada tick só porque a referência de
  // `reload` mudou.
  useEffect(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (!session || !buildArtifactId || !hasNonTerminalUpload(uploads)) return;

    pollingRef.current = setInterval(() => {
      reload();
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [uploads, session, buildArtifactId]);

  return { uploads, loading, reload };
}
