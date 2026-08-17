"use client";

import { useCallback, useEffect, useState } from "react";
import { createGameLocalizationsRepository, type GameLocalizationsRow } from "@agsos/database";
import { getBrowserClient } from "../lib/supabase-client";

// Sprint 2.15 — Store Listing Management. Leitura via client repository
// (RLS do Supabase é a autorização real, mesmo padrão de `use-game.ts`).
// A escrita usa a Server Action `saveStoreListing`
// (app/games/[id]/listing-actions.ts) — mesmo padrão já estabelecido para
// package_name/bundle_identifier (Sprint 2.11b/2.11c, ver
// `setGamePackageName`/`setGameBundleIdentifier`, reusadas por esta sprint
// em vez de duplicadas): validação no servidor, um único caminho de escrita.
export function useGameListing(gameId: string) {
  const [listing, setListing] = useState<GameLocalizationsRow | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!gameId) return;
    try {
      const client = getBrowserClient();
      const repo = createGameLocalizationsRepository(client);
      const row = await repo.getPrimaryByGame(gameId);
      setListing(row);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar a ficha de loja.");
    }
  }, [gameId]);

  useEffect(() => {
    load();
  }, [load]);

  return { listing, error, refresh: load };
}
