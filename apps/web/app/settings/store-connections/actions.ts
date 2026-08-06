"use server";

import { cookies } from "next/headers";
import {
  createAdminClient,
  createServerClient,
  createStoreConnectionsRepository,
  createStudioEventsRepository,
} from "@agsos/database";
import { createApplePublishingAdapter, type AppleCredentials } from "@agsos/integrations";
import { storeConnectionEvent } from "../../../lib/domain-events";

// Arquitetura (AGSOS-SPEC-008 §3, Sprint 2.9): UI → Server Action →
// ApplePublishingAdapter → App Store Connect API → Resposta. Nunca chamar
// a API da Apple da UI/página — só daqui.
//
// Duas etapas de autorização, propositalmente redundantes: (1) a consulta
// via `serverClient` (RLS-bound à sessão real do cookie) confirma que o
// chamador tem acesso de leitura à Store Connection — se a RLS bloquear,
// para aqui, nunca chega no admin-client; (2) `get_store_connection_secret`
// só é executável por `service_role` (grant restrito na migration), então
// mesmo que alguém burlasse a checagem (1), não haveria como chamar essa
// RPC fora de uma Server Action como esta.
async function getAuthorizedServerClient() {
  const cookieStore = await cookies();
  return createServerClient({
    getAll: () => cookieStore.getAll(),
    set: (name, value, options) => cookieStore.set(name, value, options),
  });
}

export async function validateStoreConnection(
  storeConnectionId: string,
): Promise<{ error?: string; appsCount?: number }> {
  const serverClient = await getAuthorizedServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const serverRepo = createStoreConnectionsRepository(serverClient);
  const connection = await serverRepo.getById(storeConnectionId).catch(() => null);
  if (!connection) return { error: "Store Connection não encontrada." };

  const admin = createAdminClient();
  const adminRepo = createStoreConnectionsRepository(admin);
  const eventsRepo = createStudioEventsRepository(serverClient);
  const metadata = { store_connection_id: storeConnectionId };

  let secret: string | null;
  try {
    secret = await adminRepo.getSecret(storeConnectionId);
  } catch {
    return { error: "Não foi possível ler a credencial armazenada." };
  }
  if (!secret) {
    return { error: "Nenhuma credencial cadastrada para esta conexão ainda." };
  }

  let credentials: AppleCredentials;
  try {
    credentials = JSON.parse(secret) as AppleCredentials;
  } catch {
    return { error: "Credencial armazenada em formato inválido." };
  }

  const adapter = createApplePublishingAdapter(credentials);

  const health = await adapter.health();
  await eventsRepo.create({
    studio_id: connection.studio_id,
    ...storeConnectionEvent("StoreConnectionHealthChecked", { ok: health.ok }),
    event_version: 1,
    aggregate_type: "store_connection",
    aggregate_id: storeConnectionId,
    metadata,
    actor_type: "USER",
    actor_id: user.id,
  });

  if (!health.ok) {
    await serverRepo.markValidationResult(storeConnectionId, { status: "ERROR", lastError: health.error }, { actorType: "USER", actorId: user.id });
    await eventsRepo.create({
      studio_id: connection.studio_id,
      ...storeConnectionEvent("StoreConnectionValidated", { status: "ERROR", error: health.error }),
      event_version: 1,
      aggregate_type: "store_connection",
      aggregate_id: storeConnectionId,
      metadata,
      actor_type: "USER",
      actor_id: user.id,
    });
    return { error: health.error };
  }

  const appsResult = await adapter.listApps();
  if (!appsResult.ok) {
    await serverRepo.markValidationResult(storeConnectionId, { status: "ERROR", lastError: appsResult.error }, { actorType: "USER", actorId: user.id });
    await eventsRepo.create({
      studio_id: connection.studio_id,
      ...storeConnectionEvent("StoreConnectionValidated", { status: "ERROR", error: appsResult.error }),
      event_version: 1,
      aggregate_type: "store_connection",
      aggregate_id: storeConnectionId,
      metadata,
      actor_type: "USER",
      actor_id: user.id,
    });
    return { error: appsResult.error };
  }

  await serverRepo.markValidationResult(
    storeConnectionId,
    { status: "CONNECTED", lastError: null, discoveredApps: appsResult.apps },
    { actorType: "USER", actorId: user.id },
  );

  await eventsRepo.create({
    studio_id: connection.studio_id,
    ...storeConnectionEvent("StoreAppsDiscovered", { count: appsResult.apps.length }),
    event_version: 1,
    aggregate_type: "store_connection",
    aggregate_id: storeConnectionId,
    metadata,
    actor_type: "USER",
    actor_id: user.id,
  });

  await eventsRepo.create({
    studio_id: connection.studio_id,
    ...storeConnectionEvent("StoreConnectionValidated", { status: "CONNECTED", error: null }),
    event_version: 1,
    aggregate_type: "store_connection",
    aggregate_id: storeConnectionId,
    metadata,
    actor_type: "USER",
    actor_id: user.id,
  });

  return { appsCount: appsResult.apps.length };
}
