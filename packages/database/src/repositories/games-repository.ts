import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, GamesRow } from "../generated/database.types";

// Repository do Aggregate Root Game (AGSOS-SPEC-002 §6, §17).
export function createGamesRepository(client: SupabaseClient<Database>) {
  return {
    async list(): Promise<GamesRow[]> {
      const { data, error } = await client
        .from("games")
        .select("*")
        .is("archived_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async getById(id: string): Promise<GamesRow | null> {
      const { data, error } = await client.from("games").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },

    async create(input: Pick<GamesRow, "studio_id" | "project_id" | "name"> & Partial<GamesRow>): Promise<GamesRow> {
      const { data, error } = await client.from("games").insert(input).select("*").single();
      if (error) throw error;
      return data;
    },

    // Sprint 2.11b — precisa existir `package_name` para enviar um AAB à
    // Google Play (a API não aceita upload sem um packageName real); usado
    // pelo fluxo mínimo de "Enviar ao Google Play"/"Enviar à App Store"
    // quando o campo ainda está vazio. Sprint 2.15 reusa este mesmo método
    // (mesma fonte da verdade, `games.package_name`/`bundle_identifier`)
    // na seção Store Listing do Game — ainda não um editor genérico de
    // Game (nome/descrição do Game continuam fora deste método).
    async update(id: string, patch: Partial<GamesRow>): Promise<GamesRow> {
      const { data, error } = await client.from("games").update(patch).eq("id", id).select("*").single();
      if (error) throw error;
      return data;
    },
  };
}
