// Sprint 2.13 GATE 3 — fixture de seed para o E2E crítico de Publishing.
//
// Mesma técnica de `scripts/test-readiness-golden-path.mjs` (Sprint 2.12c):
// `@supabase/supabase-js` com a service role key, contra o stack Supabase
// LOCAL (Docker) — nunca produção (checagem abaixo recusa rodar contra
// qualquer URL que não seja localhost/127.0.0.1). O login em si, porém,
// acontece de verdade pela UI do Playwright (email/senha reais criados
// aqui via Admin API) — não é um bypass de auth, só um bypass de "preencher
// dezenas de telas manualmente" para chegar ao estado que o teste precisa.
//
// Cenário construído (ver e2e/critical-path.spec.ts):
//   - 1 Studio, 1 Owner (login real na UI).
//   - 1 Release com 2 Builds (Google Play + App Store), ambos SUCCEEDED.
//   - Um artifact STORED+VALID já anexado ao Build Google (para o teste
//     começar com só 1 blocker visível, não uma lista inteira).
//   - Uma Submission Google Play PRÉ-CRIADA via fixture (não pela UI) —
//     necessária porque `SUBMISSION_TARGETS_MISSING` bloqueia a Release
//     inteira até existir ao menos 1 Submission ativa (aspereza
//     pré-existente documentada em DECISIONS.md, Sprint 2.12b) — testar o
//     ciclo completo "criar a primeira Submission" exigiria mudar essa
//     lógica, fora do escopo deste sprint. O teste E2E foca no que É
//     testável hoje: corrigir o blocker restante (Store Connection) e
//     criar a 2ª Submission (App Store) pela UI de verdade.
//   - NENHUMA Store Connection ainda → readiness fica NOT_READY com o
//     blocker STORE_CONNECTION_MISSING visível no ReadinessPanel.
//
// A "correção" que o teste aplica (`fixStoreConnectionBlocker`) é uma
// escrita direta no banco (fixture), não uma ação na UI — documentado
// explicitamente aqui e no spec: o AGSOS não tem hoje uma tela para
// conectar Store Connections de verdade (é Vault + validação de credencial
// real de Google/Apple), fora do escopo criar essa tela só para o E2E.

import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { randomUUID, createHash } from "node:crypto";

const require = createRequire(import.meta.url);
const supabaseJsPath = require.resolve("@supabase/supabase-js", {
  paths: [require.resolve("../../../../packages/database/package.json")],
});
const { createClient } = require(supabaseJsPath);

const API_URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

if (!API_URL.includes("127.0.0.1") && !API_URL.includes("localhost")) {
  throw new Error("Recusando rodar E2E: SUPABASE_URL não aponta para localhost. Este fixture é só para o stack local.");
}

