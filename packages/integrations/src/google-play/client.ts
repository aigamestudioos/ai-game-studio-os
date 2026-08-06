import { fetchJson } from "../core/http";
import { classifyHttpStatus } from "../core/errors";
import type { HealthResult, ListResult } from "../core/types";
import { getGoogleAccessToken, parseServiceAccount } from "./oauth";
import { sanitizeGoogleError, sanitizeUnexpectedError } from "./errors";
import type { GoogleApp, GoogleCredentials } from "./types";

const BASE_URL = "https://androidpublisher.googleapis.com/androidpublisher/v3";

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
