import { fetchJson } from "../core/http";
import { classifyHttpStatus, type ErrorCode } from "../core/errors";
import type { HealthResult, ItemResult, ListResult } from "../core/types";
import { createAppleJwt } from "./jwt";
import { sanitizeAppleError, sanitizeUnexpectedError } from "./errors";
import type { AppleApp, AppleBuildUploadState, AppleCredentials, AppleUploadOperation, ApplePlatform } from "./types";

const BASE_URL = "https://api.appstoreconnect.apple.com/v1";

// AGSOS-SPEC-008 §10 — "Upload: 120s" já congelado; usado no upload de
// cada uploadOperation individual (nunca no total do fluxo, que já é
// limitado por `maxDuration` na Server Action).
const UPLOAD_OPERATION_TIMEOUT_MS = 120_000;

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

// Sprint 2.11c — Build Uploads API. Contrato confirmado contra a
// documentação oficial atual (não por memória): POST /v1/buildUploads,
// corpo `BuildUploadCreateRequest` — `data.attributes.{cfBundleShortVersionString,
// cfBundleVersion,platform}` + `data.relationships.app`.
type AppleBuildUploadResponse = {
  data: { id: string; attributes?: { state?: AppleBuildUploadState } };
};

export async function createAppleBuildUpload(
  credentials: AppleCredentials,
  params: { appId: string; platform: ApplePlatform; cfBundleVersion: string; cfBundleShortVersionString: string },
): Promise<ItemResult<{ buildUploadId: string; state: AppleBuildUploadState }>> {
  try {
    const jwt = createAppleJwt(credentials);
    const { status, body } = await fetchJson(`${BASE_URL}/buildUploads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          type: "buildUploads",
          attributes: {
            cfBundleShortVersionString: params.cfBundleShortVersionString,
            cfBundleVersion: params.cfBundleVersion,
            platform: params.platform,
          },
          relationships: { app: { data: { type: "apps", id: params.appId } } },
        },
      }),
    });
    if (status < 200 || status >= 300) {
      const appleErrorCode = (body as AppleErrorResponse)?.errors?.[0]?.code;
      return { ok: false, error: sanitizeAppleError(status, appleErrorCode), code: classifyAppleError(status, appleErrorCode) };
    }
    const data = (body as AppleBuildUploadResponse).data;
    return { ok: true, item: { buildUploadId: data.id, state: data.attributes?.state ?? "AWAITING_UPLOAD" } };
  } catch {
    return { ok: false, error: sanitizeUnexpectedError(), code: "UNEXPECTED_ERROR" };
  }
}

// POST /v1/buildUploadFiles — corpo `BuildUploadFileCreateRequest`, campos
// confirmados: `assetType` (`ASSET` para o binário em si — `ASSET_DESCRIPTION`/
// `ASSET_SPI` são para outros arquivos, fora de escopo deste sprint),
// `fileName`, `fileSize`, `uti` (`com.apple.ipa` para IPA).
type AppleUploadOperationWire = {
  method?: string;
  url?: string;
  offset?: number;
  length?: number;
  requestHeaders?: { name?: string; value?: string }[];
  partNumber?: number;
};
type AppleBuildUploadFileResponse = {
  data: { id: string; attributes?: { uploadOperations?: AppleUploadOperationWire[] } };
};

export async function reserveAppleBuildUploadFile(
  credentials: AppleCredentials,
  params: { buildUploadId: string; fileName: string; fileSize: number; uti: string },
): Promise<ItemResult<{ buildUploadFileId: string; uploadOperations: AppleUploadOperation[] }>> {
  try {
    const jwt = createAppleJwt(credentials);
    const { status, body } = await fetchJson(`${BASE_URL}/buildUploadFiles`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          type: "buildUploadFiles",
          attributes: { assetType: "ASSET", fileName: params.fileName, fileSize: params.fileSize, uti: params.uti },
          relationships: { buildUpload: { data: { type: "buildUploads", id: params.buildUploadId } } },
        },
      }),
    });
    if (status < 200 || status >= 300) {
      const appleErrorCode = (body as AppleErrorResponse)?.errors?.[0]?.code;
      return { ok: false, error: sanitizeAppleError(status, appleErrorCode), code: classifyAppleError(status, appleErrorCode) };
    }
    const data = (body as AppleBuildUploadFileResponse).data;
    const uploadOperations: AppleUploadOperation[] = (data.attributes?.uploadOperations ?? []).map((op) => ({
      method: op.method ?? null,
      url: op.url ?? null,
      offset: op.offset ?? null,
      length: op.length ?? null,
      requestHeaders: (op.requestHeaders ?? null)?.map((h) => ({ name: h.name ?? "", value: h.value ?? "" })) ?? null,
      partNumber: op.partNumber ?? null,
    }));
    return { ok: true, item: { buildUploadFileId: data.id, uploadOperations } };
  } catch {
    return { ok: false, error: sanitizeUnexpectedError(), code: "UNEXPECTED_ERROR" };
  }
}

// Executa cada `uploadOperation` NA ORDEM recebida (nunca em paralelo,
// decisão do sprint) — corta `fileBuffer` por `offset`/`length` e envia
// EXATAMENTE o `method`/`url`/`requestHeaders` fornecidos pela Apple.
// Segurança crítica (instrução explícita do sprint): nunca anexa o JWT/
// Authorization da App Store Connect a essas URLs — elas podem apontar
// para um host de storage completamente diferente (presigned URL), e
// enviar credenciais da App Store Connect para outro host seria uma
// fuga de credencial real.
export async function uploadAppleBuildUploadFileOperations(
  operations: AppleUploadOperation[],
  fileBuffer: Buffer,
): Promise<ItemResult<void>> {
  for (const operation of operations) {
    if (!operation.method || !operation.url || operation.offset === null || operation.length === null) {
      return { ok: false, error: sanitizeUnexpectedError(), code: "UNEXPECTED_ERROR" };
    }
    const chunk = fileBuffer.subarray(operation.offset, operation.offset + operation.length);
    const headers: Record<string, string> = {};
    for (const h of operation.requestHeaders ?? []) {
      if (h.name) headers[h.name] = h.value;
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), UPLOAD_OPERATION_TIMEOUT_MS);
      let status: number;
      try {
        const res = await fetch(operation.url, { method: operation.method, headers, body: chunk, signal: controller.signal });
        status = res.status;
      } finally {
        clearTimeout(timeout);
      }
      if (status < 200 || status >= 300) {
        return { ok: false, error: sanitizeAppleError(status), code: classifyAppleError(status) };
      }
    } catch {
      return { ok: false, error: sanitizeUnexpectedError(), code: "UNEXPECTED_ERROR" };
    }
  }
  return { ok: true, item: undefined };
}

// PATCH /v1/buildUploadFiles/{id} — `BuildUploadFileUpdateRequest`, campo
// `uploaded: true` (confirmado como o único campo necessário para
// finalizar; `sourceFileChecksums` é opcional e não é enviado neste
// sprint — decisão deliberada de simplificação, registrada em DECISIONS.md).
export async function commitAppleBuildUploadFile(
  credentials: AppleCredentials,
  buildUploadFileId: string,
): Promise<ItemResult<void>> {
  try {
    const jwt = createAppleJwt(credentials);
    const { status, body } = await fetchJson(`${BASE_URL}/buildUploadFiles/${encodeURIComponent(buildUploadFileId)}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        data: { type: "buildUploadFiles", id: buildUploadFileId, attributes: { uploaded: true } },
      }),
    });
    if (status < 200 || status >= 300) {
      const appleErrorCode = (body as AppleErrorResponse)?.errors?.[0]?.code;
      return { ok: false, error: sanitizeAppleError(status, appleErrorCode), code: classifyAppleError(status, appleErrorCode) };
    }
    return { ok: true, item: undefined };
  } catch {
    return { ok: false, error: sanitizeUnexpectedError(), code: "UNEXPECTED_ERROR" };
  }
}

