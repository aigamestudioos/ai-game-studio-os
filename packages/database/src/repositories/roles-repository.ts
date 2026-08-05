import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, RolesRow } from "../generated/database.types";

// Repository de Role/UserRole (Sprint 1.8d-4 criou os papéis; Sprint 2.7
// adiciona a troca de papel de um membro já existente). Trocar o papel é
// modelado como DELETE da role atual + INSERT da nova em `user_roles`, não
// um UPDATE — mesmo padrão de "sem UPDATE parcial" já usado no projeto
// (ex.: knowledge_document_versions é append-only). A RLS
// (20260805000001_member_management_permissions.sql) já impede tocar a role
// "Owner" por este caminho, então este repository não precisa reforçar isso
// de novo — a UI só oferece Admin/Member como opções.
export function createRolesRepository(client: SupabaseClient<Database>) {
  return {
    async listByStudio(studioId: string): Promise<RolesRow[]> {
      const { data, error } = await client.from("roles").select("*").eq("studio_id", studioId).is("archived_at", null);
      if (error) throw error;
      return data ?? [];
    },

    async changeMemberRole(
      studioId: string,
      userId: string,
      newRoleId: string,
    ): Promise<void> {
      const { error: deleteError } = await client
        .from("user_roles")
        .delete()
        .eq("studio_id", studioId)
        .eq("user_id", userId);
      if (deleteError) throw deleteError;

      const { error: insertError } = await client.from("user_roles").insert({
        studio_id: studioId,
        user_id: userId,
        role_id: newRoleId,
      });
      if (insertError) throw insertError;
    },
  };
}
