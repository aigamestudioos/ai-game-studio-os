// Sanitização de erro compartilhada (Sprint 2.10 — extraída de
// `apple/errors.ts`, Sprint 2.9). Nunca deixar um segredo (JWT, private
// key, access token, service account) vazar para `last_error`/logs — só
// mapeia por status HTTP, nunca ecoa corpo bruto da resposta do provider.
// Cada provider pode sobrepor mensagens específicas chamando esta função
// como fallback para os status genéricos (401/403/404/429/5xx), e tratando
// separadamente qualquer código de erro específico do seu provider antes.
export function sanitizeHttpError(status: number | null): string {
  if (status === 401) {
    return "Credenciais inválidas ou expiradas.";
  }
  if (status === 403) {
    return "Credenciais válidas, mas sem permissão suficiente para esta operação.";
  }
  if (status === 404) {
    return "Recurso não encontrado.";
  }
  if (status === 429) {
    return "Limite de requisições atingido — tente novamente em alguns minutos.";
  }
  if (status !== null && status >= 500) {
    return "Serviço externo indisponível no momento — tente novamente mais tarde.";
  }
  return "Não foi possível validar a conexão.";
}

// Código estável (Sprint 2.10.1 — Integration Health) para instrumentação
// de métricas (`errorCode` em `StoreConnectionCallCompleted`) — nunca a
// mensagem sanitizada em si (que pode mudar de texto sem aviso) nem o
// status HTTP cru (não é estável entre providers: a Apple pode retornar
// 200 com um código de erro no corpo). Só os buckets abaixo, sempre os
// mesmos independente do provider.
export type ErrorCode = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "RATE_LIMITED" | "SERVER_ERROR" | "UNEXPECTED_ERROR" | "UNKNOWN";

export function classifyHttpStatus(status: number | null): ErrorCode {
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 429) return "RATE_LIMITED";
  if (status !== null && status >= 500) return "SERVER_ERROR";
  return "UNKNOWN";
}

// Nunca deixar exceções vazarem uma credencial via stack trace/message
// (ex.: erro de parsing de chave/JSON inválido costuma ecoar parte do
// input). Chamado sempre que uma exceção NÃO vinda de uma resposta HTTP
// (rede, parsing de credencial) precisa virar mensagem amigável.
export function sanitizeUnexpectedError(providerHint: string): string {
  return `Erro inesperado ao conectar com ${providerHint}. Confira o formato da credencial e tente novamente.`;
}
