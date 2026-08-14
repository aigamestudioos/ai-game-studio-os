-- Sprint 2.11d — GATE 0: NULL-safety fix (achado do Production Validation
-- do Sprint 2.11c). Quatro funções SECURITY DEFINER usavam
-- `v_studio_id <> public.current_user_studio_id()` para rejeitar acesso
-- cross-Studio. Essa comparação NÃO é NULL-safe: para um usuário
-- autenticado sem linha em `public.users` (nunca completou
-- `bootstrap_studio_for_current_user`), `current_user_studio_id()` retorna
-- NULL, `v_studio_id <> NULL` avalia para NULL, e `if NULL then` em
-- PL/pgSQL NUNCA entra no bloco — a checagem de Studio é silenciosamente
-- pulada (não rejeitada, simplesmente ignorada).
--
-- Não explorável hoje: em toda função afetada, o `IF` seguinte
-- (`current_user_has_permission(...)`) usa `exists(...)`, que é NULL-safe
-- por construção e sempre nega para um usuário sem `user_roles` — então a
-- segunda camada de defesa ainda bloqueia. Mas é uma fragilidade real de
-- defesa em profundidade: se qualquer uma dessas funções um dia perder ou
-- reordenar essa segunda checagem, o bypass do Studio deixaria de ser
-- teórico. Corrigido trocando `<>` por `is distinct from` (NULL-safe:
-- NULL IS DISTINCT FROM <qualquer coisa não-NULL> é sempre TRUE).
--
-- Nenhuma outra lógica alterada — `create or replace function` com corpo
-- idêntico ao já existente, só essa linha.

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

  if v_studio_id is distinct from public.current_user_studio_id() then
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

create or replace function public.clear_store_connection_secret(
  p_store_connection_id uuid,
  p_actor_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_studio_id uuid;
  v_ref text;
begin
  select studio_id, credentials_ref into v_studio_id, v_ref
  from store_connections
  where id = p_store_connection_id;

  if v_studio_id is null then
    raise exception 'store_connection não encontrada';
  end if;

  if v_studio_id is distinct from public.current_user_studio_id() then
    raise exception insufficient_privilege using message = 'store_connection não pertence ao Studio do usuário atual';
  end if;

  if not public.current_user_has_permission('studio.manage_store_connections') then
    raise exception insufficient_privilege using message = 'sem permissão studio.manage_store_connections';
  end if;

  if v_ref is not null then
    delete from vault.secrets where id = v_ref::uuid;
  end if;

  update store_connections
  set credentials_ref = null,
      status = 'DISCONNECTED',
      last_error = null,
      updated_at = now(),
      updated_actor_type = 'USER',
      updated_actor_id = p_actor_id
  where id = p_store_connection_id;
end;
$$;

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

  if v_studio_id is distinct from public.current_user_studio_id() then
    raise exception insufficient_privilege using message = 'build não pertence ao Studio do usuário atual';
  end if;

  if not public.current_user_has_permission('builds.manage_artifacts') then
    raise exception insufficient_privilege using message = 'sem permissão builds.manage_artifacts';
  end if;

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
  v_artifact_extension text;
  v_connection_studio_id uuid;
  v_connection_platform_name text;
  v_expected_platform_name text;
  v_row provider_uploads;
begin
  select studio_id, upload_status, validation_status, file_extension
    into v_artifact_studio_id, v_artifact_upload_status, v_artifact_validation_status, v_artifact_extension
    from build_artifacts
    where id = p_build_artifact_id;

  if v_artifact_studio_id is null then
    raise exception 'build_artifact não encontrado';
  end if;

  v_studio_id := v_artifact_studio_id;

  if v_studio_id is distinct from public.current_user_studio_id() then
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

  select sc.studio_id, p.name
    into v_connection_studio_id, v_connection_platform_name
    from store_connections sc
    join platforms p on p.id = sc.platform_id
    where sc.id = p_store_connection_id;

  if v_connection_studio_id is null then
    raise exception 'store_connection não encontrada';
  end if;
  if v_connection_studio_id is distinct from v_studio_id then
    raise exception insufficient_privilege using message = 'store_connection não pertence ao Studio do usuário atual';
  end if;

  v_expected_platform_name := case lower(v_artifact_extension)
    when 'aab' then 'Google Play'
    when 'ipa' then 'App Store'
    else null
  end;
  if v_expected_platform_name is null then
    raise exception 'extensão de artifact não suportada para envio a provider (%)', v_artifact_extension;
  end if;
  if v_connection_platform_name <> v_expected_platform_name then
    raise exception 'Store Connection incompatível: artifact .% precisa de uma conexão %, mas a conexão informada é %',
      v_artifact_extension, v_expected_platform_name, v_connection_platform_name;
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
