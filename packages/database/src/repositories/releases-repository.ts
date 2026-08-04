import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ReleasesRow } from "../generated/database.types";

// Repository de Release (AGSOS-SPEC-002 §6, AGSOS-SPEC-003 §13
// `release_status`). Sprint 2.4 — schema + repository apenas, sem UI (ver
// IMPLEMENTATION_LOG.md para o porquê da divisão do Release Pipeline).
// Não tem `platform_id`: um Release pode gerar Submissions para lojas
// diferentes (submissions.release_id N:1 releases, cada Submission com seu
// próprio platform_id) — ver comentário na migration
// 20260804000001_release_pipeline_extensions.sql.
export function createReleasesRepository(client: SupabaseClient<Database>) {
  return {
    async listByGame(gameId: string): Promise<ReleasesRow[]> {
      const { data, error } = await client
        .from("releases")
        .select("*")
        .eq("game_id", gameId)
        .is("archived_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async listByVersion(gameVersionId: string): Promise<ReleasesRow[]> {
      const { data, error } = await client
        .from("releases")
        .select("*")
        .eq("game_version_id", gameVersionId)
        .is("archived_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async getById(id: string): Promise<ReleasesRow | null> {
      const { data, error } = await client.from("releases").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },

    async create(
      input: Pick<ReleasesRow, "studio_id" | "game_id" | "game_version_id"> & Partial<ReleasesRow>,
    ): Promise<ReleasesRow> {
      const { data, error } = await client.from("releases").insert(input).select("*").single();
      if (error) throw error;
      return data;
    },
  };
}
