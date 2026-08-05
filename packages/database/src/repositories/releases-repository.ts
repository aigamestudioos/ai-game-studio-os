import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ReleasesRow } from "../generated/database.types";

export type ReleaseWithGameDetails = {
  id: string;
  status: ReleasesRow["status"];
  releaseChannel: ReleasesRow["release_channel"];
  createdAt: string;
  gameName: string;
  versionNumber: string;
};

const RELEASE_TERMINAL_STATUSES = ["PUBLISHED", "REJECTED", "CANCELLED", "ARCHIVED"];

// Repository de Release (AGSOS-SPEC-002 §6, AGSOS-SPEC-003 §13
// `release_status`). Sprint 2.4 — schema + repository apenas, sem UI (ver
// IMPLEMENTATION_LOG.md para o porquê da divisão do Release Pipeline).
// Não tem `platform_id`: um Release pode gerar Submissions para lojas
// diferentes (submissions.release_id N:1 releases, cada Submission com seu
// próprio platform_id) — ver comentário na migration
// 20260804000001_release_pipeline_extensions.sql.
export function createReleasesRepository(client: SupabaseClient<Database>) {
  return {
    async list(): Promise<ReleasesRow[]> {
      const { data, error } = await client
        .from("releases")
        .select("*")
        .is("archived_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

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

    // Sprint 2.6 — widget "Pending Releases" do Dashboard. "Pendente" =
    // qualquer status fora dos terminais (PUBLISHED/REJECTED/CANCELLED/
    // ARCHIVED) — ver RELEASE_TERMINAL_STATUSES.
    async listPendingByStudio(limit: number): Promise<ReleaseWithGameDetails[]> {
      const { data: releases, error: releasesError } = await client
        .from("releases")
        .select("id, status, release_channel, created_at, game_id, game_version_id")
        .not("status", "in", `(${RELEASE_TERMINAL_STATUSES.join(",")})`)
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (releasesError) throw releasesError;
      if (!releases || releases.length === 0) return [];

      const gameIds = [...new Set(releases.map((r) => r.game_id))];
      const versionIds = [...new Set(releases.map((r) => r.game_version_id))];
      const [{ data: games, error: gamesError }, { data: versions, error: versionsError }] = await Promise.all([
        client.from("games").select("id, name").in("id", gameIds),
        client.from("game_versions").select("id, version_number").in("id", versionIds),
      ]);
      if (gamesError) throw gamesError;
      if (versionsError) throw versionsError;

      const gameNameById = new Map((games ?? []).map((g) => [g.id, g.name]));
      const versionNumberById = new Map((versions ?? []).map((v) => [v.id, v.version_number]));

      return releases.map((release) => ({
        id: release.id,
        status: release.status,
        releaseChannel: release.release_channel,
        createdAt: release.created_at,
        gameName: gameNameById.get(release.game_id) ?? "—",
        versionNumber: versionNumberById.get(release.game_version_id) ?? "—",
      }));
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
