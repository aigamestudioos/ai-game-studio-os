"use server";

import { cookies } from "next/headers";
import {
  createAdminClient,
  createPlatformsRepository,
  createServerClient,
  createStoreConnectionsRepository,
  createStudioEventsRepository,
} from "@agsos/database";
import {
  createApplePublishingAdapter,
  createGooglePlayPublishingAdapter,
  type AppleCredentials,
  type GoogleCredentials,
  type IntegrationAdapter,
  type ListResult,
} from "@agsos/integrations";
import { storeConnectionEvent } from "../../../lib/domain-events";

// Arquitetura (AGSOS-SPEC-008 §3, Sprint 2.9/2.10): UI → Server Action →
// Adapter (Apple ou Google Play) → API do provider → Resposta. Nunca chamar
// a API de um provider da UI/página — só daqui. Dispatch por provider é
// feito pelo `platform_id` da conexão (join com `platforms.name`), não por
// um campo separado — a tabela `platforms` já é a fonte de verdade.
function buildAdapter(platformName: string, secret: string): { adapter: IntegrationAdapter & { listApps(): Promise<ListResult<{ id: string; name: string }>> } } | { error: string } {
  if (platformName === "App Store") {
    let credentials: AppleCredentials;
    try {
      credentials = JSON.parse(secret) as AppleCredentials;
    } catch {
      return { error: "Credencial armazenada em formato inválido." };
    }
    return { adapter: createApplePublishingAdapter(credentials) };
  }
  if (platformName === "Google Play") {
    let credentials: GoogleCredentials;
    try {
      credentials = JSON.parse(secret) as GoogleCredentials;
    } catch {
      return { error: "Credencial armazenada em formato inválido." };
    }
    return { adapter: createGooglePlayPublishingAdapter(credentials) };
  }
  return { error: `Provider "${platformName}" ainda não tem um adapter implementado.` };
}

// Sprint 2.10.1 — Integration Health. Mapeia `platforms.name` (schema,
// Sprint 2.8) para o vocabulário estável usado em métricas/eventos
// operacionais (`StoreConnectionCallCompletedPayload.provider`) — nunca o
// nome de exibição direto, que é texto livre editável no schema.
function providerCode(platformName: string): "APPLE" | "GOOGLE_PLAY" | null {
  if (platformName === "App Store") return "APPLE";
  if (platformName === "Google Play") return "GOOGLE_PLAY";
  return null;
}

// Mede a duração real da chamada e emite `StoreConnectionCallCompleted` —
// nunca chama o adapter de novo (isso duplicaria a chamada externa), só
// envolve a chamada já feita pelo call site. `isRetry` sempre `false`
// nesta versão: não existe ainda nenhum caminho de retry explícito para
// Validate Connection (diferente do Retry Build do Release Pipeline) —
// documentado como limitação conhecida, nunca inferido por heurística de
// timestamp (instrução explícita do usuário).
async function recordCallCompleted<T extends { ok: boolean; code?: string }>(
  params: {
    eventsRepo: ReturnType<typeof createStudioEventsRepository>;
    studioId: string;
    storeConnectionId: string;
    provider: "APPLE" | "GOOGLE_PLAY";
    operation: "HEALTH" | "LIST_APPS" | "CONNECT" | "DISCONNECT";
    actorId: string;
    metadata: Record<string, unknown>;
  },
  fn: () => Promise<T>,
): Promise<T> {
  const startedAt = Date.now();
  const result = await fn();
  const durationMs = Date.now() - startedAt;
  await params.eventsRepo.create({
    studio_id: params.studioId,
    ...storeConnectionEvent("StoreConnectionCallCompleted", {
      provider: params.provider,
      operation: params.operation,
      success: result.ok,
      durationMs,
      isRetry: false,
      errorCode: result.ok ? undefined : (result.code ?? "UNKNOWN"),
    }),
    event_version: 1,
    aggregate_type: "store_connection",
    aggregate_id: params.storeConnectionId,
    metadata: params.metadata,
    actor_type: "USER",
    actor_id: params.actorId,
  });
  return result;
}
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

  const platforms = await createPlatformsRepository(serverClient).list();
  const platform = platforms.find((p) => p.id === connection.platform_id);
  if (!platform) return { error: "Platform não encontrada para esta conexão." };

  let secret: string | null;
  try {
    secret = await adminRepo.getSecret(storeConnectionId);
  } catch {
    return { error: "Não foi possível ler a credencial armazenada." };
  }
  if (!secret) {
    return { error: "Nenhuma credencial cadastrada para esta conexão ainda." };
  }

  const built = buildAdapter(platform.name, secret);
  if ("error" in built) return { error: built.error };
  const adapter = built.adapter;

  const provider = providerCode(platform.name);
  if (!provider) return { error: `Provider "${platform.name}" sem código estável para métricas.` };

  const health = await recordCallCompleted(
    { eventsRepo, studioId: connection.studio_id, storeConnectionId, provider, operation: "HEALTH", actorId: user.id, metadata },
    () => adapter.health(),
  );
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

  const appsResult = await recordCallCompleted(
    { eventsRepo, studioId: connection.studio_id, storeConnectionId, provider, operation: "LIST_APPS", actorId: user.id, metadata },
    () => adapter.listApps(),
  );
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
    { status: "CONNECTED", lastError: null, discoveredApps: appsResult.items },
    { actorType: "USER", actorId: user.id },
  );

  await eventsRepo.create({
    studio_id: connection.studio_id,
    ...storeConnectionEvent("StoreAppsDiscovered", { count: appsResult.items.length }),
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

  return { appsCount: appsResult.items.length };
}
