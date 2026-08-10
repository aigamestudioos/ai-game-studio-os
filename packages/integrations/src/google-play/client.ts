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
