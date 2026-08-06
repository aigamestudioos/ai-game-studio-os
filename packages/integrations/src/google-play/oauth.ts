import { createSign } from "node:crypto";
import { fetchJson } from "../core/http";
import { classifyHttpStatus } from "../core/errors";
import { sanitizeGoogleError, sanitizeUnexpectedError } from "./errors";

// Autenticação Google (diferente da Apple): Service Account OAuth2 JWT
// Bearer flow (RFC 7523) — assina um JWT curto (RS256, chave RSA da
// Service Account) atestando o escopo desejado, troca por um access token
// de vida curta em `token_uri`, e usa esse access token (não o JWT) nas
// chamadas de API. A Apple assina um JWT novo por chamada; o Google faz
// uma troca por token primeiro. Fluxos deliberadamente distintos — não são
// unificáveis sem esconder essa diferença real de protocolo.

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

const SCOPE = "https://www.googleapis.com/auth/androidpublisher";
const DEFAULT_TOKEN_URI = "https://oauth2.googleapis.com/token";

function base64url(input: Buffer): string {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function parseServiceAccount(serviceAccountJson: string): ServiceAccount | null {
  try {
    const parsed = JSON.parse(serviceAccountJson) as Partial<ServiceAccount>;
    if (!parsed.client_email || !parsed.private_key) return null;
    return { client_email: parsed.client_email, private_key: parsed.private_key, token_uri: parsed.token_uri };
  } catch {
    return null;
  }
}

export type AccessTokenResult = { ok: true; accessToken: string } | { ok: false; error: string; code?: string };

export async function getGoogleAccessToken(serviceAccount: ServiceAccount): Promise<AccessTokenResult> {
  const tokenUri = serviceAccount.token_uri || DEFAULT_TOKEN_URI;
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: SCOPE,
    aud: tokenUri,
    iat: now,
    exp: now + 3600,
  };
  const signingInput = `${base64url(Buffer.from(JSON.stringify(header)))}.${base64url(Buffer.from(JSON.stringify(payload)))}`;

  try {
    const signer = createSign("RSA-SHA256");
    signer.update(signingInput);
    signer.end();
    const signature = signer.sign(serviceAccount.private_key);
    const jwt = `${signingInput}.${base64url(signature)}`;

    const { status, body } = await fetchJson(tokenUri, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }).toString(),
    });

    if (status < 200 || status >= 300) {
      return { ok: false, error: sanitizeGoogleError(status), code: classifyHttpStatus(status) };
    }
    const accessToken = (body as { access_token?: string } | null)?.access_token;
    if (!accessToken) return { ok: false, error: sanitizeUnexpectedError(), code: "UNEXPECTED_ERROR" };
    return { ok: true, accessToken };
  } catch {
    return { ok: false, error: sanitizeUnexpectedError(), code: "UNEXPECTED_ERROR" };
  }
}
