-- Sprint 2.12a — testes do avaliador de Readiness (`get_release_readiness`).
--
-- Roda inteiro dentro de uma transação com ROLLBACK no fim: não deixa
-- nenhuma linha no banco local. Rodar com `bash scripts/test-readiness.sh`.
--
-- Cobre: (a) a transição completa NOT_READY → correção → READY para
-- Google Play e para a App Store, um blocker de cada vez; (b) a matriz de
-- segurança mínima (anon, cross-Studio, release inexistente, artifact e
-- provider_upload de outro Studio); (c) ausência de vazamento de
-- credenciais/refs de Vault no payload.

\set ON_ERROR_STOP on
begin;

-- ---------- helpers de asserção ----------
create or replace function pg_temp.assert(p_cond boolean, p_label text)
returns void language plpgsql as $$
begin
  if not p_cond then
    raise exception 'FALHOU: %', p_label;
  end if;
  raise notice 'ok — %', p_label;
end $$;

-- Um check com um dado status está presente no resultado?
create or replace function pg_temp.has_check(p_result jsonb, p_code text, p_status text)
returns boolean language sql as $$
  select exists (
    select 1 from jsonb_array_elements(p_result -> 'checks') c
    where c ->> 'code' = p_code and c ->> 'status' = p_status
  );
$$;

create or replace function pg_temp.blockers(p_result jsonb)
returns text language sql as $$
  select coalesce(string_agg(c ->> 'code', ',' order by c ->> 'code'), '(nenhum)')
  from jsonb_array_elements(p_result -> 'checks') c
  where (c ->> 'blocking')::boolean;
$$;

create or replace function pg_temp.as_user(p_user_id uuid)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

-- ---------- fixture ----------
-- Studio A (o dono da Release sob teste) e Studio B (o intruso).
do $fixture$
declare
  v_google uuid := (select id from platforms where name = 'Google Play');
  v_apple uuid := (select id from platforms where name = 'App Store');
