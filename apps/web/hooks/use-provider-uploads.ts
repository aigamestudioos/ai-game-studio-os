"use client";

import { useCallback, useEffect, useState } from "react";
import { createProviderUploadsRepository, type ProviderUploadsRow, type Session } from "@agsos/database";
import { getBrowserClient } from "../lib/supabase-client";

// Lista de envios a provider de um BuildArtifact (Sprint 2.11b) — entidade
// própria (`provider_uploads`), nunca misturada com `build_artifacts.
// upload_status/validation_status` (que são sobre "chegou ao AGSOS").
export function useProviderUploads(session: Session | null | undefined, buildArtifactId: string | undefined) {
  const [uploads, setUploads] = useState<ProviderUploadsRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!session || !buildArtifactId) return;
    setLoading(true);
    try {
      const rows = await createProviderUploadsRepository(getBrowserClient()).listByBuildArtifact(buildArtifactId);
      setUploads(rows);
    } finally {
      setLoading(false);
    }
  }, [session, buildArtifactId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { uploads, loading, reload };
}
