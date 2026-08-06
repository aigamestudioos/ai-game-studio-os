-- Sprint 2.8 — Store Connections: backend (RLS com gate + Vault + colunas
-- que faltavam), sem UI ainda (Sprint 2.10) e sem os adapters Apple/Google
-- (Sprint 2.9) — escopo dividido por decisão do usuário, ver
-- IMPLEMENTATION_LOG.md.
--
-- `store_connections` já existia desde 20260716000006_publishing.sql, com
-- `credentials_ref text -- referência a Supabase Secrets; nunca a
-- credencial em si` (mesmo texto em DATA_MODEL.md §... e AGSOS-SPEC-004
-- §13, ambos citados na auditoria deste sprint) — um padrão de ponteiro já
-- decidido, nunca implementado. Este sprint implementa o mecanismo mínimo
-- que faltava (Supabase Vault) em vez de adicionar uma coluna
-- `encrypted_credentials` nova, que teria contradito a decisão já tomada.

-- Colunas que faltavam para o objeto "Store Connection" completo pedido
-- pelo usuário (id/studio_id/status/created_at/updated_at/credentials_ref
-- já existiam).
alter table store_connections
  add column display_name text null,
  add column last_validation_at timestamptz null,
  add column last_error text null,
  add column metadata jsonb not null default '{}'::jsonb;

-- Vault: mecanismo real por trás de `credentials_ref`. `supabase_vault` é
-- a extensão nativa do Supabase para isso (pgsodium por baixo) — é
-- literalmente o "Supabase Secrets" citado na documentação, não uma
-- criptografia inventada por este sprint.
create extension if not exists "supabase_vault" cascade;