begin
  -- auth.users é pré-requisito de public.users (FK).
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
  values
    ('aaaaaaaa-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'owner-a@test.local', '', now(), now()),
    ('bbbbbbbb-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'owner-b@test.local', '', now(), now());

  insert into public.users (id, studio_id, email, name, created_actor_type, updated_actor_type)
  values
    ('aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-1111-0000-0000-000000000001', 'owner-a@test.local', 'Owner A', 'SYSTEM', 'SYSTEM'),
    ('bbbbbbbb-0000-0000-0000-00000000000b', 'bbbbbbbb-1111-0000-0000-000000000001', 'owner-b@test.local', 'Owner B', 'SYSTEM', 'SYSTEM');

  insert into studios (id, name, owner_user_id, created_actor_type, updated_actor_type)
  values
    ('aaaaaaaa-1111-0000-0000-000000000001', 'Studio A', 'aaaaaaaa-0000-0000-0000-00000000000a', 'SYSTEM', 'SYSTEM'),
    ('bbbbbbbb-1111-0000-0000-000000000001', 'Studio B', 'bbbbbbbb-0000-0000-0000-00000000000b', 'SYSTEM', 'SYSTEM');

  insert into projects (id, studio_id, name, created_actor_type, updated_actor_type)
  values
    ('aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 'Projeto A', 'SYSTEM', 'SYSTEM'),
    ('bbbbbbbb-2222-0000-0000-000000000001', 'bbbbbbbb-1111-0000-0000-000000000001', 'Projeto B', 'SYSTEM', 'SYSTEM');

  insert into games (id, studio_id, project_id, name, created_actor_type, updated_actor_type)
  values
    ('aaaaaaaa-3333-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-000000000001', 'Jogo A', 'SYSTEM', 'SYSTEM'),
    ('bbbbbbbb-3333-0000-0000-000000000001', 'bbbbbbbb-1111-0000-0000-000000000001', 'bbbbbbbb-2222-0000-0000-000000000001', 'Jogo B', 'SYSTEM', 'SYSTEM');

  insert into game_versions (id, studio_id, game_id, version_number, created_actor_type, updated_actor_type)
  values
    ('aaaaaaaa-4444-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-3333-0000-0000-000000000001', '1.0.0', 'SYSTEM', 'SYSTEM'),
    -- versão "errada", para provar VERSION_MISMATCH
    ('aaaaaaaa-4444-0000-0000-000000000002', 'aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-3333-0000-0000-000000000001', '0.9.0', 'SYSTEM', 'SYSTEM'),
    ('bbbbbbbb-4444-0000-0000-000000000001', 'bbbbbbbb-1111-0000-0000-000000000001', 'bbbbbbbb-3333-0000-0000-000000000001', '1.0.0', 'SYSTEM', 'SYSTEM');

  insert into builds (id, studio_id, game_version_id, platform_id, status, created_actor_type, updated_actor_type)
  values
    ('aaaaaaaa-5555-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-4444-0000-0000-000000000001', v_google, 'PENDING', 'SYSTEM', 'SYSTEM'),
    ('aaaaaaaa-5555-0000-0000-000000000002', 'aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-4444-0000-0000-000000000001', v_apple, 'SUCCEEDED', 'SYSTEM', 'SYSTEM'),
    ('bbbbbbbb-5555-0000-0000-000000000001', 'bbbbbbbb-1111-0000-0000-000000000001', 'bbbbbbbb-4444-0000-0000-000000000001', v_google, 'SUCCEEDED', 'SYSTEM', 'SYSTEM');

  insert into releases (id, studio_id, game_id, game_version_id, status, created_actor_type, updated_actor_type)
  values
    ('aaaaaaaa-6666-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-3333-0000-0000-000000000001', 'aaaaaaaa-4444-0000-0000-000000000001', 'DRAFT', 'SYSTEM', 'SYSTEM'),
    ('bbbbbbbb-6666-0000-0000-000000000001', 'bbbbbbbb-1111-0000-0000-000000000001', 'bbbbbbbb-3333-0000-0000-000000000001', 'bbbbbbbb-4444-0000-0000-000000000001', 'DRAFT', 'SYSTEM', 'SYSTEM');

  -- Artifact do Studio B, .aab STORED+VALID, com provider_upload
  -- SUCCEEDED — a isca de cross-contamination.
  insert into build_artifacts (id, studio_id, build_id, storage_path, original_filename, file_extension, size_bytes,
                               checksum, upload_status, validation_status, created_actor_type, updated_actor_type)
  values ('bbbbbbbb-7777-0000-0000-000000000001', 'bbbbbbbb-1111-0000-0000-000000000001', 'bbbbbbbb-5555-0000-0000-000000000001',
          'b/app.aab', 'app.aab', 'aab', 1000, 'deadbeef', 'STORED', 'VALID', 'SYSTEM', 'SYSTEM');

  insert into store_connections (id, studio_id, platform_id, status, credentials_ref, display_name,
                                 created_actor_type, updated_actor_type)
  values ('bbbbbbbb-8888-0000-0000-000000000001', 'bbbbbbbb-1111-0000-0000-000000000001', v_google, 'CONNECTED',
          'sc_secret_studio_b_super_secreto', 'Google B', 'SYSTEM', 'SYSTEM');

  insert into provider_uploads (id, studio_id, build_artifact_id, store_connection_id, status, version_code,
                                completed_at, created_actor_type, updated_actor_type)
  values ('bbbbbbbb-9999-0000-0000-000000000001', 'bbbbbbbb-1111-0000-0000-000000000001', 'bbbbbbbb-7777-0000-0000-000000000001',
          'bbbbbbbb-8888-0000-0000-000000000001', 'SUCCEEDED', 42, now(), 'SYSTEM', 'SYSTEM');
end $fixture$;

-- =====================================================================
-- 1) Google Play: NOT_READY → correções → READY
-- =====================================================================
select pg_temp.as_user('aaaaaaaa-0000-0000-0000-00000000000a');

-- 1.1 Release sem nenhuma Submission
do $$
declare r jsonb := get_release_readiness('aaaaaaaa-6666-0000-0000-000000000001');
begin
  perform pg_temp.assert(r ->> 'status' = 'NOT_READY', 'release sem submission é NOT_READY');
  perform pg_temp.assert(pg_temp.has_check(r, 'SUBMISSION_TARGETS_MISSING', 'FAIL'), 'blocker SUBMISSION_TARGETS_MISSING');
  perform pg_temp.assert(pg_temp.has_check(r, 'METADATA_LISTING_MISSING', 'FAIL'), 'blocker METADATA_LISTING_MISSING');
  perform pg_temp.assert(pg_temp.has_check(r, 'METADATA_RELEASE_NOTES_MISSING', 'WARN'), 'release notes é WARNING, não blocker');
  perform pg_temp.assert(pg_temp.has_check(r, 'METADATA_SCREENSHOTS_MISSING', 'NOT_APPLICABLE'), 'screenshots são NOT_YET_MODELED/NOT_APPLICABLE');
end $$;

-- 1.2 Submission Google criada, com Build da versão ERRADA e ainda PENDING
set role postgres;
insert into submissions (id, studio_id, release_id, platform_id, build_id, status, created_actor_type, updated_actor_type)
values ('aaaaaaaa-aaaa-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-6666-0000-0000-000000000001',
        (select id from platforms where name = 'Google Play'), 'aaaaaaaa-5555-0000-0000-000000000001', 'DRAFT', 'SYSTEM', 'SYSTEM');
update builds set game_version_id = 'aaaaaaaa-4444-0000-0000-000000000002' where id = 'aaaaaaaa-5555-0000-0000-000000000001';
select pg_temp.as_user('aaaaaaaa-0000-0000-0000-00000000000a');

do $$
declare r jsonb := get_release_readiness('aaaaaaaa-6666-0000-0000-000000000001');
begin
  perform pg_temp.assert(r ->> 'status' = 'NOT_READY', 'build de outra versão é NOT_READY');
  perform pg_temp.assert(pg_temp.has_check(r, 'BUILD_VERSION_MISMATCH', 'FAIL'), 'blocker BUILD_VERSION_MISMATCH');
  perform pg_temp.assert(pg_temp.has_check(r, 'BUILD_NOT_SUCCEEDED', 'FAIL'), 'blocker BUILD_NOT_SUCCEEDED');
  perform pg_temp.assert(pg_temp.has_check(r, 'ARTIFACT_MISSING', 'FAIL'), 'blocker ARTIFACT_MISSING');
  perform pg_temp.assert(pg_temp.has_check(r, 'STORE_CONNECTION_MISSING', 'FAIL'), 'blocker STORE_CONNECTION_MISSING');
  perform pg_temp.assert(pg_temp.has_check(r, 'METADATA_PACKAGE_NAME_MISSING', 'FAIL'), 'blocker METADATA_PACKAGE_NAME_MISSING');
  -- Cross-contamination: o upload SUCCEEDED do Studio B nunca aparece aqui.
  perform pg_temp.assert(not pg_temp.has_check(r, 'PROVIDER_UPLOAD_MISSING', 'PASS'), 'upload SUCCEEDED de outro Studio não satisfaz a Release');
end $$;

-- 1.3 Corrige versão + build; sobe um artifact .ipa (formato errado p/ Google)
set role postgres;
update builds set game_version_id = 'aaaaaaaa-4444-0000-0000-000000000001', status = 'SUCCEEDED'
  where id = 'aaaaaaaa-5555-0000-0000-000000000001';
insert into build_artifacts (id, studio_id, build_id, storage_path, original_filename, file_extension, size_bytes,
                             checksum, upload_status, validation_status, created_actor_type, updated_actor_type)
values ('aaaaaaaa-7777-0000-0000-000000000009', 'aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-5555-0000-0000-000000000001',
        'a/app.ipa', 'app.ipa', 'ipa', 1000, 'cafe', 'STORED', 'VALID', 'SYSTEM', 'SYSTEM');
select pg_temp.as_user('aaaaaaaa-0000-0000-0000-00000000000a');

do $$
declare r jsonb := get_release_readiness('aaaaaaaa-6666-0000-0000-000000000001');
begin
  perform pg_temp.assert(pg_temp.has_check(r, 'ARTIFACT_WRONG_FORMAT', 'FAIL'), 'blocker ARTIFACT_WRONG_FORMAT (.ipa no Google Play)');
  perform pg_temp.assert(pg_temp.has_check(r, 'BUILD_VERSION_MISMATCH', 'PASS'), 'versão corrigida passa');
  perform pg_temp.assert(pg_temp.has_check(r, 'BUILD_NOT_SUCCEEDED', 'PASS'), 'build SUCCEEDED passa');
end $$;

-- 1.4 Artifact .aab correto, mas ainda PENDING/PENDING
set role postgres;
insert into build_artifacts (id, studio_id, build_id, storage_path, original_filename, file_extension, size_bytes,
                             checksum, upload_status, validation_status, created_actor_type, updated_actor_type)
values ('aaaaaaaa-7777-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-5555-0000-0000-000000000001',
        'a/app.aab', 'app.aab', 'aab', 1000, 'beef', 'PENDING', 'PENDING', 'SYSTEM', 'SYSTEM');
select pg_temp.as_user('aaaaaaaa-0000-0000-0000-00000000000a');

do $$
declare r jsonb := get_release_readiness('aaaaaaaa-6666-0000-0000-000000000001');
begin
  perform pg_temp.assert(pg_temp.has_check(r, 'ARTIFACT_NOT_STORED', 'FAIL'), 'blocker ARTIFACT_NOT_STORED');
  perform pg_temp.assert(pg_temp.has_check(r, 'ARTIFACT_INVALID', 'FAIL'), 'blocker ARTIFACT_INVALID');
  -- Artifact não confiável ⇒ nem se pergunta pelo provider_upload.
  perform pg_temp.assert(not pg_temp.has_check(r, 'PROVIDER_UPLOAD_MISSING', 'PASS'), 'sem artifact válido não há upload válido');
end $$;

-- 1.5 Artifact STORED+VALID: agora falta a Store Connection e o upload
set role postgres;
update build_artifacts set upload_status = 'STORED', validation_status = 'VALID'
  where id = 'aaaaaaaa-7777-0000-0000-000000000001';
select pg_temp.as_user('aaaaaaaa-0000-0000-0000-00000000000a');

do $$
declare r jsonb := get_release_readiness('aaaaaaaa-6666-0000-0000-000000000001');
begin
  perform pg_temp.assert(pg_temp.has_check(r, 'ARTIFACT_NOT_STORED', 'PASS'), 'artifact STORED passa');
  perform pg_temp.assert(pg_temp.has_check(r, 'ARTIFACT_INVALID', 'PASS'), 'artifact VALID passa');
  perform pg_temp.assert(pg_temp.has_check(r, 'PROVIDER_UPLOAD_MISSING', 'FAIL'), 'blocker PROVIDER_UPLOAD_MISSING');
end $$;

-- 1.6 Store Connection existe mas DEGRADED e sem credenciais
set role postgres;
insert into store_connections (id, studio_id, platform_id, status, credentials_ref, display_name,
                               created_actor_type, updated_actor_type)
values ('aaaaaaaa-8888-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001',
        (select id from platforms where name = 'Google Play'), 'DEGRADED', null, 'Google A', 'SYSTEM', 'SYSTEM');
select pg_temp.as_user('aaaaaaaa-0000-0000-0000-00000000000a');

do $$
declare r jsonb := get_release_readiness('aaaaaaaa-6666-0000-0000-000000000001');
begin
  perform pg_temp.assert(pg_temp.has_check(r, 'STORE_CONNECTION_MISSING', 'PASS'), 'conexão encontrada');
  perform pg_temp.assert(pg_temp.has_check(r, 'STORE_CONNECTION_INVALID', 'FAIL'), 'blocker STORE_CONNECTION_INVALID');
  perform pg_temp.assert(pg_temp.has_check(r, 'STORE_CONNECTION_CREDENTIALS_MISSING', 'FAIL'), 'blocker credenciais ausentes');
end $$;

-- 1.7 Conexão saudável; upload FAILED
set role postgres;
update store_connections set status = 'CONNECTED', credentials_ref = 'sc_secret_studio_a_super_secreto'
  where id = 'aaaaaaaa-8888-0000-0000-000000000001';
insert into provider_uploads (id, studio_id, build_artifact_id, store_connection_id, status, error_code,
                              created_actor_type, updated_actor_type)
values ('aaaaaaaa-9999-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-7777-0000-0000-000000000001',
        'aaaaaaaa-8888-0000-0000-000000000001', 'FAILED', 'HTTP_403', 'SYSTEM', 'SYSTEM');
select pg_temp.as_user('aaaaaaaa-0000-0000-0000-00000000000a');

do $$
declare r jsonb := get_release_readiness('aaaaaaaa-6666-0000-0000-000000000001');
begin
  perform pg_temp.assert(pg_temp.has_check(r, 'PROVIDER_UPLOAD_FAILED', 'FAIL'), 'blocker PROVIDER_UPLOAD_FAILED');
end $$;

-- 1.8 Retry em andamento
set role postgres;
insert into provider_uploads (id, studio_id, build_artifact_id, store_connection_id, status, attempt,
                              created_actor_type, updated_actor_type)
values ('aaaaaaaa-9999-0000-0000-000000000002', 'aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-7777-0000-0000-000000000001',
        'aaaaaaaa-8888-0000-0000-000000000001', 'UPLOADING', 2, 'SYSTEM', 'SYSTEM');
select pg_temp.as_user('aaaaaaaa-0000-0000-0000-00000000000a');

do $$
declare r jsonb := get_release_readiness('aaaaaaaa-6666-0000-0000-000000000001');
begin
  perform pg_temp.assert(pg_temp.has_check(r, 'PROVIDER_UPLOAD_IN_PROGRESS', 'FAIL'), 'blocker PROVIDER_UPLOAD_IN_PROGRESS');
end $$;

-- 1.9 Upload conclui, mas sem versionCode (assimetria Google)
set role postgres;
update provider_uploads set status = 'SUCCEEDED', completed_at = now()
  where id = 'aaaaaaaa-9999-0000-0000-000000000002';
select pg_temp.as_user('aaaaaaaa-0000-0000-0000-00000000000a');

do $$
declare r jsonb := get_release_readiness('aaaaaaaa-6666-0000-0000-000000000001');
begin
  perform pg_temp.assert(pg_temp.has_check(r, 'PROVIDER_UPLOAD_MISSING', 'PASS'), 'upload SUCCEEDED do artifact certo satisfaz');
  perform pg_temp.assert(pg_temp.has_check(r, 'GOOGLE_VERSION_CODE_MISSING', 'FAIL'), 'blocker GOOGLE_VERSION_CODE_MISSING');
end $$;

-- 1.10 Últimas correções → READY
set role postgres;
update provider_uploads set version_code = 7 where id = 'aaaaaaaa-9999-0000-0000-000000000002';
update games set package_name = 'com.studioa.jogoa' where id = 'aaaaaaaa-3333-0000-0000-000000000001';
insert into game_localizations (studio_id, game_id, language_code, title, short_description, full_description)
values ('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-3333-0000-0000-000000000001', 'en-US', 'Jogo A', 'curta', 'completa');
select pg_temp.as_user('aaaaaaaa-0000-0000-0000-00000000000a');

do $$
declare r jsonb := get_release_readiness('aaaaaaaa-6666-0000-0000-000000000001');
begin
  raise notice 'blockers restantes (Google): %', pg_temp.blockers(r);
  perform pg_temp.assert(r ->> 'status' = 'READY', 'Google Play: READY após todas as correções');
  perform pg_temp.assert((r ->> 'blockerCount')::int = 0, 'blockerCount zerado');
  -- WARNING nunca bloqueia: release_notes segue vazia e mesmo assim está READY.
  perform pg_temp.assert(pg_temp.has_check(r, 'METADATA_RELEASE_NOTES_MISSING', 'WARN'), 'WARNING coexiste com READY');
end $$;

-- =====================================================================
-- 2) App Store: NOT_READY → READY (assimetria Apple)
-- =====================================================================
set role postgres;
insert into submissions (id, studio_id, release_id, platform_id, build_id, status, created_actor_type, updated_actor_type)
values ('aaaaaaaa-aaaa-0000-0000-000000000002', 'aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-6666-0000-0000-000000000001',
        (select id from platforms where name = 'App Store'), 'aaaaaaaa-5555-0000-0000-000000000002', 'DRAFT', 'SYSTEM', 'SYSTEM');
insert into build_artifacts (id, studio_id, build_id, storage_path, original_filename, file_extension, size_bytes,
                             checksum, upload_status, validation_status, created_actor_type, updated_actor_type)
values ('aaaaaaaa-7777-0000-0000-000000000002', 'aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-5555-0000-0000-000000000002',
        'a/app2.ipa', 'app.ipa', 'ipa', 1000, 'face', 'STORED', 'VALID', 'SYSTEM', 'SYSTEM');
insert into store_connections (id, studio_id, platform_id, status, credentials_ref, display_name,
                               created_actor_type, updated_actor_type)
values ('aaaaaaaa-8888-0000-0000-000000000002', 'aaaaaaaa-1111-0000-0000-000000000001',
        (select id from platforms where name = 'App Store'), 'CONNECTED', 'sc_secret_apple_a', 'Apple A', 'SYSTEM', 'SYSTEM');
insert into provider_uploads (id, studio_id, build_artifact_id, store_connection_id, status, completed_at,
                              created_actor_type, updated_actor_type)
values ('aaaaaaaa-9999-0000-0000-000000000003', 'aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-7777-0000-0000-000000000002',
        'aaaaaaaa-8888-0000-0000-000000000002', 'SUCCEEDED', now(), 'SYSTEM', 'SYSTEM');
select pg_temp.as_user('aaaaaaaa-0000-0000-0000-00000000000a');

do $$
declare r jsonb := get_release_readiness('aaaaaaaa-6666-0000-0000-000000000001');
begin
  perform pg_temp.assert(r ->> 'status' = 'NOT_READY', 'App Store entra NOT_READY');
  perform pg_temp.assert(pg_temp.has_check(r, 'METADATA_BUNDLE_IDENTIFIER_MISSING', 'FAIL'), 'blocker bundle identifier (só Apple)');
  perform pg_temp.assert(pg_temp.has_check(r, 'APPLE_BUILD_UPLOAD_REF_MISSING', 'FAIL'), 'blocker APPLE_BUILD_UPLOAD_REF_MISSING');
  perform pg_temp.assert(not pg_temp.has_check(r, 'GOOGLE_VERSION_CODE_MISSING', 'FAIL'), 'check do Google não vaza para a Submission Apple');
end $$;

set role postgres;
update games set bundle_identifier = 'com.studioa.jogoa' where id = 'aaaaaaaa-3333-0000-0000-000000000001';
update provider_uploads set apple_build_upload_id = 'BU-123' where id = 'aaaaaaaa-9999-0000-0000-000000000003';
select pg_temp.as_user('aaaaaaaa-0000-0000-0000-00000000000a');

do $$
declare r jsonb := get_release_readiness('aaaaaaaa-6666-0000-0000-000000000001');
begin
  raise notice 'blockers restantes (Google + Apple): %', pg_temp.blockers(r);
  perform pg_temp.assert(r ->> 'status' = 'READY', 'Release com Google + Apple: READY');
end $$;

-- =====================================================================
-- 3) Segurança
-- =====================================================================

