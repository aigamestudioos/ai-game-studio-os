import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ReadinessCheckDefinitionsRow, ReleaseReadiness } from "../generated/database.types";

// Repository de Readiness (Sprint 2.12a).
//
// Não existe nenhuma leitura direta de tabela aqui de propósito: readiness
// é DERIVADA e a única fonte da verdade é a RPC `get_release_readiness`
// (supabase/migrations/20260814200002_get_release_readiness.sql). Se o
// cálculo vivesse também em TypeScript, as duas cópias divergiriam na
// primeira mudança de schema — e a versão do cliente seria a mentirosa,
// porque não tem como enxergar tudo sob RLS.
//
// A RPC deriva o `studio_id` da própria Release no servidor: nenhum
// `studioId` é (nem pode ser) passado daqui.
export function createReadinessRepository(client: SupabaseClient<Database>) {
  return {
    async getReleaseReadiness(releaseId: string): Promise<ReleaseReadiness> {
      const { data, error } = await client.rpc("get_release_readiness", { p_release_id: releaseId });
      if (error) throw error;
      return data as ReleaseReadiness;
    },

    // Catálogo global de checks (GATE 3) — útil para a UI do 2.12b listar
    // o que o sistema sabe verificar, inclusive o que ainda é
    // NOT_YET_MODELED.
    async listCheckDefinitions(): Promise<ReadinessCheckDefinitionsRow[]> {
      const { data, error } = await client
        .from("readiness_check_definitions")
        .select("*")
        .order("category", { ascending: true })
        .order("code", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  };
}