-- Grava/atualiza a credencial de uma Store Connection no Vault e guarda só
-- a referência (`credentials_ref`) na linha. SECURITY DEFINER: `vault.*` só
-- é acessível a `supabase_admin`, então a checagem de permissão acontece
-- INTEIRAMENTE dentro da função, antes de qualquer chamada ao vault — sem
-- isso, ninguém autenticado conseguiria chamar `vault.create_secret`
-- diretamente (nem deveria). Nunca expõe o segredo de volta — só grava.
create or replace function public.set_store_connection_secret(
  p_store_connection_id uuid,
  p_secret text,
  p_actor_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_studio_id uuid;
  v_existing_ref text;
  v_secret_id uuid;
begin
  select studio_id, credentials_ref into v_studio_id, v_existing_ref
  from store_connections
  where id = p_store_connection_id;

  if v_studio_id is null then
    raise exception 'store_connection não encontrada';
  end if;

  if v_studio_id <> public.current_user_studio_id() then
    raise exception insufficient_privilege using message = 'store_connection não pertence ao Studio do usuário atual';
  end if;

  if not public.current_user_has_permission('studio.manage_store_connections') then
    raise exception insufficient_privilege using message = 'sem permissão studio.manage_store_connections';
  end if;

  if v_existing_ref is not null then
    perform vault.update_secret(v_existing_ref::uuid, p_secret);
    v_secret_id := v_existing_ref::uuid;
  else
    v_secret_id := vault.create_secret(p_secret, p_store_connection_id::text);
  end if;

  update store_connections
  set credentials_ref = v_secret_id::text,
      updated_at = now(),
      updated_actor_type = 'USER',
      updated_actor_id = p_actor_id
  where id = p_store_connection_id;
end;
$$;

grant execute on function public.set_store_connection_secret(uuid, text, uuid) to authenticated;

-- Limpeza: ao apagar (ou arquivar) uma Store Connection, o segredo no Vault
-- não deve sobreviver órfão. Trigger em vez de contar com a aplicação
-- lembrar de limpar — mesmo raciocínio de `studio_events_no_update`/
-- `_no_delete` já usado no projeto para invariantes reforçados no banco.
-- `vault.delete_secret()` NÃO existe nesta versão da extensão (0.3.1) —
-- só `create_secret`/`update_secret` são expostas como função; a limpeza é
-- feita apagando direto de `vault.secrets` (tabela real por trás da view
-- `vault.decrypted_secrets`). Achado real ao testar contra Postgres de
-- verdade (a suposição inicial, baseada só na documentação, estava
-- incorreta) — corrigido antes de qualquer commit.
create or replace function public.delete_store_connection_secret()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.credentials_ref is not null then
    delete from vault.secrets where id = old.credentials_ref::uuid;
  end if;
  return old;
end;
$$;

create trigger store_connections_delete_secret
  before delete on store_connections
  for each row
  execute function public.delete_store_connection_secret();

-- RLS: mesmo padrão de studio.manage_members (20260805000001) — SELECT
-- aberto ao Studio, escrita (INSERT/UPDATE/DELETE) exige a permissão
-- dedicada. `credentials_ref`/segredo nunca são legíveis via SELECT comum
-- de qualquer forma (é só o UUID do Vault, inútil sem `vault.decrypted_secrets`,
-- que só `supabase_admin` acessa) — mas a política ainda assim gate a
-- ESCRITA da linha, não só o segredo.
insert into permissions (key, description) values
  ('studio.manage_store_connections', 'Criar, editar, remover e validar conexões com lojas (Apple/Google)')
on conflict (key) do nothing;

drop policy if exists store_connections_isolation on store_connections;

create policy store_connections_select on store_connections
  for select
  using (studio_id = public.current_user_studio_id());

create policy store_connections_insert on store_connections
  for insert
  with check (
    studio_id = public.current_user_studio_id()
    and public.current_user_has_permission('studio.manage_store_connections')
  );

create policy store_connections_update on store_connections
  for update
  using (studio_id = public.current_user_studio_id())
  with check (
    studio_id = public.current_user_studio_id()
    and public.current_user_has_permission('studio.manage_store_connections')
  );

create policy store_connections_delete on store_connections
  for delete
  using (
    studio_id = public.current_user_studio_id()
    and public.current_user_has_permission('studio.manage_store_connections')
  );

-- Backfill: Owner/Admin de Studios já existentes ganham a permissão nova
-- (Owner já tem todas as permissões via `select ... from permissions` sem
-- filtro no bootstrap, mas isso só roda na criação do Studio — precisa de
-- backfill explícito para quem já existe).
insert into role_permissions (studio_id, role_id, permission_id)
select r.studio_id, r.id, p.id
from roles r
join permissions p on p.key = 'studio.manage_store_connections'
where r.name in ('Owner', 'Admin')
on conflict do nothing;

-- `bootstrap_studio_for_current_user()` (20260729000001) concede ao Admin
-- uma lista fixa de permission keys, não "todas" como o Owner — sem este
-- `create or replace`, todo Studio criado a partir de agora teria um Admin
-- sem `studio.manage_store_connections`, mesmo com o backfill acima já
-- tendo corrigido os Studios existentes. Corpo idêntico ao original, só a
-- lista de keys do Admin ganha a chave nova.
create or replace function public.bootstrap_studio_for_current_user(p_studio_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_studio_id uuid;
  v_email text;
  v_name text;
  v_owner_role_id uuid;
  v_admin_role_id uuid;
  v_member_role_id uuid;
  v_invite_id uuid;
  v_invite_studio_id uuid;
  v_invite_role_name text;
  v_invite_role_id uuid;
begin
  if v_user_id is null then
    raise exception 'bootstrap_studio_for_current_user requer um usuário autenticado';
  end if;

  select studio_id into v_studio_id from public.users where id = v_user_id;
  if v_studio_id is not null then
    return v_studio_id;
  end if;

  select email, coalesce(raw_user_meta_data ->> 'full_name', split_part(email, '@', 1))
    into v_email, v_name
    from auth.users
    where id = v_user_id;

  select id, studio_id, role_name
    into v_invite_id, v_invite_studio_id, v_invite_role_name
    from invites
    where email = v_email and status = 'pending'
    order by created_at desc
    limit 1;

  if v_invite_studio_id is not null then
    v_studio_id := v_invite_studio_id;

    insert into users (id, studio_id, email, name, created_actor_type, created_actor_id, updated_actor_type, updated_actor_id)
    values (v_user_id, v_studio_id, v_email, v_name, 'USER', v_user_id, 'USER', v_user_id);

    select id into v_invite_role_id from roles where studio_id = v_studio_id and name = v_invite_role_name;
    if v_invite_role_id is null then
      insert into roles (studio_id, name, description, created_actor_type, created_actor_id, updated_actor_type, updated_actor_id)
      values (v_studio_id, v_invite_role_name, 'Criado automaticamente ao aceitar convite', 'SYSTEM', v_user_id, 'SYSTEM', v_user_id)
      returning id into v_invite_role_id;
    end if;

    insert into user_roles (studio_id, user_id, role_id) values (v_studio_id, v_user_id, v_invite_role_id);

    update invites set status = 'accepted', accepted_at = now() where id = v_invite_id;

    return v_studio_id;
  end if;

  insert into studios (name, owner_user_id, created_actor_type, created_actor_id, updated_actor_type, updated_actor_id)
  values (p_studio_name, v_user_id, 'USER', v_user_id, 'USER', v_user_id)
  returning id into v_studio_id;

  insert into users (id, studio_id, email, name, created_actor_type, created_actor_id, updated_actor_type, updated_actor_id)
  values (v_user_id, v_studio_id, v_email, v_name, 'USER', v_user_id, 'USER', v_user_id);

  insert into roles (studio_id, name, description, created_actor_type, created_actor_id, updated_actor_type, updated_actor_id)
  values (v_studio_id, 'Owner', 'Acesso completo ao Studio', 'USER', v_user_id, 'USER', v_user_id)
  returning id into v_owner_role_id;

  insert into roles (studio_id, name, description, created_actor_type, created_actor_id, updated_actor_type, updated_actor_id)
  values (v_studio_id, 'Admin', 'Gerencia membros e configurações do Studio', 'USER', v_user_id, 'USER', v_user_id)
  returning id into v_admin_role_id;

  insert into roles (studio_id, name, description, created_actor_type, created_actor_id, updated_actor_type, updated_actor_id)
  values (v_studio_id, 'Member', 'Acesso básico ao Studio', 'USER', v_user_id, 'USER', v_user_id)
  returning id into v_member_role_id;

  insert into role_permissions (studio_id, role_id, permission_id)
  select v_studio_id, v_owner_role_id, id from permissions;

  insert into role_permissions (studio_id, role_id, permission_id)
  select v_studio_id, v_admin_role_id, id from permissions
  where key in ('studio.invite_members', 'studio.manage_members', 'studio.manage_store_connections');

  insert into user_roles (studio_id, user_id, role_id)
  values (v_studio_id, v_user_id, v_owner_role_id);

  return v_studio_id;
end;
$$;
