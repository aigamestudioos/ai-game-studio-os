import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { randomUUID, createHash } from "node:crypto";
import { test, expect } from "@playwright/test";
import { admin, seedCriticalPath, cleanup } from "./fixtures/seed.mjs";

// Sprint 2.16d — GATE C: Playwright failure/retry. Estende o padrão de
// `submission-lifecycle.spec.ts` (2.16c) para o caminho de FALHA: Submit
// real via UI -> dispatcher real contra um FakeProviderServer configurado
// para responder um erro NÃO-RETRYABLE (403/FORBIDDEN, ver seção 11 da
// spec do sprint — evita qualquer loop de retry automático lento/flaky no
// Playwright, esses já são cobertos pelos testes de integração) -> FAILED
// visível na UI com mensagem sanitizada -> Retry manual pela UI (nunca
// update direto de submissions.status/integration_jobs/fabricação de
// provider success no banco) -> dispatcher real de novo, agora com
// sucesso -> SUBMITTED -> reload confirma persistência.
//
// PORT/PROCESS HYGIENE: porta dedicada (3102), nunca compartilhada com o
// spec de sucesso (3101) nem com o webServer padrão do playwright.config
// (3100) — evita qualquer condição de corrida entre specs mesmo rodando
// sequencialmente (`workers: 1`, `fullyParallel: false`).
//
// FIXTURE BOUNDARY (idêntico ao 2.16c): fixture fabrica Studio/users/
// Project/Game/Build/Artifact/Release/StoreConnection (+ provider_upload
// SUCCEEDED, resultado do worker de TRANSPORTE, fora de escopo aqui). A
// Submission em si, seu status (READY_TO_SUBMIT/SUBMITTING/FAILED/
// SUBMITTED) e os integration_jobs nascem exclusivamente do fluxo real
// pela UI + dispatcher.

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PORT = 3102;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const DISPATCHER_SECRET = process.env.JOBS_DISPATCHER_SECRET ?? "local-dev-test-secret-9f3a7c2b";

test.use({ baseURL: BASE_URL });

let nextProcess: ChildProcess | undefined;
let fakeServer: any;
let googleBaseUrl: string;
let ctx: Awaited<ReturnType<typeof seedCriticalPath>> | undefined;
let connId: string;

async function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {
      // ainda subindo
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`servidor não respondeu em ${url} dentro de ${timeoutMs}ms`);
}

