"use server";

// Sprint 2.11d-2b — mesma reescrita enqueue-and-return do Google
// (`provider-upload-actions.ts`), aplicada ao fluxo Apple do Sprint 2.11c.
// Todo o trabalho de rede (listApps/createBuildUpload/reserveBuildUploadFile/
// upload de uploadOperations/commit/poll) sai desta Server Action e vira
// responsabilidade do processor real da Apple no worker (Sprint 2.11d-2d) —
// até lá, um job `integration_name = "apple_app_store"` fica legitimamente
// `QUEUED` sem ser reivindicado.

import { cookies } from "next/headers";
import {
  createBuildArtifactsRepository,
  createBuildsRepository,
  createGameVersionsRepository,
  createGamesRepository,
  createProviderUploadsRepository,
  createServerClient,
  createStoreConnectionsRepository,
  createStudioEventsRepository,
} from "@agsos/database";
import { providerUploadEvent } from "../../../../../lib/domain-events";
import { MAX_PROVIDER_UPLOAD_SIZE_BYTES } from "../../../../../lib/provider-upload-limits";

async function getAuthorizedServerClient() {
  const cookieStore = await cookies();
  return createServerClient({
    getAll: () => cookieStore.getAll(),
    set: (name, value, options) => cookieStore.set(name, value, options),
  });
}

// Resolve `bundle_identifier` a partir do BuildArtifact — mesmo padrão de
// `provider-upload-actions.ts::resolveGamePackageName`.
async function resolveGameBundleIdentifier(
  serverClient: Awaited<ReturnType<typeof getAuthorizedServerClient>>,
  buildId: string,
): Promise<{ gameId: string; bundleIdentifier: string | null } | null> {
  const build = await createBuildsRepository(serverClient).getById(buildId);
  if (!build) return null;
  const version = await createGameVersionsRepository(serverClient).getById(build.game_version_id);
  if (!version) return null;
  const game = await createGamesRepository(serverClient).getById(version.game_id);
  if (!game) return null;
  return { gameId: game.id, bundleIdentifier: game.bundle_identifier };
}

export async function setGameBundleIdentifier(gameId: string, bundleIdentifier: string): Promise<{ error?: string }> {
  const serverClient = await getAuthorizedServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const trimmed = bundleIdentifier.trim();
  if (!/^[a-zA-Z][a-zA-Z0-9-]*(\.[a-zA-Z][a-zA-Z0-9-]*)+$/.test(trimmed)) {
    return { error: "Bundle Identifier inválido (formato esperado: com.exemplo.jogo)." };
  }

  try {
    await createGamesRepository(serverClient).update(gameId, {
      bundle_identifier: trimmed,
      updated_actor_type: "USER",
      updated_actor_id: user.id,
    });
    return {};
  } catch {
    return { error: "Não foi possível salvar o Bundle Identifier. Verifique sua permissão neste Studio." };
  }
}

// GATE 25 — mesmo guard pré-enqueue do Google (ver `provider-upload-actions.ts`).
async function rejectIfTooLarge(
  repo: ReturnType<typeof createProviderUploadsRepository>,
  eventsRepo: ReturnType<typeof createStudioEventsRepository>,
  providerUploadId: string,
  studioId: string,
  buildArtifactId: string,
  storeConnectionId: string,
  sizeBytes: number,
  userId: string,
): Promise<{ error: string } | null> {
  if (sizeBytes <= MAX_PROVIDER_UPLOAD_SIZE_BYTES) return null;

  await repo.update(providerUploadId, {
    status: "FAILED",
    error_code: "ARTIFACT_TOO_LARGE",
    completed_at: new Date().toISOString(),
    updated_actor_type: "USER",
    updated_actor_id: userId,
  });
  await eventsRepo.create({
    studio_id: studioId,
    ...providerUploadEvent("ProviderUploadFailed", {
      provider: "APPLE_APP_STORE",
      buildArtifactId,
      storeConnectionId,
      durationMs: 0,
      errorCode: "ARTIFACT_TOO_LARGE",
      attempt: 1,
    }),
    event_version: 1,
    aggregate_type: "provider_upload",
    aggregate_id: providerUploadId,
    metadata: { build_artifact_id: buildArtifactId, store_connection_id: storeConnectionId },
    actor_type: "USER",
    actor_id: userId,
  });
  return { error: "Artefato acima do limite temporário de 150MB para envio à App Store." };
}

