import type { SupabaseClient } from "@supabase/supabase-js";
import type { BuildsRow, BuildStatus, Database } from "../generated/database.types";

export type BuildWithDetails = {
  id: string;
  status: string;
  createdAt: string;
  versionNumber: string;
  platformName: string;
};

export type BuildWithGameDetails = BuildWithDetails & { gameName: string; gameId: string };

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

    // Sprint 2.4 — CRUD real por versão, ainda sem UI de criação (essa
    // continua sendo montada com listByGame() até o Sprint 2.5).
    async listByVersion(gameVersionId: string): Promise<BuildsRow[]> {
      const { data, error } = await client
        .from("builds")
        .select("*")
        .eq("game_version_id", gameVersionId)
        .is("archived_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async getById(id: string): Promise<BuildsRow | null> {
      const { data, error } = await client.from("builds").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },

    async create(
      input: Pick<BuildsRow, "studio_id" | "game_version_id" | "platform_id"> & Partial<BuildsRow>,
    ): Promise<BuildsRow> {
      const { data, error } = await client.from("builds").insert(input).select("*").single();
      if (error) throw error;
      return data;
    },

    // Sprint 2.6 — widgets reais de Dashboard ("Latest Builds"/"Failed
    // Builds"). Studio inteiro, não um Game específico: resolve
    // builds → game_versions → games e → platforms em consultas separadas,
    // mesmo padrão de listByGame().
    async listRecentByStudio(limit: number, statusFilter?: BuildStatus[]): Promise<BuildWithGameDetails[]> {
      let query = client.from("builds").select("id, status, created_at, game_version_id, platform_id").order("created_at", { ascending: false }).limit(limit);
      if (statusFilter && statusFilter.length > 0) query = query.in("status", statusFilter);
      const { data: builds, error: buildsError } = await query;
      if (buildsError) throw buildsError;
      if (!builds || builds.length === 0) return [];

      const versionIds = [...new Set(builds.map((b) => b.game_version_id))];
      const platformIds = [...new Set(builds.map((b) => b.platform_id))];

      const [{ data: versions, error: versionsError }, { data: platforms, error: platformsError }] = await Promise.all([
        client.from("game_versions").select("id, version_number, game_id").in("id", versionIds),
        client.from("platforms").select("id, name").in("id", platformIds),
      ]);
      if (versionsError) throw versionsError;
      if (platformsError) throw platformsError;

      const gameIds = [...new Set((versions ?? []).map((v) => v.game_id))];
      const { data: games, error: gamesError } = await client.from("games").select("id, name").in("id", gameIds);
      if (gamesError) throw gamesError;

      const versionById = new Map((versions ?? []).map((v) => [v.id, v]));
      const platformById = new Map((platforms ?? []).map((p) => [p.id, p.name]));
      const gameNameById = new Map((games ?? []).map((g) => [g.id, g.name]));

      return builds.map((build) => {
        const version = versionById.get(build.game_version_id);
        return {
          id: build.id,
          status: build.status,
          createdAt: build.created_at,
          versionNumber: version?.version_number ?? "—",
          platformName: platformById.get(build.platform_id) ?? "—",
          gameId: version?.game_id ?? "",
          gameName: version ? (gameNameById.get(version.game_id) ?? "—") : "—",
        };
      });
    },

    // Usado pela simulação de progresso de build no client (Sprint 2.5) —
    // não há CI/CD real ainda, então PENDING→RUNNING→SUCCEEDED/FAILED é
    // simulado no browser e persistido a cada transição.
    async update(id: string, patch: Partial<BuildsRow>): Promise<BuildsRow> {
      const { data, error } = await client.from("builds").update(patch).eq("id", id).select("*").single();
      if (error) throw error;
      return data;
    },
  };
}
