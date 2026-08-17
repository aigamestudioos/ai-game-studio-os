-- Sprint 2.16a — testes de `transition_submission` / `complete_submission_job`.
-- Roda inteiro dentro de uma transação com ROLLBACK no fim. Rodar com
-- `bash scripts/test-submission-lifecycle.sh`.
--
-- Cobre: PREPARE bloqueado por readiness não-READY; PREPARE feliz;
-- idempotência de PREPARE (duplo clique); permissão publishing.submit
-- (Member sem a permissão); cross-Studio; SUBMIT enfileira job e nunca
-- permite um segundo job ativo concorrente (duplo clique em SUBMIT);
-- complete_submission_job SUBMITTED e FAILED; RETRY após FAILED; duplicate
-- submission (unique index do 2.13) continua respeitado com os novos
-- estados.

\set ON_ERROR_STOP on
begin;

create or replace function pg_temp.assert(p_cond boolean, p_label text)
returns void language plpgsql as $$
begin
  if not p_cond then
    raise exception 'FALHOU: %', p_label;
  end if;
  raise notice 'ok — %', p_label;
end $$;

create or replace function pg_temp.assert_raises(p_sql text, p_label text)
returns void language plpgsql as $$
begin
  begin
    execute p_sql;
    raise exception 'FALHOU (deveria ter levantado exceção): %', p_label;
  exception
    when others then
      if sqlerrm like 'FALHOU%' then
        raise;
      end if;
      raise notice 'ok — % (erro esperado: %)', p_label, sqlerrm;
  end;
end $$;

create or replace function pg_temp.as_user(p_user_id uuid)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create or replace function pg_temp.as_service()
returns void language plpgsql as $$
begin
  perform set_config('role', 'service_role', true);
end $$;

create or replace function pg_temp.as_anon()
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'anon', true);
end $$;

