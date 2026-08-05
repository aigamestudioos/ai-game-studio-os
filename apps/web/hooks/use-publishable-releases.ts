"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createBuildsRepository,
  createGameVersionsRepository,
  createGamesRepository,
  createPlatformsRepository,
  createReleasesRepository,
  createStudioEventsRepository,
  createSubmissionsRepository,
  type ReleaseChannel,
  type Session,
} from "@agsos/database";
import { getBrowserClient } from "../lib/supabase-client";
import { releasePipelineEvent } from "../lib/domain-events";

export type PublishableRelease = {
  releaseId: string;
  gameVersionId: string;
  gameName: string;
  versionNumber: string;
  releaseChannel: ReleaseChannel;
  builds: { buildId: string; platformId: string; platformName: string }[];
};

// Releases reais disponíveis para criar uma Submission (Sprint 2.5 —
// desbloqueia o formulário que ficou desabilitado desde o Sprint 2.3, agora
// que a cadeia Version→Build→Release existe). Um Release só aparece aqui se
// tiver ao menos uma Build na mesma Version (submissions.build_id é
// NOT NULL).
export function usePublishableReleases(session: Session | null | undefined, studioId: string | undefined) {
  const [releases, setReleases] = useState<PublishableRelease[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session || !studioId) return;
    try {
      const client = getBrowserClient();
      const releasesRepo = createReleasesRepository(client);
      const versionsRepo = createGameVersionsRepository(client);
      const gamesRepo = createGamesRepository(client);
      const buildsRepo = createBuildsRepository(client);
      const platformsRepo = createPlatformsRepository(client);

      const [allReleases, platforms] = await Promise.all([releasesRepo.list(), platformsRepo.list()]);
      const platformNameById = new Map(platforms.map((p) => [p.id, p.name]));

      const result: PublishableRelease[] = [];
      for (const release of allReleases) {
        const [version, game, builds] = await Promise.all([
          versionsRepo.getById(release.game_version_id),
          gamesRepo.getById(release.game_id),
          buildsRepo.listByVersion(release.game_version_id),
        ]);
        if (!version || !game || builds.length === 0) continue;
        result.push({
          releaseId: release.id,
          gameVersionId: release.game_version_id,
          gameName: game.name,
          versionNumber: version.version_number,
          releaseChannel: release.release_channel,
          builds: builds.map((b) => ({
            buildId: b.id,
            platformId: b.platform_id,
            platformName: platformNameById.get(b.platform_id) ?? "—",
          })),
        });
      }
      setReleases(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar os releases disponíveis.");
    }
  }, [session, studioId]);

  useEffect(() => {
    load();
  }, [load]);

  async function createSubmission(input: { releaseId: string; buildId: string; platformId: string }) {
    if (!session || !studioId) throw new Error("Sessão ou Studio não carregados ainda.");
    const client = getBrowserClient();
    const submissionsRepo = createSubmissionsRepository(client);
    const eventsRepo = createStudioEventsRepository(client);

    const created = await submissionsRepo.create({
      studio_id: studioId,
      release_id: input.releaseId,
      build_id: input.buildId,
      platform_id: input.platformId,
      created_actor_type: "USER",
      created_actor_id: session.user.id,
      updated_actor_type: "USER",
      updated_actor_id: session.user.id,
    });

    const release = releases?.find((r) => r.releaseId === input.releaseId);
    await eventsRepo.create({
      studio_id: studioId,
      ...releasePipelineEvent("SubmissionCreated", { release_id: input.releaseId, platform_id: input.platformId }),
      event_version: 1,
      aggregate_type: "submission",
      aggregate_id: created.id,
      metadata: release ? { game_version_id: release.gameVersionId } : {},
      actor_type: "USER",
      actor_id: session.user.id,
    });

    return created;
  }

  return { releases, error, refresh: load, createSubmission };
}
