import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, StudiosRow } from "../generated/database.types";

// Repository do Aggregate Root Studio — raiz de tudo (AGSOS-SPEC-002 §4, §17).
// Sem list(): hoje um usuário pertence a exatamente um Studio (ver
// DATA_MODEL.md §1), então só faz sentido buscar o Studio atual.
export function createStudiosRepository(client: SupabaseClient<Database>) {
  return {
    async getById(id: string): Promise<StudiosRow | null> {
      const { data, error } = await client.from("studios").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  };
}
