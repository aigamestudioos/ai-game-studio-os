// Upload resumível (TUS) — decisão aprovada do sprint: arquivos grandes
// (AAB/IPA reais) usam o protocolo TUS nativo do Supabase Storage, não um
// upload simples. O cliente TUS de fato (`tus-js-client`) roda no browser —
// este módulo só monta a configuração (endpoint + headers + metadata) que o
// browser precisa para abrir a sessão TUS; nenhum binário passa por aqui
// nem por nenhuma Server Action/Route Handler (decisão do sprint: binário
// nunca atravessa o runtime da Vercel).
//
// Autenticação: diferente do upload simples (que usa um token assinado por
// objeto via `createSignedUploadUrl`), o endpoint TUS do Supabase não emite
// token assinado por objeto para uploads resumíveis — a autorização real é
// a policy de RLS `build_artifacts_object_insert` em `storage.objects`
// (supabase/migrations/20260810000001_build_artifacts.sql), avaliada contra
// a sessão do próprio usuário autenticado. Por isso os headers usam a
// `anon key` pública + o access token da sessão do usuário — nunca a
// service_role key (que nunca deve chegar ao browser).
export type ResumableUploadConfig = {
  endpoint: string;
  headers: Record<string, string>;
  metadata: { bucketName: string; objectName: string; contentType?: string };
};

export function buildResumableUploadConfig(params: {
  supabaseUrl: string;
  anonKey: string;
  accessToken: string;
  bucket: string;
  path: string;
  contentType?: string;
}): ResumableUploadConfig {
  const { supabaseUrl, anonKey, accessToken, bucket, path, contentType } = params;
  return {
    endpoint: `${supabaseUrl.replace(/\/$/, "")}/storage/v1/upload/resumable`,
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${accessToken}`,
      "x-upsert": "false",
    },
    metadata: { bucketName: bucket, objectName: path, contentType },
  };
}