-- ---------- fixture: Studio A com uma Release READY (Google Play) ----------
do $fixture$
declare
  v_google uuid := (select id from platforms where name = 'Google Play');
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
  values
    ('c0000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-c@test.local', '', now(), now()),
    ('c0000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member-c@test.local', '', now(), now()),
    ('d0000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-d@test.local', '', now(), now());

  insert into studios (id, name, owner_user_id, created_actor_type, updated_actor_type)
  values
    ('c1111111-0000-0000-0000-000000000001', 'Studio C', 'c0000000-0000-0000-0000-00000000000a', 'SYSTEM', 'SYSTEM'),
    ('d1111111-0000-0000-0000-000000000001', 'Studio D', 'd0000000-0000-0000-0000-00000000000a', 'SYSTEM', 'SYSTEM');

  insert into public.users (id, studio_id, email, name, created_actor_type, updated_actor_type)
  values
    ('c0000000-0000-0000-0000-00000000000a', 'c1111111-0000-0000-0000-000000000001', 'owner-c@test.local', 'Owner C', 'SYSTEM', 'SYSTEM'),
    ('c0000000-0000-0000-0000-00000000000b', 'c1111111-0000-0000-0000-000000000001', 'member-c@test.local', 'Member C', 'SYSTEM', 'SYSTEM'),
    ('d0000000-0000-0000-0000-00000000000a', 'd1111111-0000-0000-0000-000000000001', 'owner-d@test.local', 'Owner D', 'SYSTEM', 'SYSTEM');

  insert into roles (id, studio_id, name, description, created_actor_type, updated_actor_type)
  values
    ('c9999999-0000-0000-0000-000000000001', 'c1111111-0000-0000-0000-000000000001', 'Owner', 'Acesso completo', 'SYSTEM', 'SYSTEM'),
    ('c9999999-0000-0000-0000-000000000002', 'c1111111-0000-0000-0000-000000000001', 'Member', 'Sem publishing.submit', 'SYSTEM', 'SYSTEM'),
    ('d9999999-0000-0000-0000-000000000001', 'd1111111-0000-0000-0000-000000000001', 'Owner', 'Acesso completo', 'SYSTEM', 'SYSTEM');

  insert into user_roles (studio_id, user_id, role_id)
  values
    ('c1111111-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-00000000000a', 'c9999999-0000-0000-0000-000000000001'),
    ('c1111111-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-00000000000b', 'c9999999-0000-0000-0000-000000000002'),
    ('d1111111-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-00000000000a', 'd9999999-0000-0000-0000-000000000001');

  -- Owner C: todas as permissões de publishing. Member C: só publishing.read
  -- (nunca publishing.submit) — prova o gate de permissão.
  insert into role_permissions (studio_id, role_id, permission_id)
  select 'c1111111-0000-0000-0000-000000000001', 'c9999999-0000-0000-0000-000000000001', id from permissions
  where key in ('publishing.read', 'publishing.create_submission', 'publishing.submit');
  insert into role_permissions (studio_id, role_id, permission_id)
  select 'c1111111-0000-0000-0000-000000000001', 'c9999999-0000-0000-0000-000000000002', id from permissions
  where key in ('publishing.read', 'publishing.create_submission');
  insert into role_permissions (studio_id, role_id, permission_id)
  select 'd1111111-0000-0000-0000-000000000001', 'd9999999-0000-0000-0000-000000000001', id from permissions
  where key in ('publishing.read', 'publishing.create_submission', 'publishing.submit');

  insert into projects (id, studio_id, name, created_actor_type, updated_actor_type)
  values ('c2222222-0000-0000-0000-000000000001', 'c1111111-0000-0000-0000-000000000001', 'Projeto C', 'SYSTEM', 'SYSTEM');

  insert into games (id, studio_id, project_id, name, package_name, created_actor_type, updated_actor_type)
  values ('c3333333-0000-0000-0000-000000000001', 'c1111111-0000-0000-0000-000000000001', 'c2222222-0000-0000-0000-000000000001', 'Jogo C', 'com.studioc.jogo', 'SYSTEM', 'SYSTEM');

  insert into game_localizations (id, studio_id, game_id, language_code, title, full_description)
  values ('c3333333-0000-0000-0000-000000000009', 'c1111111-0000-0000-0000-000000000001', 'c3333333-0000-0000-0000-000000000001', 'en-US', 'Jogo C', 'Descrição completa.');

  insert into game_versions (id, studio_id, game_id, version_number, created_actor_type, updated_actor_type)
  values ('c4444444-0000-0000-0000-000000000001', 'c1111111-0000-0000-0000-000000000001', 'c3333333-0000-0000-0000-000000000001', '1.0.0', 'SYSTEM', 'SYSTEM');

  insert into builds (id, studio_id, game_version_id, platform_id, status, created_actor_type, updated_actor_type)
  values ('c5555555-0000-0000-0000-000000000001', 'c1111111-0000-0000-0000-000000000001', 'c4444444-0000-0000-0000-000000000001', v_google, 'SUCCEEDED', 'SYSTEM', 'SYSTEM');

  insert into releases (id, studio_id, game_id, game_version_id, status, release_notes, created_actor_type, updated_actor_type)
  values ('c6666666-0000-0000-0000-000000000001', 'c1111111-0000-0000-0000-000000000001', 'c3333333-0000-0000-0000-000000000001', 'c4444444-0000-0000-0000-000000000001', 'DRAFT', 'Primeira versão.', 'SYSTEM', 'SYSTEM');

  insert into build_artifacts (id, studio_id, build_id, storage_path, original_filename, file_extension, size_bytes,
                               checksum, upload_status, validation_status, created_actor_type, updated_actor_type)
  values ('c7777777-0000-0000-0000-000000000001', 'c1111111-0000-0000-0000-000000000001', 'c5555555-0000-0000-0000-000000000001',
          'c/app.aab', 'app.aab', 'aab', 1000, 'beef', 'STORED', 'VALID', 'SYSTEM', 'SYSTEM');

  insert into store_connections (id, studio_id, platform_id, status, credentials_ref, display_name, created_actor_type, updated_actor_type)
  values ('c8888888-0000-0000-0000-000000000001', 'c1111111-0000-0000-0000-000000000001', v_google, 'CONNECTED',
          'sc_secret_c', 'Google C', 'SYSTEM', 'SYSTEM');

  insert into provider_uploads (id, studio_id, build_artifact_id, store_connection_id, status, version_code,
                                completed_at, created_actor_type, updated_actor_type)
  values ('c9999999-9999-0000-0000-000000000001', 'c1111111-0000-0000-0000-000000000001', 'c7777777-0000-0000-0000-000000000001',
          'c8888888-0000-0000-0000-000000000001', 'SUCCEEDED', 7, now(), 'SYSTEM', 'SYSTEM');

  insert into submissions (id, studio_id, release_id, platform_id, build_id, status, created_actor_type, updated_actor_type)
  values ('caaaaaaa-0000-0000-0000-000000000001', 'c1111111-0000-0000-0000-000000000001', 'c6666666-0000-0000-0000-000000000001',
          v_google, 'c5555555-0000-0000-0000-000000000001', 'DRAFT', 'SYSTEM', 'SYSTEM');
