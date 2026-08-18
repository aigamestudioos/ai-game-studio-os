import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { randomUUID, createHash } from "node:crypto";
import { test, expect } from "@playwright/test";
import { admin, seedCriticalPath, cleanup } from "./fixtures/seed.mjs";

// Sprint 2.16c — Submission Lifecycle E2E: estende o critical-path (2.13/
// 2.14/2.15) para além da CRIAÇÃO da Submission — cobre Prepare → Submit →
// dispatcher real (contra um FakeProviderServer local, `node:http`) →
// SUBMITTED, tudo pela UI real (botões "Preparar envio"/"Enviar" de
// `SubmissionLifecycleActions`, já existentes desde o Sprint 2.16a) e o
// polling já existente de `useSubmission` (SUBMITTING → refetch a cada
// poucos segundos até sair de SUBMITTING).
//
// Não reusa o `webServer`/porta 3100 do `playwright.config.ts` porque este
// spec precisa de env vars exclusivas (`AGSOS_ALLOW_STORE_MUTATION=true` +
// allowlist apontando SÓ para o FakeProviderServer local) — nunca ligadas
// no `next start` compartilhado dos outros specs. Sobe seu próprio
// `next start` numa porta dedicada (3101), com essas env vars só neste
// processo filho, e usa `test.use({ baseURL })` para apontar só este
// arquivo a ela.
//
// PROIBIÇÃO DE PRODUÇÃO: os mesmos guards de sempre — recusa rodar se
// SUPABASE_URL não for local (ver fixtures/seed.mjs), e a allowlist de
// mutação de loja aponta EXCLUSIVAMENTE para o FakeProviderServer local
// (porta efêmera 127.0.0.1), nunca para host real do Google/Apple.

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PORT = 3101;
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
  // ---------- 1. FakeProviderServer real (node:http, porta efêmera) ----------
  const { FakeProviderServer } = await import(
    path.join(ROOT, "packages/integrations/src/test-utils/fake-provider-server.ts")
  );
  fakeServer = new FakeProviderServer();
  googleBaseUrl = await fakeServer.listen();

  // ---------- 2. `next start` dedicado, com env de mutação ligada SÓ para o fake local ----------
  // Chama o binário `next` diretamente (não `npx next`): `npx` cria um
  // processo wrapper cujo filho real (`next start`, dono da porta) não
  // morre quando só o wrapper recebe SIGKILL — achado ao rodar este spec
  // 2x em sequência (2ª execução falhava com EADDRINUSE na porta 3101
  // mesmo depois do `afterAll` "matar" o processo).
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
  nextProcess.stderr?.on("data", (d) => process.stderr.write(`[next:3101] ${d}`));
  await waitForServer(BASE_URL, 60_000);

  // ---------- 3. Fixture (mesmo seed do critical-path — 0 Submissions, 0 Store Listing) ----------
  ctx = await seedCriticalPath();

  // ---------- 4. Store Connection com credencial REAL (RSA), token_uri apontando pro fake ----------
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
  connId = uid("conn-e2e");
  await admin
    .from("store_connections")
    .insert({
      id: connId, studio_id: ctx.studioId, platform_id: ctx.googleId, status: "CONNECTED",
      display_name: "Google E2E", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
    })
    .throwOnError();

  // `set_store_connection_secret` só é chamável por `authenticated` (auth.uid()
  // real) — precisa de um client logado, não do client admin/service_role.
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

  // `provider_uploads` SUCCEEDED — resultado do worker de TRANSPORTE
  // (fora de escopo deste E2E, testado em outro sprint), pré-condição de
  // readiness, não o que este teste prova.
  await admin
    .from("provider_uploads")
    .insert({
      id: uid("upload-e2e"), studio_id: ctx.studioId, build_artifact_id: ctx.artifactGoogleId, store_connection_id: connId,
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

test("Submission lifecycle: UI Prepare → Submit → dispatcher real (fake provider) → SUBMITTED → persiste após reload", async ({ page }) => {
  if (!ctx) throw new Error("fixture não inicializado");

  // ---------- Login real via UI ----------
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.locator("#email").fill(ctx.email);
  await page.locator("#password").fill(ctx.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/dashboard", { timeout: 45_000, waitUntil: "commit" });

  // ---------- Store Listing pela UI (mesma exigência do critical-path) ----------
  await page.goto(`/games/${ctx.gameId}`);
  await expect(page.getByRole("heading", { name: "Store Listing" })).toBeVisible();
  await page.locator("#listing-title").fill("Jogo E2E Lifecycle");
  await page.locator("#listing-short").fill("Um jogo de teste E2E do lifecycle.");
  await page.locator("#listing-full").fill("Descrição completa da ficha de loja — E2E lifecycle.");
  await page.locator("#listing-keywords").fill("e2e, lifecycle, submissao");
  await page.getByRole("button", { name: "Salvar ficha de loja" }).click();
  await expect(page.getByText("Cadastrada")).toBeVisible({ timeout: 10_000 });

  // ---------- Cria a Submission (Google Play) pela UI ----------
  await page.goto("/publishing");
  await expect(page.getByRole("heading", { name: "Publishing" })).toBeVisible();
  await page.getByRole("button", { name: "New Submission" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Nova Submissão" })).toBeVisible();
  await dialog.getByText("Jogo E2E", { exact: false }).first().click();

  // Store Connection + provider_upload já existem (fixture) -> readiness
  // já deve estar READY para Google Play assim que a Submission nascer.
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

  // ---------- Prepare (DRAFT -> READY_TO_SUBMIT) via UI real ----------
  const prepareButton = page.getByRole("button", { name: "Preparar envio" });
  await expect(prepareButton).toBeVisible({ timeout: 10_000 });
  await prepareButton.click();
  await expect(page.getByText("Pronto para enviar")).toBeVisible({ timeout: 10_000 });

  // ---------- Submit (READY_TO_SUBMIT -> SUBMITTING, job enfileirado) ----------
  const submitButton = page.getByRole("button", { name: "Enviar" });
  await expect(submitButton).toBeVisible();
  await submitButton.click();
  await expect(page.getByText("Enviando…").first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Envio em andamento…")).toBeVisible();

  // ---------- Scripts as respostas do FakeProviderServer para o fluxo Google ----------
  // Sem isto o fake responde 200 `{}` genérico (default do server) para
  // qualquer rota — quebra o parse do client real (`created.item.editId`
  // ausente) e o job nunca sai de UNEXPECTED_ERROR/RETRY_WAIT. Enfileira
  // várias cópias de cada resposta porque o processor reentra (claim → 1
  // etapa → release → claim de novo) múltiplas vezes até completar.
  for (let i = 0; i < 6; i++) {
    fakeServer.queue("POST", "/token", { kind: "json", status: 200, body: { access_token: "fake-token-e2e", expires_in: 3600 } });
  }
  fakeServer.queue("POST", "/applications/com.e2e.studio/edits", { kind: "json", status: 200, body: { id: "edit-e2e" } });
  fakeServer.queue("GET", "/applications/com.e2e.studio/edits/edit-e2e/tracks/internal", { kind: "json", status: 200, body: { track: "internal", releases: [] } });
  fakeServer.queue("PUT", "/applications/com.e2e.studio/edits/edit-e2e/tracks/internal", {
    kind: "json", status: 200, body: { track: "internal", releases: [{ status: "completed", versionCodes: ["1"] }] },
  });
  fakeServer.queue("POST", "/applications/com.e2e.studio/edits/edit-e2e:commit", { kind: "json", status: 200, body: { id: "edit-e2e" } });

  // ---------- Dispatcher real: chama /api/jobs/tick (mesmo endpoint que
  // pg_cron chamaria em produção) repetidamente contra o `next start`
  // deste spec, até o job (contra o fake provider real) convergir. O
  // polling de `useSubmission` (useEffect com setInterval) refaz o fetch
  // do lado do browser sozinho enquanto SUBMITTING — só precisamos manter
  // o dispatcher alimentado.
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
});
