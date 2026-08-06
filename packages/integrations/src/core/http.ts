// AGSOS-SPEC-008 §10 — timeout padrão de leitura para chamadas de
// integração. Compartilhado entre todos os providers.
export const DEFAULT_READ_TIMEOUT_MS = 10_000;

export type FetchJsonResult = { status: number; body: unknown };

// Wrapper único de fetch+timeout usado por todo client de provider — antes
// (Sprint 2.9) cada provider reimplementava seu próprio AbortController;
// extraído aqui para não duplicar por provider (Sprint 2.10).
export async function fetchJson(
  url: string,
  init: RequestInit,
  timeoutMs: number = DEFAULT_READ_TIMEOUT_MS,
): Promise<FetchJsonResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  } finally {
    clearTimeout(timeout);
  }
}
