import type { SupabaseClient } from "@supabase/supabase-js";
import type { BuildArtifactsRow, Database } from "../generated/database.types";

// Repository de BuildArtifact (Sprint 2.11a — Artifact Storage Foundation).
// `create()` nunca faz um `insert` direto na tabela — sempre passa pela RPC
// `create_pending_build_artifact` (supabase/migrations/20260810000001_build_artifacts.sql),
// que gera o `storage_path` server-side (nunca aceito do browser) dentro da
// mesma checagem de studio/permission que a RLS já teria feito — defesa em
// profundidade, mesmo padrão do Vault (Sprint 2.8/2.9).
export function createBuildArtifactsRepository(client: SupabaseClient<Database>) {
  return {
    async listByBuild(buildId: string): Promise<BuildArtifactsRow[]> {
      const { data, error } = await client
        .from("build_artifacts")
        .select("*")
        .eq("build_id", buildId)
        .is("archived_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async getById(id: string): Promise<BuildArtifactsRow | null> {
      const { data, error } = await client.from("build_artifacts").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },

    async createPending(input: {
      buildId: string;
      originalFilename: string;
      fileExtension: string;
      sizeBytes: number;
      checksum: string;
      mimeTypeReported: string | null;
      actorId: string;
    }): Promise<BuildArtifactsRow> {
      const { data, error } = await client.rpc("create_pending_build_artifact", {
        p_build_id: input.buildId,
        p_original_filename: input.originalFilename,
        p_file_extension: input.fileExtension,
        p_size_bytes: input.sizeBytes,
        p_checksum: input.checksum,
        p_mime_type_reported: input.mimeTypeReported,
        p_actor_id: input.actorId,
      });
      if (error) throw error;
      return data as BuildArtifactsRow;
    },

    async update(id: string, patch: Partial<BuildArtifactsRow>): Promise<BuildArtifactsRow> {
      const { data, error } = await client.from("build_artifacts").update(patch).eq("id", id).select("*").single();
      if (error) throw error;
      return data;
    },

    async archive(id: string, actor: { actorType: "USER" | "SYSTEM" | "INTEGRATION"; actorId: string }): Promise<BuildArtifactsRow> {
      const { data, error } = await client
        .from("build_artifacts")
        .update({
          archived_at: new Date().toISOString(),
          archived_actor_type: actor.actorType,
          archived_actor_id: actor.actorId,
        })
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
  };
}