// GET /v1/buildUploads/{id} — usado para polling limitado (nunca
// infinito) do processamento pós-commit.
export async function getAppleBuildUpload(
  credentials: AppleCredentials,
  buildUploadId: string,
): Promise<ItemResult<{ state: AppleBuildUploadState }>> {
  try {
    const { status, body } = await appleFetch(`/buildUploads/${encodeURIComponent(buildUploadId)}`, credentials);
    if (status < 200 || status >= 300) {
      const appleErrorCode = (body as AppleErrorResponse)?.errors?.[0]?.code;
      return { ok: false, error: sanitizeAppleError(status, appleErrorCode), code: classifyAppleError(status, appleErrorCode) };
    }
    const data = (body as AppleBuildUploadResponse).data;
    return { ok: true, item: { state: data.attributes?.state ?? "PROCESSING" } };
  } catch {
    return { ok: false, error: sanitizeUnexpectedError(), code: "UNEXPECTED_ERROR" };
  }
}

// DELETE /v1/buildUploads/{id} — best-effort (mesmo padrão do
// `deleteGoogleEdit`, Sprint 2.11b): nunca deixar um BuildUpload
// incompleto/órfão pendurado quando o fluxo falha antes do commit.
export async function deleteAppleBuildUpload(credentials: AppleCredentials, buildUploadId: string): Promise<void> {
  try {
    const jwt = createAppleJwt(credentials);
    await fetchJson(`${BASE_URL}/buildUploads/${encodeURIComponent(buildUploadId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${jwt}` },
    });
  } catch {
    // best-effort — nunca lançar.
  }
}
