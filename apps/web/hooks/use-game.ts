"use client";

import { useEffect, useState } from "react";
import { createBuildsRepository, createGamesRepository, type BuildWithDetails, type GamesRow } from "@agsos/database";
import { getBrowserClient } from "../lib/supabase-client";

// Game + builds para a tela de detalhes (Sprint 2.1). `game === undefined` →
// carregando; `null` → carregado, não encontrado.
export function useGame(id: string) {
  const [game, setGame] = useState<GamesRow | null | undefined>(undefined);
  const [builds, setBuilds] = useState<BuildWithDetails[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const client = getBrowserClient();
        const games = createGamesRepository(client);
        const buildsRepo = createBuildsRepository(client);

        const gameRow = await games.getById(id);
        if (cancelled) return;
        setGame(gameRow);

        if (gameRow) {
          const buildRows = await buildsRepo.listByGame(gameRow.id);
          if (!cancelled) setBuilds(buildRows);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Falha ao carregar o jogo.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { game, builds, error };
}
