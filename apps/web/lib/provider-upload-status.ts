import type { ProviderUploadStatus } from "@agsos/database";

// Textos da UI de envio a provider (Sprint 2.11b/2.11c) — nunca "Publicado"/
// "Enviado à loja com sucesso de produção": estes sprints só provam que o
// binário chegou a um rascunho do provider (Edit do Google / BuildUpload
// da Apple), nunca comitam/publicam/enviam para review.
export function providerUploadStatusLabel(status: ProviderUploadStatus, provider: "GOOGLE_PLAY" | "APPLE_APP_STORE"): string {
  const storeName = provider === "GOOGLE_PLAY" ? "Google Play" : "App Store";
  switch (status) {
    case "PENDING":
      return "Aguardando envio";
    case "UPLOADING":
      return provider === "GOOGLE_PLAY" ? "Enviando ao Google Play" : "Enviando/processando na App Store";
    case "SUCCEEDED":
      return provider === "GOOGLE_PLAY" ? "Recebido pelo Google Play (rascunho)" : "Enviado à App Store";
    case "FAILED":
      return `Falha no envio (${storeName})`;
  }
}

// Estado bruto da Apple (`apple_upload_state`) — exibido como detalhe
// complementar ao badge genérico acima, nunca substituindo-o.
export function appleUploadStateLabel(state: string | null): string | null {
  if (!state) return null;
  switch (state) {
    case "AWAITING_UPLOAD":
      return "Aguardando upload";
    case "PROCESSING":
      return "Processando";
    case "COMPLETE":
      return "Concluído";
    case "FAILED":
      return "Falhou";
    default:
      return state;
  }
}

const PROVIDER_UPLOAD_ERROR_LABEL: Record<string, string> = {
  UNAUTHORIZED: "Credenciais da Store Connection inválidas ou expiradas.",
  FORBIDDEN: "Credenciais válidas, mas sem permissão suficiente na loja.",
  NOT_FOUND: "Recurso não encontrado (package name/bundle identifier correto?).",
  RATE_LIMITED: "Limite de requisições atingido — tente novamente em alguns minutos.",
  SERVER_ERROR: "Loja indisponível no momento — tente novamente mais tarde.",
  ARTIFACT_TOO_LARGE: "Artefato acima do limite temporário de 150MB (suporte a arquivos maiores chega no Sprint 2.11d).",
  MISSING_CREDENTIAL: "Nenhuma credencial cadastrada para esta Store Connection.",
  INVALID_CREDENTIAL: "Credencial armazenada em formato inválido.",
  APPLE_PROCESSING_FAILED: "A Apple rejeitou o build durante o processamento pós-upload.",
  UNEXPECTED_ERROR: "Erro inesperado ao enviar o artefato.",
};

export function providerUploadErrorLabel(code: string | null): string | null {
  if (!code) return null;
  return PROVIDER_UPLOAD_ERROR_LABEL[code] ?? "Falha não identificada ao enviar o artefato.";
}
