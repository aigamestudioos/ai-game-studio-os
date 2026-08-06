import { sanitizeHttpError, sanitizeUnexpectedError as sharedSanitizeUnexpectedError } from "../core/errors";

// Sanitização de erros da App Store Connect API — específico da Apple só
// para o caso 401 (mensagem menciona os campos do formulário Apple) e o
// código `NOT_AUTHORIZED` (a Apple às vezes retorna 200 com esse código no
// corpo em vez de um 401 puro). O resto (403/404/429/5xx/fallback) vem do
// mapeamento genérico compartilhado (`core/errors.ts`, Sprint 2.10) — não
// duplicado aqui.
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
  return sanitizeHttpError(status);
}

export function sanitizeUnexpectedError(): string {
  return sharedSanitizeUnexpectedError("a Apple");
}
