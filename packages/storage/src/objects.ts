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
//
// Débito conhecido, registrado desde o Sprint 2.11a/b/c: baixa o objeto
// inteiro em memória — só usado hoje pela validação estrutural (2.11a),
// nunca mais pelo fluxo de envio a provider (Sprint 2.11d usa
// `downloadObjectRange` abaixo para isso).
export async function downloadObject(client: SupabaseClient, ref: ObjectRef): Promise<Blob> {
  const { data, error } = await client.storage.from(ref.bucket).download(ref.path);
  if (error) throw error;
  return data;
}

// Sprint 2.11d — leitura incremental por Range (`Range: bytes=start-end`).
// Confirmado empiricamente (não assumido — há relatos históricos de
// suporte inconsistente a Range no Storage API do Supabase) que a versão
// atual responde `206 Partial Content` com `Content-Range` corretos.
// `supabase-js` não expõe Range em `.download()` — por isso esta função
// usa `fetch` direto contra o endpoint REST de objeto, com a
// `service_role key` (nunca deve ser chamada com uma chave de sessão de
// usuário; o caller é sempre o worker, nunca uma Server Action exposta ao
// browser). `end` é o offset final INCLUSIVE (semântica HTTP Range), não
// length — quem chama calcula `start + length - 1`.
export async function downloadObjectRange(
  params: { supabaseUrl: string; serviceRoleKey: string; bucket: string; path: string; start: number; end: number },
): Promise<Buffer> {
  const url = `${params.supabaseUrl.replace(/\/$/, "")}/storage/v1/object/${encodeURIComponent(params.bucket)}/${params.path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
  const res = await fetch(url, {
    headers: {
      apikey: params.serviceRoleKey,
      Authorization: `Bearer ${params.serviceRoleKey}`,
      Range: `bytes=${params.start}-${params.end}`,
    },
  });
  if (res.status !== 206 && res.status !== 200) {
    throw new Error(`downloadObjectRange: HTTP ${res.status} inesperado`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Metadados mínimos (só `content-length` via HEAD-like GET de 1 byte) —
// usado pelo worker para saber o tamanho total antes de fatiar em chunks,
// sem precisar de `getObjectMetadata()` (que depende de `list()`, uma
// chamada diferente e não garantidamente consistente com o Content-Length
// real do objeto).
export async function getObjectSizeViaRange(params: { supabaseUrl: string; serviceRoleKey: string; bucket: string; path: string }): Promise<number> {
  const url = `${params.supabaseUrl.replace(/\/$/, "")}/storage/v1/object/${encodeURIComponent(params.bucket)}/${params.path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
  const res = await fetch(url, {
    headers: { apikey: params.serviceRoleKey, Authorization: `Bearer ${params.serviceRoleKey}`, Range: "bytes=0-0" },
  });
  const contentRange = res.headers.get("content-range");
  if (!contentRange) throw new Error("getObjectSizeViaRange: content-range ausente na resposta");
  const total = contentRange.split("/")[1];
  if (!total) throw new Error("getObjectSizeViaRange: não foi possível extrair o tamanho total");
  return Number(total);
}
