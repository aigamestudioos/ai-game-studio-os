-- Sprint 2.11a — Artifact Storage Foundation. Entidade própria para os
-- binários reais de Build (AAB/IPA), substituindo o dado 100% simulado hoje
-- em `builds.artifact_url/artifact_size/checksum` (gerado no cliente em
-- `use-game-version.ts`, nunca um upload real). `builds.artifact_url/
-- artifact_size/checksum` continuam existindo — são legado, tratados em
-- sprint futuro (decisão do usuário, ver IMPLEMENTATION_LOG.md), não
-- migrados nem removidos aqui.
--
-- Build 1 → N BuildArtifacts. upload_status e validation_status são duas
-- máquinas de estado independentes (upload = chegou ao Storage;
-- validation = estrutura interna do arquivo é coerente) — nunca fundidas
-- numa só, para não confundir "falhou o upload" com "upload ok, arquivo
-- inválido".

-- Bucket privado `builds` (AGSOS-SPEC-003 §8 já previa este bucket na lista
-- oficial). Criado via migration, não via supabase/config.toml — config.toml
-- só afeta o Postgres local (DEPLOY_RUNBOOK.md §14: nada fora de
-- supabase/migrations chega ao projeto hospedado). Limite de 500MiB (acima
-- do padrão de 50MiB do projeto, específico deste bucket) — AAB/IPA reais
-- podem passar de 50MB facilmente. Sem `allowed_mime_types`: o MIME
-- reportado pelo browser não é confiável (decisão do sprint), a validação
-- real é por extensão + estrutura do arquivo, feita na aplicação.
-- `public = false`: todo acesso é via signed URL de curta duração, emitida
-- por `packages/storage` usando o admin client (service_role) — nenhuma
-- policy em `storage.objects` é necessária ou criada aqui, porque o
-- service_role já bypassa RLS de Storage e nenhum outro caminho de acesso
-- é permitido por design.
insert into storage.buckets (id, name, public, file_size_limit)
values ('builds', 'builds', false, 524288000)
on conflict (id) do nothing;

create type artifact_upload_status as enum ('PENDING', 'UPLOADING', 'STORED', 'FAILED', 'CANCELED');
create type artifact_validation_status as enum ('PENDING', 'VALIDATING', 'VALID', 'INVALID', 'FAILED');
create type checksum_algorithm as enum ('SHA256');

create table build_artifacts (
  id                     uuid primary key default gen_random_uuid(),
  studio_id              uuid not null references studios(id),
  build_id               uuid not null references builds(id),
  storage_bucket         text not null default 'builds',
  storage_path           text not null,
  original_filename      text not null,
  file_extension         text not null,
  mime_type_reported     text null,
  size_bytes             bigint not null,
  checksum_algorithm     checksum_algorithm not null default 'SHA256',
  checksum               text not null,
  upload_status          artifact_upload_status not null default 'PENDING',
  validation_status      artifact_validation_status not null default 'PENDING',
  validation_error_code  text null,
  uploaded_at            timestamptz null,
  validated_at           timestamptz null,
  archived_at            timestamptz null,
  archived_actor_type    actor_type null,
  archived_actor_id      uuid null,
  created_at             timestamptz not null default now(),
  created_actor_type     actor_type not null,
  created_actor_id       uuid null,
  updated_at             timestamptz not null default now(),
  updated_actor_type     actor_type not null,
  updated_actor_id       uuid null,
  constraint build_artifacts_storage_object_unique unique (storage_bucket, storage_path)
);

create index idx_build_artifacts_build on build_artifacts(build_id);
create index idx_build_artifacts_studio on build_artifacts(studio_id);

alter table build_artifacts enable row level security;

-- Permissão dedicada (decisão do usuário: namespace `builds.*` próprio,
-- não reaproveitar `studio.manage_store_connections` nem o namespace
-- `studio.*` usado por todas as permissions existentes até aqui — início
-- deliberado de um domínio de permissions separado para Build/Publishing).
insert into permissions (key, description) values
  ('builds.manage_artifacts', 'Enviar, validar e remover artefatos binários (AAB/IPA) de Builds')
on conflict (key) do nothing;

-- SELECT aberto ao Studio (mesmo padrão de invites/store_connections);
-- escrita (INSERT/UPDATE/DELETE) exige a permissão dedicada. `studio_id` só
-- pode ser o do usuário atual em ambos os lados do check — impede um
-- INSERT/UPDATE que tente "mover" a linha para outro Studio.
create policy build_artifacts_select on build_artifacts
  for select
  using (studio_id = public.current_user_studio_id());

create policy build_artifacts_insert on build_artifacts
  for insert
  with check (
    studio_id = public.current_user_studio_id()
    and public.current_user_has_permission('builds.manage_artifacts')
  );

create policy build_artifacts_update on build_artifacts
  for update
  using (studio_id = public.current_user_studio_id())
  with check (
    studio_id = public.current_user_studio_id()
    and public.current_user_has_permission('builds.manage_artifacts')
  );

create policy build_artifacts_delete on build_artifacts
  for delete
  using (
    studio_id = public.current_user_studio_id()
    and public.current_user_has_permission('builds.manage_artifacts')
  );

-- Backfill: Owner/Admin de Studios já existentes ganham a permissão nova
-- (mesmo raciocínio de 20260806000001 §"Backfill" — bootstrap só roda na
-- criação do Studio, precisa de backfill explícito para quem já existe).
insert into role_permissions (studio_id, role_id, permission_id)
select r.studio_id, r.id, p.id
from roles r
join permissions p on p.key = 'builds.manage_artifacts'
where r.name in ('Owner', 'Admin')
on conflict do nothing;

