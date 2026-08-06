import { sanitizeHttpError, sanitizeUnexpectedError as sharedSanitizeUnexpectedError } from "../core/errors";

// Sanitização de erros da Android Publisher API — específico do Google só
// para 401/403/404 (mensagens mencionam os campos do formulário Google). O
// resto (429/5xx/fallback) vem do mapeamento genérico compartilhado
// (`core/errors.ts`, Sprint 2.10).
export function sanitizeGoogleError(status: number | null): string {
  if (status === 401) {
    return "Credenciais inválidas ou expiradas — confira o JSON da Service Account.";
  }
  if (status === 403) {
    return "Credenciais válidas, mas sem permissão suficiente para este app no Google Play Console (Service Account associada ao app? Package Name correto?).";
  }
  if (status === 404) {
    return "App não encontrado no Google Play Console — confira o Package Name.";
  }
  return sanitizeHttpError(status);
}

export function sanitizeUnexpectedError(): string {
  return sharedSanitizeUnexpectedError("o Google Play");
}