export const admin = createClient(API_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const DB_CONTAINER = process.env.SUPABASE_DB_CONTAINER ?? "supabase_db_ai-game-studio-os";
function psqlExec(sql) {
  execFileSync("docker", ["exec", "-i", DB_CONTAINER, "psql", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres"], {
    input: sql,
    stdio: ["pipe", "pipe", "inherit"],
  });
}

const uid = (run, seed) => {
  const hex = createHash("sha256").update(`${run}:${seed}`).digest("hex").slice(0, 32);
  return hex.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
};

export async function seedCriticalPath() {
  const RUN = randomUUID().slice(0, 8);
  const studioId = uid(RUN, "studio");
  const gameId = uid(RUN, "game");
  const projectId = uid(RUN, "project");
  const versionId = uid(RUN, "version");
  const releaseId = uid(RUN, "release");
  const roleId = uid(RUN, "role");
  const buildGoogleId = uid(RUN, "buildgoogle");
  const buildAppleId = uid(RUN, "buildapple");
  const artifactGoogleId = uid(RUN, "artifactgoogle");
  const submissionGoogleId = uid(RUN, "submissiongoogle");

  const email = `e2e-owner-${RUN}@test.local`;
  const password = "TestPassw0rd!23";
  const { data: authUser, error: authErr } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (authErr) throw authErr;
  const userId = authUser.user.id;

  // studios <-> users é FK circular deferrable — precisa da mesma transação SQL.
  psqlExec(`
    begin;
    insert into studios (id, name, owner_user_id, created_actor_type, updated_actor_type)
      values ('${studioId}', 'E2E Studio ${RUN}', '${userId}', 'SYSTEM', 'SYSTEM');
    insert into users (id, studio_id, email, name, created_actor_type, updated_actor_type)
      values ('${userId}', '${studioId}', '${email}', 'E2E Owner', 'SYSTEM', 'SYSTEM');
    commit;
  `);

  // Owner com TODAS as permissões (mesmo padrão de bootstrap_studio_for_current_user).
  const { data: allPerms } = await admin.from("permissions").select("id");
  await admin.from("roles").insert({
    id: roleId, studio_id: studioId, name: "Owner", description: "Owner",
    created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
  }).throwOnError();
  await admin.from("role_permissions").insert(
    (allPerms ?? []).map((p) => ({ studio_id: studioId, role_id: roleId, permission_id: p.id })),
  ).throwOnError();
  await admin.from("user_roles").insert({ studio_id: studioId, user_id: userId, role_id: roleId }).throwOnError();

  await admin.from("projects").insert({
    id: projectId, studio_id: studioId, name: "Projeto E2E",
    created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
  }).throwOnError();
  await admin.from("games").insert({
    id: gameId, studio_id: studioId, project_id: projectId, name: "Jogo E2E",
    package_name: "com.e2e.studio", bundle_identifier: "com.e2e.studio",
    created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
  }).throwOnError();
  await admin.from("game_localizations").insert({
    id: uid(RUN, "loc"), studio_id: studioId, game_id: gameId, language_code: "en-US",
    title: "Jogo E2E", full_description: "E2E full description.",
  }).throwOnError();
  await admin.from("game_versions").insert({
    id: versionId, studio_id: studioId, game_id: gameId, version_number: "1.0.0",
    created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
  }).throwOnError();

  const { data: platforms } = await admin.from("platforms").select("id, name");
  const googleId = platforms.find((p) => p.name === "Google Play").id;
  const appleId = platforms.find((p) => p.name === "App Store").id;

  await admin.from("builds").insert([
    { id: buildGoogleId, studio_id: studioId, game_version_id: versionId, platform_id: googleId, status: "SUCCEEDED", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM" },
    { id: buildAppleId, studio_id: studioId, game_version_id: versionId, platform_id: appleId, status: "SUCCEEDED", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM" },
  ]).throwOnError();

  await admin.from("releases").insert({
    id: releaseId, studio_id: studioId, game_id: gameId, game_version_id: versionId, status: "DRAFT",
    created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
  }).throwOnError();

  await admin.from("build_artifacts").insert({
    id: artifactGoogleId, studio_id: studioId, build_id: buildGoogleId, storage_path: `e2e/${RUN}-app.aab`,
    original_filename: "app.aab", file_extension: "aab", size_bytes: 1000, checksum: "deadbeef",
    upload_status: "STORED", validation_status: "VALID", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
  }).throwOnError();

  // Submission Google pré-criada via fixture (não pela UI) — ver comentário
  // no topo do arquivo sobre a aspereza SUBMISSION_TARGETS_MISSING.
  await admin.from("submissions").insert({
    id: submissionGoogleId, studio_id: studioId, release_id: releaseId, platform_id: googleId, build_id: buildGoogleId,
    status: "DRAFT", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
  }).throwOnError();

  return {
    run: RUN, studioId, gameId, releaseId, userId, email, password,
    googleId, appleId, buildAppleId, artifactGoogleId, submissionGoogleId,
  };
}

// A "correção" do único blocker restante (STORE_CONNECTION_MISSING) para a
// Submission Google — fixture direta no banco, não ação de UI (ver
// justificativa no topo do arquivo). Inclui também o provider_upload
// SUCCEEDED com version_code, porque sem ele o blocker seguinte
// (PROVIDER_UPLOAD_MISSING/GOOGLE_VERSION_CODE_MISSING) apareceria no lugar
// — o teste quer 1 correção → READY, não uma cadeia de blockers.
export async function fixStoreConnectionBlocker(ctx) {
  const connId = uid(ctx.run, "conn");
  await admin.from("store_connections").insert({
    id: connId, studio_id: ctx.studioId, platform_id: ctx.googleId, status: "CONNECTED",
    credentials_ref: uid(ctx.run, "vault"), display_name: "Google E2E",
    created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
  }).throwOnError();
  await admin.from("provider_uploads").insert({
    id: uid(ctx.run, "upload"), studio_id: ctx.studioId, build_artifact_id: ctx.artifactGoogleId, store_connection_id: connId,
    status: "SUCCEEDED", version_code: 1, completed_at: new Date().toISOString(),
    created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
  }).throwOnError();
}

export async function cleanup(ctx) {
  if (!ctx) return;
  // `studio_events` é append-only por desenho (regra `studio_events_no_delete`
  // — DELETE vira NOOP silencioso, ver 20260716000008_events_and_preferences.sql)
  // e o fluxo real de criar a Submission (App Store) emite um evento
  // `SubmissionCreated` — então `studios` nunca pode ser deletado depois que
  // o teste passa por esse passo (FK de `studio_events` para `studios`
  // sempre sobra). Não há como o fixture limpar isso sem violar o desenho
  // deliberado do event log; a linha de produto correta aqui é NÃO tentar
  // apagar as tabelas de domínio no cleanup — só invalidar a sessão
  // (deletar o usuário de auth). Os dados do Studio de teste ficam órfãos
  // no banco LOCAL (studio_id aleatório por execução, isolado por RLS de
  // qualquer outro teste/uso do stack local) — aceitável para um ambiente
  // de desenvolvimento descartável (`npx supabase db reset` limpa tudo).
  await admin.auth.admin.deleteUser(ctx.userId);
}