-- Atualiza o bootstrap para incluir a permissão nova na lista fixa do
-- Admin de Studios novos (corpo idêntico ao de 20260806000001, só a lista
-- de keys do Admin ganha a chave nova) — sem isso, todo Studio criado a
-- partir de agora teria um Admin sem `builds.manage_artifacts`.
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
  where key in ('studio.invite_members', 'studio.manage_members', 'studio.manage_store_connections', 'builds.manage_artifacts');

  insert into user_roles (studio_id, user_id, role_id)
  values (v_studio_id, v_user_id, v_owner_role_id);

  return v_studio_id;
end;
$$;

-- Signed upload/download: browser nunca fornece `storage_path` livremente
-- (item de segurança do sprint — path traversal/cross-Studio). Esta função
-- gera o path oficial server-side, cria a linha PENDING e devolve o
-- caminho para o Server Action (que já tem a sessão do usuário via
-- server-client, sujeito a RLS) chamar `storage.createSignedUploadUrl`
-- pelo `packages/storage` — a função em si NÃO chama a Storage API (isso
-- só é possível via cliente JS, não de dentro do Postgres); ela só garante
-- que a linha e o path são criados de forma consistente e auditável, com a
-- mesma checagem de permissão que a RLS já exige, redundante de propósito
-- (defesa em profundidade, mesmo padrão do Sprint 2.8/2.9 documentado em
-- DEPLOY_RUNBOOK.md §11).
create or replace function public.create_pending_build_artifact(
  p_build_id uuid,
  p_original_filename text,
  p_file_extension text,
  p_size_bytes bigint,
  p_checksum text,
  p_mime_type_reported text,
  p_actor_id uuid
)
returns build_artifacts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_studio_id uuid;
  v_artifact_id uuid := gen_random_uuid();
  v_sanitized_filename text;
  v_storage_path text;
  v_row build_artifacts;
begin
  select studio_id into v_studio_id from builds where id = p_build_id;
  if v_studio_id is null then
    raise exception 'build não encontrado';
  end if;

  if v_studio_id <> public.current_user_studio_id() then
    raise exception insufficient_privilege using message = 'build não pertence ao Studio do usuário atual';
  end if;

  if not public.current_user_has_permission('builds.manage_artifacts') then
    raise exception insufficient_privilege using message = 'sem permissão builds.manage_artifacts';
  end if;

  -- Sanitização mínima: mantém só [A-Za-z0-9._-], colapsa o resto em "_" —
  -- suficiente porque o path final nunca usa o filename como único
  -- componente (sempre prefixado por studio_id/build_id/artifact_id, todos
  -- UUIDs gerados server-side), mas ainda assim nunca confia no filename
  -- crú do browser dentro do path.
  v_sanitized_filename := regexp_replace(p_original_filename, '[^A-Za-z0-9._-]', '_', 'g');
  if v_sanitized_filename = '' or v_sanitized_filename is null then
    v_sanitized_filename := 'artifact';
  end if;

  v_storage_path := v_studio_id::text || '/' || p_build_id::text || '/' || v_artifact_id::text || '/' || v_sanitized_filename;

  insert into build_artifacts (
    id, studio_id, build_id, storage_bucket, storage_path,
    original_filename, file_extension, mime_type_reported, size_bytes,
    checksum_algorithm, checksum, upload_status, validation_status,
    created_actor_type, created_actor_id, updated_actor_type, updated_actor_id
  ) values (
    v_artifact_id, v_studio_id, p_build_id, 'builds', v_storage_path,
    p_original_filename, p_file_extension, p_mime_type_reported, p_size_bytes,
    'SHA256', p_checksum, 'PENDING', 'PENDING',
    'USER', p_actor_id, 'USER', p_actor_id
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- Grants explícitos (DEPLOY_RUNBOOK.md §11 — `revoke ... from public` não
-- basta neste projeto Supabase; grants a `anon`/`authenticated` são
-- concedidos automaticamente por padrão às roles nomeadas, não só ao
-- pseudo-role PUBLIC). Só `authenticated` deveria poder chamar — a checagem
-- de permissão real acontece dentro da função, mas `anon` nunca deveria
-- alcançar nem essa checagem.
revoke execute on function public.create_pending_build_artifact(uuid, text, text, bigint, text, text, uuid) from public;
revoke execute on function public.create_pending_build_artifact(uuid, text, text, bigint, text, text, uuid) from anon;
grant execute on function public.create_pending_build_artifact(uuid, text, text, bigint, text, text, uuid) to authenticated;

-- Upload direto do browser ao bucket `builds` via protocolo TUS (resumível,
-- item 4 das decisões aprovadas) — o browser nunca vê a service_role key
-- (item 3), então o upload em si tem que ser autorizado pela sessão do
-- próprio usuário (anon key + JWT), não por um token assinado emitido
-- previamente (Supabase Storage não expõe token assinado por objeto para
-- uploads resumíveis, só para uploads simples via `createSignedUploadUrl` +
-- `uploadToSignedUrl` — não resumível). Por isso o INSERT em
-- `storage.objects` é gated por RLS real: só o Studio do usuário (primeiro
-- segmento do path, que é sempre `storage_path`'s studio_id — nunca
-- fornecido livremente pelo browser fora desse formato) e só quem tem
-- `builds.manage_artifacts`. Download/remoção nunca passam por policy
-- alguma aqui — só signed URL / admin client (service_role), que bypassa
-- RLS de Storage inteiramente; por isso não existe policy de SELECT/DELETE
-- em storage.objects para authenticated.
create policy build_artifacts_object_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'builds'
    and (storage.foldername(name))[1] = public.current_user_studio_id()::text
    and public.current_user_has_permission('builds.manage_artifacts')
  );
