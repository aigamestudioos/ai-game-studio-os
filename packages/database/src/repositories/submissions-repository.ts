import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, SubmissionsRow } from "../generated/database.types";

// Repository do Aggregate Root Submission (AGSOS-SPEC-002 §8, §17).
// Publishing nunca lê Games diretamente em código de feature — este
// repository só acessa a tabela submissions (e o join com releases quando
// necessário), nunca games/game_versions.
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

    async getById(id: string): Promise<SubmissionsRow | null> {
      const { data, error } = await client.from("submissions").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },

    async create(
      input: Pick<SubmissionsRow, "studio_id" | "release_id" | "platform_id" | "build_id"> & Partial<SubmissionsRow>,
    ): Promise<SubmissionsRow> {
      const { data, error } = await client.from("submissions").insert(input).select("*").single();
      if (error) throw error;
      return data;
    },
  };
}
