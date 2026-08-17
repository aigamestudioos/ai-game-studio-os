import { describe, expect, it, beforeEach, afterEach } from "vitest";

// `env.ts` lê variáveis obrigatórias (Supabase URL/keys) eagerly no import
// do módulo — irrelevante para este teste (guard não as usa), mas precisa
// estar presente para o import não lançar fora do contexto normal do app
// (que sempre tem `.env.local` carregado pelo Next.js).
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://127.0.0.1:54321";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??= "test-publishable-key";
process.env.NEXT_PUBLIC_SITE_URL ??= "http://127.0.0.1:3000";

const { checkStoreMutationGuard } = await import("./store-mutation-guard");

// Sprint 2.16b — GATE 16, Casos A/B/C/D da especificação.
describe("checkStoreMutationGuard", () => {
  const ORIGINAL_ALLOW = process.env.AGSOS_ALLOW_STORE_MUTATION;
  const ORIGINAL_ALLOWLIST = process.env.AGSOS_STORE_MUTATION_BASE_URL_ALLOWLIST;

  beforeEach(() => {
    delete process.env.AGSOS_ALLOW_STORE_MUTATION;
    delete process.env.AGSOS_STORE_MUTATION_BASE_URL_ALLOWLIST;
  });
  afterEach(() => {
    if (ORIGINAL_ALLOW === undefined) delete process.env.AGSOS_ALLOW_STORE_MUTATION;
    else process.env.AGSOS_ALLOW_STORE_MUTATION = ORIGINAL_ALLOW;
    if (ORIGINAL_ALLOWLIST === undefined) delete process.env.AGSOS_STORE_MUTATION_BASE_URL_ALLOWLIST;
    else process.env.AGSOS_STORE_MUTATION_BASE_URL_ALLOWLIST = ORIGINAL_ALLOWLIST;
  });

  it("Caso A — env ausente: bloqueia mesmo com allowlist configurada", () => {
    process.env.AGSOS_STORE_MUTATION_BASE_URL_ALLOWLIST = "http://127.0.0.1:4310";
    const result = checkStoreMutationGuard("http://127.0.0.1:4310");
    expect(result.allowed).toBe(false);
  });

  it("Caso B — env=false: bloqueia", () => {
    process.env.AGSOS_ALLOW_STORE_MUTATION = "false";
    process.env.AGSOS_STORE_MUTATION_BASE_URL_ALLOWLIST = "http://127.0.0.1:4310";
    const result = checkStoreMutationGuard("http://127.0.0.1:4310");
    expect(result.allowed).toBe(false);
  });

  it("Caso C — env=true + host permitido: autoriza", () => {
    process.env.AGSOS_ALLOW_STORE_MUTATION = "true";
    process.env.AGSOS_STORE_MUTATION_BASE_URL_ALLOWLIST = "http://127.0.0.1:4310";
    const result = checkStoreMutationGuard("http://127.0.0.1:4310/androidpublisher/v3");
    expect(result.allowed).toBe(true);
  });

  it("Caso D — env=true + host NÃO permitido (ex.: host real do Google): falha fechado", () => {
    process.env.AGSOS_ALLOW_STORE_MUTATION = "true";
    process.env.AGSOS_STORE_MUTATION_BASE_URL_ALLOWLIST = "http://127.0.0.1:4310";
    const result = checkStoreMutationGuard("https://androidpublisher.googleapis.com/androidpublisher/v3");
    expect(result.allowed).toBe(false);
  });

  it("env=true + allowlist ausente: fail-closed mesmo com host aparentemente local", () => {
    process.env.AGSOS_ALLOW_STORE_MUTATION = "true";
    const result = checkStoreMutationGuard("http://127.0.0.1:4310");
    expect(result.allowed).toBe(false);
  });

  it("nunca autoriza o host real da App Store Connect mesmo com guard ligado sem allowlist", () => {
    process.env.AGSOS_ALLOW_STORE_MUTATION = "true";
    const result = checkStoreMutationGuard("https://api.appstoreconnect.apple.com/v1");
    expect(result.allowed).toBe(false);
  });
});
