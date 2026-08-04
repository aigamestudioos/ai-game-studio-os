import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, PlatformsRow } from "../generated/database.types";

// `platforms` é tabela global (AGSOS-SPEC-003 §10) — somente leitura para
// usuários comuns, populada via seed versionado.
export function createPlatformsRepository(client: SupabaseClient<Database>) {
  return {
    async list(): Promise<PlatformsRow[]> {
      const { data, error } = await client.from("platforms").select("*").order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  };
}
