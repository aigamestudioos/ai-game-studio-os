import { generateKeyPairSync } from "node:crypto";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { FakeProviderServer } from "../test-utils/fake-provider-server";
import {
  createAppleReviewSubmission,
  createAppleReviewSubmissionItem,
  getAppleReviewSubmission,
  listAppleReviewSubmissions,
  submitAppleReviewSubmission,
} from "./client";
import type { AppleCredentials } from "./types";

// Sprint 2.16b — testes byte/JSON-exatos dos clients HTTP reais de
// Submission (Apple): URL, método, headers, body — contra um fake provider
// server real (node:http).

const { privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const PRIVATE_KEY_PEM = privateKey.export({ type: "pkcs8", format: "pem" }).toString();

describe("Apple client — Submission (Sprint 2.16b)", () => {
  let server: FakeProviderServer;
  let baseUrl: string;
  let credentials: AppleCredentials;

  beforeAll(async () => {
    server = new FakeProviderServer();
    baseUrl = await server.listen();
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(() => {
    server.reset();
    credentials = {
      issuerId: "issuer-123",
      keyId: "KEY123",
      privateKey: PRIVATE_KEY_PEM,
      teamId: "TEAM123",
    };
  });

  afterEach(() => {
    for (const r of server.requests) {
      expect(JSON.stringify(r.body ?? "")).not.toContain("PRIVATE KEY");
    }
  });

  it("listAppleReviewSubmissions — GET com filter[app]/filter[platform] na query, sem body", async () => {
    server.queue("GET", "/reviewSubmissions", {
      kind: "json",
      status: 200,
      body: { data: [{ id: "rs-1", attributes: { state: "READY_FOR_REVIEW" } }] },
    });
    const result = await listAppleReviewSubmissions(credentials, { appId: "app-1", platform: "IOS" }, baseUrl);
    expect(result).toEqual({ ok: true, items: [{ id: "rs-1", state: "READY_FOR_REVIEW" }] });

    const req = server.requests[0]!;
    expect(req.method).toBe("GET");
    expect(req.url).toBe("/reviewSubmissions?filter[app]=app-1&filter[platform]=IOS");
    expect(req.headers.authorization).toMatch(/^Bearer /);
    expect(req.body).toBeNull();
  });

  it("createAppleReviewSubmission — POST body JSON:API exato", async () => {
    server.queue("POST", "/reviewSubmissions", {
      kind: "json",
      status: 201,
      body: { data: { id: "rs-1", type: "reviewSubmissions", attributes: { state: "READY_FOR_REVIEW" } } },
    });
    const result = await createAppleReviewSubmission(credentials, { appId: "app-1", platform: "IOS" }, baseUrl);
    expect(result).toEqual({ ok: true, item: { reviewSubmissionId: "rs-1", state: "READY_FOR_REVIEW" } });

    const req = server.requests[0]!;
    expect(req.method).toBe("POST");
    expect(req.headers["content-type"]).toBe("application/json");
    expect(req.body).toEqual({
      data: {
        type: "reviewSubmissions",
        attributes: { platform: "IOS" },
        relationships: { app: { data: { type: "apps", id: "app-1" } } },
      },
    });
  });

  it("createAppleReviewSubmissionItem — POST body relationships reviewSubmission+build, sem itemType", async () => {
    server.queue("POST", "/reviewSubmissionItems", {
      kind: "json",
      status: 201,
      body: { data: { id: "item-1", type: "reviewSubmissionItems" } },
    });
    const result = await createAppleReviewSubmissionItem(credentials, { reviewSubmissionId: "rs-1", buildId: "build-1" }, baseUrl);
    expect(result).toEqual({ ok: true, item: { reviewSubmissionItemId: "item-1" } });

    const req = server.requests[0]!;
    expect(req.body).toEqual({
      data: {
        type: "reviewSubmissionItems",
        relationships: {
          reviewSubmission: { data: { type: "reviewSubmissions", id: "rs-1" } },
          build: { data: { type: "builds", id: "build-1" } },
        },
      },
    });
    expect(JSON.stringify(req.body)).not.toContain("itemType");
  });

  it("submitAppleReviewSubmission — PATCH body attributes.submitted:true", async () => {
    server.queue("PATCH", "/reviewSubmissions/rs-1", {
      kind: "json",
      status: 200,
      body: { data: { id: "rs-1", type: "reviewSubmissions", attributes: { state: "WAITING_FOR_REVIEW" } } },
    });
    const result = await submitAppleReviewSubmission(credentials, "rs-1", baseUrl);
    expect(result).toEqual({ ok: true, item: { reviewSubmissionId: "rs-1", state: "WAITING_FOR_REVIEW" } });

    const req = server.requests[0]!;
    expect(req.method).toBe("PATCH");
    expect(req.body).toEqual({ data: { type: "reviewSubmissions", id: "rs-1", attributes: { submitted: true } } });
  });

  it("getAppleReviewSubmission — GET, sem body", async () => {
    server.queue("GET", "/reviewSubmissions/rs-1", {
      kind: "json",
      status: 200,
      body: { data: { id: "rs-1", type: "reviewSubmissions", attributes: { state: "WAITING_FOR_REVIEW" } } },
    });
    const result = await getAppleReviewSubmission(credentials, "rs-1", baseUrl);
    expect(result).toEqual({ ok: true, item: { reviewSubmissionId: "rs-1", state: "WAITING_FOR_REVIEW" } });
  });

  describe("classes de erro Apple (status + JSON:API error code -> code estável)", () => {
    it("401 -> AUTH", async () => {
      server.queue("PATCH", "/reviewSubmissions/rs-1", { kind: "json", status: 401, body: { errors: [{ code: "NOT_AUTHORIZED" }] } });
      const result = await submitAppleReviewSubmission(credentials, "rs-1", baseUrl);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe("UNAUTHORIZED");
    });

    it("409 -> erro (conflito, não sucesso)", async () => {
      server.queue("PATCH", "/reviewSubmissions/rs-1", { kind: "json", status: 409, body: { errors: [{ code: "STATE_ERROR" }] } });
      const result = await submitAppleReviewSubmission(credentials, "rs-1", baseUrl);
      expect(result.ok).toBe(false);
    });

    it("429 -> RATE_LIMIT", async () => {
      server.queue("PATCH", "/reviewSubmissions/rs-1", { kind: "json", status: 429, body: { errors: [{ code: "RATE_LIMIT_EXCEEDED" }] } });
      const result = await submitAppleReviewSubmission(credentials, "rs-1", baseUrl);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe("RATE_LIMITED");
    });

    it("500 -> RETRYABLE", async () => {
      server.queue("PATCH", "/reviewSubmissions/rs-1", { kind: "json", status: 500, body: {} });
      const result = await submitAppleReviewSubmission(credentials, "rs-1", baseUrl);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe("SERVER_ERROR");
    });
  });

  it("resposta perdida (lost) na submissão — falha limpa, nunca finge sucesso", async () => {
    server.queue("PATCH", "/reviewSubmissions/rs-1", { kind: "lost" });
    const result = await submitAppleReviewSubmission(credentials, "rs-1", baseUrl);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("UNEXPECTED_ERROR");
  }, 15_000);
});
