import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, SubmissionsRow, StoreReviewsRow } from "../generated/database.types";

export type SubmissionWithDetails = {
  id: string;
  status: SubmissionsRow["status"];
  createdAt: string;
  updatedAt: string;
  gameName: string;
  versionNumber: string;
  platformName: string;
  // Sprint 2.12b — necessários para a UI consultar Release Readiness
  // (`get_release_readiness`, RPC escopada por Release) a partir da tela
  // de detalhe de Submission, sem precisar de uma query extra.
  releaseId: string;
  platformId: string;
};

// Repository do Aggregate Root Submission (AGSOS-SPEC-002 §8, §17).
// Publishing nunca lê Games diretamente em código de feature — este
// repository só acessa submissions (e os joins com releases/builds/platforms
// necessários para exibição), nunca games/game_versions diretamente.
export function createSubmissionsRepository(client: SupabaseClient<Database>) {
  return {
    async list(): Promise<SubmissionsRow[]> {
      const { data, error } = await client
        .from("submissions")
        .select("*")
        .is("archived_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    // Resolve os nomes de jogo/versão/plataforma para exibição na UI a
    // partir de submissions → releases → games/game_versions e
    // submissions.platform_id → platforms — mesmo padrão de consultas
    // separadas de builds-repository.listByGame() (mais simples de validar
    // que embutir joins aninhados do PostgREST).
    async listWithDetails(): Promise<SubmissionWithDetails[]> {
      const { data: submissions, error: submissionsError } = await client
        .from("submissions")
        .select("id, status, created_at, updated_at, release_id, platform_id")
        .is("archived_at", null)
        .order("created_at", { ascending: false });
      if (submissionsError) throw submissionsError;
      if (!submissions || submissions.length === 0) return [];

      const releaseIds = [...new Set(submissions.map((s) => s.release_id))];
      const { data: releases, error: releasesError } = await client
        .from("releases")
        .select("id, game_id, game_version_id")
        .in("id", releaseIds);
      if (releasesError) throw releasesError;

      const gameIds = [...new Set((releases ?? []).map((r) => r.game_id))];
      const versionIds = [...new Set((releases ?? []).map((r) => r.game_version_id))];
      const platformIds = [...new Set(submissions.map((s) => s.platform_id))];

      const [{ data: games, error: gamesError }, { data: versions, error: versionsError }, { data: platforms, error: platformsError }] =
        await Promise.all([
          client.from("games").select("id, name").in("id", gameIds),
          client.from("game_versions").select("id, version_number").in("id", versionIds),
          client.from("platforms").select("id, name").in("id", platformIds),
        ]);
      if (gamesError) throw gamesError;
      if (versionsError) throw versionsError;
      if (platformsError) throw platformsError;

      const releaseById = new Map((releases ?? []).map((r) => [r.id, r]));
      const gameNameById = new Map((games ?? []).map((g) => [g.id, g.name]));
      const versionNumberById = new Map((versions ?? []).map((v) => [v.id, v.version_number]));
      const platformNameById = new Map((platforms ?? []).map((p) => [p.id, p.name]));

      return submissions.map((submission) => {
        const release = releaseById.get(submission.release_id);
        return {
          id: submission.id,
          status: submission.status,
          createdAt: submission.created_at,
          updatedAt: submission.updated_at,
          gameName: release ? (gameNameById.get(release.game_id) ?? "—") : "—",
          versionNumber: release ? (versionNumberById.get(release.game_version_id) ?? "—") : "—",
          platformName: platformNameById.get(submission.platform_id) ?? "—",
          releaseId: submission.release_id,
          platformId: submission.platform_id,
        };
      });
    },

    async getById(id: string): Promise<SubmissionsRow | null> {
      const { data, error } = await client.from("submissions").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },

    async getWithDetails(id: string): Promise<SubmissionWithDetails | null> {
      const submission = await this.getById(id);
      if (!submission) return null;

      const { data: release, error: releaseError } = await client
        .from("releases")
        .select("id, game_id, game_version_id")
        .eq("id", submission.release_id)
        .maybeSingle();
      if (releaseError) throw releaseError;

      const [{ data: game, error: gameError }, { data: version, error: versionError }, { data: platform, error: platformError }] =
        await Promise.all([
          release ? client.from("games").select("name").eq("id", release.game_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
          release
            ? client.from("game_versions").select("version_number").eq("id", release.game_version_id).maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          client.from("platforms").select("name").eq("id", submission.platform_id).maybeSingle(),
        ]);
      if (gameError) throw gameError;
      if (versionError) throw versionError;
      if (platformError) throw platformError;

      return {
        id: submission.id,
        status: submission.status,
        createdAt: submission.created_at,
        updatedAt: submission.updated_at,
        gameName: game?.name ?? "—",
        versionNumber: version?.version_number ?? "—",
        platformName: platform?.name ?? "—",
        releaseId: submission.release_id,
        platformId: submission.platform_id,
      };
    },

    async listReviews(submissionId: string): Promise<StoreReviewsRow[]> {
      const { data, error } = await client
        .from("store_reviews")
        .select("*")
        .eq("submission_id", submissionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async create(
      input: Pick<SubmissionsRow, "studio_id" | "release_id" | "platform_id" | "build_id"> & Partial<SubmissionsRow>,
    ): Promise<SubmissionsRow> {
      const { data, error } = await client.from("submissions").insert(input).select("*").single();
      if (error) throw error;
      return data;
    },

    // Sprint 2.16a — única porta de entrada para transições de lifecycle
    // (DRAFT → READY_TO_SUBMIT → SUBMITTING → SUBMITTED/FAILED). Nunca faz
    // `update` direto em `submissions.status` a partir de código de
    // feature — sempre via `transition_submission` (RPC SECURITY DEFINER
    // que valida permissão/Studio/readiness/idempotência no servidor).
    async transition(
      submissionId: string,
      action: "PREPARE" | "SUBMIT" | "RETRY",
      actorId: string,
    ): Promise<{ submission: SubmissionsRow; job?: unknown; noop: boolean }> {
      const { data, error } = await client.rpc("transition_submission", {
        p_submission_id: submissionId,
        p_action: action,
        p_actor_id: actorId,
      });
      if (error) throw error;
      return data as { submission: SubmissionsRow; job?: unknown; noop: boolean };
    },

    async listEvents(submissionId: string) {
      const { data, error } = await client
        .from("submission_events")
        .select("*")
        .eq("submission_id", submissionId)
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  };
}
