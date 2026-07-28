import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, InvitesRow } from "../generated/database.types";

// Repository de Invite (Sprint 1.8d-3). O envio real do email é
// responsabilidade do Supabase Auth (`admin.inviteUserByEmail`, admin-only —
// ver apps/web/app/settings/studio/actions.ts); este repository só lida com
// o registro da intenção do convite (studio/email/papel), lido pelo bootstrap
// (supabase/migrations/20260728000001_invites.sql) quando esse email loga
// pela primeira vez.
export function createInvitesRepository(client: SupabaseClient<Database>) {
  return {
    async listPendingByStudio(studioId: string): Promise<InvitesRow[]> {
      const { data, error } = await client
        .from("invites")
        .select("*")
        .eq("studio_id", studioId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },

    async create(fields: {
      studio_id: string;
      email: string;
      invited_by_user_id: string;
      role_name: string;
    }): Promise<InvitesRow> {
      const { data, error } = await client.from("invites").insert(fields).select("*").single();
      if (error) throw error;
      return data;
    },

    async revoke(id: string): Promise<void> {
      const { error } = await client.from("invites").update({ status: "revoked" }).eq("id", id);
      if (error) throw error;
    },
  };
}
