"use client";

import { useCallback, useEffect, useState } from "react";
import { createBuildArtifactsRepository, type BuildArtifactsRow, type Session } from "@agsos/database";
import { getBrowserClient } from "../lib/supabase-client";

// Lista de artefatos de uma Build (Sprint 2.11a) — separado de
// `useGameVersion` porque BuildArtifact é uma entidade própria (Build 1→N
// BuildArtifacts), não um campo da Build. RLS (`build_artifacts_select`)
// já garante isolamento por Studio — este hook não refaz nenhum filtro.
export function useBuildArtifacts(session: Session | null | undefined, buildId: string | undefined) {
  const [artifacts, setArtifacts] = useState<BuildArtifactsRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!session || !buildId) return;
    setLoading(true);
    try {
      const rows = await createBuildArtifactsRepository(getBrowserClient()).listByBuild(buildId);
      setArtifacts(rows);
    } finally {
      setLoading(false);
    }
  }, [session, buildId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { artifacts, loading, reload };
}
