// Sanitização de erros da App Store Connect API — nunca deixar um JWT, a
// private key ou qualquer header de autenticação vazar para `last_error`
// (que é uma coluna legível por qualquer membro do Studio com acesso à
// Store Connection) nem para logs. Mapeia por status HTTP / código
// conhecido da Apple, nunca ecoa `error.message`/corpo bruto da resposta.

export function sanitizeAppleError(status: number | null, appleErrorCode?: string): string {
  if (status === 401 || appleErrorCode === "NOT_AUTHORIZED") {
    return "Credenciais inválidas ou expiradas — confira Issuer ID, Key ID e a Private Key (.p8).";
  }
  if (status === 403) {
    return "Credenciais válidas, mas sem permissão suficiente para listar Apps no App Store Connect.";
  }
  if (status === 404) {
    return "Recurso não encontrado no App Store Connect (Team ID correto?).";
  }
  if (status === 429) {
    return "Limite de requisições da App Store Connect API atingido — tente novamente em alguns minutos.";
  }
  if (status !== null && status >= 500) {
    return "App Store Connect indisponível no momento — tente novamente mais tarde.";
  }
  return "Não foi possível validar a conexão com a Apple.";
}

// Nunca deixar exceções vazarem a private key/JWT via stack trace/message
// (ex.: erro de parsing de chave PEM inválida costuma ecoar parte do
// input). Chamado sempre que uma exceção NÃO vinda de uma resposta HTTP
// (rede, parsing de chave) precisa virar mensagem amigável.
export function sanitizeUnexpectedError(): string {
  return "Erro inesperado ao conectar com a Apple. Confira o formato da Private Key (.p8) e tente novamente.";
}
