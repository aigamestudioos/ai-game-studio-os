import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, StudioEventsRow } from "../generated/database.types";

// Event Store (AGSOS-SPEC-003 §5) — append-only, `studio_events`. Sprint 2.5
// usa `metadata.game_version_id` para agrupar eventos de Version/Build/
// Release/Submission na Timeline de uma Version, sem precisar de uma tabela
// de junção nova — todo evento emitido pelo Release Pipeline carrega esse
// campo em `metadata`, independente do `aggregate_type`.
export function createStudioEventsRepository(client: SupabaseClient<Database>) {
  return {
    async listByGameVersion(gameVersionId: string): Promise<StudioEventsRow[]> {
      const { data, error } = await client
        .from("studio_events")
        .select("*")
        .contains("metadata", { game_version_id: gameVersionId })
        .order("occurred_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },

    // Sprint 2.10.1 — Integration Health. `sinceIso` cobre a maior janela
    // pedida (7 dias); a isolação por Studio vem da RLS (`studio_events_isolation`),
    // não é refeita aqui — mesmo padrão de `listByGameVersion` acima.
    async listByEventNameSince(eventName: string, sinceIso: string): Promise<StudioEventsRow[]> {
      const { data, error } = await client
        .from("studio_events")
        .select("*")
        .eq("event_name", eventName)
        .gte("occurred_at", sinceIso)
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async create(
      input: Pick<StudioEventsRow, "studio_id" | "event_name" | "event_version" | "aggregate_type" | "aggregate_id" | "payload" | "actor_type"> &
        Partial<StudioEventsRow>,
    ): Promise<StudioEventsRow> {
      const { data, error } = await client.from("studio_events").insert(input).select("*").single();
      if (error) throw error;
      return data;
    },
  };
}
