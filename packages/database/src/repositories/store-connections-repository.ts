import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, StoreConnectionsRow } from "../generated/database.types";

// Repository de Store Connection (AGSOS-SPEC-002 §8 — Publishing). Sprint
// 2.8 — schema/RLS/Vault + repository, sem UI (Sprint 2.10) e sem os
// adapters Apple/Google que de fato chamam as APIs externas (Sprint 2.9).
//
// `credentials_ref` nunca é a credencial — é o id de um segredo no Supabase
// Vault. Este repository nunca lê nem grava o segredo diretamente: gravar
// passa por `setSecret()` (RPC `set_store_connection_secret`, que valida
// permissão + posse do Studio inteiramente dentro de uma função
// SECURITY DEFINER antes de tocar o Vault); não existe (nem deveria existir
// aqui) um método para LER o segredo de volta — isso é trabalho dos
// adapters (Sprint 2.9), que rodam só no servidor.
export function createStoreConnectionsRepository(client: SupabaseClient<Database>) {
  return {
    async listByStudio(studioId: string): Promise<StoreConnectionsRow[]> {
      const { data, error } = await client
        .from("store_connections")
        .select("*")
        .eq("studio_id", studioId)
        .is("archived_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async getById(id: string): Promise<StoreConnectionsRow | null> {
      const { data, error } = await client.from("store_connections").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },

    // Cria a linha sem nenhuma credencial ainda — `setSecret()` é uma
    // segunda chamada, obrigatória antes de a conexão poder ser validada.
    async create(
      input: Pick<StoreConnectionsRow, "studio_id" | "platform_id" | "display_name"> & Partial<StoreConnectionsRow>,
    ): Promise<StoreConnectionsRow> {
      const { data, error } = await client.from("store_connections").insert(input).select("*").single();
      if (error) throw error;
      return data;
    },

    async update(
      id: string,
      fields: Partial<Pick<StoreConnectionsRow, "display_name" | "metadata" | "updated_actor_type" | "updated_actor_id">>,
    ): Promise<StoreConnectionsRow> {
      const { data, error } = await client.from("store_connections").update(fields).eq("id", id).select("*").single();
      if (error) throw error;
      return data;
    },

    // Grava/atualiza o segredo no Vault via RPC — nunca via `update()`
    // direto na tabela (`credentials_ref` só é escrito pela função
    // SECURITY DEFINER, nunca pelo client).
    async setSecret(storeConnectionId: string, secret: string, actorId: string): Promise<void> {
      const { error } = await client.rpc("set_store_connection_secret", {
        p_store_connection_id: storeConnectionId,
        p_secret: secret,
        p_actor_id: actorId,
      });
      if (error) throw error;
    },

    // Resultado de uma tentativa de validação (Sprint 2.9 vai chamar isso
    // depois de tentar listar apps via o adapter correspondente).
    async markValidationResult(
      id: string,
      result: { status: "CONNECTED" | "ERROR"; lastError: string | null },
      actor: { actorType: "USER"; actorId: string },
    ): Promise<StoreConnectionsRow> {
      const { data, error } = await client
        .from("store_connections")
        .update({
          status: result.status,
          last_error: result.lastError,
          last_validation_at: new Date().toISOString(),
          updated_actor_type: actor.actorType,
          updated_actor_id: actor.actorId,
        })
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },

    // Soft-delete (mesmo padrão de `users.archive()`, Sprint 2.7) — a
    // trigger `store_connections_delete_secret` só limpa o Vault num DELETE
    // de verdade, não num archive. Como este sprint não expõe UI ainda,
    // "remover" fica definido aqui como o DELETE real (limpa o Vault junto),
    // não archive — reavaliar se o Sprint 2.10 (UI) preferir soft-delete
    // reversível como o resto do projeto.
    async delete(id: string): Promise<void> {
      const { error } = await client.from("store_connections").delete().eq("id", id);
      if (error) throw error;
    },
  };
}
