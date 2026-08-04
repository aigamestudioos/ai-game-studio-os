import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, GameVersionsRow } from "../generated/database.types";

// Repository de Game Version (AGSOS-SPEC-002 §6, AGSOS-SPEC-003 §13
// `version_status`). Sprint 2.4 — schema + repository apenas, sem UI (ver
// IMPLEMENTATION_LOG.md para o porquê da divisão do Release Pipeline).
export function createGameVersionsRepository(client: SupabaseClient<Database>) {
  return {
    async listByGame(gameId: string): Promise<GameVersionsRow[]> {
      const { data, error } = await client
        .from("game_versions")
        .select("*")
        .eq("game_id", gameId)
        .is("archived_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async getById(id: string): Promise<GameVersionsRow | null> {
      const { data, error } = await client.from("game_versions").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },

    async create(
      input: Pick<GameVersionsRow, "studio_id" | "game_id" | "version_number"> & Partial<GameVersionsRow>,
    ): Promise<GameVersionsRow> {
      const { data, error } = await client.from("game_versions").insert(input).select("*").single();
      if (error) throw error;
      return data;
    },
  };
}
