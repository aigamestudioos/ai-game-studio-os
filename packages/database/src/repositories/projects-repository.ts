import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ProjectsRow } from "../generated/database.types";

// Repository do Aggregate Root Project (AGSOS-SPEC-002 §5, §17). Recebe o
// client por injeção — funciona com browser-client, server-client ou
// admin-client, quem decide isso é a camada que chama (Command/Query), não
// o repository. Nenhuma lógica de negócio aqui — só acesso a dados.

export function createProjectsRepository(client: SupabaseClient<Database>) {
  return {
    async list(): Promise<ProjectsRow[]> {
      const { data, error } = await client
        .from("projects")
        .select("*")
        .is("archived_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async getById(id: string): Promise<ProjectsRow | null> {
      const { data, error } = await client.from("projects").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },

    async create(input: Pick<ProjectsRow, "studio_id" | "name"> & Partial<ProjectsRow>): Promise<ProjectsRow> {
      const { data, error } = await client.from("projects").insert(input).select("*").single();
      if (error) throw error;
      return data;
    },

    async archive(id: string, actorId: string): Promise<void> {
      const { error } = await client
        .from("projects")
        .update({ archived_at: new Date().toISOString(), archived_actor_type: "USER", archived_actor_id: actorId })
        .eq("id", id);
      if (error) throw error;
    },
  };
}
