import type { SupabaseClient } from "@supabase/supabase-js";

// Abstração de Storage (AGSOS-SPEC-008 §6, AGSOS-SPEC-004 §"@agsos/storage"):
// implementação inicial Supabase Storage, sem nenhum tipo de `Database`
// importado de @agsos/database — este package é deliberadamente agnóstico
// do schema da aplicação (só sabe de bucket/path), para poder trocar de
// provider (S3/R2) no futuro sem levar o domínio de Builds junto. Nenhuma
// regra de negócio de Build/Artifact vive aqui — isso é responsabilidade do
// repository/Server Action em apps/web + packages/database.
export type ObjectRef = { bucket: string; path: string };

// Signed upload URL: usado hoje só para o caminho não-resumível (arquivos
// pequenos/fixtures de teste). O caminho principal de upload de artefatos
// reais é resumível via TUS (ver resumable.ts) — Supabase Storage não emite
// token assinado por objeto para uploads resumíveis, só para este caminho
// simples.
export async function createSignedUploadUrl(
  client: SupabaseClient,
  ref: ObjectRef,
): Promise<{ signedUrl: string; token: string; path: string }> {
  const { data, error } = await client.storage.from(ref.bucket).createSignedUploadUrl(ref.path);
  if (error) throw error;
  return data;
}

// Download: sempre por signed URL de curta duração — nunca bucket público,
// nunca service_role exposta ao browser (decisão do sprint). `expiresInSeconds`
// pequeno por padrão (60s) — a UI deve pedir uma URL nova a cada clique em
// "Download", não guardar uma URL de longa duração em memória/estado.
export async function createSignedDownloadUrl(
  client: SupabaseClient,
  ref: ObjectRef,
  expiresInSeconds = 60,
): Promise<string> {
  const { data, error } = await client.storage.from(ref.bucket).createSignedUrl(ref.path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

// Confirmação de que o objeto existe de verdade no bucket — nunca confiar
// só no evento de sucesso do client de upload (decisão do sprint: "nunca
// afirmar armazenado sem confirmar"). `list()` com prefixo do diretório pai
// e busca pelo nome exato do arquivo, porque a Storage API do Supabase não
// tem um "HEAD object" dedicado.
export async function objectExists(client: SupabaseClient, ref: ObjectRef): Promise<boolean> {
  const lastSlash = ref.path.lastIndexOf("/");
  const dir = lastSlash === -1 ? "" : ref.path.slice(0, lastSlash);
  const filename = lastSlash === -1 ? ref.path : ref.path.slice(lastSlash + 1);

  const { data, error } = await client.storage.from(ref.bucket).list(dir, { search: filename });
  if (error) throw error;
  return (data ?? []).some((entry) => entry.name === filename);
}

export async function getObjectMetadata(
  client: SupabaseClient,
  ref: ObjectRef,
): Promise<{ sizeBytes: number | null; mimeType: string | null } | null> {
  const lastSlash = ref.path.lastIndexOf("/");
  const dir = lastSlash === -1 ? "" : ref.path.slice(0, lastSlash);
  const filename = lastSlash === -1 ? ref.path : ref.path.slice(lastSlash + 1);

  const { data, error } = await client.storage.from(ref.bucket).list(dir, { search: filename });
  if (error) throw error;
  const entry = (data ?? []).find((item) => item.name === filename);
  if (!entry) return null;
  return {
    sizeBytes: (entry.metadata as { size?: number } | null)?.size ?? null,
    mimeType: (entry.metadata as { mimetype?: string } | null)?.mimetype ?? null,
  };
}

export async function removeObject(client: SupabaseClient, ref: ObjectRef): Promise<void> {
  const { error } = await client.storage.from(ref.bucket).remove([ref.path]);
  if (error) throw error;
}

// Download de conteúdo direto para o servidor (usado pela validação
// estrutural — precisa dos bytes reais para inspecionar ZIP/AAB/IPA, nunca
// confiando no metadata reportado pelo client). Server-side only: chama
// sempre com o admin client (service_role), nunca deve ser exposto a uma
// Server Action que recebe input não confiável de outro Studio.
export async function downloadObject(client: SupabaseClient, ref: ObjectRef): Promise<Blob> {
  const { data, error } = await client.storage.from(ref.bucket).download(ref.path);
  if (error) throw error;
  return data;
}
