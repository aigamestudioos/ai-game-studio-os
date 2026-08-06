import { createAppleJwt } from "./jwt";
import { sanitizeAppleError, sanitizeUnexpectedError } from "./errors";
import type { AppleApp, AppleCredentials } from "./types";

const BASE_URL = "https://api.appstoreconnect.apple.com/v1";
// AGSOS-SPEC-008 §10 — timeout de leitura para chamadas de integração.
const READ_TIMEOUT_MS = 10_000;

type AppleAppsResponse = {
  data: { id: string; attributes: { name: string; bundleId: string; sku: string } }[];
};

type AppleErrorResponse = { errors?: { code?: string; title?: string }[] };

async function appleFetch(path: string, credentials: AppleCredentials): Promise<{ status: number; body: unknown }> {
  const jwt = createAppleJwt(credentials);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), READ_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${jwt}` },
      signal: controller.signal,
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  } finally {
    clearTimeout(timeout);
  }
}

// GET /v1/apps?limit=1 — chamada mínima só para confirmar que as
// credenciais autenticam de verdade, sem trazer a lista inteira.
export async function checkAppleHealth(credentials: AppleCredentials): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { status, body } = await appleFetch("/apps?limit=1", credentials);
    if (status >= 200 && status < 300) return { ok: true };
    const code = (body as AppleErrorResponse)?.errors?.[0]?.code;
    return { ok: false, error: sanitizeAppleError(status, code) };
  } catch {
    return { ok: false, error: sanitizeUnexpectedError() };
  }
}

export async function fetchAppleApps(credentials: AppleCredentials): Promise<{ ok: true; apps: AppleApp[] } | { ok: false; error: string }> {
  try {
    const { status, body } = await appleFetch("/apps?limit=200", credentials);
    if (status < 200 || status >= 300) {
      const code = (body as AppleErrorResponse)?.errors?.[0]?.code;
      return { ok: false, error: sanitizeAppleError(status, code) };
    }
    const apps = (body as AppleAppsResponse).data.map((row) => ({
      id: row.id,
      name: row.attributes.name,
      bundleId: row.attributes.bundleId,
      sku: row.attributes.sku,
    }));
    return { ok: true, apps };
  } catch {
    return { ok: false, error: sanitizeUnexpectedError() };
  }
}

export async function fetchAppleApp(appId: string, credentials: AppleCredentials): Promise<{ ok: true; app: AppleApp } | { ok: false; error: string }> {
  try {
    const { status, body } = await appleFetch(`/apps/${encodeURIComponent(appId)}`, credentials);
    if (status < 200 || status >= 300) {
      const code = (body as AppleErrorResponse)?.errors?.[0]?.code;
      return { ok: false, error: sanitizeAppleError(status, code) };
    }
    const row = (body as { data: AppleAppsResponse["data"][number] }).data;
    return { ok: true, app: { id: row.id, name: row.attributes.name, bundleId: row.attributes.bundleId, sku: row.attributes.sku } };
  } catch {
    return { ok: false, error: sanitizeUnexpectedError() };
  }
}