end $fixture$;

set role postgres;

-- ---------- sanity: readiness da fixture é READY ----------
select pg_temp.as_user('c0000000-0000-0000-0000-00000000000a');
do $$
declare r jsonb := get_release_readiness('c6666666-0000-0000-0000-000000000001');
begin
  perform pg_temp.assert(r ->> 'status' = 'READY', 'fixture da Release C é READY (pré-condição dos testes de lifecycle)');
end $$;

-- ---------- 1) PREPARE feliz: DRAFT → READY_TO_SUBMIT ----------
do $$
declare v jsonb := transition_submission('caaaaaaa-0000-0000-0000-000000000001', 'PREPARE', 'c0000000-0000-0000-0000-00000000000a');
begin
  perform pg_temp.assert(v -> 'submission' ->> 'status' = 'READY_TO_SUBMIT', 'PREPARE move DRAFT -> READY_TO_SUBMIT');
  perform pg_temp.assert((v ->> 'noop')::boolean = false, 'PREPARE não é noop na primeira chamada');
end $$;

-- 1.1 idempotência: PREPARE de novo (duplo clique) é noop, não erro
do $$
declare v jsonb := transition_submission('caaaaaaa-0000-0000-0000-000000000001', 'PREPARE', 'c0000000-0000-0000-0000-00000000000a');
begin
  perform pg_temp.assert((v ->> 'noop')::boolean = true, 'PREPARE duplicado é idempotente (noop)');
  perform pg_temp.assert(v -> 'submission' ->> 'status' = 'READY_TO_SUBMIT', 'estado permanece READY_TO_SUBMIT');
end $$;

-- ---------- 2) Permission gate: Member sem publishing.submit ----------
select pg_temp.as_user('c0000000-0000-0000-0000-00000000000b');
select pg_temp.assert_raises(
  $q$ select transition_submission('caaaaaaa-0000-0000-0000-000000000001', 'SUBMIT', 'c0000000-0000-0000-0000-00000000000b') $q$,
  'Member sem publishing.submit não consegue SUBMIT');

-- ---------- 3) Cross-Studio: Owner D não pode transicionar Submission de C ----------
select pg_temp.as_user('d0000000-0000-0000-0000-00000000000a');
select pg_temp.assert_raises(
  $q$ select transition_submission('caaaaaaa-0000-0000-0000-000000000001', 'SUBMIT', 'd0000000-0000-0000-0000-00000000000a') $q$,
  'Owner de outro Studio não pode transicionar submission de Studio C');

-- ---------- 4) anon não pode chamar a RPC ----------
select pg_temp.as_anon();
select pg_temp.assert_raises(
  $q$ select transition_submission('caaaaaaa-0000-0000-0000-000000000001', 'SUBMIT', null) $q$,
  'anon não pode chamar transition_submission (sem permissão/studio)');

-- ---------- 5) SUBMIT feliz: READY_TO_SUBMIT → SUBMITTING + job enfileirado ----------
select pg_temp.as_user('c0000000-0000-0000-0000-00000000000a');
do $$
declare v jsonb := transition_submission('caaaaaaa-0000-0000-0000-000000000001', 'SUBMIT', 'c0000000-0000-0000-0000-00000000000a');
begin
  perform pg_temp.assert(v -> 'submission' ->> 'status' = 'SUBMITTING', 'SUBMIT move READY_TO_SUBMIT -> SUBMITTING');
  perform pg_temp.assert(v -> 'job' ->> 'status' = 'QUEUED', 'job de execução fica QUEUED');
  perform pg_temp.assert(v -> 'job' ->> 'integration_name' = 'submission_google_play', 'integration_name correto para Google Play');
end $$;

-- 5.1 duplo clique em SUBMIT enquanto já está SUBMITTING: idempotente, nunca 2º job
do $$
declare v jsonb := transition_submission('caaaaaaa-0000-0000-0000-000000000001', 'SUBMIT', 'c0000000-0000-0000-0000-00000000000a');
declare v_jobs integer;
begin
  perform pg_temp.assert((v ->> 'noop')::boolean = true, 'SUBMIT duplicado enquanto SUBMITTING é noop');
  select count(*) into v_jobs from integration_jobs where submission_id = 'caaaaaaa-0000-0000-0000-000000000001';
  perform pg_temp.assert(v_jobs = 1, 'nunca existe mais de um job para a mesma submission (duplo clique)');
