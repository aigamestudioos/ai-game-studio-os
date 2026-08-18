import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { test, expect } from "@playwright/test";
import { admin, seedCriticalPath, cleanup } from "./fixtures/seed.mjs";

// Sprint 2.16d — GATE D: Playwright Member permission. Prova que um
// Member (só `publishing.read` + `publishing.create_submission`, SEM
// `publishing.submit`) consegue ver uma Submission existente mas nunca vê
// nem consegue disparar a ação de Submit/Retry/Prepare — nem pela UI, nem
// chamando a Server Action/RPC diretamente com a própria sessão Member
// (nunca testado com `service_role`, ver seção 12 da spec do sprint).
//
// PORT/PROCESS HYGIENE: porta dedicada (3103), isolada dos outros specs
// deste sprint (3100 padrão, 3101 sucesso, 3102 falha/retry).
//
// FIXTURE BOUNDARY: mesmo padrão do 2.16c — Studio/users(Owner+Member)/
// Project/Game/Build/Release são fixture; a Submission em si nasce da UI
// (sessão Owner, que tem `publishing.submit`), só para o Member ter algo
// real para abrir — o Member NUNCA cria nem transiciona nada.

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PORT = 3103;
const BASE_URL = `http://127.0.0.1:${PORT}`;

test.use({ baseURL: BASE_URL });

