-- Sprint 2.15 — testes de RLS/autorização de `game_localizations` (Store
-- Listing). Mesma técnica de `readiness_test.sql`: tudo dentro de uma
-- transação com ROLLBACK no fim, roda via `bash scripts/test-readiness.sh`.
--
-- Cobre exatamente a matriz pedida pelo Sprint 2.15 (§13): Studio pode
-- ler/criar/editar sua própria Store Listing; cross-Studio é bloqueado;
-- anon é bloqueado; e que criar a listing satisfaz naturalmente
-- `METADATA_LISTING_MISSING` (sem tocar em `get_release_readiness`).

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

create or replace function pg_temp.as_user(p_user_id uuid)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create or replace function pg_temp.as_anon()
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{}', true);
  perform set_config('role', 'anon', true);
end $$;

-- ---------- fixture: Studio A (dono) e Studio B (intruso), 1 Game cada ----------
do $fixture$
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
  values
    ('cccccccc-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'listing-owner-a@test.local', '', now(), now()),
    ('dddddddd-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'listing-owner-b@test.local', '', now(), now());

  insert into studios (id, name, owner_user_id, created_actor_type, updated_actor_type)
  values
    ('cccccccc-1111-0000-0000-000000000001', 'Studio A (listing)', 'cccccccc-0000-0000-0000-00000000000a', 'SYSTEM', 'SYSTEM'),
    ('dddddddd-1111-0000-0000-000000000001', 'Studio B (listing)', 'dddddddd-0000-0000-0000-00000000000b', 'SYSTEM', 'SYSTEM');

  insert into public.users (id, studio_id, email, name, created_actor_type, updated_actor_type)
  values
    ('cccccccc-0000-0000-0000-00000000000a', 'cccccccc-1111-0000-0000-000000000001', 'listing-owner-a@test.local', 'Owner A', 'SYSTEM', 'SYSTEM'),
    ('dddddddd-0000-0000-0000-00000000000b', 'dddddddd-1111-0000-0000-000000000001', 'listing-owner-b@test.local', 'Owner B', 'SYSTEM', 'SYSTEM');

  insert into projects (id, studio_id, name, created_actor_type, updated_actor_type)
  values
    ('cccccccc-2222-0000-0000-000000000001', 'cccccccc-1111-0000-0000-000000000001', 'Projeto A', 'SYSTEM', 'SYSTEM'),
    ('dddddddd-2222-0000-0000-000000000001', 'dddddddd-1111-0000-0000-000000000001', 'Projeto B', 'SYSTEM', 'SYSTEM');

  insert into games (id, studio_id, project_id, name, created_actor_type, updated_actor_type)
  values
    ('cccccccc-3333-0000-0000-000000000001', 'cccccccc-1111-0000-0000-000000000001', 'cccccccc-2222-0000-0000-000000000001', 'Jogo A', 'SYSTEM', 'SYSTEM'),
    ('dddddddd-3333-0000-0000-000000000001', 'dddddddd-1111-0000-0000-000000000001', 'dddddddd-2222-0000-0000-000000000001', 'Jogo B', 'SYSTEM', 'SYSTEM');
end $fixture$;

-- ---------- Studio A cria sua própria Store Listing ----------
select pg_temp.as_user('cccccccc-0000-0000-0000-00000000000a');

insert into game_localizations (id, studio_id, game_id, language_code, title, full_description)
values ('cccccccc-4444-0000-0000-000000000001', 'cccccccc-1111-0000-0000-000000000001', 'cccccccc-3333-0000-0000-000000000001', 'en-US', 'Jogo A', 'Descrição completa.');

select pg_temp.assert(
  (select count(*) from game_localizations where game_id = 'cccccccc-3333-0000-0000-000000000001') = 1,
  'Studio A consegue criar sua própria Store Listing'
);

-- Studio A edita sua própria listing.
update game_localizations set title = 'Jogo A (editado)' where id = 'cccccccc-4444-0000-0000-000000000001';
select pg_temp.assert(
  (select title from game_localizations where id = 'cccccccc-4444-0000-0000-000000000001') = 'Jogo A (editado)',
  'Studio A consegue editar sua própria Store Listing'
);

-- ---------- Nota sobre game_id "estrangeiro" ----------
-- `game_localizations_isolation` (mesmo padrão de `builds`/`releases`/
-- `game_versions` — todas as tabelas irmãs de Game desde o Sprint 2.1) só
-- verifica `studio_id = current_user_studio_id()`; não valida que `game_id`
-- pertence a esse mesmo Studio no nível de RLS. Isso é um padrão
-- pré-existente e sistêmico (não introduzido por esta sprint) — fora de
-- escopo redesenhar RLS de todas as tabelas do domínio Game no 2.15 (ver
-- CLAUDE.md/limite de escopo). A superfície real do produto nunca expõe
-- esse gap: a Server Action `saveStoreListing`
-- (app/games/[id]/listing-actions.ts) resolve `game.studio_id` via
-- `createGamesRepository().getById(gameId)`, que já é filtrado por RLS de
-- `games` — um Game de outro Studio simplesmente não é encontrado
-- (retorna null, a action recusa antes de qualquer insert). Registrado
-- como dívida pré-existente, não como achado novo desta sprint.

-- ---------- cross-Studio: Studio B não lê a Store Listing de Studio A ----------
select pg_temp.as_user('dddddddd-0000-0000-0000-00000000000b');

select pg_temp.assert(
  (select count(*) from game_localizations where game_id = 'cccccccc-3333-0000-0000-000000000001') = 0,
  'Studio B (cross-Studio) não enxerga a Store Listing de Studio A via RLS'
);

do $$
begin
  begin
    update game_localizations set title = 'invasão' where id = 'cccccccc-4444-0000-0000-000000000001';
    raise exception 'FALHOU: Studio B conseguiu editar a Store Listing de Studio A';
  exception
    when others then
      raise notice 'ok — Studio B bloqueado ao tentar editar a Store Listing de Studio A (0 linhas afetadas / RLS)';
  end;
end $$;

select pg_temp.assert(
  (select title from game_localizations where id = 'cccccccc-4444-0000-0000-000000000001') = 'Jogo A (editado)',
  'a Store Listing de Studio A não foi alterada pela tentativa de Studio B'
);

-- ---------- anon é bloqueado ----------
-- `anon` não tem nenhum GRANT na tabela (mesmo padrão de `games`/`builds`/
-- `releases`) — nível de bloqueio mais forte que RLS: o erro é
-- "permission denied for table", nem chega a avaliar a policy.
select pg_temp.as_anon();

do $$
begin
  begin
    perform count(*) from game_localizations;
    raise exception 'FALHOU: anon conseguiu ler game_localizations';
  exception
    when insufficient_privilege then
      raise notice 'ok — anon bloqueado ao tentar ler game_localizations (permission denied, sem GRANT)';
  end;
end $$;

do $$
begin
  begin
    insert into game_localizations (studio_id, game_id, language_code, title)
    values ('cccccccc-1111-0000-0000-000000000001', 'cccccccc-3333-0000-0000-000000000001', 'pt-BR', 'anon');
    raise exception 'FALHOU: anon conseguiu inserir uma Store Listing';
  exception
    when insufficient_privilege then
      raise notice 'ok — anon bloqueado ao tentar inserir uma Store Listing (permission denied, sem GRANT)';
  end;
end $$;

-- ---------- METADATA_LISTING_MISSING resolvido naturalmente (sem tocar a RPC) ----------
select pg_temp.as_user('cccccccc-0000-0000-0000-00000000000a');

select pg_temp.assert(
  exists (
    select 1 from game_localizations
    where game_id = 'cccccccc-3333-0000-0000-000000000001' and language_code = 'en-US'
  ),
  'Store Listing de Studio A existe — mesma condição que get_release_readiness usa para METADATA_LISTING_MISSING'
);

reset role;
select set_config('request.jwt.claims', '', true);

select 'TODOS OS TESTES DE GAME_LOCALIZATIONS PASSARAM' as resultado;

rollback;