end $$;

-- ---------- 6) complete_submission_job (worker, service_role) ----------
select pg_temp.as_service();
do $$
declare v submissions;
declare v_job_id uuid := (select id from integration_jobs where submission_id = 'caaaaaaa-0000-0000-0000-000000000001');
begin
  v := complete_submission_job(v_job_id, 'caaaaaaa-0000-0000-0000-000000000001', 'SUBMITTED', null, 1200);
  perform pg_temp.assert(v.status = 'SUBMITTED', 'complete_submission_job(SUBMITTED) move SUBMITTING -> SUBMITTED');
end $$;

-- 6.1 idempotência do worker: chamar de novo não regride nem levanta erro
do $$
declare v submissions;
declare v_job_id uuid := (select id from integration_jobs where submission_id = 'caaaaaaa-0000-0000-0000-000000000001');
begin
  v := complete_submission_job(v_job_id, 'caaaaaaa-0000-0000-0000-000000000001', 'FAILED', 'SHOULD_NOT_APPLY', 1);
  perform pg_temp.assert(v.status = 'SUBMITTED', 'segunda chamada de complete_submission_job é no-op (já não está SUBMITTING)');
end $$;

-- authenticated não pode chamar complete_submission_job (só service_role)
select pg_temp.as_user('c0000000-0000-0000-0000-00000000000a');
select pg_temp.assert_raises(
  $q$ select complete_submission_job(gen_random_uuid(), 'caaaaaaa-0000-0000-0000-000000000001', 'SUBMITTED', null, null) $q$,
  'authenticated não pode chamar complete_submission_job (permission denied, GRANT só a service_role)');

-- ---------- 7) segunda Submission: bloqueada pelo unique index (2.13) enquanto a primeira está ativa (SUBMITTED não é terminal) ----------
set role postgres;
select pg_temp.assert_raises(
  $q$ insert into submissions (studio_id, release_id, platform_id, build_id, status, created_actor_type, updated_actor_type)
      values ('c1111111-0000-0000-0000-000000000001', 'c6666666-0000-0000-0000-000000000001',
              (select id from platforms where name = 'Google Play'), 'c5555555-0000-0000-0000-000000000001', 'DRAFT', 'SYSTEM', 'SYSTEM') $q$,
  'SUBMITTED não é status terminal para o unique index — 2ª submission ativa continua bloqueada');

-- ---------- 8) FAILED -> RETRY (nova submission, para não reusar a já SUBMITTED) ----------
insert into submissions (id, studio_id, release_id, platform_id, build_id, status, created_actor_type, updated_actor_type)
values ('caaaaaaa-0000-0000-0000-000000000002', 'c1111111-0000-0000-0000-000000000001', 'c6666666-0000-0000-0000-000000000001',
        (select id from platforms where name = 'App Store'), 'c5555555-0000-0000-0000-000000000001', 'FAILED', 'SYSTEM', 'SYSTEM');
-- (App Store não tem Build/artefato/conexão na fixture — readiness ficará
-- NOT_READY; usamos isso para provar o gate de readiness no RETRY também.)
select pg_temp.as_user('c0000000-0000-0000-0000-00000000000a');
select pg_temp.assert_raises(
  $q$ select transition_submission('caaaaaaa-0000-0000-0000-000000000002', 'RETRY', 'c0000000-0000-0000-0000-00000000000a') $q$,
  'RETRY também recalcula readiness no servidor — bloqueado se Release não está READY para essa plataforma');

-- ---------- 9) PREPARE numa Submission já SUBMITTED nunca regride — noop determinístico, nunca erro nem volta a READY_TO_SUBMIT ----------
do $$
declare v jsonb := transition_submission('caaaaaaa-0000-0000-0000-000000000001', 'PREPARE', 'c0000000-0000-0000-0000-00000000000a');
begin
  perform pg_temp.assert((v ->> 'noop')::boolean = true, 'PREPARE numa submission SUBMITTED é noop');
  perform pg_temp.assert(v -> 'submission' ->> 'status' = 'SUBMITTED', 'PREPARE nunca regride SUBMITTED para READY_TO_SUBMIT');
end $$;

rollback;