let nextProcess: ChildProcess | undefined;
let ctx: Awaited<ReturnType<typeof seedCriticalPath>> | undefined;
let memberEmail: string;
let memberPassword: string;
let memberUserId: string;
let submissionUrl: string;
let submissionId: string;

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
  nextProcess = spawn(path.join(ROOT, "apps/web/node_modules/.bin/next"), ["start", "-p", String(PORT)], {
    cwd: path.join(ROOT, "apps/web"),
    env: { ...process.env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  nextProcess.stderr?.on("data", (d) => process.stderr.write(`[next:${PORT}] ${d}`));
  await waitForServer(BASE_URL, 60_000);

  ctx = await seedCriticalPath();

  // ---------- Member: mesmo Studio, papel com publishing.read +
  // publishing.create_submission, SEM publishing.submit. ----------
  memberEmail = `e2e-member-${ctx.run}@test.local`;
  memberPassword = "TestPassw0rd!23";
  const { data: memberAuth, error: memberAuthErr } = await admin.auth.admin.createUser({
    email: memberEmail, password: memberPassword, email_confirm: true,
  });
  if (memberAuthErr) throw memberAuthErr;
  memberUserId = memberAuth.user.id;

  await admin.from("users").insert({
    id: memberUserId, studio_id: ctx.studioId, email: memberEmail, name: "E2E Member",
    created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
  }).throwOnError();

  const { data: perms } = await admin.from("permissions").select("id, key");
  const memberRoleId = memberUserId; // reaproveita um uuid válido já gerado, só como id de role.
  await admin.from("roles").insert({
    id: memberRoleId, studio_id: ctx.studioId, name: "Member", description: "Member sem publishing.submit",
    created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
  }).throwOnError();
  const memberPermKeys = ["publishing.read", "publishing.create_submission"];
  const memberPermRows = (perms ?? []).filter((p: any) => memberPermKeys.includes(p.key));
  await admin.from("role_permissions").insert(
    memberPermRows.map((p: any) => ({ studio_id: ctx!.studioId, role_id: memberRoleId, permission_id: p.id })),
  ).throwOnError();
  await admin.from("user_roles").insert({ studio_id: ctx.studioId, user_id: memberUserId, role_id: memberRoleId }).throwOnError();

  // ---------- Store Listing (necessário para readiness) + Submission
  // criada pela SESSÃO OWNER (via API real, não UI, aqui só para ter algo
  // para o Member abrir — a prova de UX/permission do Member acontece nos
  // testes abaixo, não nesta etapa de setup). ----------
  const supabaseJsPath = require.resolve("@supabase/supabase-js", { paths: [path.join(ROOT, "packages/database")] });
  const { createClient } = require(supabaseJsPath);
  const anonKey =
    process.env.SUPABASE_ANON_KEY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
  const ownerClient = createClient(process.env.SUPABASE_URL ?? "http://127.0.0.1:54321", anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInErr } = await ownerClient.auth.signInWithPassword({ email: ctx.email, password: ctx.password });
  if (signInErr) throw signInErr;

  await createRepo(ownerClient);

  async function createRepo(client: any) {
    const dbIndexPath = path.join(ROOT, "packages/database/src/index.ts");
    const { createGameLocalizationsRepository } = await import(dbIndexPath);
    await createGameLocalizationsRepository(client).upsertPrimary({
      studio_id: ctx!.studioId, game_id: ctx!.gameId, title: "Jogo E2E Member",
      short_description: "short", full_description: "full",
    });
  }

  const { data: sub } = await ownerClient
    .from("submissions")
    .insert({
      studio_id: ctx.studioId, release_id: ctx.releaseId, platform_id: ctx.googleId, build_id: ctx.buildGoogleId,
      created_actor_type: "USER", created_actor_id: ctx.userId, updated_actor_type: "USER", updated_actor_id: ctx.userId,
    })
    .select("id")
    .single();
  submissionId = sub.id;
  submissionUrl = `/publishing/${submissionId}`;
});

test.afterAll(async () => {
  if (nextProcess && !nextProcess.killed) {
    nextProcess.kill("SIGKILL");
    await new Promise((r) => nextProcess?.once("exit", r));
  }
  await admin.auth.admin.deleteUser(memberUserId).catch(() => {});
  await cleanup(ctx);
});

test("Member vê a Submission mas não tem ação de Submit/Retry/Prepare disponível (UI + backend)", async ({ page }) => {
  if (!ctx) throw new Error("fixture não inicializado");

  // ---------- Login real do Member pela UI ----------
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.locator("#email").fill(memberEmail);
  await page.locator("#password").fill(memberPassword);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/dashboard", { timeout: 45_000, waitUntil: "commit" });

  // ---------- Abre a Submission existente ----------
  await page.goto(submissionUrl);
  await expect(page.getByText("Google Play", { exact: false }).first()).toBeVisible({ timeout: 10_000 });

  // ---------- Nenhum botão de transição (Preparar envio/Enviar/Retry)
  // visível — a state machine client-side permitiria "Preparar envio"
  // (status DRAFT), mas o check de permissão (GATE D, fix deste sub-sprint
  // em `SubmissionLifecycleActions`) esconde o botão até confirmar
  // `publishing.submit` via RPC, que o Member não tem. ----------
  await expect(page.getByRole("button", { name: "Preparar envio" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Enviar" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(0);

  // A negação de BACKEND (Server Action/RPC direto com sessão Member,
  // nunca service_role) é provada no teste seguinte — a sessão do browser
  // Playwright vive em cookies httpOnly do Supabase SSR, não acessível a
  // `page.evaluate`, então o caminho mais honesto para provar o backend é
  // uma sessão `@supabase/supabase-js` real e independente com as mesmas
  // credenciais do Member (mesmo RLS/permission real do Postgres).
});

test("Backend: Server Action transitionSubmissionAction nega SUBMIT para sessão Member (não service_role)", async () => {
  if (!ctx) throw new Error("fixture não inicializado");

  const supabaseJsPath = require.resolve("@supabase/supabase-js", { paths: [path.join(ROOT, "packages/database")] });
  const { createClient } = require(supabaseJsPath);
  const anonKey =
    process.env.SUPABASE_ANON_KEY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
  const memberClient = createClient(process.env.SUPABASE_URL ?? "http://127.0.0.1:54321", anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInErr } = await memberClient.auth.signInWithPassword({ email: memberEmail, password: memberPassword });
  if (signInErr) throw signInErr;

  // Mesma RPC que a Server Action `transitionSubmissionAction` chama
  // (`createSubmissionsRepository(serverClient).transition(...)`), só que
  // aqui invocada com a sessão Member real (RLS/permission real do
  // Postgres, não um mock) — prova o backend, não só a UI.
  const { error } = await memberClient.rpc("transition_submission", {
    p_submission_id: submissionId,
    p_action: "PREPARE",
    p_actor_id: memberUserId,
  });
  expect(error).toBeTruthy();
  expect(error?.message ?? "").toContain("sem permissão publishing.submit");

  // Confirma que a Submission realmente não mudou de estado.
  const { data: sub } = await admin.from("submissions").select("status").eq("id", submissionId).single();
  expect(sub.status).toBe("DRAFT");
});
