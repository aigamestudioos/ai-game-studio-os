import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../generated/database.types";

export type BuildWithDetails = {
  id: string;
  status: string;
  createdAt: string;
  versionNumber: string;
  platformName: string;
};

// Repository de Build (AGSOS-SPEC-002 §6). `builds` não tem `game_id` direto
// (só `game_version_id` → `game_versions.game_id`) nem `version`/`platform`
// como texto (`game_version_id` → `game_versions.version_number`,
// `platform_id` → `platforms.name`) — DATA_MODEL.md §7 documenta essa
// diferença em relação ao mock, que tinha tudo achatado no próprio Game.
// listByGame() resolve os dois joins em consultas separadas (mais simples e
// mais fácil de validar do que embutir joins aninhados do PostgREST) — builds
// ainda não têm nenhuma UI de criação (Sprint 2.1), então este caminho é
// pouco exercitado por enquanto.
export function createBuildsRepository(client: SupabaseClient<Database>) {
  return {
    async listByGame(gameId: string): Promise<BuildWithDetails[]> {
      const { data: versions, error: versionsError } = await client
        .from("game_versions")
        .select("id, version_number")
        .eq("game_id", gameId);
      if (versionsError) throw versionsError;
      if (!versions || versions.length === 0) return [];

      const versionIds = versions.map((v) => v.id);
      const { data: builds, error: buildsError } = await client
        .from("builds")
        .select("id, status, created_at, game_version_id, platform_id")
        .in("game_version_id", versionIds)
        .order("created_at", { ascending: false });
      if (buildsError) throw buildsError;
      if (!builds || builds.length === 0) return [];

      const platformIds = [...new Set(builds.map((b) => b.platform_id))];
      const { data: platforms, error: platformsError } = await client
        .from("platforms")
        .select("id, name")
        .in("id", platformIds);
      if (platformsError) throw platformsError;

      const versionById = new Map(versions.map((v) => [v.id, v.version_number]));
      const platformById = new Map((platforms ?? []).map((p) => [p.id, p.name]));

      return builds.map((build) => ({
        id: build.id,
        status: build.status,
        createdAt: build.created_at,
        versionNumber: versionById.get(build.game_version_id) ?? "—",
        platformName: platformById.get(build.platform_id) ?? "—",
      }));
    },
  };
}
