import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UsersRow } from "../generated/database.types";

// Repository de User (parte do contexto Administration, AGSOS-SPEC-002).
// listByStudio() é a base de "ver membros" (Sprint 1.8d-2) — hoje sempre
// retorna 1 linha (o próprio Owner), já que convites (1.8d-3) ainda não
// existem; RLS (studio_id = current_user_studio_id()) já garante que só o
// próprio Studio é visível, então nenhum filtro adicional é necessário aqui.
export function createUsersRepository(client: SupabaseClient<Database>) {
  return {
    async getById(id: string): Promise<UsersRow | null> {
      const { data, error } = await client.from("users").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },

    async listByStudio(studioId: string): Promise<UsersRow[]> {
      const { data, error } = await client.from("users").select("*").eq("studio_id", studioId);
      if (error) throw error;
      return data;
    },

    // Papel real por membro (Sprint 1.8d-4) — antes disso, a UI comparava
    // com `studio.owner_user_id` como atalho (só existiam Owner/Member fixo).
    // Consulta a partir de `user_roles` (join table) para trazer usuário +
    // papel numa única query.
    async listByStudioWithRoles(
      studioId: string,
    ): Promise<{ user: UsersRow; roleName: string }[]> {
      const { data, error } = await client
        .from("user_roles")
        .select("users(*), roles(name)")
        .eq("studio_id", studioId);
      if (error) throw error;
      return (data as unknown as { users: UsersRow; roles: { name: string } }[])
        .filter((row) => row.users)
        .map((row) => ({ user: row.users, roleName: row.roles?.name ?? "Member" }));
    },
  };
}
