import type { ProviderUploadStatus } from "@agsos/database";

// Textos da UI de envio a provider (Sprint 2.11b) — nunca "Publicado"/
// "Enviado à loja com sucesso de produção": este sprint só prova que o
// bundle chegou a um Google Play Edit rascunho, nunca comita/publica.
export function providerUploadStatusLabel(status: ProviderUploadStatus): string {
  switch (status) {
    case "PENDING":
      return "Aguardando envio";
    case "UPLOADING":
      return "Enviando ao Google Play";
    case "SUCCEEDED":
      return "Recebido pelo Google Play (rascunho)";
    case "FAILED":
      return "Falha no envio";
  }
}

const PROVIDER_UPLOAD_ERROR_LABEL: Record<string, string> = {
  UNAUTHORIZED: "Credenciais da Store Connection inválidas ou expiradas.",
  FORBIDDEN: "Credenciais válidas, mas sem permissão suficiente no Google Play.",
  NOT_FOUND: "Package name não encontrado no Google Play Console para esta credencial.",
  RATE_LIMITED: "Limite de requisições do Google atingido — tente novamente em alguns minutos.",
  SERVER_ERROR: "Google Play indisponível no momento — tente novamente mais tarde.",
  MISSING_CREDENTIAL: "Nenhuma credencial cadastrada para esta Store Connection.",
  INVALID_CREDENTIAL: "Credencial armazenada em formato inválido.",
  UNEXPECTED_ERROR: "Erro inesperado ao enviar o artefato ao Google Play.",
};

export function providerUploadErrorLabel(code: string | null): string | null {
  if (!code) return null;
  return PROVIDER_UPLOAD_ERROR_LABEL[code] ?? "Falha não identificada ao enviar ao Google Play.";
}
