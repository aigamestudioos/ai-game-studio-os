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

    // Sprint 1.8d-2 — Studio settings (nome, logo). Só campos editáveis pelo
    // usuário; colunas de auditoria (created_*, owner_user_id) nunca passam
    // por aqui.
    async update(id: string, fields: Partial<Pick<StudiosRow, "name" | "logo_url">>): Promise<StudiosRow> {
      const { data, error } = await client.from("studios").update(fields).eq("id", id).select("*").single();
      if (error) throw error;
      return data;
    },

    // Cria o Studio + profile (public.users) + Role Owner do usuário
    // autenticado atual, se ainda não existir (Sprint 1.8d-1). Idempotente —
    // seguro de chamar sempre que a app não tiver certeza se já rodou.
    // Retorna o id do Studio (existente ou recém-criado).
    async bootstrapForCurrentUser(studioName: string): Promise<string> {
      const { data, error } = await client.rpc("bootstrap_studio_for_current_user", {
        p_studio_name: studioName,
      });
      if (error) throw error;
      return data;
    },
  };
}
