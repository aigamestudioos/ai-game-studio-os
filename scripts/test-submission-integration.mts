#!/usr/bin/env -S npx tsx
// Sprint 2.16c — Integrated Submission Lifecycle Proof.
//
// Prova de ponta a ponta do fluxo DRAFT → READY_TO_SUBMIT → SUBMITTING →
// SUBMITTED (Google e Apple), passando pelo caminho REAL: RPC
// `transition_submission` (autenticado, via PostgREST) → enqueue de
// `integration_jobs` → `runDispatcherTick()` chamado em processo (mesma
// função que `/api/jobs/tick` invoca — não recriamos o dispatcher, só
// evitamos precisar de `next start` rodando para os testes de integração
// backend) → processor real (`submission-google-play.ts`/
// `submission-apple.ts`) → clientes HTTP reais (`@agsos/integrations`)
// contra um `FakeProviderServer` (node:http, porta real, não mock).
//
// ===========================================================================
// FIXTURE BOUNDARY — o que este script tem permissão de fabricar
// diretamente (INSERT via client admin/service_role) vs. o que TEM que
// nascer do caminho real:
//
//   FIXTURE (legítimo fabricar, pré-condição do cenário):
//     - auth users (Supabase Admin API)
//     - studios / users / roles / role_permissions / user_roles
//     - projects, games (incl. package_name/bundle_identifier)
//     - game_localizations (Store Listing) — via repository real
//       (`createGameLocalizationsRepository(ownerClient)`, RLS-checked, o
//       mesmo caminho de dados que a Server Action `saveStoreListing` usa;
//       a Server Action em si não é chamável fora de um request Next.js
//       porque depende de `cookies()`, então este é o "real path" mais
//       próximo alcançável de um script standalone)
//     - game_versions, builds (status SUCCEEDED), build_artifacts
//       (validados) — resultado de um pipeline de build já provado em
//       sprints anteriores, fora de escopo aqui
//     - releases (DRAFT)
//     - store_connections (linha + secret via RPC `set_store_connection_secret`
//       autenticado — não é INSERT cru na tabela do Vault)
//     - provider_uploads SUCCEEDED — é o RESULTADO do worker de TRANSPORTE
//       (Sprint 2.11d, testado à exaustão em outro sprint); readiness exige
//       esse fato como pré-condição, mas o transporte em si não é o que
//       este sprint prova. Mesmo padrão já usado em
//       `scripts/test-readiness-golden-path.mjs` (GATE 12/13).
//
//   NUNCA FABRICADO — só pode nascer do caminho real sob teste:
//     - submissions: criada via INSERT autenticado (RLS real, não
//       service_role) — real porque passa pelas policies, mas o valor
//       inicial é sempre DRAFT (não escolhido por nós)
//     - submissions.status em qualquer transição além do INSERT inicial —
//       só via RPC `transition_submission`/`complete_submission_job`
//     - integration_jobs (linha, status, checkpoint) — só via
//       `transition_submission` (enqueue) e `runDispatcherTick()`/
//       processor (claim/checkpoint/complete)
//     - submission_events — só via as RPCs acima
//     - qualquer efeito no FakeProviderServer (edits, tracks, review
//       submissions) — só via o processor real chamando os clients HTTP
//       reais
//
// Requer: stack Supabase local rodando (`npx supabase start`), executado
// com `npx tsx scripts/test-submission-integration.mts`. Nunca aponta para
// produção — recusa rodar se as env vars de Supabase não forem
// localhost/127.0.0.1.

