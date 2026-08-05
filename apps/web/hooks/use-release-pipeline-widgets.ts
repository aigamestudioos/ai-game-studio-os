"use client";

import { useEffect, useState } from "react";
import {
  createBuildsRepository,
  createReleasesRepository,
  type BuildWithGameDetails,
  type ReleaseWithGameDetails,
  type Session,
} from "@agsos/database";
import { getBrowserClient } from "../lib/supabase-client";

const WIDGET_LIMIT = 5;

// Sprint 2.6 — primeiros widgets reais do Dashboard (os demais continuam
// mock, ver DECISIONS.md "Dashboard 'Recent Projects' continua mock" — só
// os 3 abaixo, ligados ao Release Pipeline, foram conectados neste sprint).
export function useReleasePipelineWidgets(session: Session | null | undefined, studioId: string | undefined) {
  const [latestBuilds, setLatestBuilds] = useState<BuildWithGameDetails[] | undefined>(undefined);
  const [failedBuilds, setFailedBuilds] = useState<BuildWithGameDetails[] | undefined>(undefined);
  const [pendingReleases, setPendingReleases] = useState<ReleaseWithGameDetails[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || !studioId) return;
    let cancelled = false;
    async function load() {
      try {
        const client = getBrowserClient();
        const buildsRepo = createBuildsRepository(client);
        const releasesRepo = createReleasesRepository(client);

        const [latest, failed, pending] = await Promise.all([
          buildsRepo.listRecentByStudio(WIDGET_LIMIT),
          buildsRepo.listRecentByStudio(WIDGET_LIMIT, ["FAILED"]),
          releasesRepo.listPendingByStudio(WIDGET_LIMIT),
        ]);
        if (cancelled) return;
        setLatestBuilds(latest);
        setFailedBuilds(failed);
        setPendingReleases(pending);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Falha ao carregar os widgets do Release Pipeline.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [session, studioId]);

  return { latestBuilds, failedBuilds, pendingReleases, error };
}