-- 3.1 Nenhum segredo no payload
do $$
declare r text := get_release_readiness('aaaaaaaa-6666-0000-0000-000000000001')::text;
begin
  perform pg_temp.assert(r not like '%sc_secret%', 'payload não contém credentials_ref/refs de Vault');
  -- `original_filename` (ex: "app.aab") SAI de propósito, na mensagem do
  -- check — é texto que o próprio usuário deu e serve para ele identificar
  -- o artefato na UI. O que nunca pode sair é a localização interna:
  -- bucket + storage_path (que viram URL assinada).
  perform pg_temp.assert(r not like '%storage_path%' and r not like '%a/app.aab%' and r not like '%"builds"%',
                         'payload não contém bucket/caminho de storage do artefato');
  perform pg_temp.assert(r not like '%authorization%' and r not like '%Bearer%', 'payload não contém headers/tokens');
end $$;

-- 3.2 Cross-Studio: Owner B não lê a Release do Studio A
select pg_temp.as_user('bbbbbbbb-0000-0000-0000-00000000000b');
do $$
declare r jsonb;
begin
  begin
    r := get_release_readiness('aaaaaaaa-6666-0000-0000-000000000001');
    raise exception 'FALHOU: cross-Studio devia ter sido rejeitado';
  exception when insufficient_privilege then
    raise notice 'ok — cross-Studio rejeitado com insufficient_privilege';
  end;
end $$;

-- 3.3 Release inexistente
do $$
begin
  begin
    perform get_release_readiness('00000000-0000-0000-0000-0000000000ff');
    raise exception 'FALHOU: release inexistente devia ter sido rejeitada';
  exception when others then
    if sqlerrm like 'FALHOU%' then raise; end if;
    raise notice 'ok — release inexistente rejeitada (%)', sqlerrm;
  end;
end $$;

-- 3.4 anon não tem EXECUTE
set role postgres;
do $$
begin
  perform set_config('request.jwt.claims', null, true);
  perform set_config('role', 'anon', true);
  begin
    perform get_release_readiness('aaaaaaaa-6666-0000-0000-000000000001');
    raise exception 'FALHOU: anon conseguiu executar get_release_readiness';
  exception when insufficient_privilege then
    raise notice 'ok — anon sem EXECUTE em get_release_readiness';
  end;
end $$;

set role postgres;
select 'TODOS OS TESTES DE READINESS PASSARAM' as resultado;
rollback;
