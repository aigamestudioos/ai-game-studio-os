import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, StoreConnectionsRow } from "../generated/database.types";

// Repository de Store Connection (AGSOS-SPEC-002 §8 — Publishing). Sprint
// 2.8 — schema/RLS/Vault + repository, sem UI (Sprint 2.10) e sem os
// adapters Apple/Google que de fato chamam as APIs externas (Sprint 2.9).
//
// `credentials_ref` nunca é a credencial — é o id de um segredo no Supabase
// Vault. Este repository nunca lê nem grava o segredo diretamente: gravar
// passa por `setSecret()`, ler por `getSecret()` — ambas RPCs SECURITY
// DEFINER que validam posse do Studio/permissão antes de tocar o Vault.
// `getSecret()` só é chamável por `service_role` (grant restrito na
// migration, Sprint 2.9) — nunca importar esta função num Client Component;
// ela só deve ser invocada a partir de uma Server Action usando
// `admin-client.ts`.
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

    // Lê o segredo do Vault (Sprint 2.9) — só a Server Action de "Validate
    // Connection" chama isso, com um client admin (`service_role`). Nunca
    // expor este método a um caminho alcançável pelo browser.
    async getSecret(storeConnectionId: string): Promise<string | null> {
      const { data, error } = await client.rpc("get_store_connection_secret", {
        p_store_connection_id: storeConnectionId,
      });
      if (error) throw error;
      return data;
    },

    // "Disconnect" (Sprint 2.9) — limpa Vault + `credentials_ref`, volta o
    // status para DISCONNECTED, mantém a linha (diferente de `delete()`).
    async clearSecret(storeConnectionId: string, actorId: string): Promise<void> {
      const { error } = await client.rpc("clear_store_connection_secret", {
        p_store_connection_id: storeConnectionId,
        p_actor_id: actorId,
      });
      if (error) throw error;
    },

    // Resultado de uma tentativa de validação — health() + listApps() via
    // o adapter correspondente (Sprint 2.9). `discoveredApps` vai em
    // `metadata` (coluna já existente desde o Sprint 2.8) — não foi criada
    // uma tabela nova só para isso; a lista é só para exibição, não é usada
    // por nenhuma feature de negócio ainda (publicação/build permanecem
    // fora de escopo deste sprint).
    async markValidationResult(
      id: string,
      result: { status: "CONNECTED" | "ERROR"; lastError: string | null; discoveredApps?: unknown[] },
      actor: { actorType: "USER"; actorId: string },
    ): Promise<StoreConnectionsRow> {
      const patch: Partial<StoreConnectionsRow> = {
        status: result.status,
        last_error: result.lastError,
        last_validation_at: new Date().toISOString(),
        updated_actor_type: actor.actorType,
        updated_actor_id: actor.actorId,
      };
      if (result.discoveredApps) {
        patch.metadata = { apps: result.discoveredApps };
      }
      const { data, error } = await client.from("store_connections").update(patch).eq("id", id).select("*").single();
      if (error) throw error;
      return data;
    },

    // DELETE real (não soft-delete) — a trigger `store_connections_delete_secret`
    // (Sprint 2.8) limpa o Vault junto. Decisão registrada em DECISIONS.md:
    // provisória, sem UI que decidisse diferente até agora.
    async delete(id: string): Promise<void> {
      const { error } = await client.from("store_connections").delete().eq("id", id);
      if (error) throw error;
    },
  };
}
