"use server";

import { cookies } from "next/headers";
import {
  createPlatformsRepository,
  createServerClient,
  createStoreConnectionsRepository,
  createStudioEventsRepository,
  createUsersRepository,
} from "@agsos/database";
import { buildConnectionHealthSummary, SEVEN_DAYS_MS, type CallCompletedEvent, type ConnectionHealthSummary } from "../../../lib/integration-health";
import type { StoreConnectionCallCompletedPayload } from "../../../lib/domain-events";

// Sprint 2.10.1 — Integration Health. Só LÊ (nenhuma chamada externa,
// nenhuma escrita) — agrega `StoreConnectionCallCompleted` já persistidos
// por `validateStoreConnection` (`actions.ts`) sobre as funções puras de
// `lib/integration-health.ts`. Isolação por Studio vem da RLS de
// `studio_events`/`store_connections` (a mesma sessão de cookie de sempre),
// nunca de um filtro manual que poderia divergir.
export async function getIntegrationHealthSummary(): Promise<{ error?: string; connections?: ConnectionHealthSummary[] }> {
  const cookieStore = await cookies();
  const serverClient = createServerClient({
    getAll: () => cookieStore.getAll(),
    set: (name, value, options) => cookieStore.set(name, value, options),
  });

  const {
    data: { user },
  } = await serverClient.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const profile = await createUsersRepository(serverClient).getById(user.id);
  if (!profile) return { error: "Perfil não encontrado." };

  const [connections, platforms, callEvents] = await Promise.all([
    createStoreConnectionsRepository(serverClient).listByStudio(profile.studio_id),
    createPlatformsRepository(serverClient).list(),
    createStudioEventsRepository(serverClient).listByEventNameSince(
      "StoreConnectionCallCompleted",
      new Date(Date.now() - SEVEN_DAYS_MS).toISOString(),
    ),
  ]);

  const platformNameById = new Map(platforms.map((p) => [p.id, p.name] as const));
  const providerOf = (platformName: string | undefined): "APPLE" | "GOOGLE_PLAY" | null => {
    if (platformName === "App Store") return "APPLE";
    if (platformName === "Google Play") return "GOOGLE_PLAY";
    return null;
  };

  const eventsByConnectionId = new Map<string, CallCompletedEvent[]>();
  for (const row of callEvents) {
    if (row.aggregate_type !== "store_connection") continue;
    const payload = row.payload as unknown as StoreConnectionCallCompletedPayload;
    const list = eventsByConnectionId.get(row.aggregate_id) ?? [];
    list.push({ payload, occurred_at: row.occurred_at });
    eventsByConnectionId.set(row.aggregate_id, list);
  }

  const summaries = connections
    .map((connection) => {
      const provider = providerOf(platformNameById.get(connection.platform_id));
      if (!provider) return null;
      return buildConnectionHealthSummary({
        storeConnectionId: connection.id,
        provider,
        connectionDisconnected: connection.status === "DISCONNECTED",
        calls: eventsByConnectionId.get(connection.id) ?? [],
      });
    })
    .filter((s): s is ConnectionHealthSummary => s !== null);

  return { connections: summaries };
}
