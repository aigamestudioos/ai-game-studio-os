"use server";

import { cookies } from "next/headers";
import {
  createAdminClient,
  createBuildArtifactsRepository,
  createBuildsRepository,
  createServerClient,
  createStudioEventsRepository,
} from "@agsos/database";
import { createSignedDownloadUrl, downloadObject, objectExists, removeObject } from "@agsos/storage";
import { validateArtifactStructure } from "../../../../../lib/artifact-validation";
import { buildArtifactEvent } from "../../../../../lib/domain-events";

// Arquitetura (Sprint 2.11a): o binário nunca passa por aqui — o browser
// envia direto ao Supabase Storage via TUS (packages/storage, gated pela
// policy `build_artifacts_object_insert`). Estas Server Actions só
// orquestram metadata: (1) criar a linha PENDING e devolver o path oficial
// antes do upload, (2) confirmar que o objeto chegou de verdade ao Storage
// depois do upload, (3) validar a estrutura, (4) emitir signed download URL,
// (5) arquivar/remover.
//
// Limitação conhecida (deferida para 2.11d — background processing): a
// confirmação/validação faz `downloadObject` do binário inteiro dentro da
// própria Server Action (runtime da Vercel) para inspecionar a estrutura
// ZIP — isso é diferente do UPLOAD (que nunca atravessa a Vercel), mas
// ainda assim implica ler o arquivo completo na memória do processo
// server-side. Para arquivos até o limite do bucket (500MiB) isso deve
// funcionar, mas pode aproximar-se de limites de memória/tempo de execução
// de uma function serverless — sem worker/fila neste sprint (fora de
// escopo, ver limites do Sprint 2.11a), este é o caminho síncrono aceito
// como primeira versão.

async function getAuthorizedServerClient() {
  const cookieStore = await cookies();
  return createServerClient({
    getAll: () => cookieStore.getAll(),
    set: (name, value, options) => cookieStore.set(name, value, options),
  });
}

export async function createPendingArtifact(input: {
  buildId: string;
  originalFilename: string;
  fileExtension: string;
  sizeBytes: number;
  checksum: string;
  mimeTypeReported: string | null;
}): Promise<{ error?: string; artifactId?: string; storageBucket?: string; storagePath?: string }> {
  const serverClient = await getAuthorizedServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const buildsRepo = createBuildsRepository(serverClient);
  const build = await buildsRepo.getById(input.buildId).catch(() => null);
  if (!build) return { error: "Build não encontrada." };

  try {
    const artifact = await createBuildArtifactsRepository(serverClient).createPending({
      buildId: input.buildId,
      originalFilename: input.originalFilename,
      fileExtension: input.fileExtension,
      sizeBytes: input.sizeBytes,
      checksum: input.checksum,
      mimeTypeReported: input.mimeTypeReported,
      actorId: user.id,
    });

    const eventsRepo = createStudioEventsRepository(serverClient);
    await eventsRepo.create({
      studio_id: artifact.studio_id,
      ...buildArtifactEvent("BuildArtifactUploadStarted", {
        build_id: input.buildId,
        original_filename: input.originalFilename,
        size_bytes: input.sizeBytes,
      }),
      event_version: 1,
      aggregate_type: "build_artifact",
      aggregate_id: artifact.id,
      metadata: { build_id: input.buildId },
      actor_type: "USER",
      actor_id: user.id,
    });

    return { artifactId: artifact.id, storageBucket: artifact.storage_bucket, storagePath: artifact.storage_path };
  } catch {
    return { error: "Não foi possível preparar o upload. Verifique sua permissão neste Studio." };
  }
}

export async function markArtifactUploadFailed(artifactId: string, reason: string): Promise<{ error?: string }> {
  const serverClient = await getAuthorizedServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const repo = createBuildArtifactsRepository(serverClient);
  const artifact = await repo.getById(artifactId).catch(() => null);
  if (!artifact) return { error: "Artefato não encontrado." };

  await repo.update(artifactId, { upload_status: "FAILED", updated_actor_type: "USER", updated_actor_id: user.id });
  await createStudioEventsRepository(serverClient).create({
    studio_id: artifact.studio_id,
    ...buildArtifactEvent("BuildArtifactUploadFailed", { build_id: artifact.build_id, reason: reason.slice(0, 200) }),
    event_version: 1,
    aggregate_type: "build_artifact",
    aggregate_id: artifactId,
    metadata: { build_id: artifact.build_id },
    actor_type: "USER",
    actor_id: user.id,
  });
  return {};
}

