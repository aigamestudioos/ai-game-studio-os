import { fetchJson } from "../core/http";
import { classifyHttpStatus } from "../core/errors";
import type { HealthResult, ItemResult, ListResult } from "../core/types";
import { getGoogleAccessToken, parseServiceAccount } from "./oauth";
import { sanitizeGoogleError, sanitizeUnexpectedError } from "./errors";
import type { GoogleApp, GoogleBundle, GoogleCredentials } from "./types";

const BASE_URL = "https://androidpublisher.googleapis.com/androidpublisher/v3";
// Upload de mídia usa um host/path diferente do resto da API (convenção
// do Google para todo `uploadType=media`, não específico deste recurso).
const UPLOAD_BASE_URL = "https://androidpublisher.googleapis.com/upload/androidpublisher/v3";

// AGSOS-SPEC-008 §10 — "Upload: 120s" já congelado; nunca reduzido aqui
// porque um AAB real pode legitimamente demorar mais que o timeout padrão
// de leitura (10s) usado pelo resto deste adapter (health/listApps).
const BUNDLE_UPLOAD_TIMEOUT_MS = 120_000;

// A Android Publisher API não tem endpoint de "listar apps" nem de "ler
// nome do app" isolado do fluxo de publicação. A forma real de confirmar
// acesso a um `packageName` específico é abrir um edit rascunho e
// descartá-lo em seguida — é exatamente o que "Validate Connection" faz
// aqui, sem deixar nenhum edit pendente no Play Console.
async function createDraftEdit(packageName: string, accessToken: string) {
  return fetchJson(`${BASE_URL}/applications/${encodeURIComponent(packageName)}/edits`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

async function deleteEdit(packageName: string, editId: string, accessToken: string) {
  return fetchJson(`${BASE_URL}/applications/${encodeURIComponent(packageName)}/edits/${encodeURIComponent(editId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function checkGoogleHealth(credentials: GoogleCredentials): Promise<HealthResult> {
  const serviceAccount = parseServiceAccount(credentials.serviceAccountJson);
  if (!serviceAccount) {
    return { ok: false, error: "JSON da Service Account inválido ou incompleto (client_email/private_key).", code: "UNEXPECTED_ERROR" };
  }

  const tokenResult = await getGoogleAccessToken(serviceAccount);
  if (!tokenResult.ok) return { ok: false, error: tokenResult.error, code: tokenResult.code };

  try {
    const created = await createDraftEdit(credentials.packageName, tokenResult.accessToken);
    if (created.status < 200 || created.status >= 300) {
      return { ok: false, error: sanitizeGoogleError(created.status), code: classifyHttpStatus(created.status) };
    }
    const editId = (created.body as { id?: string } | null)?.id;
    if (editId) {
      // best-effort: não deixar o edit rascunho pendurado, mas não falhar
      // a validação por causa de um erro no cleanup.
      await deleteEdit(credentials.packageName, editId, tokenResult.accessToken).catch(() => undefined);
    }
    return { ok: true };
  } catch {
    return { ok: false, error: sanitizeUnexpectedError(), code: "UNEXPECTED_ERROR" };
  }
}

// Não existe endpoint para descobrir o nome de exibição do app a partir da
// Android Publisher API — só o `packageName` já configurado é conhecido
// com certeza. Retorna esse único item, nunca uma lista descoberta de
// verdade (ver nota em `types.ts`).
export async function fetchGoogleApps(credentials: GoogleCredentials): Promise<ListResult<GoogleApp>> {
  const health = await checkGoogleHealth(credentials);
  if (!health.ok) return { ok: false, error: health.error, code: health.code };
  const app: GoogleApp = { id: credentials.packageName, name: credentials.packageName, packageName: credentials.packageName };
  return { ok: true, items: [app] };
}

// Sprint 2.11b — Google Play AAB Upload. Diferente de `checkGoogleHealth`
// (que cria e já apaga o edit na mesma chamada, só para provar acesso),
// este edit fica aberto de propósito para o caller fazer o upload em
// seguida — quem chama é responsável por chamar `deleteGoogleEdit`
// depois (sucesso ou falha), nunca deixando o edit pendurado
// (DECISIONS.md).
export async function createGoogleEdit(credentials: GoogleCredentials): Promise<ItemResult<{ editId: string }>> {
  const serviceAccount = parseServiceAccount(credentials.serviceAccountJson);
  if (!serviceAccount) {
    return { ok: false, error: "JSON da Service Account inválido ou incompleto (client_email/private_key).", code: "UNEXPECTED_ERROR" };
  }
  const tokenResult = await getGoogleAccessToken(serviceAccount);
  if (!tokenResult.ok) return { ok: false, error: tokenResult.error, code: tokenResult.code };

  try {
    const created = await createDraftEdit(credentials.packageName, tokenResult.accessToken);
    if (created.status < 200 || created.status >= 300) {
      return { ok: false, error: sanitizeGoogleError(created.status), code: classifyHttpStatus(created.status) };
    }
    const editId = (created.body as { id?: string } | null)?.id;
    if (!editId) return { ok: false, error: sanitizeUnexpectedError(), code: "UNEXPECTED_ERROR" };
    return { ok: true, item: { editId } };
  } catch {
    return { ok: false, error: sanitizeUnexpectedError(), code: "UNEXPECTED_ERROR" };
  }
}

// Upload SIMPLES (uploadType=media, não resumível) — decisão do sprint
// (DECISIONS.md): resumível de verdade exigiria rastrear estado de sessão
// TUS entre múltiplos requests, um formato de problema de fila/job, fora
// de escopo sem worker/queue. `fetchJson` já aceita `Buffer` como body
// (RequestInit.body do fetch nativo do Node aceita Buffer diretamente) —
// não foi preciso criar nenhuma abstração de upload binário nova, só
// aumentar o timeout para o valor já congelado em AGSOS-SPEC-008 §10
// ("Upload: 120s").
export async function uploadGoogleBundle(
  credentials: GoogleCredentials,
  editId: string,
  bundle: Buffer,
): Promise<ItemResult<GoogleBundle>> {
  const serviceAccount = parseServiceAccount(credentials.serviceAccountJson);
  if (!serviceAccount) {
    return { ok: false, error: "JSON da Service Account inválido ou incompleto (client_email/private_key).", code: "UNEXPECTED_ERROR" };
  }
  const tokenResult = await getGoogleAccessToken(serviceAccount);
  if (!tokenResult.ok) return { ok: false, error: tokenResult.error, code: tokenResult.code };

  const url = `${UPLOAD_BASE_URL}/applications/${encodeURIComponent(credentials.packageName)}/edits/${encodeURIComponent(editId)}/bundles?uploadType=media`;
  try {
    const { status, body } = await fetchJson(
      url,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenResult.accessToken}`,
          "Content-Type": "application/octet-stream",
        },
        body: bundle,
      },
      BUNDLE_UPLOAD_TIMEOUT_MS,
    );
    if (status < 200 || status >= 300) {
      return { ok: false, error: sanitizeGoogleError(status), code: classifyHttpStatus(status) };
    }
    const versionCode = (body as { versionCode?: number | string } | null)?.versionCode;
    if (versionCode === undefined || versionCode === null) {
      return { ok: false, error: sanitizeUnexpectedError(), code: "UNEXPECTED_ERROR" };
    }
    return { ok: true, item: { versionCode: Number(versionCode) } };
  } catch {
    return { ok: false, error: sanitizeUnexpectedError(), code: "UNEXPECTED_ERROR" };
  }
}