import { createRequire } from "node:module";
import { createHash, randomUUID, generateKeyPairSync } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// ---------------------------------------------------------------------
// 0. Env — lido de apps/web/.env.local (mesmo arquivo que `next dev`/
// `next start` usam localmente), nunca de produção. `apps/web/lib/env.ts`
// lê `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SECRET_KEY`/etc eagerly no
// import, então essas variáveis precisam estar em `process.env` ANTES de
// qualquer `import()` de módulos de `apps/web/lib`.
// ---------------------------------------------------------------------
function loadDotEnv(file: string) {
  const raw = readFileSync(file, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadDotEnv(path.join(ROOT, "apps/web/.env.local"));

const API_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
if (!API_URL.includes("127.0.0.1") && !API_URL.includes("localhost")) {
  console.error("❌ Recusando rodar: SUPABASE_URL não aponta para localhost.");
  process.exit(1);
}

const supabaseJsPath = require.resolve("@supabase/supabase-js", {
  paths: [path.join(ROOT, "packages/database")],
});
const { createClient } = require(supabaseJsPath);
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;

const admin = createClient(API_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const DB_CONTAINER = process.env.SUPABASE_DB_CONTAINER ?? "supabase_db_ai-game-studio-os";
function psqlExec(sql: string) {
  execFileSync("docker", ["exec", "-i", DB_CONTAINER, "psql", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres"], {
    input: sql,
    stdio: ["pipe", "pipe", "inherit"],
  });
}

let passed = 0;
let failed = 0;
const failures: string[] = [];
function assert(cond: boolean, label: string) {
  if (cond) {
    passed++;
    console.log(`ok — ${label}`);
  } else {
    failed++;
    failures.push(label);
    console.error(`FALHOU — ${label}`);
  }
}

const RUN = randomUUID().slice(0, 8);
const uid = (seed: string) => {
  const hex = createHash("sha256").update(`${RUN}:${seed}`).digest("hex").slice(0, 32);
  return hex.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
};

async function signInAs(email: string, password: string) {
  const client = createClient(API_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { client, session: data.session };
}

async function createAuthUser(email: string) {
  const password = "TestPassw0rd!23";
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  return { id: data.user.id, email, password };
}

async function main() {
  console.log(`=== Sprint 2.16c — Integrated Submission Lifecycle Proof (run ${RUN}) ===`);

  // -------------------------------------------------------------------
  // 1. Fake provider servers (Google e Apple), processos HTTP reais.
  // -------------------------------------------------------------------
  const { FakeProviderServer } = await import(path.join(ROOT, "packages/integrations/src/test-utils/fake-provider-server.ts"));
  const googleServer = new FakeProviderServer();
  const appleServer = new FakeProviderServer();
  const googleBaseUrl: string = await googleServer.listen();
  const appleBaseUrl: string = await appleServer.listen();
  console.log(`fake Google Play server: ${googleBaseUrl}`);
  console.log(`fake Apple server: ${appleBaseUrl}`);

  // -------------------------------------------------------------------
  // 2. Guard: liga a mutação real SÓ contra os dois hosts locais dos fakes
  // acima — nunca contra host real do Google/Apple (checkStoreMutationGuard
  // é fail-closed por padrão).
  // -------------------------------------------------------------------
  process.env.AGSOS_ALLOW_STORE_MUTATION = "true";
  process.env.AGSOS_STORE_MUTATION_BASE_URL_ALLOWLIST = `${googleBaseUrl},${appleBaseUrl}`;
  process.env.AGSOS_GOOGLE_PLAY_TEST_BASE_URL = googleBaseUrl;
  process.env.AGSOS_APPLE_TEST_BASE_URL = appleBaseUrl;

  // Import tardio (depois de setar env) do dispatcher real — a mesma
  // função que `/api/jobs/tick` chama.
  const { runDispatcherTick } = await import(path.join(ROOT, "apps/web/lib/jobs/dispatcher.ts"));

  const studioId = uid("s1");
  const gameId = uid("g1");
  const projectId = uid("p1");
  const versionId = uid("v1");

  const owner = await createAuthUser(`owner-${RUN}@test.local`);
  const member = await createAuthUser(`member-${RUN}@test.local`);

  try {
    await runScenario({ runDispatcherTick, googleServer, appleServer, googleBaseUrl, appleBaseUrl, studioId, gameId, projectId, versionId, owner, member });
  } finally {
    await cleanup();
    await googleServer.close();
    await appleServer.close();
  }

  async function runScenario(ctx: any) {
    const { runDispatcherTick, googleServer, appleServer, googleBaseUrl, studioId, gameId, projectId, versionId, owner, member } = ctx;

    // -----------------------------------------------------------------
    // FIXTURE — Studio/users/roles (par de FK circular studios<->users,
    // única razão para usar psql direto neste script).
    // -----------------------------------------------------------------
    psqlExec(`
      begin;
      insert into studios (id, name, owner_user_id, created_actor_type, updated_actor_type) values
        ('${studioId}', 'Studio Integration ${RUN}', '${owner.id}', 'SYSTEM', 'SYSTEM');
      insert into users (id, studio_id, email, name, created_actor_type, updated_actor_type) values
        ('${owner.id}', '${studioId}', '${owner.email}', 'Owner', 'SYSTEM', 'SYSTEM'),
        ('${member.id}', '${studioId}', '${member.email}', 'Member', 'SYSTEM', 'SYSTEM');
      commit;
    `);

    const { data: perms } = await admin.from("permissions").select("id, key");
    const ownerRoleId = uid("role-owner");
    const memberRoleId = uid("role-member");
    await admin.from("roles").insert([
      { id: ownerRoleId, studio_id: studioId, name: "Owner", description: "Owner", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM" },
      { id: memberRoleId, studio_id: studioId, name: "Member", description: "Member", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM" },
    ]).throwOnError();
    await admin.from("role_permissions").insert((perms ?? []).map((p: any) => ({ studio_id: studioId, role_id: ownerRoleId, permission_id: p.id }))).throwOnError();
    const memberPerms = (perms ?? []).filter((p: any) => p.key === "publishing.read");
    if (memberPerms.length > 0) {
      await admin.from("role_permissions").insert(memberPerms.map((p: any) => ({ studio_id: studioId, role_id: memberRoleId, permission_id: p.id }))).throwOnError();
    }
    await admin.from("user_roles").insert([
      { studio_id: studioId, user_id: owner.id, role_id: ownerRoleId },
      { studio_id: studioId, user_id: member.id, role_id: memberRoleId },
    ]).throwOnError();

    const { client: ownerClient } = await signInAs(owner.email, owner.password);
    const { client: memberClient } = await signInAs(member.email, member.password);

    await admin.from("projects").insert({ id: projectId, studio_id: studioId, name: "Projeto Integration", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM" }).throwOnError();
    await admin.from("games").insert({
      id: gameId, studio_id: studioId, project_id: projectId, name: "Jogo Integration",
      package_name: "com.agsos.integration", bundle_identifier: "com.agsos.integration",
      created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
    }).throwOnError();
    await admin.from("game_versions").insert({ id: versionId, studio_id: studioId, game_id: gameId, version_number: "1.0.0", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM" }).throwOnError();

    // Store Listing — via repository real (RLS-checked, mesmo caminho de
    // dados que a Server Action `saveStoreListing` usa).
    const { createGameLocalizationsRepository } = await import(path.join(ROOT, "packages/database/src/index.ts"));
    await createGameLocalizationsRepository(ownerClient).upsertPrimary({
      studio_id: studioId, game_id: gameId, title: "Integration Game",
      short_description: "short", full_description: "full",
    });

    const { data: platforms } = await admin.from("platforms").select("id, name");
    const googleId = platforms.find((p: any) => p.name === "Google Play").id;
    const appleId = platforms.find((p: any) => p.name === "App Store").id;

    // -----------------------------------------------------------------
    // Credenciais: Google service account com chave RSA de verdade
    // (o client assina um JWT real), Apple com chave EC de verdade.
    // -----------------------------------------------------------------
    const { privateKey: googlePriv } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const googlePrivPem = googlePriv.export({ type: "pkcs1", format: "pem" }).toString();
    const googleCredentials = {
      packageName: "com.agsos.integration",
      serviceAccountJson: JSON.stringify({
        client_email: "svc@agsos-test.iam.gserviceaccount.com",
        private_key: googlePrivPem,
        token_uri: `${googleBaseUrl}/token`,
      }),
    };

    const { privateKey: applePriv } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
    const applePrivPem = applePriv.export({ type: "pkcs8", format: "pem" }).toString();
    const appleCredentials = { issuerId: "issuer-123", keyId: "KEY123", teamId: "TEAM123", privateKey: applePrivPem };

    // Helper compartilhado (Google) — extraído para ser reaproveitado
    // pelos gates novos do 2.16d (crash-recovery, duplicate-submit) sem
    // duplicar a fixture inteira.
    async function buildGoogleReadySubmission(label: string) {
      const buildId = uid(`gbuild-${label}`);
      await admin.from("builds").insert({ id: buildId, studio_id: studioId, game_version_id: versionId, platform_id: googleId, status: "SUCCEEDED", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM" }).throwOnError();
      const releaseId = uid(`grelease-${label}`);
      await admin.from("releases").insert({ id: releaseId, studio_id: studioId, game_id: gameId, game_version_id: versionId, status: "DRAFT", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM" }).throwOnError();
      const artifactId = uid(`gartifact-${label}`);
      await admin.from("build_artifacts").insert({
        id: artifactId, studio_id: studioId, build_id: buildId, storage_path: `int/${RUN}-${label}.aab`,
        original_filename: "app.aab", file_extension: "aab", size_bytes: 1000, checksum: `chk-${label}`,
        upload_status: "STORED", validation_status: "VALID", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
      }).throwOnError();
      const connId = uid(`gconn-${label}`);
      await admin.from("store_connections").insert({
        id: connId, studio_id: studioId, platform_id: googleId, status: "CONNECTED", display_name: `Google ${label}`,
        created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
      }).throwOnError();
      await ownerClient.rpc("set_store_connection_secret", { p_store_connection_id: connId, p_secret: JSON.stringify(googleCredentials), p_actor_id: owner.id }).throwOnError?.();
      const versionCode = 42;
      await admin.from("provider_uploads").insert({
        id: uid(`gpu-${label}`), studio_id: studioId, build_artifact_id: artifactId, store_connection_id: connId,
        status: "SUCCEEDED", version_code: versionCode, completed_at: new Date().toISOString(),
        created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
      }).throwOnError();
      const { data: sub } = await ownerClient.from("submissions").insert({
        studio_id: studioId, release_id: releaseId, platform_id: googleId, build_id: buildId,
        created_actor_type: "USER", created_actor_id: owner.id, updated_actor_type: "USER", updated_actor_id: owner.id,
      }).select("*").single();
      return { releaseId, buildId, artifactId, connId, submission: sub, versionCode };
    }

    await googleTest({ ownerClient, memberClient, studioId, gameId, versionId, googleId, googleServer, googleBaseUrl, googleCredentials, runDispatcherTick });
    await appleTest({ ownerClient, studioId, gameId, versionId, appleId, appleServer, appleBaseUrl, appleCredentials, runDispatcherTick });
    await crashRecoveryTest({ ownerClient, googleBaseUrl, googleServer, googleCredentials, runDispatcherTick, buildGoogleReadySubmission });
    await duplicateSubmitTest({ ownerClient, googleServer, googleBaseUrl, googleCredentials, runDispatcherTick, buildGoogleReadySubmission });
  }

  // =====================================================================
  // GOOGLE — fluxo de sucesso ponta a ponta + resiliência
  // =====================================================================
  async function googleTest(p: any) {
    const { ownerClient, studioId, gameId, versionId, googleId, googleServer, googleBaseUrl, googleCredentials, runDispatcherTick } = p;

    async function buildReleaseWithReadiness(label: string) {
      const buildId = uid(`gbuild-${label}`);
      await admin.from("builds").insert({ id: buildId, studio_id: studioId, game_version_id: versionId, platform_id: googleId, status: "SUCCEEDED", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM" }).throwOnError();
      const releaseId = uid(`grelease-${label}`);
      await admin.from("releases").insert({ id: releaseId, studio_id: studioId, game_id: gameId, game_version_id: versionId, status: "DRAFT", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM" }).throwOnError();
      const artifactId = uid(`gartifact-${label}`);
      await admin.from("build_artifacts").insert({
        id: artifactId, studio_id: studioId, build_id: buildId, storage_path: `int/${RUN}-${label}.aab`,
        original_filename: "app.aab", file_extension: "aab", size_bytes: 1000, checksum: `chk-${label}`,
        upload_status: "STORED", validation_status: "VALID", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
      }).throwOnError();
      const connId = uid(`gconn-${label}`);
      await admin.from("store_connections").insert({
        id: connId, studio_id: studioId, platform_id: googleId, status: "CONNECTED", display_name: `Google ${label}`,
        created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
      }).throwOnError();
      await ownerClient.rpc("set_store_connection_secret", { p_store_connection_id: connId, p_secret: JSON.stringify(googleCredentials), p_actor_id: owner.id }).throwOnError?.();
      const versionCode = 42;
      await admin.from("provider_uploads").insert({
        id: uid(`gpu-${label}`), studio_id: studioId, build_artifact_id: artifactId, store_connection_id: connId,
        status: "SUCCEEDED", version_code: versionCode, completed_at: new Date().toISOString(),
        created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
      }).throwOnError();
      const { data: sub } = await ownerClient.from("submissions").insert({
        studio_id: studioId, release_id: releaseId, platform_id: googleId, build_id: buildId,
        created_actor_type: "USER", created_actor_id: owner.id, updated_actor_type: "USER", updated_actor_id: owner.id,
      }).select("*").single();
      return { releaseId, buildId, artifactId, connId, submission: sub, versionCode };
    }

    // -------------------------------------------------------------
    // Cenário 1: sucesso ponta a ponta.
    // -------------------------------------------------------------
    {
      const { submission } = await buildReleaseWithReadiness("ok");
      const { data: prep, error: prepErr } = await ownerClient.rpc("transition_submission", { p_submission_id: submission.id, p_action: "PREPARE", p_actor_id: owner.id });
      assert(!prepErr, `Google sucesso: PREPARE sem erro (${prepErr?.message ?? ""})`);
      assert(prep?.submission?.status === "READY_TO_SUBMIT", "Google sucesso: PREPARE -> READY_TO_SUBMIT");

      const { data: sub2, error: subErr } = await ownerClient.rpc("transition_submission", { p_submission_id: submission.id, p_action: "SUBMIT", p_actor_id: owner.id });
      assert(!subErr, `Google sucesso: SUBMIT sem erro (${subErr?.message ?? ""})`);
      assert(sub2?.submission?.status === "SUBMITTING", "Google sucesso: SUBMIT -> SUBMITTING (job enfileirado)");

      googleServer.reset();
      for (let i = 0; i < 8; i++) googleServer.queue("POST", "/token", { kind: "json", status: 200, body: { access_token: "fake-token", expires_in: 3600 } });
      googleServer.setDefault({ kind: "json", status: 200, body: {} });
      googleServer.queue("POST", "/applications/com.agsos.integration/edits", { kind: "json", status: 200, body: { id: "edit-ok" } });
      googleServer.queue("GET", "/applications/com.agsos.integration/edits/edit-ok/tracks/internal", { kind: "json", status: 200, body: { track: "internal", releases: [] } });
      googleServer.queue("PUT", "/applications/com.agsos.integration/edits/edit-ok/tracks/internal", { kind: "json", status: 200, body: { track: "internal", releases: [{ status: "completed", versionCodes: ["42"] }] } });
      googleServer.queue("POST", "/applications/com.agsos.integration/edits/edit-ok:commit", { kind: "json", status: 200, body: { id: "edit-ok" } });

      const finalStatus = await drainUntilTerminal(runDispatcherTick, admin, submission.id, 10);
      assert(finalStatus === "SUBMITTED", `Google sucesso: submission convergiu para SUBMITTED (obteve ${finalStatus})`);

      const { data: job } = await admin.from("integration_jobs").select("*").eq("submission_id", submission.id).single();
      assert(job.status === "SUCCEEDED", "Google sucesso: integration_jobs.status = SUCCEEDED (terminal)");
      assert(job.checkpoint?.editId === "edit-ok", "Google sucesso: checkpoint.editId persistido");
      assert(job.checkpoint?.track === "internal", "Google sucesso: checkpoint.track persistido");
      assert(job.checkpoint?.versionCode === 42, "Google sucesso: checkpoint.versionCode persistido");
      assert(job.checkpoint?.commitConfirmed === true, "Google sucesso: checkpoint.commitConfirmed = true");

      const trackMutations = googleServer.requests.filter((r: any) => r.method === "PUT" && r.url.includes("/tracks/internal"));
      const commits = googleServer.requests.filter((r: any) => r.method === "POST" && r.url.endsWith(":commit"));
      assert(trackMutations.length === 1, `Google sucesso: exatamente 1 track mutation lógica (obteve ${trackMutations.length})`);
      assert(commits.length === 1, `Google sucesso: exatamente 1 commit lógico (obteve ${commits.length})`);

      const { data: events } = await admin.from("submission_events").select("event_type").eq("submission_id", submission.id).order("occurred_at", { ascending: true });
      const seq = (events ?? []).map((e: any) => e.event_type);
      assert(seq[0] === "SubmissionReadyToSubmit" && seq[1] === "SubmissionSubmissionStarted" && seq[seq.length - 1] === "SubmissionSubmitted", `Google sucesso: sequência de submission_events coerente (obteve ${seq.join(",")})`);
    }

    // -------------------------------------------------------------
    // Cenário 2: lost-response no commit — worker roda 2x, converge sem
    // duplicar commit externo (reconciliation via edits.get).
    // -------------------------------------------------------------
    {
      const { submission } = await buildReleaseWithReadiness("lost");
      await ownerClient.rpc("transition_submission", { p_submission_id: submission.id, p_action: "PREPARE", p_actor_id: owner.id });
      await ownerClient.rpc("transition_submission", { p_submission_id: submission.id, p_action: "SUBMIT", p_actor_id: owner.id });

      googleServer.reset();
      for (let i = 0; i < 8; i++) googleServer.queue("POST", "/token", { kind: "json", status: 200, body: { access_token: "fake-token", expires_in: 3600 } });
      googleServer.setDefault({ kind: "json", status: 200, body: {} });
      googleServer.queue("POST", "/applications/com.agsos.integration/edits", { kind: "json", status: 200, body: { id: "edit-lost" } });
      googleServer.queue("GET", "/applications/com.agsos.integration/edits/edit-lost/tracks/internal", { kind: "json", status: 200, body: { track: "internal", releases: [] } });
      googleServer.queue("PUT", "/applications/com.agsos.integration/edits/edit-lost/tracks/internal", { kind: "json", status: 200, body: { track: "internal", releases: [{ status: "completed", versionCodes: ["42"] }] } });
      // 1ª tentativa de commit: conexão cai sem resposta.
      googleServer.queue("POST", "/applications/com.agsos.integration/edits/edit-lost:commit", { kind: "lost" });
      // Reconciliação (edits.get): o Edit AINDA existe -> commit anterior
      // NÃO ocorreu -> processor tenta de novo. NOT_FOUND simularia
      // "commit ocorreu"; aqui simulamos o caso onde a tentativa perdida
      // de fato falhou no lado do provider (Edit sobrevive), então uma
      // 2ª tentativa de commit acontece e o Edit é consumido de verdade.
      googleServer.queue("GET", "/applications/com.agsos.integration/edits/edit-lost", { kind: "json", status: 200, body: { id: "edit-lost", expiryTimeSeconds: "3600" } });
      googleServer.queue("POST", "/applications/com.agsos.integration/edits/edit-lost:commit", { kind: "json", status: 200, body: { id: "edit-lost" } });

      const finalStatus = await drainUntilTerminal(runDispatcherTick, admin, submission.id, 12);
      assert(finalStatus === "SUBMITTED", `Google lost-response: convergiu para SUBMITTED (obteve ${finalStatus})`);
      const commitAttempts = googleServer.requests.filter((r: any) => r.method === "POST" && r.url.endsWith(":commit"));
      assert(commitAttempts.length === 2, `Google lost-response: 2 TENTATIVAS de commit HTTP (1 perdida + 1 bem-sucedida), obteve ${commitAttempts.length}`);
      const { data: job } = await admin.from("integration_jobs").select("checkpoint").eq("submission_id", submission.id).single();
      assert(job.checkpoint?.commitConfirmed === true, "Google lost-response: checkpoint final commitConfirmed=true (nenhum commit cego duplicado)");
    }

    // -------------------------------------------------------------
    // Cenário 3: retry após 429/500 — primeira tentativa de commit falha
    // retryable, segunda sucede; classificação RETRYABLE, attempt
    // incrementa, sem duplicar mutação externa.
    // -------------------------------------------------------------
    {
      const { submission } = await buildReleaseWithReadiness("retry");
      await ownerClient.rpc("transition_submission", { p_submission_id: submission.id, p_action: "PREPARE", p_actor_id: owner.id });
      await ownerClient.rpc("transition_submission", { p_submission_id: submission.id, p_action: "SUBMIT", p_actor_id: owner.id });

      googleServer.reset();
      for (let i = 0; i < 8; i++) googleServer.queue("POST", "/token", { kind: "json", status: 200, body: { access_token: "fake-token", expires_in: 3600 } });
      googleServer.setDefault({ kind: "json", status: 200, body: {} });
      googleServer.queue("POST", "/applications/com.agsos.integration/edits", { kind: "json", status: 200, body: { id: "edit-retry" } });
      googleServer.queue("GET", "/applications/com.agsos.integration/edits/edit-retry/tracks/internal", { kind: "json", status: 200, body: { track: "internal", releases: [] } });
      googleServer.queue("PUT", "/applications/com.agsos.integration/edits/edit-retry/tracks/internal", { kind: "json", status: 200, body: { track: "internal", releases: [{ status: "completed", versionCodes: ["42"] }] } });
      googleServer.queue("POST", "/applications/com.agsos.integration/edits/edit-retry:commit", { kind: "json", status: 500, body: {} });
      // Depois de um commit RETRYABLE (500), o processor reentra pela
      // reconciliation branch (GATE 11 — `commitAttempted && !commitConfirmed`)
      // ANTES de tentar de novo: consulta `edits.get`. Edit ainda existe
      // (commit de fato não ocorreu no provider) -> seguro repetir.
      googleServer.queue("GET", "/applications/com.agsos.integration/edits/edit-retry", { kind: "json", status: 200, body: { id: "edit-retry", expiryTimeSeconds: "3600" } });
      googleServer.queue("POST", "/applications/com.agsos.integration/edits/edit-retry:commit", { kind: "json", status: 200, body: { id: "edit-retry" } });

      // RETRY_WAIT do dispatcher usa backoff (nextAttemptAt no futuro) —
      // `claim_integration_jobs` só reivindica jobs com next_attempt_at <=
      // now(). Em vez de esperar o backoff real, avançamos o relógio do
      // job direto no Postgres entre tentativas (mesma técnica que
      // `submission_lifecycle_test.sql` usaria para testar retry sem
      // sleep real) — não fabrica o RESULTADO, só evita um teste lento.
      let finalStatus = "SUBMITTING";
      let attempts = 0;
      for (let i = 0; i < 12 && finalStatus === "SUBMITTING"; i++) {
        await runDispatcherTick();
        await admin.from("integration_jobs").update({ scheduled_at: new Date().toISOString() }).eq("submission_id", submission.id).in("status", ["RETRY_WAIT"]);
        const { data: sub } = await admin.from("submissions").select("status").eq("id", submission.id).single();
        finalStatus = sub.status;
        attempts++;
      }
      assert(finalStatus === "SUBMITTED", `Google retry 500->200: convergiu para SUBMITTED (obteve ${finalStatus}, ${attempts} ticks)`);
      const { data: job } = await admin.from("integration_jobs").select("attempt, status").eq("submission_id", submission.id).single();
      assert(job.attempt >= 1, `Google retry 500->200: attempt incrementou (${job.attempt})`);
      assert(job.status === "SUCCEEDED", "Google retry 500->200: job terminal SUCCEEDED");
      const commitAttempts = googleServer.requests.filter((r: any) => r.method === "POST" && r.url.endsWith(":commit"));
      assert(commitAttempts.length === 2, `Google retry 500->200: exatamente 2 tentativas HTTP de commit (1 falha + 1 sucesso), obteve ${commitAttempts.length}`);
    }

    // -------------------------------------------------------------
    // Cenário 4: concorrência real — dois `runDispatcherTick()` disparados
    // via Promise.all (não sequencial) competindo pelo mesmo job QUEUED.
    // `claim_integration_jobs` usa `FOR UPDATE SKIP LOCKED` — confirma
    // exatamente 1 processamento lógico (1 chamada real ao provider por
    // etapa, nunca 2 workers processando o mesmo job na mesma etapa).
    // -------------------------------------------------------------
    {
      const { submission } = await buildReleaseWithReadiness("conc");
      await ownerClient.rpc("transition_submission", { p_submission_id: submission.id, p_action: "PREPARE", p_actor_id: owner.id });
      await ownerClient.rpc("transition_submission", { p_submission_id: submission.id, p_action: "SUBMIT", p_actor_id: owner.id });

      googleServer.reset();
      for (let i = 0; i < 8; i++) googleServer.queue("POST", "/token", { kind: "json", status: 200, body: { access_token: "fake-token", expires_in: 3600 } });
      googleServer.setDefault({ kind: "json", status: 200, body: {} });
      googleServer.queue("POST", "/applications/com.agsos.integration/edits", { kind: "json", status: 200, body: { id: "edit-conc" } });

      // Dois dispatchers reais disputando o MESMO claim, de verdade em
      // paralelo (Promise.all, não sequencial).
      const [r1, r2] = await Promise.all([runDispatcherTick(), runDispatcherTick()]);
      const totalProcessed = r1.processedJobs + r2.processedJobs;
      assert(totalProcessed === 1, `Google concorrência: exatamente 1 dos 2 ticks concorrentes processou o job (obteve ${totalProcessed})`);
      const createEditCalls = googleServer.requests.filter((r: any) => r.method === "POST" && r.url === "/applications/com.agsos.integration/edits");
      assert(createEditCalls.length === 1, `Google concorrência: exatamente 1 createEdit lógico apesar de 2 workers competindo (obteve ${createEditCalls.length})`);

      // Drena o resto do fluxo normalmente para não deixar lixo pendente.
      googleServer.queue("GET", "/applications/com.agsos.integration/edits/edit-conc/tracks/internal", { kind: "json", status: 200, body: { track: "internal", releases: [] } });
      googleServer.queue("PUT", "/applications/com.agsos.integration/edits/edit-conc/tracks/internal", { kind: "json", status: 200, body: { track: "internal", releases: [{ status: "completed", versionCodes: ["42"] }] } });
      googleServer.queue("POST", "/applications/com.agsos.integration/edits/edit-conc:commit", { kind: "json", status: 200, body: { id: "edit-conc" } });
      const finalStatus = await drainUntilTerminal(runDispatcherTick, admin, submission.id, 10);
      assert(finalStatus === "SUBMITTED", `Google concorrência: após drenar, converge para SUBMITTED (obteve ${finalStatus})`);
    }
  }

  // =====================================================================
  // APPLE — fluxo de sucesso ponta a ponta
  // =====================================================================
  async function appleTest(p: any) {
    const { ownerClient, studioId, gameId, versionId, appleId, appleServer, appleCredentials, runDispatcherTick } = p;

    const buildId = uid("abuild-ok");
    await admin.from("builds").insert({ id: buildId, studio_id: studioId, game_version_id: versionId, platform_id: appleId, status: "SUCCEEDED", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM" }).throwOnError();
    const releaseId = uid("arelease-ok");
    await admin.from("releases").insert({ id: releaseId, studio_id: studioId, game_id: gameId, game_version_id: versionId, status: "DRAFT", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM" }).throwOnError();
    const artifactId = uid("aartifact-ok");
    await admin.from("build_artifacts").insert({
      id: artifactId, studio_id: studioId, build_id: buildId, storage_path: `int/${RUN}-apple.ipa`,
      original_filename: "app.ipa", file_extension: "ipa", size_bytes: 1000, checksum: "chk-apple",
      upload_status: "STORED", validation_status: "VALID", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
    }).throwOnError();
    const connId = uid("aconn-ok");
    await admin.from("store_connections").insert({
      id: connId, studio_id: studioId, platform_id: appleId, status: "CONNECTED", display_name: "Apple ok",
      created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
    }).throwOnError();
    await ownerClient.rpc("set_store_connection_secret", { p_store_connection_id: connId, p_secret: JSON.stringify(appleCredentials), p_actor_id: owner.id }).throwOnError?.();
    await admin.from("provider_uploads").insert({
      id: uid("apu-ok"), studio_id: studioId, build_artifact_id: artifactId, store_connection_id: connId,
      status: "SUCCEEDED", apple_build_upload_id: "BU-OK", completed_at: new Date().toISOString(),
      created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
    }).throwOnError();

    const { data: submission } = await ownerClient.from("submissions").insert({
      studio_id: studioId, release_id: releaseId, platform_id: appleId, build_id: buildId,
      created_actor_type: "USER", created_actor_id: owner.id, updated_actor_type: "USER", updated_actor_id: owner.id,
    }).select("*").single();

    const { data: prep, error: prepErr } = await ownerClient.rpc("transition_submission", { p_submission_id: submission.id, p_action: "PREPARE", p_actor_id: owner.id });
    assert(!prepErr, `Apple sucesso: PREPARE sem erro (${prepErr?.message ?? ""})`);
    assert(prep?.submission?.status === "READY_TO_SUBMIT", "Apple sucesso: PREPARE -> READY_TO_SUBMIT");

    const { data: sub2, error: subErr } = await ownerClient.rpc("transition_submission", { p_submission_id: submission.id, p_action: "SUBMIT", p_actor_id: owner.id });
    assert(!subErr, `Apple sucesso: SUBMIT sem erro (${subErr?.message ?? ""})`);
    assert(sub2?.submission?.status === "SUBMITTING", "Apple sucesso: SUBMIT -> SUBMITTING");

    appleServer.reset();
    appleServer.setDefault({ kind: "json", status: 200, body: {} });
    // FakeProviderServer roteia por `${method} ${pathname}` (sem query
    // string, ver `handle()`/`url.pathname` em fake-provider-server.ts) —
    // registrar com a query concatenada (como uma 1ª tentativa deste
    // script fez) nunca casa a rota e cai no `defaultResponse` genérico,
    // que não tem os campos esperados (`data`) e quebra o parse do client
    // com UNEXPECTED_ERROR. Mesmo padrão de `apple/client.submission.test.ts`.
    // `adapter.listApps()` roda em TODA reentrada do processor (não só na
    // 1ª etapa — resolve `appId` de novo a cada passo, decisão documentada
    // em `submission-apple.ts`), então precisa de uma resposta por tick,
    // não só uma.
    for (let i = 0; i < 6; i++) {
      appleServer.queue("GET", "/apps", { kind: "json", status: 200, body: { data: [{ id: "app-1", attributes: { name: "Integration Game", bundleId: "com.agsos.integration", sku: "sku-1" } }] } });
    }
    appleServer.queue("GET", "/reviewSubmissions", { kind: "json", status: 200, body: { data: [] } });
    appleServer.queue("POST", "/reviewSubmissions", { kind: "json", status: 200, body: { data: { id: "rs-ok", attributes: { state: "READY_FOR_REVIEW" } } } });
    appleServer.queue("POST", "/reviewSubmissionItems", { kind: "json", status: 200, body: { data: { id: "rsi-ok" } } });
    appleServer.queue("PATCH", "/reviewSubmissions/rs-ok", { kind: "json", status: 200, body: { data: { id: "rs-ok", attributes: { state: "WAITING_FOR_REVIEW" } } } });

    const finalStatus = await drainUntilTerminal(runDispatcherTick, admin, submission.id, 10);
    assert(finalStatus === "SUBMITTED", `Apple sucesso: submission convergiu para SUBMITTED (obteve ${finalStatus})`);

    const { data: job } = await admin.from("integration_jobs").select("*").eq("submission_id", submission.id).single();
    assert(job.status === "SUCCEEDED", "Apple sucesso: integration_jobs.status = SUCCEEDED");
    assert(job.checkpoint?.reviewSubmissionId === "rs-ok", "Apple sucesso: checkpoint.reviewSubmissionId persistido");
    assert(job.checkpoint?.reviewSubmissionItemId === "rsi-ok", "Apple sucesso: checkpoint.reviewSubmissionItemId persistido");
    assert(job.checkpoint?.submitConfirmed === true, "Apple sucesso: checkpoint.submitConfirmed = true");

    const createRs = appleServer.requests.filter((r: any) => r.method === "POST" && r.url === "/reviewSubmissions");
    const createItems = appleServer.requests.filter((r: any) => r.method === "POST" && r.url === "/reviewSubmissionItems");
    const submits = appleServer.requests.filter((r: any) => r.method === "PATCH" && r.url === "/reviewSubmissions/rs-ok");
    assert(createRs.length === 1, `Apple sucesso: exatamente 1 Review Submission criada (obteve ${createRs.length})`);
    assert(createItems.length === 1, `Apple sucesso: exatamente 1 Review Submission Item criado (obteve ${createItems.length})`);
    assert(submits.length === 1, `Apple sucesso: exatamente 1 submit lógico (obteve ${submits.length})`);
  }

  // =====================================================================
  // GATE A/6/7 (2.16d) — WORKER CRASH RECOVERY.
  //
  // Usa o mecanismo REAL: `claim_integration_jobs` (claim atômico com
  // lease), `requeue_stale_jobs` (recovery de worker morto), reconciliation
  // do processor (GATE 11 do 2.16b). Não fabricamos o RESULTADO
  // (submission.status/job.status finais nascem só do caminho real) — só
  // simulamos a PASSAGEM DO TEMPO (lease_expires_at para o passado, mesma
  // técnica já usada no cenário de retry 500->200 do 2.16c) e a MORTE do
  // processo (paramos de chamar o dispatcher no meio de um step, em vez de
  // matar um processo Node de verdade — inviável de simular literalmente
  // dentro do mesmo processo do test runner).
  //
  // Cenário 1 (crash ANTES de qualquer efeito externo, genérico): job
  // reivindicado, worker morre antes de sequer chamar o provider. Lease
  // expira, `requeue_stale_jobs` reclama, um novo worker processa do zero
  // — nenhum efeito duplicado porque nenhum efeito jamais ocorreu.
  //
  // Cenário 2 (crash DEPOIS do provider aceitar a mutação — o caso mais
  // importante, GATE 7): reproduz o gap real que este sub-sprint encontrou
  // e corrigiu em `submission-google-play.ts` — antes do fix,
  // `commitAttempted` só era persistido DEPOIS do `commitEdit` retornar; um
  // crash entre o commit ser aceito pelo provider e o retorno da função
  // perdia essa marca, arriscando um segundo commit lógico cego na
  // reentrada. Simulamos a morte chamando o MESMO client HTTP real que o
  // processor usa (`createGooglePlayPublishingAdapter`) diretamente, fora
  // do processor, e então "esquecendo" de persistir o resultado — o
  // processor real, ao reentrar, só enxerga o que estava de fato na
  // coluna `checkpoint` no momento do crash (com o fix: `commitAttempted:
  // true` já lá).
  // =====================================================================
  async function crashRecoveryTest(p: any) {
    const { ownerClient, googleServer, googleBaseUrl, googleCredentials, runDispatcherTick, buildGoogleReadySubmission } = p;
    const integrationsPath = require.resolve("@agsos/integrations", { paths: [path.join(ROOT, "apps/web")] });
    const { createGooglePlayPublishingAdapter } = await import(integrationsPath);

    // -------------------------------------------------------------
    // Cenário 1 — crash genérico ANTES de qualquer efeito externo.
    // -------------------------------------------------------------
    {
      const { submission } = await buildGoogleReadySubmission("crashgen");
      await ownerClient.rpc("transition_submission", { p_submission_id: submission.id, p_action: "PREPARE", p_actor_id: owner.id });
      await ownerClient.rpc("transition_submission", { p_submission_id: submission.id, p_action: "SUBMIT", p_actor_id: owner.id });

      const { data: jobBefore } = await admin.from("integration_jobs").select("*").eq("submission_id", submission.id).single();
      assert(jobBefore.status === "QUEUED", "Crash genérico: job nasce QUEUED");

      // Worker A reivindica o job com lease curta (2s) e "morre" — nunca
      // chama o provider, nunca chama checkpoint/complete.
      const claimed: any[] = await admin.rpc("claim_integration_jobs", { p_worker_id: "crash-worker-gen", p_limit: 5, p_lease_seconds: 2 }).then((r: any) => r.data ?? []);
      const ourJob = claimed.find((j: any) => j.id === jobBefore.id);
      assert(!!ourJob, "Crash genérico: worker A reivindicou o job (claim atômico real)");
      assert(ourJob.status === "CLAIMED" && ourJob.claimed_by === "crash-worker-gen", "Crash genérico: job CLAIMED pelo worker A");

      // Passagem do tempo real: espera a lease de fato expirar (2s) — sem
      // isso não é honesto chamar de "expirou".
      await new Promise((r) => setTimeout(r, 2200));

      googleServer.reset();
      for (let i = 0; i < 8; i++) googleServer.queue("POST", "/token", { kind: "json", status: 200, body: { access_token: "fake-token", expires_in: 3600 } });
      googleServer.setDefault({ kind: "json", status: 200, body: {} });
      googleServer.queue("POST", "/applications/com.agsos.integration/edits", { kind: "json", status: 200, body: { id: "edit-crashgen" } });
      googleServer.queue("GET", "/applications/com.agsos.integration/edits/edit-crashgen/tracks/internal", { kind: "json", status: 200, body: { track: "internal", releases: [] } });
      googleServer.queue("PUT", "/applications/com.agsos.integration/edits/edit-crashgen/tracks/internal", { kind: "json", status: 200, body: { track: "internal", releases: [{ status: "completed", versionCodes: ["42"] }] } });
      googleServer.queue("POST", "/applications/com.agsos.integration/edits/edit-crashgen:commit", { kind: "json", status: 200, body: { id: "edit-crashgen" } });

      // Novo tick: `requeue_stale_jobs` (dentro de `runDispatcherTick`)
      // deve recuperar o job morto ANTES de reivindicar qualquer coisa nova
      // — mecanismo real, não simulado.
      const tick1 = await runDispatcherTick();
      assert(tick1.requeuedStaleJobs >= 1, `Crash genérico: requeue_stale_jobs recuperou >=1 job (obteve ${tick1.requeuedStaleJobs})`);

      const { data: jobAfterRequeue } = await admin.from("integration_jobs").select("*").eq("id", jobBefore.id).single();
      assert(jobAfterRequeue.attempt === jobBefore.attempt + 1, `Crash genérico: attempt incrementou pela recovery (${jobBefore.attempt} -> ${jobAfterRequeue.attempt})`);
      assert(jobAfterRequeue.last_error_code === "WORKER_LEASE_EXPIRED", "Crash genérico: last_error_code = WORKER_LEASE_EXPIRED");

      const finalStatus = await drainUntilTerminal(runDispatcherTick, admin, submission.id, 10);
      assert(finalStatus === "SUBMITTED", `Crash genérico: novo worker processou do zero e convergiu para SUBMITTED (obteve ${finalStatus})`);
      const createEditCalls = googleServer.requests.filter((r: any) => r.method === "POST" && r.url === "/applications/com.agsos.integration/edits");
      assert(createEditCalls.length === 1, `Crash genérico: exatamente 1 createEdit lógico (nenhum efeito do worker morto, que nunca chegou a chamar o provider) — obteve ${createEditCalls.length}`);
      const { data: finalJob } = await admin.from("integration_jobs").select("status, checkpoint").eq("submission_id", submission.id).single();
      assert(finalJob.status === "SUCCEEDED", "Crash genérico: job terminal SUCCEEDED (nenhum RUNNING/CLAIMED preso)");
    }

    // -------------------------------------------------------------
    // Cenário 2 — crash DEPOIS do provider aceitar a mutação (GATE 7).
    // -------------------------------------------------------------
    {
      const { submission } = await buildGoogleReadySubmission("crasheff");
      await ownerClient.rpc("transition_submission", { p_submission_id: submission.id, p_action: "PREPARE", p_actor_id: owner.id });
      await ownerClient.rpc("transition_submission", { p_submission_id: submission.id, p_action: "SUBMIT", p_actor_id: owner.id });

      googleServer.reset();
      for (let i = 0; i < 8; i++) googleServer.queue("POST", "/token", { kind: "json", status: 200, body: { access_token: "fake-token", expires_in: 3600 } });
      googleServer.setDefault({ kind: "json", status: 200, body: {} });
      googleServer.queue("POST", "/applications/com.agsos.integration/edits", { kind: "json", status: 200, body: { id: "edit-crasheff" } });
      googleServer.queue("GET", "/applications/com.agsos.integration/edits/edit-crasheff/tracks/internal", { kind: "json", status: 200, body: { track: "internal", releases: [] } });
      googleServer.queue("PUT", "/applications/com.agsos.integration/edits/edit-crasheff/tracks/internal", { kind: "json", status: 200, body: { track: "internal", releases: [{ status: "completed", versionCodes: ["42"] }] } });

      // 2 ticks reais: createEdit (continue) -> track update (continue).
      // Job volta para QUEUED com checkpoint {editId, track, trackUpdated}.
      await runDispatcherTick();
      await runDispatcherTick();
      const { data: jobMid } = await admin.from("integration_jobs").select("*").eq("submission_id", submission.id).single();
      assert(jobMid.status === "QUEUED", "Crash pós-efeito: job de volta a QUEUED após 2 steps de checkpoint reais");
      assert(jobMid.checkpoint?.editId === "edit-crasheff" && jobMid.checkpoint?.trackUpdated === true, "Crash pós-efeito: checkpoint real tem editId+trackUpdated antes do commit");
      assert(!jobMid.checkpoint?.commitAttempted, "Crash pós-efeito: commitAttempted ainda ausente (nenhuma tentativa de commit ainda)");

      // Worker B reivindica (claim REAL, lease curta) para a etapa final.
      const claimed: any[] = await admin.rpc("claim_integration_jobs", { p_worker_id: "crash-worker-eff", p_limit: 5, p_lease_seconds: 2 }).then((r: any) => r.data ?? []);
      const ourJob = claimed.find((j: any) => j.id === jobMid.id);
      assert(!!ourJob, "Crash pós-efeito: worker B reivindicou o job para a etapa de commit");

      // Reproduz exatamente o que o processor real faz agora (pós-fix):
      // persiste `commitAttempted: true` no checkpoint ANTES de discar a
      // chamada de rede — mesma escrita que `submission-google-play.ts`
      // faz hoje antes de `adapter.commitEdit`.
      const preCommitCheckpoint = { ...jobMid.checkpoint, commitAttempted: true, externalResultState: "ATTEMPTED" };
      await admin.from("integration_jobs").update({ checkpoint: preCommitCheckpoint }).eq("id", jobMid.id);

      // Chamada HTTP REAL ao fake provider — o mesmo client (`@agsos/integrations`)
      // que o processor usaria — o provider ACEITA a mutação de verdade.
      const adapter = createGooglePlayPublishingAdapter(googleCredentials);
      googleServer.queue("POST", "/applications/com.agsos.integration/edits/edit-crasheff:commit", { kind: "json", status: 200, body: { id: "edit-crasheff" } });
      const committed = await adapter.commitEdit("edit-crasheff", googleBaseUrl);
      assert(committed.ok === true, "Crash pós-efeito: commit HTTP real foi ACEITO pelo provider (efeito externo ocorreu de fato)");

      // "Morte" do worker B: NENHUM checkpointAndRelease/complete é
      // chamado a partir daqui — job fica preso em CLAIMED com o
      // checkpoint que já tínhamos persistido (commitAttempted:true, sem
      // commitConfirmed), exatamente o estado que um crash real deixaria
      // para trás.
      await new Promise((r) => setTimeout(r, 2200)); // lease (2s) expira de verdade.

      // Reconciliação: quando o novo worker reentrar e consultar
      // `edits.get`, o Edit já não existe (o Google consumiu no commit
      // real acima) -> 404 -> processor converge para SUBMITTED sem
      // tentar um segundo commit.
      googleServer.queue("GET", "/applications/com.agsos.integration/edits/edit-crasheff", { kind: "json", status: 404, body: { error: "not found" } });

      const tick = await runDispatcherTick();
      assert(tick.requeuedStaleJobs >= 1, `Crash pós-efeito: requeue_stale_jobs recuperou o job do worker B morto (obteve ${tick.requeuedStaleJobs})`);

      const finalStatus = await drainUntilTerminal(runDispatcherTick, admin, submission.id, 10);
      assert(finalStatus === "SUBMITTED", `Crash pós-efeito: reconciliação convergiu para SUBMITTED sem repetir cegamente (obteve ${finalStatus})`);

      const commitCalls = googleServer.requests.filter((r: any) => r.method === "POST" && r.url.endsWith(":commit"));
      assert(commitCalls.length === 1, `Crash pós-efeito: exatamente 1 commit lógico HTTP no total (o do worker B "morto" antes do crash) — obteve ${commitCalls.length}`);
      const editGetCalls = googleServer.requests.filter((r: any) => r.method === "GET" && r.url === "/applications/com.agsos.integration/edits/edit-crasheff");
      assert(editGetCalls.length === 1, "Crash pós-efeito: exatamente 1 reconciliação (edits.get) consultada pelo novo worker antes de decidir");

      const { data: finalJob } = await admin.from("integration_jobs").select("status, checkpoint").eq("submission_id", submission.id).single();
      assert(finalJob.status === "SUCCEEDED", "Crash pós-efeito: job terminal SUCCEEDED via reconciliação, nunca update manual");
      assert(finalJob.checkpoint?.commitConfirmed === true, "Crash pós-efeito: checkpoint final commitConfirmed=true via edits.get, não via commit repetido");
    }
  }

  // =====================================================================
  // GATE B/8/9 (2.16d) — DUPLICATE SUBMIT DEDICADO.
  // =====================================================================
  async function duplicateSubmitTest(p: any) {
    const { ownerClient, googleServer, googleBaseUrl, googleCredentials, runDispatcherTick, buildGoogleReadySubmission } = p;

    // -------------------------------------------------------------
    // Cenário 1 — duas chamadas SUBMIT concorrentes de verdade
    // (Promise.all, não sequencial) na MESMA Submission READY_TO_SUBMIT.
    // -------------------------------------------------------------
    {
      const { submission } = await buildGoogleReadySubmission("dupsubmit");
      await ownerClient.rpc("transition_submission", { p_submission_id: submission.id, p_action: "PREPARE", p_actor_id: owner.id }).throwOnError?.();

      const [r1, r2] = await Promise.all([
        ownerClient.rpc("transition_submission", { p_submission_id: submission.id, p_action: "SUBMIT", p_actor_id: owner.id }),
        ownerClient.rpc("transition_submission", { p_submission_id: submission.id, p_action: "SUBMIT", p_actor_id: owner.id }),
      ]);

      assert(!r1.error && !r2.error, `Duplicate submit: nenhuma das 2 chamadas concorrentes levantou erro inesperado (r1=${r1.error?.message ?? "ok"}, r2=${r2.error?.message ?? "ok"})`);
      const noops = [r1.data?.noop, r2.data?.noop].filter((n) => n === true).length;
      const reals = [r1.data?.noop, r2.data?.noop].filter((n) => n === false).length;
      assert(reals === 1, `Duplicate submit: exatamente 1 das 2 chamadas concorrentes fez a transição real (obteve ${reals})`);
      assert(noops === 1, `Duplicate submit: a outra chamada retornou noop:true (idempotência via row lock), obteve ${noops}`);

      const { data: sub } = await admin.from("submissions").select("status").eq("id", submission.id).single();
      assert(sub.status === "SUBMITTING", "Duplicate submit: submission transicionou 1x para SUBMITTING (nunca duas)");

      const { data: jobs } = await admin.from("integration_jobs").select("id, status").eq("submission_id", submission.id);
      assert((jobs ?? []).length === 1, `Duplicate submit: exatamente 1 integration_job criado (obteve ${(jobs ?? []).length})`);

      const { data: events } = await admin.from("submission_events").select("event_type").eq("submission_id", submission.id).eq("event_type", "SubmissionSubmissionStarted");
      assert((events ?? []).length === 1, `Duplicate submit: exatamente 1 evento SubmissionSubmissionStarted (obteve ${(events ?? []).length})`);

      // Dispatcher concorrente ainda processa o job resultante 1x só
      // (mesma garantia de `claim_integration_jobs FOR UPDATE SKIP LOCKED`
      // já provada no cenário de concorrência do Google — reconfirmada
      // aqui sobre o job nascido de uma corrida de SUBMIT, não só de um
      // SUBMIT único).
      googleServer.reset();
      for (let i = 0; i < 8; i++) googleServer.queue("POST", "/token", { kind: "json", status: 200, body: { access_token: "fake-token", expires_in: 3600 } });
      googleServer.setDefault({ kind: "json", status: 200, body: {} });
      googleServer.queue("POST", "/applications/com.agsos.integration/edits", { kind: "json", status: 200, body: { id: "edit-dupsubmit" } });
      const [t1, t2] = await Promise.all([runDispatcherTick(), runDispatcherTick()]);
      assert(t1.processedJobs + t2.processedJobs === 1, `Duplicate submit: dispatcher concorrente ainda processa o job 1x só (obteve ${t1.processedJobs + t2.processedJobs})`);
      const createEditCalls = googleServer.requests.filter((r: any) => r.method === "POST" && r.url === "/applications/com.agsos.integration/edits");
      assert(createEditCalls.length === 1, `Duplicate submit: 1 único createEdit lógico apesar da corrida (obteve ${createEditCalls.length})`);

      // Drena o resto para não deixar job pendente.
      googleServer.queue("GET", "/applications/com.agsos.integration/edits/edit-dupsubmit/tracks/internal", { kind: "json", status: 200, body: { track: "internal", releases: [] } });
      googleServer.queue("PUT", "/applications/com.agsos.integration/edits/edit-dupsubmit/tracks/internal", { kind: "json", status: 200, body: { track: "internal", releases: [{ status: "completed", versionCodes: ["42"] }] } });
      googleServer.queue("POST", "/applications/com.agsos.integration/edits/edit-dupsubmit:commit", { kind: "json", status: 200, body: { id: "edit-dupsubmit" } });
      const finalStatus = await drainUntilTerminal(runDispatcherTick, admin, submission.id, 10);
      assert(finalStatus === "SUBMITTED", `Duplicate submit: após drenar, converge para SUBMITTED (obteve ${finalStatus})`);
    }

    // -------------------------------------------------------------
    // Cenário 2 — job já ativo (SUBMITTING) e usuário tenta SUBMIT/RETRY
    // de novo (não concorrente — sequencial, job real já em voo).
    // -------------------------------------------------------------
    {
      const { submission } = await buildGoogleReadySubmission("dupretry");
      await ownerClient.rpc("transition_submission", { p_submission_id: submission.id, p_action: "PREPARE", p_actor_id: owner.id }).throwOnError?.();
      const first = await ownerClient.rpc("transition_submission", { p_submission_id: submission.id, p_action: "SUBMIT", p_actor_id: owner.id });
      assert(!first.error && first.data?.noop === false, "Duplicate submit + retry ativo: 1º SUBMIT real, sem erro");

      const { data: jobsBefore } = await admin.from("integration_jobs").select("id").eq("submission_id", submission.id);
      assert((jobsBefore ?? []).length === 1, "Duplicate submit + retry ativo: 1 job ativo após o 1º SUBMIT");

      // Job está QUEUED/RUNNING (SUBMITTING) — usuário aperta Retry de
      // novo enquanto ainda em voo.
      const second = await ownerClient.rpc("transition_submission", { p_submission_id: submission.id, p_action: "RETRY", p_actor_id: owner.id });
      assert(!second.error, `Duplicate submit + retry ativo: 2ª chamada (RETRY) não levanta erro (${second.error?.message ?? "ok"})`);
      assert(second.data?.noop === true, "Duplicate submit + retry ativo: 2ª chamada é noop (bloqueio/dedup, nenhuma nova transição)");

      const { data: jobsAfter } = await admin.from("integration_jobs").select("id").eq("submission_id", submission.id);
      assert((jobsAfter ?? []).length === 1, `Duplicate submit + retry ativo: ainda só 1 job ativo (nenhum segundo criado pelo RETRY durante SUBMITTING) — obteve ${(jobsAfter ?? []).length}`);

      const { data: sub } = await admin.from("submissions").select("status").eq("id", submission.id).single();
      assert(sub.status === "SUBMITTING", "Duplicate submit + retry ativo: submission permanece SUBMITTING (1 transição só)");

      // Drena para não deixar lixo pendente — simula sucesso.
      googleServer.reset();
      for (let i = 0; i < 8; i++) googleServer.queue("POST", "/token", { kind: "json", status: 200, body: { access_token: "fake-token", expires_in: 3600 } });
      googleServer.setDefault({ kind: "json", status: 200, body: {} });
      googleServer.queue("POST", "/applications/com.agsos.integration/edits", { kind: "json", status: 200, body: { id: "edit-dupretry" } });
      googleServer.queue("GET", "/applications/com.agsos.integration/edits/edit-dupretry/tracks/internal", { kind: "json", status: 200, body: { track: "internal", releases: [] } });
      googleServer.queue("PUT", "/applications/com.agsos.integration/edits/edit-dupretry/tracks/internal", { kind: "json", status: 200, body: { track: "internal", releases: [{ status: "completed", versionCodes: ["42"] }] } });
      googleServer.queue("POST", "/applications/com.agsos.integration/edits/edit-dupretry:commit", { kind: "json", status: 200, body: { id: "edit-dupretry" } });
      const finalStatus = await drainUntilTerminal(runDispatcherTick, admin, submission.id, 10);
      assert(finalStatus === "SUBMITTED", `Duplicate submit + retry ativo: após drenar, converge para SUBMITTED (obteve ${finalStatus})`);
    }
  }

  async function drainUntilTerminal(runDispatcherTick: any, admin: any, submissionId: string, maxTicks: number): Promise<string> {
    let status = "SUBMITTING";
    for (let i = 0; i < maxTicks; i++) {
      await runDispatcherTick();
      const { data: sub } = await admin.from("submissions").select("status").eq("id", submissionId).single();
      status = sub.status;
      if (status !== "SUBMITTING" && status !== "DRAFT" && status !== "READY_TO_SUBMIT") break;
      // job pode ter ido para RETRY_WAIT com backoff futuro — força
      // next_attempt_at para agora para não esperar o backoff real (não
      // fabrica o resultado, só evita um teste lento).
      await admin.from("integration_jobs").update({ scheduled_at: new Date().toISOString() }).eq("submission_id", submissionId).eq("status", "RETRY_WAIT");
    }
    return status;
  }

  async function cleanup() {
    psqlExec(`
      begin;
      update store_connections set credentials_ref = gen_random_uuid()::text
        where studio_id = '${studioId}' and credentials_ref !~ '^[0-9a-f-]{36}$';
      delete from submission_events where studio_id = '${studioId}';
      delete from integration_jobs where studio_id = '${studioId}';
      delete from submissions where studio_id = '${studioId}';
      delete from provider_uploads where studio_id = '${studioId}';
      delete from store_connections where studio_id = '${studioId}';
      delete from build_artifacts where studio_id = '${studioId}';
      delete from releases where studio_id = '${studioId}';
      delete from builds where studio_id = '${studioId}';
      delete from game_localizations where studio_id = '${studioId}';
      delete from game_versions where studio_id = '${studioId}';
      delete from games where studio_id = '${studioId}';
      delete from projects where studio_id = '${studioId}';
      delete from role_permissions where studio_id = '${studioId}';
      delete from user_roles where studio_id = '${studioId}';
      delete from roles where studio_id = '${studioId}';
      delete from users where studio_id = '${studioId}';
      delete from studios where id = '${studioId}';
      commit;
    `);
    for (const u of [owner, member]) {
      await admin.auth.admin.deleteUser(u.id).catch(() => {});
    }
  }

  console.log(`\n=== ${passed} passaram, ${failed} falharam ===`);
  if (failed > 0) {
    console.error("Falhas:", failures.join(" | "));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("ERRO FATAL:", err);
  process.exit(1);
});
