import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, GameLocalizationsRow } from "../generated/database.types";

// Sprint 2.15 — Store Listing Management. `game_localizations` já existia
// desde o Sprint 2.1 (schema + RLS de isolamento por Studio), mas nunca
// teve repository/UI/Server Action usados pela aplicação — o único jeito
// de satisfazer `METADATA_LISTING_MISSING` (readiness, Sprint 2.12a) era
// fixture/service_role. Este repository é a primeira leitura/escrita real.
//
// Schema: `unique (game_id, language_code)` — Store Listing é modelada por
// Game + idioma (não por plataforma). MVP desta sprint gerencia só o
// idioma padrão (`en-US`): a UI ainda não tem seletor de idioma —
// expandir para multi-idioma é trabalho futuro que o schema já comporta,
// não um redesign.
export const STORE_LISTING_DEFAULT_LANGUAGE_CODE = "en-US";

export function createGameLocalizationsRepository(client: SupabaseClient<Database>) {
  return {
    async listByGame(gameId: string): Promise<GameLocalizationsRow[]> {
      const { data, error } = await client
        .from("game_localizations")
        .select("*")
        .eq("game_id", gameId)
        .order("language_code", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },

    // `null` = ainda não existe Store Listing para este Game (empty state).
    async getPrimaryByGame(gameId: string): Promise<GameLocalizationsRow | null> {
      const { data, error } = await client
        .from("game_localizations")
        .select("*")
        .eq("game_id", gameId)
        .eq("language_code", STORE_LISTING_DEFAULT_LANGUAGE_CODE)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    // Um único upsert cobre create E edit (GATE 10 do sprint) — a UI não
    // precisa saber se está criando ou atualizando; o `unique(game_id,
    // language_code)` do schema já garante no-duplicate por Game+idioma.
    async upsertPrimary(input: {
      studio_id: string;
      game_id: string;
      title: string;
      short_description: string | null;
      full_description: string | null;
      keywords: string | null;
    }): Promise<GameLocalizationsRow> {
      const { data, error } = await client
        .from("game_localizations")
        .upsert(
          { ...input, language_code: STORE_LISTING_DEFAULT_LANGUAGE_CODE },
          { onConflict: "game_id,language_code" },
        )
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
  };
}