test.beforeAll(async () => {
  const { FakeProviderServer } = await import(
    path.join(ROOT, "packages/integrations/src/test-utils/fake-provider-server.ts")
  );
  fakeServer = new FakeProviderServer();
  googleBaseUrl = await fakeServer.listen();

  // Binário `next` direto (não `npx next`) — mesmo achado de process leak
  // do 2.16c: o wrapper do `npx` não repassa SIGKILL ao filho real dono da
  // porta.
  nextProcess = spawn(path.join(ROOT, "apps/web/node_modules/.bin/next"), ["start", "-p", String(PORT)], {
    cwd: path.join(ROOT, "apps/web"),
    env: {
      ...process.env,
      AGSOS_ALLOW_STORE_MUTATION: "true",
      AGSOS_STORE_MUTATION_BASE_URL_ALLOWLIST: googleBaseUrl,
      AGSOS_GOOGLE_PLAY_TEST_BASE_URL: googleBaseUrl,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  nextProcess.stderr?.on("data", (d) => process.stderr.write(`[next:${PORT}] ${d}`));
  await waitForServer(BASE_URL, 60_000);

  ctx = await seedCriticalPath();

  const { generateKeyPairSync } = await import("node:crypto");
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const privatePem = privateKey.export({ type: "pkcs1", format: "pem" }).toString();
  const googleCredentials = {
    packageName: "com.e2e.studio",
    serviceAccountJson: JSON.stringify({
      client_email: "svc@agsos-e2e.iam.gserviceaccount.com",
      private_key: privatePem,
      token_uri: `${googleBaseUrl}/token`,
    }),
  };

  const uid = (seed: string) => {
    const hex = createHash("sha256").update(`${ctx!.run}:${seed}`).digest("hex").slice(0, 32);
    return hex.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
  };
  connId = uid("conn-e2e-fail");
  await admin
    .from("store_connections")
    .insert({
      id: connId, studio_id: ctx.studioId, platform_id: ctx.googleId, status: "CONNECTED",
      display_name: "Google E2E Failure", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
    })
    .throwOnError();

  const supabaseJsPath = require.resolve("@supabase/supabase-js", { paths: [path.join(ROOT, "packages/database")] });
  const { createClient } = require(supabaseJsPath);
  const anon = createClient(
    process.env.SUPABASE_URL ?? "http://127.0.0.1:54321",
    process.env.SUPABASE_ANON_KEY ??
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { error: signInErr } = await anon.auth.signInWithPassword({ email: ctx.email, password: ctx.password });
  if (signInErr) throw signInErr;
  const { error: secretErr } = await anon.rpc("set_store_connection_secret", {
    p_store_connection_id: connId,
    p_secret: JSON.stringify(googleCredentials),
    p_actor_id: ctx.userId,
  });
  if (secretErr) throw secretErr;

  await admin
    .from("provider_uploads")
    .insert({
      id: uid("upload-e2e-fail"), studio_id: ctx.studioId, build_artifact_id: ctx.artifactGoogleId, store_connection_id: connId,
      status: "SUCCEEDED", version_code: 1, completed_at: new Date().toISOString(),
      created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
    })
    .throwOnError();
});

test.afterAll(async () => {
  if (nextProcess && !nextProcess.killed) {
    nextProcess.kill("SIGKILL");
    await new Promise((r) => nextProcess?.once("exit", r));
  }
  await fakeServer?.close().catch(() => {});
  await cleanup(ctx);
});

test("Submission lifecycle: FAILED (erro não-retryable) visível na UI -> Retry manual -> SUBMITTED -> persiste", async ({ page }) => {
  if (!ctx) throw new Error("fixture não inicializado");

  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.locator("#email").fill(ctx.email);
  await page.locator("#password").fill(ctx.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/dashboard", { timeout: 45_000, waitUntil: "commit" });

  await page.goto(`/games/${ctx.gameId}`);
  await expect(page.getByRole("heading", { name: "Store Listing" })).toBeVisible();
  await page.locator("#listing-title").fill("Jogo E2E Failure");
  await page.locator("#listing-short").fill("Um jogo de teste E2E do fluxo de falha.");
  await page.locator("#listing-full").fill("Descrição completa da ficha de loja — E2E failure.");
  await page.locator("#listing-keywords").fill("e2e, failure, retry");
  await page.getByRole("button", { name: "Salvar ficha de loja" }).click();
  await expect(page.getByText("Cadastrada")).toBeVisible({ timeout: 10_000 });

  await page.goto("/publishing");
  await expect(page.getByRole("heading", { name: "Publishing" })).toBeVisible();
  await page.getByRole("button", { name: "New Submission" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Nova Submissão" })).toBeVisible();
  await dialog.getByText("Jogo E2E", { exact: false }).first().click();
  const googlePlayOption = dialog.getByText("Google Play", { exact: true });
  await expect(googlePlayOption).toBeVisible();
  await googlePlayOption.evaluate((el) => (el.closest("button") as HTMLElement).click());
  const createButton = dialog.getByRole("button", { name: "Criar Submissão" });
  await expect(createButton).toBeEnabled();
  await createButton.evaluate((el) => (el as HTMLElement).click());
  await expect(page.getByRole("heading", { name: "Nova Submissão" })).not.toBeVisible({ timeout: 10_000 });

  const submissionCard = page.getByText("Google Play — v1.0.0");
  await expect(submissionCard).toBeVisible();
  await submissionCard.click();
  await page.waitForURL(/\/publishing\/[0-9a-f-]+$/, { timeout: 10_000 });

  await page.getByRole("button", { name: "Preparar envio" }).click();
  await expect(page.getByText("Pronto para enviar")).toBeVisible({ timeout: 10_000 });

  await page.getByRole("button", { name: "Enviar" }).click();
  await expect(page.getByText("Enviando…").first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Envio em andamento…")).toBeVisible();

  // ---------- Fake provider: token OK, createEdit -> 403 FORBIDDEN
  // (não-retryable, seção 11 da spec — evita loop de retry automático
  // 429/500 no Playwright, isso já é coberto pelos testes de integração).
  for (let i = 0; i < 4; i++) {
    fakeServer.queue("POST", "/token", { kind: "json", status: 200, body: { access_token: "fake-token-fail", expires_in: 3600 } });
  }
  fakeServer.queue("POST", "/applications/com.e2e.studio/edits", {
    kind: "json", status: 403, body: { error: { message: "The caller does not have permission" } },
  });

  let failed = false;
  for (let i = 0; i < 10 && !failed; i++) {
    const res = await fetch(`${BASE_URL}/api/jobs/tick`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-dispatcher-secret": DISPATCHER_SECRET },
      body: "{}",
    });
    expect(res.status).toBe(200);
    await page.waitForTimeout(500);
    const bodyText = await page.locator("body").innerText();
    if (bodyText.includes("Falhou")) failed = true;
  }
  await expect(page.getByText("Falhou").first()).toBeVisible({ timeout: 10_000 });

  // ---------- Segurança: mensagem sanitizada, nunca o erro cru do
  // provider ("The caller does not have permission") nem nenhum segredo.
  const pageText = await page.locator("body").innerText();
  expect(pageText).not.toContain("The caller does not have permission");
  expect(pageText.toLowerCase()).not.toContain("private_key");
  expect(pageText.toLowerCase()).not.toContain("access_token");
  expect(pageText.toLowerCase()).not.toContain("bearer");
  expect(pageText.toLowerCase()).not.toContain("service_account");

  // ---------- Retry disponível ----------
  const retryButton = page.getByRole("button", { name: "Retry" });
  await expect(retryButton).toBeVisible({ timeout: 5_000 });

  // ---------- Muda o fake provider para sucesso, clica Retry pela UI ----------
  fakeServer.reset();
  for (let i = 0; i < 6; i++) {
    fakeServer.queue("POST", "/token", { kind: "json", status: 200, body: { access_token: "fake-token-fail2", expires_in: 3600 } });
  }
  fakeServer.queue("POST", "/applications/com.e2e.studio/edits", { kind: "json", status: 200, body: { id: "edit-fail-retry" } });
  fakeServer.queue("GET", "/applications/com.e2e.studio/edits/edit-fail-retry/tracks/internal", { kind: "json", status: 200, body: { track: "internal", releases: [] } });
  fakeServer.queue("PUT", "/applications/com.e2e.studio/edits/edit-fail-retry/tracks/internal", {
    kind: "json", status: 200, body: { track: "internal", releases: [{ status: "completed", versionCodes: ["1"] }] },
  });
  fakeServer.queue("POST", "/applications/com.e2e.studio/edits/edit-fail-retry:commit", { kind: "json", status: 200, body: { id: "edit-fail-retry" } });

  await retryButton.click();
  await expect(page.getByText("Reenviando…").first()).toBeVisible({ timeout: 10_000 });

  let submitted = false;
  for (let i = 0; i < 15 && !submitted; i++) {
    const res = await fetch(`${BASE_URL}/api/jobs/tick`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-dispatcher-secret": DISPATCHER_SECRET },
      body: "{}",
    });
    expect(res.status).toBe(200);
    await page.waitForTimeout(700);
    const bodyText = await page.locator("body").innerText();
    if (bodyText.includes("Enviado")) submitted = true;
  }
  await expect(page.getByText("Enviado").first()).toBeVisible({ timeout: 15_000 });

  // ---------- Reload confirma persistência do estado terminal ----------
  await page.reload();
  await expect(page.getByText("Enviado").first()).toBeVisible({ timeout: 10_000 });

  // Nenhum update direto: o estado SUBMITTED nasceu 100% do dispatcher
  // real + Retry pela UI, nunca de um `update submissions set status=...`
  // fabricado por este teste.
});
