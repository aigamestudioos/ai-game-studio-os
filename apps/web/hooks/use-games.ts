"use client";

import { useCallback, useEffect, useState } from "react";
import { createGamesRepository, type GamesRow, type Session } from "@agsos/database";
import { getBrowserClient } from "../lib/supabase-client";

// Substitui apps/web/lib/games-store.ts (mock) — Sprint 2.1. `games.project_id`
// é obrigatório no schema real (todo Game pertence a um Project) — diferença
// do mock, que não tinha esse vínculo. A UI precisa de um Project já
// existente antes de criar um Game (ver apps/web/app/games/page.tsx).
export function useGames(session: Session | null | undefined, studioId: string | undefined) {
  const [games, setGames] = useState<GamesRow[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session || !studioId) return;
    try {
      const client = getBrowserClient();
      const repo = createGamesRepository(client);
      const rows = await repo.list();
      setGames(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar os jogos.");
    }
  }, [session, studioId]);

  useEffect(() => {
    load();
  }, [load]);

  async function createGame(input: { name: string; description: string; projectId: string }): Promise<GamesRow> {
    if (!session || !studioId) throw new Error("Sessão ou Studio não carregados ainda.");
    const client = getBrowserClient();
    const repo = createGamesRepository(client);
    const created = await repo.create({
      studio_id: studioId,
      project_id: input.projectId,
      name: input.name,
      description: input.description || null,
      created_actor_type: "USER",
      created_actor_id: session.user.id,
      updated_actor_type: "USER",
      updated_actor_id: session.user.id,
    });
    setGames((prev) => (prev ? [created, ...prev] : [created]));
    return created;
  }

  return { games, error, refresh: load, createGame };
}
