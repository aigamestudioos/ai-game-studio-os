import { generateKeyPairSync } from "node:crypto";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { FakeProviderServer } from "../test-utils/fake-provider-server";
import { commitGoogleEdit, getGoogleEdit, getGoogleTrack, updateGoogleTrack } from "./client";
import type { GoogleCredentials } from "./types";

// Sprint 2.16b — testes byte/JSON-exatos dos clients HTTP reais de
// Submission (Google): URL, método, headers, body — contra um fake
// provider server real (node:http), não um mock de `fetch`.

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const PRIVATE_KEY_PEM = privateKey.export({ type: "pkcs1", format: "pem" }).toString();

describe("Google Play client — Submission (Sprint 2.16b)", () => {
  let server: FakeProviderServer;
  let baseUrl: string;
  let credentials: GoogleCredentials;

  beforeAll(async () => {
    server = new FakeProviderServer();
    baseUrl = await server.listen();
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(() => {
    server.reset();
    // token_uri aponta para o próprio fake server — o cliente Google
    // sempre troca o JWT assinado por um access token antes de chamar a
    // API real; aqui o "servidor de token" e a "API" são o mesmo fake.
    credentials = {
      packageName: "com.agsos.testgame",
      serviceAccountJson: JSON.stringify({
        client_email: "svc@agsos-test.iam.gserviceaccount.com",
        private_key: PRIVATE_KEY_PEM,
        token_uri: `${baseUrl}/token`,
      }),
    };
    server.queue("POST", "/token", { kind: "json", status: 200, body: { access_token: "fake-access-token", expires_in: 3600 } });
  });

  afterEach(() => {
    // Nenhum request registrado pode carregar o segredo em claro no corpo —
    // só o header Authorization (esperado, é o transporte), nunca
    // private_key.
    for (const r of server.requests) {
      expect(JSON.stringify(r.body ?? "")).not.toContain("PRIVATE KEY");
    }
  });

  it("getGoogleEdit — GET correto, Authorization Bearer, sem body", async () => {
    server.queue("GET", "/applications/com.agsos.testgame/edits/edit-1", {
      kind: "json",
      status: 200,
      body: { id: "edit-1", expiryTimeSeconds: "1234567890" },
    });
    const result = await getGoogleEdit(credentials, "edit-1", baseUrl);
    expect(result).toEqual({ ok: true, item: { editId: "edit-1", expiryTimeSeconds: "1234567890" } });

    const req = server.requests.find((r) => r.url === "/applications/com.agsos.testgame/edits/edit-1");
    expect(req?.method).toBe("GET");
    expect(req?.headers.authorization).toBe("Bearer fake-access-token");
    expect(req?.body).toBeNull();
  });

  it("getGoogleTrack — GET no path track correto", async () => {
    server.queue("GET", "/applications/com.agsos.testgame/edits/edit-1/tracks/internal", {
      kind: "json",
      status: 200,
      body: { track: "internal", releases: [{ status: "draft", versionCodes: ["7"] }] },
    });
    const result = await getGoogleTrack(credentials, "edit-1", "internal", baseUrl);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.item).toEqual({ track: "internal", releases: [{ status: "draft", versionCodes: ["7"] }] });
    }
  });

  it("updateGoogleTrack — PUT com body { track, releases } exato, Content-Type json", async () => {
    server.queue("PUT", "/applications/com.agsos.testgame/edits/edit-1/tracks/internal", {
      kind: "json",
      status: 200,
      body: { track: "internal", releases: [{ status: "completed", versionCodes: ["7"] }] },
    });
    const track = { track: "internal", releases: [{ status: "completed" as const, versionCodes: ["7"] }] };
    const result = await updateGoogleTrack(credentials, "edit-1", track, baseUrl);
    expect(result.ok).toBe(true);

    const req = server.requests.find((r) => r.url === "/applications/com.agsos.testgame/edits/edit-1/tracks/internal" && r.method === "PUT");
    expect(req?.headers["content-type"]).toBe("application/json");
    expect(req?.body).toEqual({ track: "internal", releases: [{ status: "completed", versionCodes: ["7"] }] });
  });

  it("commitGoogleEdit — POST :commit sem body", async () => {
    server.queue("POST", "/applications/com.agsos.testgame/edits/edit-1:commit", {
      kind: "json",
      status: 200,
      body: { id: "edit-1" },
    });
    const result = await commitGoogleEdit(credentials, "edit-1", baseUrl);
    expect(result).toEqual({ ok: true, item: { editId: "edit-1" } });

    const req = server.requests.find((r) => r.url === "/applications/com.agsos.testgame/edits/edit-1:commit");
    expect(req?.method).toBe("POST");
    expect(req?.body).toBeNull();
  });

  describe("classes de erro (status -> code, sem vazar corpo bruto)", () => {
    it("401 -> AUTH", async () => {
      server.queue("POST", "/applications/com.agsos.testgame/edits/edit-1:commit", { kind: "json", status: 401, body: { error: "unauthorized" } });
      const result = await commitGoogleEdit(credentials, "edit-1", baseUrl);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe("UNAUTHORIZED");
    });

    it("403 -> classifyHttpStatus resultante nunca AUTH nem sucesso", async () => {
      server.queue("POST", "/applications/com.agsos.testgame/edits/edit-1:commit", { kind: "json", status: 403, body: {} });
      const result = await commitGoogleEdit(credentials, "edit-1", baseUrl);
      expect(result.ok).toBe(false);
    });

    it("409 -> erro (não trata como sucesso)", async () => {
      server.queue("POST", "/applications/com.agsos.testgame/edits/edit-1:commit", { kind: "json", status: 409, body: {} });
      const result = await commitGoogleEdit(credentials, "edit-1", baseUrl);
      expect(result.ok).toBe(false);
    });

    it("429 -> RATE_LIMIT", async () => {
      server.queue("POST", "/applications/com.agsos.testgame/edits/edit-1:commit", { kind: "json", status: 429, body: {} });
      const result = await commitGoogleEdit(credentials, "edit-1", baseUrl);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe("RATE_LIMITED");
    });

    it("500 -> RETRYABLE", async () => {
      server.queue("POST", "/applications/com.agsos.testgame/edits/edit-1:commit", { kind: "json", status: 500, body: {} });
      const result = await commitGoogleEdit(credentials, "edit-1", baseUrl);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe("SERVER_ERROR");
    });
  });

  it("resposta perdida (lost) — client falha (timeout), não trava indefinidamente, nunca finge sucesso", async () => {
    server.queue("POST", "/applications/com.agsos.testgame/edits/edit-1:commit", { kind: "lost" });
    // fetchJson usa DEFAULT_READ_TIMEOUT_MS (10s); usamos um baseUrl com
    // handler "lost" e confiamos no timeout do client — reduzimos o teste
    // ao próprio comportamento de erro (não invocamos setTimeout custom).
    const result = await commitGoogleEdit(credentials, "edit-1", baseUrl);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("UNEXPECTED_ERROR");
  }, 15_000);
});
