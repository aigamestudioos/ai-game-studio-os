import { createSign } from "node:crypto";
import type { AppleCredentials } from "./types";

// JWT ES256 exigido pela App Store Connect API — construído com
// `node:crypto` (sem dependência nova; ES256/P-256 é suportado nativamente
// desde muito antes do Node 18). Referência: Apple Developer, "Generating
// Tokens for API Requests". Vida máxima do token: 20 minutos — usamos 15
// para ter margem.
const MAX_TOKEN_LIFETIME_SECONDS = 15 * 60;
const AUDIENCE = "appstoreconnect-v1";

function base64url(input: Buffer): string {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function createAppleJwt(credentials: AppleCredentials): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: credentials.keyId, typ: "JWT" };
  const payload = {
    iss: credentials.issuerId,
    iat: now,
    exp: now + MAX_TOKEN_LIFETIME_SECONDS,
    aud: AUDIENCE,
  };

  const signingInput = `${base64url(Buffer.from(JSON.stringify(header)))}.${base64url(Buffer.from(JSON.stringify(payload)))}`;

  // `dsaEncoding: "ieee-p1363"` é o que faz a assinatura sair no formato
  // fixo r||s (64 bytes) que JWS/ES256 exige — o padrão do Node para chaves
  // EC é DER, que o App Store Connect rejeita.
  const signer = createSign("sha256");
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign({ key: credentials.privateKey, dsaEncoding: "ieee-p1363" });

  return `${signingInput}.${base64url(signature)}`;
}