export async function sendArtifactToAppStore(
  buildArtifactId: string,
  storeConnectionId: string,
): Promise<{ error?: string; providerUploadId?: string }> {
  const serverClient = await getAuthorizedServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const artifact = await createBuildArtifactsRepository(serverClient).getById(buildArtifactId);
  if (!artifact) return { error: "Artefato não encontrado." };

  const context = await resolveGameBundleIdentifier(serverClient, artifact.build_id);
  if (!context || !context.bundleIdentifier) {
    return { error: "Este Game ainda não tem um Bundle Identifier configurado — defina antes de enviar." };
  }

  const connection = await createStoreConnectionsRepository(serverClient).getById(storeConnectionId);
  if (!connection) return { error: "Store Connection não encontrada." };

  const repo = createProviderUploadsRepository(serverClient);
  let providerUpload;
  try {
    providerUpload = await repo.createPending({ buildArtifactId, storeConnectionId, actorId: user.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("Store Connection incompatível")) {
      return { error: "Esta Store Connection não é da App Store — selecione uma conexão Apple." };
    }
    return { error: "Não foi possível iniciar o envio — confira se o artefato está válido e sua permissão neste Studio." };
  }

  const eventsRepo = createStudioEventsRepository(serverClient);

  const tooLarge = await rejectIfTooLarge(
    repo,
    eventsRepo,
    providerUpload.id,
    providerUpload.studio_id,
    artifact.id,
    connection.id,
    artifact.size_bytes,
    user.id,
  );
  if (tooLarge) return { ...tooLarge, providerUploadId: providerUpload.id };

  try {
    await serverClient.rpc("enqueue_provider_upload_job", {
      p_provider_upload_id: providerUpload.id,
      p_integration_name: "apple_app_store",
      p_operation: "upload_build",
      p_actor_id: user.id,
    });
  } catch {
    return { error: "Não foi possível enfileirar o envio.", providerUploadId: providerUpload.id };
  }

  await eventsRepo.create({
    studio_id: providerUpload.studio_id,
    ...providerUploadEvent("ProviderUploadQueued", {
      provider: "APPLE_APP_STORE",
      buildArtifactId: artifact.id,
      storeConnectionId: connection.id,
      attempt: 1,
    }),
    event_version: 1,
    aggregate_type: "provider_upload",
    aggregate_id: providerUpload.id,
    metadata: { build_artifact_id: artifact.id, store_connection_id: connection.id },
    actor_type: "USER",
    actor_id: user.id,
  });

  return { providerUploadId: providerUpload.id };
}

export async function retryAppleProviderUpload(providerUploadId: string): Promise<{ error?: string }> {
  const serverClient = await getAuthorizedServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const repo = createProviderUploadsRepository(serverClient);
  const existing = await repo.getById(providerUploadId).catch(() => null);
  if (!existing) return { error: "Envio não encontrado." };

  const nextAttempt = existing.attempt + 1;

  try {
    await serverClient.rpc("enqueue_provider_upload_job", {
      p_provider_upload_id: providerUploadId,
      p_integration_name: "apple_app_store",
      p_operation: "upload_build",
      p_actor_id: user.id,
    });
  } catch {
    return { error: "Já existe um envio em andamento para este artefato — aguarde terminar antes de tentar de novo." };
  }

  await repo.update(providerUploadId, {
    attempt: nextAttempt,
    updated_actor_type: "USER",
    updated_actor_id: user.id,
  });

  const eventsRepo = createStudioEventsRepository(serverClient);
  await eventsRepo.create({
    studio_id: existing.studio_id,
    ...providerUploadEvent("ProviderUploadRetried", {
      provider: "APPLE_APP_STORE",
      buildArtifactId: existing.build_artifact_id,
      storeConnectionId: existing.store_connection_id,
      attempt: nextAttempt,
    }),
    event_version: 1,
    aggregate_type: "provider_upload",
    aggregate_id: providerUploadId,
    metadata: { build_artifact_id: existing.build_artifact_id, store_connection_id: existing.store_connection_id },
    actor_type: "USER",
    actor_id: user.id,
  });

  return {};
}
