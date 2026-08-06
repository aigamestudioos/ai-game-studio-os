"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createStoreConnectionsRepository,
  createStudioEventsRepository,
  type Session,
  type StoreConnectionsRow,
} from "@agsos/database";
import { getBrowserClient } from "../lib/supabase-client";
import { storeConnectionEvent } from "../lib/domain-events";
import { validateStoreConnection } from "../app/settings/store-connections/actions";

// Store Connections (Sprint 2.9 — primeira UI real). `setSecret()`/
// `getSecret()` continuam nunca sendo chamados diretamente por este hook
// para LER o segredo — só `create()`/atualizar a credencial (escrita) via
// RPC, que é permitido a `authenticated` (Sprint 2.8). Ler o segredo de
// volta (para chamar a Apple) só acontece dentro da Server Action
// `validateStoreConnection`, nunca aqui.
export function useStoreConnections(session: Session | null | undefined, studioId: string | undefined) {
  const [connections, setConnections] = useState<StoreConnectionsRow[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session || !studioId) return;
    try {
      const client = getBrowserClient();
      const repo = createStoreConnectionsRepository(client);
      const rows = await repo.listByStudio(studioId);
      setConnections(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar as conexões.");
    }
  }, [session, studioId]);

  useEffect(() => {
    load();
  }, [load]);

  async function createConnection(input: {
    platformId: string;
    displayName: string;
    credentials: Record<string, string>;
  }): Promise<{ error?: string }> {
    if (!session || !studioId) return { error: "Sessão ou Studio não carregados ainda." };
    try {
      const client = getBrowserClient();
      const repo = createStoreConnectionsRepository(client);
      const eventsRepo = createStudioEventsRepository(client);

      const created = await repo.create({
        studio_id: studioId,
        platform_id: input.platformId,
        display_name: input.displayName,
        created_actor_type: "USER",
        created_actor_id: session.user.id,
        updated_actor_type: "USER",
        updated_actor_id: session.user.id,
      });

      await repo.setSecret(created.id, JSON.stringify(input.credentials), session.user.id);

      await eventsRepo.create({
        studio_id: studioId,
        ...storeConnectionEvent("StoreConnectionCreated", { platform_id: input.platformId, display_name: input.displayName }),
        event_version: 1,
        aggregate_type: "store_connection",
        aggregate_id: created.id,
        metadata: { store_connection_id: created.id },
        actor_type: "USER",
        actor_id: session.user.id,
      });

      await load();
      return {};
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "42501") return { error: "Você não tem permissão para gerenciar Store Connections." };
      return { error: err instanceof Error ? err.message : "Não foi possível criar a conexão." };
    }
  }

  async function updateDisplayName(id: string, displayName: string): Promise<{ error?: string }> {
    if (!session || !studioId) return {};
    try {
      const client = getBrowserClient();
      const repo = createStoreConnectionsRepository(client);
      const eventsRepo = createStudioEventsRepository(client);
      await repo.update(id, { display_name: displayName, updated_actor_type: "USER", updated_actor_id: session.user.id });
      await eventsRepo.create({
        studio_id: studioId,
        ...storeConnectionEvent("StoreConnectionUpdated", { fields: ["display_name"] }),
        event_version: 1,
        aggregate_type: "store_connection",
        aggregate_id: id,
        metadata: { store_connection_id: id },
        actor_type: "USER",
        actor_id: session.user.id,
      });
      await load();
      return {};
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "42501") return { error: "Você não tem permissão para gerenciar Store Connections." };
      return { error: "Não foi possível atualizar." };
    }
  }

  async function reconnect(id: string, credentials: Record<string, string>): Promise<{ error?: string }> {
    if (!session) return {};
    try {
      const client = getBrowserClient();
      const repo = createStoreConnectionsRepository(client);
      await repo.setSecret(id, JSON.stringify(credentials), session.user.id);
      await load();
      return {};
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "42501") return { error: "Você não tem permissão para gerenciar Store Connections." };
      return { error: "Não foi possível salvar a credencial." };
    }
  }

  async function disconnect(id: string): Promise<{ error?: string }> {
    if (!session || !studioId) return {};
    try {
      const client = getBrowserClient();
      const repo = createStoreConnectionsRepository(client);
      const eventsRepo = createStudioEventsRepository(client);
      await repo.clearSecret(id, session.user.id);
      await eventsRepo.create({
        studio_id: studioId,
        ...storeConnectionEvent("StoreConnectionUpdated", { fields: ["credentials_ref", "status"] }),
        event_version: 1,
        aggregate_type: "store_connection",
        aggregate_id: id,
        metadata: { store_connection_id: id },
        actor_type: "USER",
        actor_id: session.user.id,
      });
      await load();
      return {};
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "42501") return { error: "Você não tem permissão para gerenciar Store Connections." };
      return { error: "Não foi possível desconectar." };
    }
  }

  async function removeConnection(id: string): Promise<{ error?: string }> {
    if (!session || !studioId) return {};
    try {
      const client = getBrowserClient();
      const repo = createStoreConnectionsRepository(client);
      const eventsRepo = createStudioEventsRepository(client);
      await repo.delete(id);
      await eventsRepo.create({
        studio_id: studioId,
        ...storeConnectionEvent("StoreConnectionDeleted", {}),
        event_version: 1,
        aggregate_type: "store_connection",
        aggregate_id: id,
        metadata: { store_connection_id: id },
        actor_type: "USER",
        actor_id: session.user.id,
      });
      setConnections((prev) => prev?.filter((c) => c.id !== id));
      return {};
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "42501") return { error: "Você não tem permissão para gerenciar Store Connections." };
      return { error: "Não foi possível remover." };
    }
  }

  // "Validate Connection" — a única ação deste hook que sai pela Server
  // Action (UI → Server Action → ApplePublishingAdapter → API da Apple →
  // Resposta), nunca chamando a Apple direto do client.
  async function validate(id: string): Promise<{ error?: string; appsCount?: number }> {
    const result = await validateStoreConnection(id);
    await load();
    return result;
  }

  return { connections, error, refresh: load, createConnection, updateDisplayName, reconnect, disconnect, removeConnection, validate };
}
