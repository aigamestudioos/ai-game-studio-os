#!/usr/bin/env node
// Sprint 2.12c — GATE 11/12/13/14: golden paths Google e Apple, matriz de
// segurança expandida (Owner/Admin/Member/cross-Studio/anon) e verificação
// de duplicate submission — tudo via chamadas HTTP reais (@supabase/supabase-js,
// PostgREST + RPC), contra o stack Supabase LOCAL (Docker), nunca produção.
//
// Diferença deliberada em relação a supabase/tests/readiness_test.sql
// (2.12a): aquele script roda dentro do Postgres via `psql`/`set role`
// (prova a lógica SQL isoladamente). Este roda como um client HTTP real,
// autenticado com sessões de usuários de verdade (senha real via Admin API +
// signInWithPassword), passando pelo PostgREST/GoTrue exatamente como a
// aplicação faz — prova que a RPC e o gate de Submission funcionam de ponta
// a ponta, não só que o SQL está correto.
//
// Uso: node scripts/test-readiness-golden-path.mjs
// Requer: stack local rodando (npx supabase start).

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const supabaseJsPath = require.resolve("@supabase/supabase-js", {
  paths: [require.resolve("../packages/database/package.json")],
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
  console.error("❌ Recusando rodar: SUPABASE_URL não aponta para localhost. Este script é só para o stack local.");
  process.exit(1);
}

const admin = createClient(API_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

// `studios.owner_user_id` e `users.studio_id` são FKs mutuamente
// deferrable-initially-deferred (só resolvem dentro da MESMA transação) —
// PostgREST não expõe transações multi-tabela, então esse par circular
// específico precisa de uma única sessão SQL. Único uso de psql/Docker
// neste script; toda a lógica sob teste (RPC de readiness, criação de
// Submission, matriz de segurança) roda via HTTP real abaixo.
import { execFileSync } from "node:child_process";
const DB_CONTAINER = process.env.SUPABASE_DB_CONTAINER ?? "supabase_db_ai-game-studio-os";
function psqlExec(sql) {
  execFileSync("docker", ["exec", "-i", DB_CONTAINER, "psql", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres"], {
    input: sql,
    stdio: ["pipe", "pipe", "inherit"],
  });
}

let passed = 0;
let failed = 0;
function assert(cond, label) {
  if (cond) {
    passed++;
    console.log(`ok — ${label}`);
  } else {
    failed++;
    console.error(`FALHOU — ${label}`);
  }
}

const { createHash, randomUUID } = require("node:crypto");
const RUN = randomUUID().slice(0, 8);
// IDs determinísticos por seed dentro desta execução — hex válido (sha256),
// não hand-rolled com caracteres fora de [0-9a-f] como uma tentativa
// anterior usando base36 diretamente (gerava "g"/"s"/"t", uuid inválido).
const uid = (seed) => {
  const hex = createHash("sha256").update(`${RUN}:${seed}`).digest("hex").slice(0, 32);
  return hex.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
};

async function signInAs(email, password) {
  const client = createClient(API_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { client, session: data.session };
}

async function createAuthUser(email) {
  const password = "TestPassw0rd!23";
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  return { id: data.user.id, email, password };
}

async function main() {
  console.log(`=== Sprint 2.12c — golden paths + matriz de segurança (run ${RUN}) ===`);

  // ---------- Studios A (sob teste) e B (intruso) ----------
  const studioAId = uid("aaaa1111");
  const studioBId = uid("bbbb1111");
  const gameId = uid("aaaa3333");
  const versionId = uid("aaaa4444");
  const projectId = uid("aaaa2222");

  const ownerA = await createAuthUser(`owner-a-${RUN}@test.local`);
  const adminA = await createAuthUser(`admin-a-${RUN}@test.local`);
  const memberA = await createAuthUser(`member-a-${RUN}@test.local`);
  const ownerB = await createAuthUser(`owner-b-${RUN}@test.local`);

  // A partir daqui há estado no banco que precisa ser limpo mesmo se uma
  // asserção ou chamada falhar no meio — sem isso, uma falha deixa lixo que
  // pode colidir com a PRÓXIMA execução (achado real durante o
  // desenvolvimento deste script: um `storage_path` fixo colidiu com uma
  // execução anterior que abortou antes da limpeza).
  try {
    await runScenario();
  } finally {
    await cleanup();
  }

  async function runScenario() {
  // studios <-> users é um par de FKs circulares (deferrable initially
  // deferred) — só resolve dentro de uma mesma transação SQL.
  psqlExec(`
    begin;
    insert into studios (id, name, owner_user_id, created_actor_type, updated_actor_type) values
      ('${studioAId}', 'Studio A ${RUN}', '${ownerA.id}', 'SYSTEM', 'SYSTEM'),
      ('${studioBId}', 'Studio B ${RUN}', '${ownerB.id}', 'SYSTEM', 'SYSTEM');
    insert into users (id, studio_id, email, name, created_actor_type, updated_actor_type) values
      ('${ownerA.id}', '${studioAId}', '${ownerA.email}', 'Owner A', 'SYSTEM', 'SYSTEM'),
      ('${adminA.id}', '${studioAId}', '${adminA.email}', 'Admin A', 'SYSTEM', 'SYSTEM'),
      ('${memberA.id}', '${studioAId}', '${memberA.email}', 'Member A', 'SYSTEM', 'SYSTEM'),
      ('${ownerB.id}', '${studioBId}', '${ownerB.email}', 'Owner B', 'SYSTEM', 'SYSTEM');
    commit;
  `);

  // Papéis reais do Studio A (Sprint 1.8d-4) — Owner tem todas as
  // permissões, Admin um subconjunto, Member só publishing.read (Sprint
  // 2.13 GATE 2 — antes disso nenhuma permissão governava
  // `submissions`/readiness; agora `publishing.read`/`publishing.create_submission`
  // fazem isso).
  const { data: roles } = await admin
    .from("permissions")
    .select("id, key");
  const ownerRoleId = uid("aaaarole1");
  const adminRoleId = uid("aaaarole2");
  const memberRoleId = uid("aaaarole3");
  await admin.from("roles").insert([
    { id: ownerRoleId, studio_id: studioAId, name: "Owner", description: "Owner", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM" },
    { id: adminRoleId, studio_id: studioAId, name: "Admin", description: "Admin", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM" },
    { id: memberRoleId, studio_id: studioAId, name: "Member", description: "Member", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM" },
  ]).throwOnError();
  await admin.from("role_permissions").insert(
    (roles ?? []).map((p) => ({ studio_id: studioAId, role_id: ownerRoleId, permission_id: p.id })),
  ).throwOnError();
  const adminPerms = (roles ?? []).filter((p) => p.key === "studio.invite_members" || p.key === "studio.manage_members" || p.key === "studio.manage_store_connections" || p.key === "publishing.read" || p.key === "publishing.create_submission");
  if (adminPerms.length > 0) {
    await admin.from("role_permissions").insert(
      adminPerms.map((p) => ({ studio_id: studioAId, role_id: adminRoleId, permission_id: p.id })),
    ).throwOnError();
  }
  // Sprint 2.13 GATE 2 — Member ganha publishing.read (lê readiness/
  // submissions, mas não cria Submission) — antes deste sprint Member não
  // tinha NENHUMA permission granular; agora precisa desta para o cenário
  // "Member A lê readiness" abaixo continuar passando.
  const memberPerms = (roles ?? []).filter((p) => p.key === "publishing.read");
  if (memberPerms.length > 0) {
    await admin.from("role_permissions").insert(
      memberPerms.map((p) => ({ studio_id: studioAId, role_id: memberRoleId, permission_id: p.id })),
    ).throwOnError();
  }
  await admin.from("user_roles").insert([
    { studio_id: studioAId, user_id: ownerA.id, role_id: ownerRoleId },
    { studio_id: studioAId, user_id: adminA.id, role_id: adminRoleId },
    { studio_id: studioAId, user_id: memberA.id, role_id: memberRoleId },
  ]).throwOnError();

  await admin.from("projects").insert({ id: projectId, studio_id: studioAId, name: "Projeto A", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM" }).throwOnError();
  await admin.from("games").insert({ id: gameId, studio_id: studioAId, project_id: projectId, name: "Jogo Golden Path", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM" }).throwOnError();
  await admin.from("game_versions").insert([
    { id: versionId, studio_id: studioAId, game_id: gameId, version_number: "1.0.0", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM" },
  ]).throwOnError();

  const { data: platforms } = await admin.from("platforms").select("id, name");
  const googleId = platforms.find((p) => p.name === "Google Play").id;
  const appleId = platforms.find((p) => p.name === "App Store").id;

  const buildGoogleId = uid("aaaa5551");
  const buildAppleId = uid("aaaa5552");
  await admin.from("builds").insert([
    { id: buildGoogleId, studio_id: studioAId, game_version_id: versionId, platform_id: googleId, status: "SUCCEEDED", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM" },
    { id: buildAppleId, studio_id: studioAId, game_version_id: versionId, platform_id: appleId, status: "SUCCEEDED", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM" },
  ]).throwOnError();

  const releaseId = uid("aaaa6666");
  await admin.from("releases").insert({ id: releaseId, studio_id: studioAId, game_id: gameId, game_version_id: versionId, status: "DRAFT", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM" }).throwOnError();

  // ---------- Sessões reais (Owner/Admin/Member A, Owner B) ----------
  const { client: ownerAClient } = await signInAs(ownerA.email, ownerA.password);
  const { client: adminAClient } = await signInAs(adminA.email, adminA.password);
  const { client: memberAClient } = await signInAs(memberA.email, memberA.password);
  const { client: ownerBClient } = await signInAs(ownerB.email, ownerB.password);

  // =====================================================================
  // GATE 11 — Segurança: sem Submission ainda, todo mundo do Studio A lê
  // NOT_READY (nenhuma tem acesso negado); Owner B (cross-Studio) é negado.
  // =====================================================================
  for (const [label, client] of [["Owner A", ownerAClient], ["Admin A", adminAClient], ["Member A", memberAClient]]) {
    const { data, error } = await client.rpc("get_release_readiness", { p_release_id: releaseId });
    assert(!error && data?.status === "NOT_READY", `${label} lê readiness (RLS studio-level, sem gate de permission) — NOT_READY`);
  }
  {
    const { error } = await ownerBClient.rpc("get_release_readiness", { p_release_id: releaseId });
    assert(!!error, "Owner B (Studio B) é rejeitado ao ler readiness da Release do Studio A");
  }
  {
    const anon = createClient(API_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
    const { error } = await anon.rpc("get_release_readiness", { p_release_id: releaseId });
    assert(!!error, "anon é rejeitado (sem EXECUTE)");
  }

  // =====================================================================
  // GATE 12 — Golden path Google, através de Submission real criada por
  // Owner A (autenticado via HTTP), não `insert` de superusuário.
  // =====================================================================
  const { data: subGoogle, error: subGoogleErr } = await ownerAClient
    .from("submissions")
    .insert({
      studio_id: studioAId, release_id: releaseId, platform_id: googleId, build_id: buildGoogleId,
      created_actor_type: "USER", created_actor_id: ownerA.id, updated_actor_type: "USER", updated_actor_id: ownerA.id,
    })
    .select("*").single();
  assert(!subGoogleErr && !!subGoogle, "Owner A cria a Submission Google Play (real, via PostgREST)");

  {
    const { data } = await ownerAClient.rpc("get_release_readiness", { p_release_id: releaseId });
    assert(data.status === "NOT_READY", "Google: NOT_READY logo após criar a Submission (sem artifact/upload/metadata ainda)");
    const artifactMissing = data.checks.find((c) => c.code === "ARTIFACT_MISSING" && c.status === "FAIL");
    assert(!!artifactMissing, "blocker específico identificado: ARTIFACT_MISSING");
  }

  // Corrige um blocker de cada vez, através de escrita real do Owner A.
  const artifactGoogleId = uid("aaaa7771");
  await admin.from("build_artifacts").insert({
    id: artifactGoogleId, studio_id: studioAId, build_id: buildGoogleId, storage_path: `a/${RUN}-app.aab`,
    original_filename: "app.aab", file_extension: "aab", size_bytes: 1000, checksum: "deadbeef",
    upload_status: "STORED", validation_status: "VALID", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
  }).throwOnError();
  {
    const { data } = await ownerAClient.rpc("get_release_readiness", { p_release_id: releaseId });
    assert(data.status === "NOT_READY", "Google: ainda NOT_READY (falta Store Connection / provider upload)");
    assert(data.checks.some((c) => c.code === "STORE_CONNECTION_MISSING" && c.status === "FAIL"), "blocker STORE_CONNECTION_MISSING identificado");
  }

  const connGoogleId = uid("aaaa8881");
  await admin.from("store_connections").insert({
    id: connGoogleId, studio_id: studioAId, platform_id: googleId, status: "CONNECTED",
    credentials_ref: uid("vaultgoogle"), display_name: "Google A",
    created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
  }).throwOnError();
  {
    const { data } = await ownerAClient.rpc("get_release_readiness", { p_release_id: releaseId });
    assert(data.checks.some((c) => c.code === "PROVIDER_UPLOAD_MISSING" && c.status === "FAIL"), "blocker PROVIDER_UPLOAD_MISSING identificado (artefato ainda não transferido)");
    assert(data.checks.some((c) => c.code === "METADATA_PACKAGE_NAME_MISSING" && c.status === "FAIL"), "blocker METADATA_PACKAGE_NAME_MISSING identificado (só Google)");
  }

  // Simula o worker Google (validado em transporte no 2.11d) já ter
  // concluído — não estamos testando o worker de novo, só a reação da
  // readiness a um provider_upload SUCCEEDED.
  await admin.from("provider_uploads").insert({
    id: uid("aaaa9991"), studio_id: studioAId, build_artifact_id: artifactGoogleId, store_connection_id: connGoogleId,
    status: "SUCCEEDED", version_code: 7, completed_at: new Date().toISOString(),
    created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
  }).throwOnError();
  await admin.from("games").update({ package_name: "com.studio.golden" }).eq("id", gameId).throwOnError();
  await admin.from("game_localizations").insert({
    studio_id: studioAId, game_id: gameId, language_code: "en-US", title: "Golden", short_description: "s", full_description: "d",
  }).throwOnError();

  {
    const { data } = await ownerAClient.rpc("get_release_readiness", { p_release_id: releaseId });
    console.log("Google — blockers restantes:", data.checks.filter((c) => c.blocking).map((c) => c.code).join(",") || "(nenhum)");
    assert(data.status === "READY", "Google: READY depois de todas as correções (fluxo real via HTTP)");
  }

  // =====================================================================
  // GATE 13 — Golden path Apple, mesmo princípio, assimetrias do catálogo.
  // =====================================================================
  const { data: subApple, error: subAppleErr } = await ownerAClient
    .from("submissions")
    .insert({
      studio_id: studioAId, release_id: releaseId, platform_id: appleId, build_id: buildAppleId,
      created_actor_type: "USER", created_actor_id: ownerA.id, updated_actor_type: "USER", updated_actor_id: ownerA.id,
    })
    .select("*").single();
  assert(!subAppleErr && !!subApple, "Owner A cria a Submission App Store (real, via PostgREST)");

  {
    const { data } = await ownerAClient.rpc("get_release_readiness", { p_release_id: releaseId });
    assert(data.status === "NOT_READY", "Apple: NOT_READY logo após criar a Submission");
    assert(data.checks.some((c) => c.code === "ARTIFACT_MISSING" && c.status === "FAIL"), "blocker ARTIFACT_MISSING identificado (Apple)");
    assert(!data.checks.some((c) => c.code === "METADATA_PACKAGE_NAME_MISSING" && c.status === "FAIL"), "check Google (package_name) não vaza para a Submission Apple");
  }

  const artifactAppleId = uid("aaaa7772");
  await admin.from("build_artifacts").insert({
    id: artifactAppleId, studio_id: studioAId, build_id: buildAppleId, storage_path: `a/${RUN}-app.ipa`,
    original_filename: "app.ipa", file_extension: "ipa", size_bytes: 1000, checksum: "face",
    upload_status: "STORED", validation_status: "VALID", created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
  }).throwOnError();

  const connAppleId = uid("aaaa8882");
  await admin.from("store_connections").insert({
    id: connAppleId, studio_id: studioAId, platform_id: appleId, status: "CONNECTED",
    credentials_ref: uid("vaultapple"), display_name: "Apple A",
    created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
  }).throwOnError();

  {
    const { data } = await ownerAClient.rpc("get_release_readiness", { p_release_id: releaseId });
    assert(data.checks.some((c) => c.code === "METADATA_BUNDLE_IDENTIFIER_MISSING" && c.status === "FAIL"), "blocker METADATA_BUNDLE_IDENTIFIER_MISSING identificado (só Apple)");
  }

  // Simula o worker Apple (validado em transporte no 2.11d) já ter
  // concluído.
  await admin.from("provider_uploads").insert({
    id: uid("aaaa9992"), studio_id: studioAId, build_artifact_id: artifactAppleId, store_connection_id: connAppleId,
    status: "SUCCEEDED", completed_at: new Date().toISOString(),
    created_actor_type: "SYSTEM", updated_actor_type: "SYSTEM",
  }).throwOnError();
  {
    const { data } = await ownerAClient.rpc("get_release_readiness", { p_release_id: releaseId });
    assert(data.checks.some((c) => c.code === "APPLE_BUILD_UPLOAD_REF_MISSING" && c.status === "FAIL"), "blocker APPLE_BUILD_UPLOAD_REF_MISSING identificado (assimetria Apple)");
  }
  await admin.from("provider_uploads").update({ apple_build_upload_id: "BU-GOLDEN" }).eq("build_artifact_id", artifactAppleId).throwOnError();
  await admin.from("games").update({ bundle_identifier: "com.studio.golden" }).eq("id", gameId).throwOnError();

  {
    const { data } = await ownerAClient.rpc("get_release_readiness", { p_release_id: releaseId });
    console.log("Google+Apple — blockers restantes:", data.checks.filter((c) => c.blocking).map((c) => c.code).join(",") || "(nenhum)");
    assert(data.status === "READY", "Release com Google + Apple: READY (fluxo real via HTTP)");
  }

  // =====================================================================
  // GATE 11 (continuação) — nenhum segredo na resposta HTTP real (não só
  // no jsonb cru do Postgres): credentials_ref, Vault ref, upload URLs,
  // Authorization/Bearer.
  // =====================================================================
  {
    const { data } = await ownerAClient.rpc("get_release_readiness", { p_release_id: releaseId });
    const text = JSON.stringify(data);
    assert(!text.includes(uid("vaultgoogle")) && !text.includes(uid("vaultapple")), "resposta HTTP real não contém credentials_ref/Vault ref");
    assert(!text.includes("storage_path") && !text.includes(`a/${RUN}-app.aab`), "resposta HTTP real não contém storage_path do artefato");
    assert(!/authorization|bearer/i.test(text), "resposta HTTP real não contém headers/tokens");
  }

  // =====================================================================
  // GATE 14 — Duplicate submission (Sprint 2.12c achado, fechado no Sprint
  // 2.13 GATE 1): índice único parcial `idx_submissions_release_platform_active`
  // agora rejeita uma 2ª Submission ATIVA para o mesmo (release_id,
  // platform_id). Confirma o caminho bloqueado (concorrência real, duas
  // criações simultâneas) e o caminho legítimo (nova Submission permitida
  // depois que a anterior chega a um estado terminal).
  // =====================================================================
  {
    // Uma Submission Google Play ATIVA já existe para esta Release (criada
    // mais acima, ainda DRAFT) — uma 2ª criação idêntica sequencial já deve
    // ser rejeitada pelo índice único parcial.
    const dupPayload = {
      studio_id: studioAId, release_id: releaseId, platform_id: googleId, build_id: buildGoogleId,
      created_actor_type: "USER", created_actor_id: ownerA.id, updated_actor_type: "USER", updated_actor_id: ownerA.id,
    };
    const { error: seqDupErr } = await ownerAClient.from("submissions").insert(dupPayload).select("*").single();
    assert(!!seqDupErr && /duplicate key|unique/i.test(seqDupErr.message ?? ""), "2ª Submission idêntica (sequencial) é rejeitada pelo índice único parcial (idx_submissions_release_platform_active)");

    const { data: existing } = await admin.from("submissions")
      .select("*").eq("release_id", releaseId).eq("platform_id", googleId).single();
    const { data: rel } = await admin.from("releases").select("status").eq("id", releaseId).single();
    assert(rel.status === "DRAFT", "criar Submission não publica nem muda o status da Release automaticamente");
    assert(existing.status === "DRAFT", "Submission nasce DRAFT — nenhum review/publish é disparado automaticamente");

    // Caminho legítimo: Submission anterior em estado TERMINAL (REJECTED)
    // libera uma nova Submission para o mesmo Release+Platform (resubmissão
    // pós-rejeição — interpretação conservadora documentada em DECISIONS.md).
    await admin.from("submissions").update({ status: "REJECTED", updated_actor_type: "SYSTEM" }).eq("id", existing.id).throwOnError();

    // Concorrência real: com o slot ativo livre (Submission anterior agora
    // terminal), duas criações SIMULTÂNEAS do mesmo Release+Platform
    // competem pelo mesmo índice único parcial — o banco precisa aceitar
    // exatamente uma e rejeitar a outra, deterministicamente.
    const [r1, r2] = await Promise.all([
      ownerAClient.from("submissions").insert(dupPayload).select("*").single(),
      ownerAClient.from("submissions").insert(dupPayload).select("*").single(),
    ]);
    const results = [r1, r2];
    const oks = results.filter((r) => !r.error);
    const fails = results.filter((r) => !!r.error);
    assert(oks.length === 1 && fails.length === 1, "concorrência real: exatamente 1 das 2 criações simultâneas (mesmo Release+Platform) é aceita");
    assert(/duplicate key|unique/i.test(fails[0]?.error?.message ?? ""), "a rejeição concorrente também é a unique violation do índice parcial, não outro erro");
    assert(!!oks[0]?.data, "resubmissão concorrente vencedora persiste — Submission anterior terminal (REJECTED) liberou o slot corretamente");
  }

  } // fim de runScenario()

  // ---------- Limpeza: banco local não fica sujo entre execuções ----------
  // Nenhuma FK aqui é ON DELETE CASCADE — remoção manual, na ordem inversa
  // de dependência, dentro de uma única transação (studios/users têm o
  // mesmo par de FKs circulares do setup). `or credentials_ref not being a
  // valid uuid` não deveria mais acontecer (uid() gera uuid válido), mas o
  // update abaixo é defensivo: sem ele, uma linha com credentials_ref
  // inválido faria o trigger de exclusão do Vault abortar a transação
  // inteira e reintroduzir o mesmo problema desta vez para a PRÓXIMA
  // execução (exatamente o bug encontrado ao escrever este script).
  async function cleanup() {
    psqlExec(`
      begin;
      update store_connections set credentials_ref = gen_random_uuid()::text
        where studio_id in ('${studioAId}', '${studioBId}') and credentials_ref !~ '^[0-9a-f-]{36}$';
      delete from provider_uploads where studio_id in ('${studioAId}', '${studioBId}');
      delete from store_connections where studio_id in ('${studioAId}', '${studioBId}');
      delete from build_artifacts where studio_id in ('${studioAId}', '${studioBId}');
      delete from submissions where studio_id in ('${studioAId}', '${studioBId}');
      delete from releases where studio_id in ('${studioAId}', '${studioBId}');
      delete from builds where studio_id in ('${studioAId}', '${studioBId}');
      delete from game_localizations where studio_id in ('${studioAId}', '${studioBId}');
      delete from game_versions where studio_id in ('${studioAId}', '${studioBId}');
      delete from games where studio_id in ('${studioAId}', '${studioBId}');
      delete from projects where studio_id in ('${studioAId}', '${studioBId}');
      delete from role_permissions where studio_id in ('${studioAId}', '${studioBId}');
      delete from user_roles where studio_id in ('${studioAId}', '${studioBId}');
      delete from roles where studio_id in ('${studioAId}', '${studioBId}');
      delete from users where studio_id in ('${studioAId}', '${studioBId}');
      delete from studios where id in ('${studioAId}', '${studioBId}');
      commit;
    `);
    for (const u of [ownerA, adminA, memberA, ownerB]) {
      await admin.auth.admin.deleteUser(u.id).catch(() => {});
    }
  }

  console.log(`\n=== ${passed} passaram, ${failed} falharam ===`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("ERRO FATAL:", err);
  process.exit(1);
});
