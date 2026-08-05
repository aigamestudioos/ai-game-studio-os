"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createGameVersionsRepository,
  createStudioEventsRepository,
  type GameVersionsRow,
  type Session,
} from "@agsos/database";
import { getBrowserClient } from "../lib/supabase-client";
import { releasePipelineEvent } from "../lib/domain-events";

// Versions de um Game (Sprint 2.5 — primeira UI de criação da cadeia
// Version→Build→Release; schema e repositories já existiam desde o
// Sprint 2.4).
export function useGameVersions(session: Session | null | undefined, studioId: string | undefined, gameId: string) {
  const [versions, setVersions] = useState<GameVersionsRow[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session || !studioId) return;
    try {
      const client = getBrowserClient();
      const repo = createGameVersionsRepository(client);
      const rows = await repo.listByGame(gameId);
      setVersions(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar as versões.");
    }
  }, [session, studioId, gameId]);

  useEffect(() => {
    load();
  }, [load]);

  async function createVersion(input: {
    versionNumber: string;
    changelog: string;
    branch: string;
    commitHash: string;
  }): Promise<GameVersionsRow> {
    if (!session || !studioId) throw new Error("Sessão ou Studio não carregados ainda.");
    const client = getBrowserClient();
    const repo = createGameVersionsRepository(client);
    const events = createStudioEventsRepository(client);

    const created = await repo.create({
      studio_id: studioId,
      game_id: gameId,
      version_number: input.versionNumber,
      changelog: input.changelog || null,
      branch: input.branch || null,
      commit_hash: input.commitHash || null,
      created_actor_type: "USER",
      created_actor_id: session.user.id,
      updated_actor_type: "USER",
      updated_actor_id: session.user.id,
    });

    await events.create({
      studio_id: studioId,
      ...releasePipelineEvent("VersionCreated", { version_number: created.version_number, game_id: gameId }),
      event_version: 1,
      aggregate_type: "game_version",
      aggregate_id: created.id,
      metadata: { game_version_id: created.id },
      actor_type: "USER",
      actor_id: session.user.id,
    });

    setVersions((prev) => (prev ? [created, ...prev] : [created]));
    return created;
  }

  return { versions, error, refresh: load, createVersion };
}
