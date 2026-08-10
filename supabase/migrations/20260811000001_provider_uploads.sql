-- Sprint 2.11b — Google Play AAB Upload. Entidade própria para "artifact
-- enviado a um provider externo" — nunca confundida com `build_artifacts.
-- upload_status/validation_status` (que são sobre "chegou ao AGSOS", não
-- "chegou à loja") nem com `submissions` (que é sobre o pipeline de
-- revisão da loja, Sprint 2.3, referencia `builds` não `build_artifacts`).
-- Decisão registrada em DECISIONS.md.
--
-- provider_upload_status é uma máquina de estado própria e independente de
-- artifact_upload_status/artifact_validation_status (Sprint 2.11a) — nunca
-- fundida com elas.
create type provider_upload_status as enum ('PENDING', 'UPLOADING', 'SUCCEEDED', 'FAILED');

create table provider_uploads (
  id                    uuid primary key default gen_random_uuid(),
  studio_id             uuid not null references studios(id),
  build_artifact_id     uuid not null references build_artifacts(id),
  store_connection_id   uuid not null references store_connections(id),
  status                provider_upload_status not null default 'PENDING',
  edit_id               text null,
  version_code          bigint null,
  error_code            text null,
  attempt               integer not null default 1,
  started_at            timestamptz null,
  completed_at          timestamptz null,
  archived_at           timestamptz null,
  archived_actor_type   actor_type null,
  archived_actor_id     uuid null,
  created_at            timestamptz not null default now(),
  created_actor_type    actor_type not null,
  created_actor_id      uuid null,
  updated_at            timestamptz not null default now(),
  updated_actor_type    actor_type not null,
  updated_actor_id      uuid null
);

create index idx_provider_uploads_build_artifact on provider_uploads(build_artifact_id);
create index idx_provider_uploads_studio on provider_uploads(studio_id);

alter table provider_uploads enable row level security;

-- Permission nova (namespace `publishing.*`, decisão registrada em
-- DECISIONS.md) — "enviar a uma loja externa" é uma capacidade diferente
-- de `builds.manage_artifacts` (gerenciar o binário dentro do AGSOS) e de
-- `studio.manage_store_connections` (gerenciar a credencial).
insert into permissions (key, description) values
  ('publishing.upload_build', 'Enviar um artefato de Build já validado para uma loja externa (Google Play/Apple)')
on conflict (key) do nothing;

create policy provider_uploads_select on provider_uploads
  for select
  using (studio_id = public.current_user_studio_id());

create policy provider_uploads_insert on provider_uploads
  for insert
  with check (
    studio_id = public.current_user_studio_id()
    and public.current_user_has_permission('publishing.upload_build')
  );

create policy provider_uploads_update on provider_uploads
  for update
  using (studio_id = public.current_user_studio_id())
  with check (
    studio_id = public.current_user_studio_id()
    and public.current_user_has_permission('publishing.upload_build')
  );

create policy provider_uploads_delete on provider_uploads
  for delete
  using (
    studio_id = public.current_user_studio_id()
    and public.current_user_has_permission('publishing.upload_build')
  );

-- Backfill: Owner/Admin de Studios já existentes ganham a permissão nova
-- (mesmo padrão de 20260806000001/20260810000001).
insert into role_permissions (studio_id, role_id, permission_id)
select r.studio_id, r.id, p.id
from roles r
join permissions p on p.key = 'publishing.upload_build'
where r.name in ('Owner', 'Admin')
on conflict do nothing;

-- Atualiza o bootstrap para incluir a permissão nova na lista fixa do
-- Admin de Studios novos (corpo idêntico ao de 20260810000001, só a lista
-- de keys do Admin ganha a chave nova).
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
  where key in ('studio.invite_members', 'studio.manage_members', 'studio.manage_store_connections', 'builds.manage_artifacts', 'publishing.upload_build');

  insert into user_roles (studio_id, user_id, role_id)
  values (v_studio_id, v_user_id, v_owner_role_id);

  return v_studio_id;
end;
$$;

-- RPC de criação (defesa em profundidade, mesmo padrão de
-- create_pending_build_artifact, Sprint 2.11a): valida que o
-- build_artifact pertence ao Studio, está STORED+VALID (só artefato
-- estruturalmente válido pode ser enviado à loja), que a store_connection
-- pertence ao mesmo Studio, e a permission — tudo dentro da mesma
-- transação que cria a linha PENDING.
create or replace function public.create_pending_provider_upload(
  p_build_artifact_id uuid,
  p_store_connection_id uuid,
  p_actor_id uuid
)
returns provider_uploads
language plpgsql
security definer
set search_path = public
as $$
declare
  v_studio_id uuid;
  v_artifact_studio_id uuid;
  v_artifact_upload_status artifact_upload_status;
  v_artifact_validation_status artifact_validation_status;
  v_connection_studio_id uuid;
  v_row provider_uploads;
begin
  select studio_id, upload_status, validation_status
    into v_artifact_studio_id, v_artifact_upload_status, v_artifact_validation_status
    from build_artifacts
    where id = p_build_artifact_id;

  if v_artifact_studio_id is null then
    raise exception 'build_artifact não encontrado';
  end if;

  v_studio_id := v_artifact_studio_id;

  if v_studio_id <> public.current_user_studio_id() then
    raise exception insufficient_privilege using message = 'build_artifact não pertence ao Studio do usuário atual';
  end if;

  if not public.current_user_has_permission('publishing.upload_build') then
    raise exception insufficient_privilege using message = 'sem permissão publishing.upload_build';
  end if;

  if v_artifact_upload_status <> 'STORED' then
    raise exception 'build_artifact ainda não está armazenado (upload_status = %)', v_artifact_upload_status;
  end if;

  if v_artifact_validation_status <> 'VALID' then
    raise exception 'build_artifact não é estruturalmente válido (validation_status = %)', v_artifact_validation_status;
  end if;

  select studio_id into v_connection_studio_id from store_connections where id = p_store_connection_id;
  if v_connection_studio_id is null then
    raise exception 'store_connection não encontrada';
  end if;
  if v_connection_studio_id <> v_studio_id then
    raise exception insufficient_privilege using message = 'store_connection não pertence ao Studio do usuário atual';
  end if;

  insert into provider_uploads (
    studio_id, build_artifact_id, store_connection_id, status,
    created_actor_type, created_actor_id, updated_actor_type, updated_actor_id
  ) values (
    v_studio_id, p_build_artifact_id, p_store_connection_id, 'PENDING',
    'USER', p_actor_id, 'USER', p_actor_id
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- Grants explícitos (DEPLOY_RUNBOOK.md §11/§16 — revoke de PUBLIC nunca
-- basta neste projeto Supabase, grants a anon/authenticated são
-- automáticos e separados).
revoke execute on function public.create_pending_provider_upload(uuid, uuid, uuid) from public;
revoke execute on function public.create_pending_provider_upload(uuid, uuid, uuid) from anon;
grant execute on function public.create_pending_provider_upload(uuid, uuid, uuid) to authenticated;
