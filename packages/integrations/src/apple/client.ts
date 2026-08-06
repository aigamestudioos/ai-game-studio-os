import { fetchJson } from "../core/http";
import { classifyHttpStatus, type ErrorCode } from "../core/errors";
import type { HealthResult, ItemResult, ListResult } from "../core/types";
import { createAppleJwt } from "./jwt";
import { sanitizeAppleError, sanitizeUnexpectedError } from "./errors";
import type { AppleApp, AppleCredentials } from "./types";

const BASE_URL = "https://api.appstoreconnect.apple.com/v1";

type AppleAppsResponse = {
  data: { id: string; attributes: { name: string; bundleId: string; sku: string } }[];
};

type AppleErrorResponse = { errors?: { code?: string; title?: string }[] };

async function appleFetch(path: string, credentials: AppleCredentials) {
  const jwt = createAppleJwt(credentials);
  return fetchJson(`${BASE_URL}${path}`, { headers: { Authorization: `Bearer ${jwt}` } });
}

// `code` (Sprint 2.10.1) — classificação estável para métricas de
// Integration Health; a Apple às vezes retorna 200 com `NOT_AUTHORIZED` no
// corpo, então esse caso é mapeado para `UNAUTHORIZED` explicitamente, não
// só o status HTTP puro.
function classifyAppleError(status: number, appleErrorCode?: string): ErrorCode {
  if (appleErrorCode === "NOT_AUTHORIZED") return "UNAUTHORIZED";
  return classifyHttpStatus(status);
}

// GET /v1/apps?limit=1 — chamada mínima só para confirmar que as
// credenciais autenticam de verdade, sem trazer a lista inteira.
export async function checkAppleHealth(credentials: AppleCredentials): Promise<HealthResult> {
  try {
    const { status, body } = await appleFetch("/apps?limit=1", credentials);
    if (status >= 200 && status < 300) return { ok: true };
    const appleErrorCode = (body as AppleErrorResponse)?.errors?.[0]?.code;
    return { ok: false, error: sanitizeAppleError(status, appleErrorCode), code: classifyAppleError(status, appleErrorCode) };
  } catch {
    return { ok: false, error: sanitizeUnexpectedError(), code: "UNEXPECTED_ERROR" };
  }
}

export async function fetchAppleApps(credentials: AppleCredentials): Promise<ListResult<AppleApp>> {
  try {
    const { status, body } = await appleFetch("/apps?limit=200", credentials);
    if (status < 200 || status >= 300) {
      const appleErrorCode = (body as AppleErrorResponse)?.errors?.[0]?.code;
      return { ok: false, error: sanitizeAppleError(status, appleErrorCode), code: classifyAppleError(status, appleErrorCode) };
    }
    const items = (body as AppleAppsResponse).data.map((row) => ({
      id: row.id,
      name: row.attributes.name,
      bundleId: row.attributes.bundleId,
      sku: row.attributes.sku,
    }));
    return { ok: true, items };
  } catch {
    return { ok: false, error: sanitizeUnexpectedError(), code: "UNEXPECTED_ERROR" };
  }
}

export async function fetchAppleApp(appId: string, credentials: AppleCredentials): Promise<ItemResult<AppleApp>> {
  try {
    const { status, body } = await appleFetch(`/apps/${encodeURIComponent(appId)}`, credentials);
    if (status < 200 || status >= 300) {
      const appleErrorCode = (body as AppleErrorResponse)?.errors?.[0]?.code;
      return { ok: false, error: sanitizeAppleError(status, appleErrorCode), code: classifyAppleError(status, appleErrorCode) };
    }
    const row = (body as { data: AppleAppsResponse["data"][number] }).data;
    return { ok: true, item: { id: row.id, name: row.attributes.name, bundleId: row.attributes.bundleId, sku: row.attributes.sku } };
  } catch {
    return { ok: false, error: sanitizeUnexpectedError(), code: "UNEXPECTED_ERROR" };
  }
}
