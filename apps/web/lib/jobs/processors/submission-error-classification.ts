// Sprint 2.16a (GATE 17) — extraído de `submission-google-play.ts` para
// ficar testável sem puxar `env.ts` (que lança se as variáveis de ambiente
// do Supabase não estiverem setadas — inofensivo em runtime real, mas
// exige um `.env` só para testar uma função pura de mapeamento de erro).
export function classifyGoogleCommitError(code: string | undefined): "AUTH" | "NON_RETRYABLE" | "RATE_LIMIT" | "RETRYABLE" | "INTERNAL" {
  switch (code) {
    case "UNAUTHORIZED":
      return "AUTH";
    case "FORBIDDEN":
    case "NOT_FOUND":
    case "PROVIDER_REJECTED":
      return "NON_RETRYABLE";
    case "RATE_LIMITED":
      return "RATE_LIMIT";
    case "SERVER_ERROR":
      return "RETRYABLE";
    default:
      return "INTERNAL";
  }
}
