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
        .filter((row) => row.users && !row.users.archived_at)
        .map((row) => ({ user: row.users, roleName: row.roles?.name ?? "Member" }));
    },

    // Remoção de membro (Sprint 2.7) — soft-delete via `archived_at`, nunca
    // deleta a conta em `auth.users`. RLS (20260805000001) já impede
    // arquivar o Owner; `updated_actor_id` é sempre quem executou a ação
    // (não o próprio membro removido).
    async archive(id: string, actor: { actorType: "USER"; actorId: string }): Promise<UsersRow> {
      const { data, error } = await client
        .from("users")
        .update({
          archived_at: new Date().toISOString(),
          archived_actor_type: actor.actorType,
          archived_actor_id: actor.actorId,
          updated_actor_type: actor.actorType,
          updated_actor_id: actor.actorId,
        })
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
  };
}