export async function confirmArtifactStored(
  artifactId: string,
): Promise<{ error?: string; uploadStatus?: string; validationStatus?: string; validationErrorCode?: string }> {
  const serverClient = await getAuthorizedServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const serverRepo = createBuildArtifactsRepository(serverClient);
  const artifact = await serverRepo.getById(artifactId).catch(() => null);
  if (!artifact) return { error: "Artefato não encontrado." };

  const admin = createAdminClient();
  const ref = { bucket: artifact.storage_bucket, path: artifact.storage_path };
  const eventsRepo = createStudioEventsRepository(serverClient);
  const metadata = { build_id: artifact.build_id };

  const exists = await objectExists(admin, ref).catch(() => false);
  if (!exists) {
    await serverRepo.update(artifactId, { upload_status: "FAILED", updated_actor_type: "USER", updated_actor_id: user.id });
    await eventsRepo.create({
      studio_id: artifact.studio_id,
      ...buildArtifactEvent("BuildArtifactUploadFailed", { build_id: artifact.build_id, reason: "Objeto não encontrado no Storage após o upload." }),
      event_version: 1,
      aggregate_type: "build_artifact",
      aggregate_id: artifactId,
      metadata,
      actor_type: "USER",
      actor_id: user.id,
    });
    return { error: "O arquivo não chegou ao armazenamento. Tente novamente." };
  }

  await serverRepo.update(artifactId, {
    upload_status: "STORED",
    uploaded_at: new Date().toISOString(),
    updated_actor_type: "USER",
    updated_actor_id: user.id,
  });
  await eventsRepo.create({
    studio_id: artifact.studio_id,
    ...buildArtifactEvent("BuildArtifactStored", { build_id: artifact.build_id }),
    event_version: 1,
    aggregate_type: "build_artifact",
    aggregate_id: artifactId,
    metadata,
    actor_type: "USER",
    actor_id: user.id,
  });

  await serverRepo.update(artifactId, { validation_status: "VALIDATING", updated_actor_type: "USER", updated_actor_id: user.id });
  await eventsRepo.create({
    studio_id: artifact.studio_id,
    ...buildArtifactEvent("BuildArtifactValidationStarted", { build_id: artifact.build_id }),
    event_version: 1,
    aggregate_type: "build_artifact",
    aggregate_id: artifactId,
    metadata,
    actor_type: "USER",
    actor_id: user.id,
  });

  let result: { valid: true } | { valid: false; errorCode: string };
  try {
    const blob = await downloadObject(admin, ref);
    const buffer = Buffer.from(await blob.arrayBuffer());
    result = validateArtifactStructure({ fileExtension: artifact.file_extension, sizeBytes: artifact.size_bytes, buffer });
  } catch {
    result = { valid: false, errorCode: "ZIP_STRUCTURE_INVALID" };
  }

  if (result.valid) {
    await serverRepo.update(artifactId, {
      validation_status: "VALID",
      validated_at: new Date().toISOString(),
      updated_actor_type: "USER",
      updated_actor_id: user.id,
    });
    await eventsRepo.create({
      studio_id: artifact.studio_id,
      ...buildArtifactEvent("BuildArtifactValidated", { build_id: artifact.build_id }),
      event_version: 1,
      aggregate_type: "build_artifact",
      aggregate_id: artifactId,
      metadata,
      actor_type: "USER",
      actor_id: user.id,
    });
    return { uploadStatus: "STORED", validationStatus: "VALID" };
  }

  await serverRepo.update(artifactId, {
    validation_status: "INVALID",
    validation_error_code: result.errorCode,
    validated_at: new Date().toISOString(),
    updated_actor_type: "USER",
    updated_actor_id: user.id,
  });
  await eventsRepo.create({
    studio_id: artifact.studio_id,
    ...buildArtifactEvent("BuildArtifactValidationFailed", { build_id: artifact.build_id, error_code: result.errorCode }),
    event_version: 1,
    aggregate_type: "build_artifact",
    aggregate_id: artifactId,
    metadata,
    actor_type: "USER",
    actor_id: user.id,
  });
  return { uploadStatus: "STORED", validationStatus: "INVALID", validationErrorCode: result.errorCode };
}

export async function getArtifactDownloadUrl(artifactId: string): Promise<{ error?: string; url?: string }> {
  const serverClient = await getAuthorizedServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const artifact = await createBuildArtifactsRepository(serverClient).getById(artifactId).catch(() => null);
  if (!artifact) return { error: "Artefato não encontrado." };

  const admin = createAdminClient();
  try {
    const url = await createSignedDownloadUrl(admin, { bucket: artifact.storage_bucket, path: artifact.storage_path }, 60);
    return { url };
  } catch {
    return { error: "Não foi possível gerar o link de download." };
  }
}

export async function archiveArtifact(artifactId: string): Promise<{ error?: string }> {
  const serverClient = await getAuthorizedServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const serverRepo = createBuildArtifactsRepository(serverClient);
  const artifact = await serverRepo.getById(artifactId).catch(() => null);
  if (!artifact) return { error: "Artefato não encontrado." };

  try {
    await serverRepo.archive(artifactId, { actorType: "USER", actorId: user.id });
  } catch {
    return { error: "Não foi possível remover o artefato. Verifique sua permissão neste Studio." };
  }

  const admin = createAdminClient();
  await removeObject(admin, { bucket: artifact.storage_bucket, path: artifact.storage_path }).catch(() => {
    // Best-effort: a linha já foi arquivada (fonte de verdade); falha ao
    // remover o objeto físico não deve impedir o usuário de seguir — fica
    // como órfão no bucket, aceitável para este sprint (sem job de limpeza).
  });

  await createStudioEventsRepository(serverClient).create({
    studio_id: artifact.studio_id,
    ...buildArtifactEvent("BuildArtifactRemoved", { build_id: artifact.build_id }),
    event_version: 1,
    aggregate_type: "build_artifact",
    aggregate_id: artifactId,
    metadata: { build_id: artifact.build_id },
    actor_type: "USER",
    actor_id: user.id,
  });

  return {};
}
