import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, EpicsRow } from "../generated/database.types";

// Repository de Epic (AGSOS-SPEC-002 §5) — parte do Aggregate Project.
// Só list() por enquanto (Sprint 2.0): a UI de Projects exibe epics como
// checklist somente leitura, mesma paridade do mock que substitui — criar/
// editar epics fica para quando houver uma tela dedicada de gestão de
// backlog (fora de escopo deste sprint).
export function createEpicsRepository(client: SupabaseClient<Database>) {
  return {
    async listByProject(projectId: string): Promise<EpicsRow[]> {
      const { data, error } = await client
        .from("epics")
        .select("*")
        .eq("project_id", projectId)
        .is("archived_at", null)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  };
}
