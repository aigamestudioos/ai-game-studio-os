// Limite TEMPORÁRIO compartilhado por todo envio de artifact a um provider
// externo (Google Play, Sprint 2.11b; Apple, Sprint 2.11c) — medido, não
// assumido: `downloadObject()` + `Buffer.from(await blob.arrayBuffer())`
// custam ~2.5-2.8x o tamanho do arquivo em RSS (medido localmente no
// Sprint 2.11b: 200MiB de arquivo → +550MiB de RSS). Sem saber a memória
// real configurada na função Vercel de produção, 150MiB é o teto que
// mantém margem segura. Resolver isso de verdade (streaming real) é
// trabalho do Sprint 2.11d — nunca aumentar este valor sem remedir.
export const MAX_PROVIDER_UPLOAD_SIZE_BYTES = 150 * 1024 * 1024;
