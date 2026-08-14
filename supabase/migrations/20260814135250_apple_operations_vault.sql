-- Sprint 2.11d-2d (GATE 15) — `uploadOperations` da Apple contêm URLs
-- presignadas e headers por operação (`requestHeaders`) — mesma classe de
-- segredo que a session URI resumível do Google (2.11d-1): nunca em
-- `integration_jobs.checkpoint` (visível via RLS ao Studio dono), nunca em
-- log, nunca em Domain Event. Persistidas no Vault, mesmo padrão exato de
-- `set_provider_upload_resumable_session` — coluna própria
-- (`apple_operations_ref`), nunca reaproveitando `google_resumable_session_ref`
-- (provider diferente, mesmo que um `provider_upload` nunca use os dois ao
-- mesmo tempo na prática).
alter table provider_uploads add column if not exists apple_operations_ref text;

create or replace function public.set_provider_upload_apple_operations(
  p_provider_upload_id uuid,
  p_operations_json text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing_ref text;
  v_secret_id uuid;
begin
  select apple_operations_ref into v_existing_ref
  from provider_uploads where id = p_provider_upload_id;

  if v_existing_ref is not null then
    perform vault.update_secret(v_existing_ref::uuid, p_operations_json);
    v_secret_id := v_existing_ref::uuid;
  else
    v_secret_id := vault.create_secret(p_operations_json, p_provider_upload_id::text || ':apple_upload_operations');
  end if;

  update provider_uploads
  set apple_operations_ref = v_secret_id::text
  where id = p_provider_upload_id;
end;
$$;

revoke execute on function public.set_provider_upload_apple_operations(uuid, text) from public;
revoke execute on function public.set_provider_upload_apple_operations(uuid, text) from anon;
revoke execute on function public.set_provider_upload_apple_operations(uuid, text) from authenticated;
grant execute on function public.set_provider_upload_apple_operations(uuid, text) to service_role;

create or replace function public.get_provider_upload_apple_operations(
  p_provider_upload_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref text;
begin
  select apple_operations_ref into v_ref from provider_uploads where id = p_provider_upload_id;
  if v_ref is null then
    return null;
  end if;
  return (select decrypted_secret from vault.decrypted_secrets where id = v_ref::uuid);
end;
$$;

revoke execute on function public.get_provider_upload_apple_operations(uuid) from public;
revoke execute on function public.get_provider_upload_apple_operations(uuid) from anon;
revoke execute on function public.get_provider_upload_apple_operations(uuid) from authenticated;
grant execute on function public.get_provider_upload_apple_operations(uuid) to service_role;

create or replace function public.clear_provider_upload_apple_operations(
  p_provider_upload_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref text;
begin
  select apple_operations_ref into v_ref from provider_uploads where id = p_provider_upload_id;
  if v_ref is not null then
    delete from vault.secrets where id = v_ref::uuid;
  end if;
  update provider_uploads set apple_operations_ref = null where id = p_provider_upload_id;
end;
$$;

revoke execute on function public.clear_provider_upload_apple_operations(uuid) from public;
revoke execute on function public.clear_provider_upload_apple_operations(uuid) from anon;
revoke execute on function public.clear_provider_upload_apple_operations(uuid) from authenticated;
grant execute on function public.clear_provider_upload_apple_operations(uuid) to service_role;