// Sempre best-effort (DECISIONS.md: nunca deixar um edit pendurado, mas
// falha no cleanup nunca deveria mascarar o resultado real do upload que
// já aconteceu) — por isso não retorna erro, só tenta.
export async function deleteGoogleEdit(credentials: GoogleCredentials, editId: string): Promise<void> {
  const serviceAccount = parseServiceAccount(credentials.serviceAccountJson);
  if (!serviceAccount) return;
  const tokenResult = await getGoogleAccessToken(serviceAccount);
  if (!tokenResult.ok) return;
  await deleteEdit(credentials.packageName, editId, tokenResult.accessToken).catch(() => undefined);
}

// Sprint 2.11d — upload resumível real (`uploadType=resumable`),
// substituindo o upload simples síncrono do Sprint 2.11b. Contrato
// confirmado contra a documentação oficial da Android Publisher API
// (developers.google.com/android-publisher/upload, "Resumable Media
// Upload"): iniciar a sessão com `X-Upload-Content-Type`/
// `X-Upload-Content-Length`, capturar a `Location` da resposta como a
// URI da sessão. **A URI da sessão funciona como bearer capability** —
// quem a possui pode continuar o upload sem token OAuth novo. Por isso
// esta função só a RETORNA (nunca a loga, nunca a inclui em erro) — quem
// chama é responsável por armazená-la como segredo (Vault), nunca
// plaintext em `provider_uploads`/`integration_jobs`.
export async function createGoogleResumableSession(
  credentials: GoogleCredentials,
  editId: string,
  totalBytes: number,
  mimeType: string,
): Promise<ItemResult<{ sessionUri: string }>> {
  const serviceAccount = parseServiceAccount(credentials.serviceAccountJson);
  if (!serviceAccount) {
    return { ok: false, error: "JSON da Service Account inválido ou incompleto (client_email/private_key).", code: "UNEXPECTED_ERROR" };
  }
  const tokenResult = await getGoogleAccessToken(serviceAccount);
  if (!tokenResult.ok) return { ok: false, error: tokenResult.error, code: tokenResult.code };

  const url = `${UPLOAD_BASE_URL}/applications/${encodeURIComponent(credentials.packageName)}/edits/${encodeURIComponent(editId)}/bundles?uploadType=resumable`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), BUNDLE_UPLOAD_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenResult.accessToken}`,
          "X-Upload-Content-Type": mimeType,
          "X-Upload-Content-Length": String(totalBytes),
          "Content-Length": "0",
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    if (res.status < 200 || res.status >= 300) {
      return { ok: false, error: sanitizeGoogleError(res.status), code: classifyHttpStatus(res.status) };
    }
    const sessionUri = res.headers.get("location");
    if (!sessionUri) return { ok: false, error: sanitizeUnexpectedError(), code: "UNEXPECTED_ERROR" };
    return { ok: true, item: { sessionUri } };
  } catch {
    return { ok: false, error: sanitizeUnexpectedError(), code: "UNEXPECTED_ERROR" };
  }
}

// Envia um chunk (múltiplo de 256KB, exceto o último — confirmado contra a
// documentação oficial) via `PUT` na `sessionUri`. `status: "complete"` só
// quando a Google retorna 200/201 (upload concluído, corpo tem o
// `Bundle`); `status: "incomplete"` em `308 Resume Incomplete` (chunk
// aceito, continuar); qualquer outro status é erro. Nunca envia
// `Authorization` — a `sessionUri` já é a credencial da sessão (mesma
// razão pela qual as `uploadOperations` da Apple nunca recebem o JWT da
// App Store Connect).
export async function uploadGoogleResumableChunk(
  sessionUri: string,
  chunk: Buffer,
  startByte: number,
  totalBytes: number,
): Promise<ItemResult<{ status: "complete"; versionCode: number } | { status: "incomplete"; bytesReceived: number }>> {
  const endByte = startByte + chunk.length - 1;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), BUNDLE_UPLOAD_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(sessionUri, {
        method: "PUT",
        headers: {
          "Content-Length": String(chunk.length),
          "Content-Range": `bytes ${startByte}-${endByte}/${totalBytes}`,
        },
        body: chunk,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    if (res.status === 308) {
      const range = res.headers.get("range"); // "bytes=0-N"
      const bytesReceived = range ? Number(range.split("-")[1]) + 1 : endByte + 1;
      return { ok: true, item: { status: "incomplete", bytesReceived } };
    }
    if (res.status >= 200 && res.status < 300) {
      const body = (await res.json().catch(() => null)) as { versionCode?: number | string } | null;
      const versionCode = body?.versionCode;
      if (versionCode === undefined || versionCode === null) {
        return { ok: false, error: sanitizeUnexpectedError(), code: "UNEXPECTED_ERROR" };
      }
      return { ok: true, item: { status: "complete", versionCode: Number(versionCode) } };
    }
    return { ok: false, error: sanitizeGoogleError(res.status), code: classifyHttpStatus(res.status) };
  } catch {
    return { ok: false, error: sanitizeUnexpectedError(), code: "UNEXPECTED_ERROR" };
  }
}

// Consulta quantos bytes o Google já recebeu (reconciliação — GATE 5,
// caso "enviei o bundle, perdi a resposta"): `PUT` vazio com
// `Content-Range: bytes */total`, confirmado pela documentação oficial
// como o mecanismo de consulta de progresso de uma sessão resumível já
// aberta. Nunca cria uma sessão nova.
export async function queryGoogleResumableProgress(
  sessionUri: string,
  totalBytes: number,
): Promise<ItemResult<{ status: "complete"; versionCode: number } | { status: "incomplete"; bytesReceived: number }>> {
  try {
    const res = await fetch(sessionUri, {
      method: "PUT",
      headers: { "Content-Range": `bytes */${totalBytes}` },
    });
    if (res.status === 308) {
      const range = res.headers.get("range");
      const bytesReceived = range ? Number(range.split("-")[1]) + 1 : 0;
      return { ok: true, item: { status: "incomplete", bytesReceived } };
    }
    if (res.status >= 200 && res.status < 300) {
      const body = (await res.json().catch(() => null)) as { versionCode?: number | string } | null;
      const versionCode = body?.versionCode;
      if (versionCode === undefined || versionCode === null) {
        return { ok: false, error: sanitizeUnexpectedError(), code: "UNEXPECTED_ERROR" };
      }
      return { ok: true, item: { status: "complete", versionCode: Number(versionCode) } };
    }
    return { ok: false, error: sanitizeGoogleError(res.status), code: classifyHttpStatus(res.status) };
  } catch {
    return { ok: false, error: sanitizeUnexpectedError(), code: "UNEXPECTED_ERROR" };
  }
}
