import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ProviderUploadsRow } from "../generated/database.types";

// Repository de ProviderUpload (Sprint 2.11b — Google Play AAB Upload).
// `createPending()` nunca faz `insert` direto — sempre passa pela RPC
// `create_pending_provider_upload` (supabase/migrations/20260811000001_provider_uploads.sql),
// que valida Studio/permission/upload_status/validation_status do
// build_artifact e Studio da store_connection dentro da mesma transação
// que cria a linha PENDING — defesa em profundidade, mesmo padrão de
// `build-artifacts-repository.ts` (Sprint 2.11a).
export function createProviderUploadsRepository(client: SupabaseClient<Database>) {
  return {
    async listByBuildArtifact(buildArtifactId: string): Promise<ProviderUploadsRow[]> {
      const { data, error } = await client
        .from("provider_uploads")
        .select("*")
        .eq("build_artifact_id", buildArtifactId)
        .is("archived_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async getById(id: string): Promise<ProviderUploadsRow | null> {
      const { data, error } = await client.from("provider_uploads").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },

    async createPending(input: {
      buildArtifactId: string;
      storeConnectionId: string;
      actorId: string;
    }): Promise<ProviderUploadsRow> {
      const { data, error } = await client.rpc("create_pending_provider_upload", {
        p_build_artifact_id: input.buildArtifactId,
        p_store_connection_id: input.storeConnectionId,
        p_actor_id: input.actorId,
      });
      if (error) throw error;
      return data as ProviderUploadsRow;
    },

    async update(id: string, patch: Partial<ProviderUploadsRow>): Promise<ProviderUploadsRow> {
      const { data, error } = await client.from("provider_uploads").update(patch).eq("id", id).select("*").single();
      if (error) throw error;
      return data;
    },
  };
}
