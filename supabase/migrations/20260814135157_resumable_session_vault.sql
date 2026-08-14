-- Sprint 2.11d — a `sessionUri` do upload resumível do Google é uma
-- bearer capability (DECISIONS.md/AGSOS-SPEC-008 §"nunca segredo em
-- texto puro") — nunca plaintext em `provider_uploads`. Mesmo padrão do
-- Vault já usado para credenciais de Store Connection (Sprint 2.8):
-- `google_resumable_session_ref` é só o ponteiro (UUID do registro no
-- Vault), nunca o valor. Todas as três funções são `service_role`
-- exclusivamente — o worker é o único chamador, nunca o browser, nunca
-- `authenticated` (diferente do fluxo de credencial de Store Connection,
-- que o usuário digita via UI; a session URI é gerada e consumida
-- inteiramente do lado do servidor).
create or replace function public.set_provider_upload_resumable_session(
  p_provider_upload_id uuid,
  p_session_uri text
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
  select google_resumable_session_ref into v_existing_ref
  from provider_uploads where id = p_provider_upload_id;

  if v_existing_ref is not null then
    perform vault.update_secret(v_existing_ref::uuid, p_session_uri);
    v_secret_id := v_existing_ref::uuid;
  else
    v_secret_id := vault.create_secret(p_session_uri, p_provider_upload_id::text || ':google_resumable_session');
  end if;

  update provider_uploads
  set google_resumable_session_ref = v_secret_id::text
  where id = p_provider_upload_id;
end;
$$;

revoke execute on function public.set_provider_upload_resumable_session(uuid, text) from public;
revoke execute on function public.set_provider_upload_resumable_session(uuid, text) from anon;
revoke execute on function public.set_provider_upload_resumable_session(uuid, text) from authenticated;
grant execute on function public.set_provider_upload_resumable_session(uuid, text) to service_role;

create or replace function public.get_provider_upload_resumable_session(
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
  select google_resumable_session_ref into v_ref from provider_uploads where id = p_provider_upload_id;
  if v_ref is null then
    return null;
  end if;
  return (select decrypted_secret from vault.decrypted_secrets where id = v_ref::uuid);
end;
$$;

revoke execute on function public.get_provider_upload_resumable_session(uuid) from public;
revoke execute on function public.get_provider_upload_resumable_session(uuid) from anon;
revoke execute on function public.get_provider_upload_resumable_session(uuid) from authenticated;
grant execute on function public.get_provider_upload_resumable_session(uuid) to service_role;

create or replace function public.clear_provider_upload_resumable_session(
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
  select google_resumable_session_ref into v_ref from provider_uploads where id = p_provider_upload_id;
  if v_ref is not null then
    delete from vault.secrets where id = v_ref::uuid;
  end if;
  update provider_uploads set google_resumable_session_ref = null where id = p_provider_upload_id;
end;
$$;

revoke execute on function public.clear_provider_upload_resumable_session(uuid) from public;
revoke execute on function public.clear_provider_upload_resumable_session(uuid) from anon;
revoke execute on function public.clear_provider_upload_resumable_session(uuid) from authenticated;
grant execute on function public.clear_provider_upload_resumable_session(uuid) to service_role;
