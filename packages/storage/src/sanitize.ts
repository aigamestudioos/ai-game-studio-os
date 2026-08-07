// Sanitização de path/filename (AGSOS-SPEC-008 §6 — abstração de buckets,
// upload, download; nenhuma feature deve montar um `storage_path` sozinha).
// Espelha exatamente a lógica de `create_pending_build_artifact()`
// (supabase/migrations/20260810000001_build_artifacts.sql) — o path real e
// autoritativo é sempre gerado pelo banco (dentro da mesma transação que
// cria a linha `PENDING`); esta função existe para o client conseguir
// prever o path antes de chamar a RPC (ex.: pré-visualizar o nome do
// objeto) e para os testes de sanitização não dependerem de round-trip ao
// banco. Nunca aceitar `storage_path` vindo do browser como fonte de
// verdade — sempre usar o valor devolvido pela RPC.
export function sanitizeFilename(filename: string): string {
  const sanitized = filename.replace(/[^A-Za-z0-9._-]/g, "_");
  return sanitized === "" ? "artifact" : sanitized;
}

export function buildArtifactStoragePath(params: { studioId: string; buildId: string; artifactId: string; filename: string }): string {
  const { studioId, buildId, artifactId, filename } = params;
  return `${studioId}/${buildId}/${artifactId}/${sanitizeFilename(filename)}`;
}
