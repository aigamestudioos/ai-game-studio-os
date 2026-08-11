-- Sprint 2.11c — Apple IPA / Build Uploads API. Reaproveita `provider_uploads`
-- (Sprint 2.11b) — decisão explícita do usuário, nunca criar
-- `apple_provider_uploads`. `edit_id`/`version_code` (Google) já existiam;
-- este sprint adiciona as colunas equivalentes da Apple, com nomes
-- próprios (nunca reaproveitar `edit_id` para o `buildUploadId` da Apple —
-- semânticas diferentes, campos diferentes).
--
-- `apple_upload_state` guarda o estado BRUTO retornado pela Build Uploads
-- API (`AWAITING_UPLOAD`/`PROCESSING`/`COMPLETE`/`FAILED`, confirmado
-- contra a documentação oficial atual da Apple) — nunca deformado para
-- caber em `provider_upload_status` (que é mais genérico:
-- `PENDING`/`UPLOADING`/`SUCCEEDED`/`FAILED`). Os dois convivem: `status`
-- é o campo provider-agnostic que a UI/eventos usam por padrão;
-- `apple_upload_state` preserva o vocabulário real da Apple para quem
-- precisar dele (debug, suporte, futura tela de detalhe).
alter table provider_uploads
  add column apple_build_upload_id text null,
  add column apple_build_upload_file_id text null,
  add column apple_upload_state text null;

-- Guard de platform/extension (achado da Fase 0: nada impedia hoje usar
-- uma Store Connection Google para "enviar" um artifact — só a UI
-- filtrava por platform, nunca o banco). Nunca deformar
-- create_pending_build_artifact/build_artifacts — a extensão do artifact
-- já é a fonte de verdade (`.aab` → Google Play, `.ipa` → App Store); a
-- checagem cruza isso com `platforms.name` da Store Connection escolhida,
-- dentro da mesma função SECURITY DEFINER que já valida Studio/permission/
-- STORED/VALID (Sprint 2.11b) — defesa em profundidade, nunca só na UI.
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

  select sc.studio_id, p.name
    into v_connection_studio_id, v_connection_platform_name
    from store_connections sc
    join platforms p on p.id = sc.platform_id
    where sc.id = p_store_connection_id;

  if v_connection_studio_id is null then
    raise exception 'store_connection não encontrada';
  end if;
  if v_connection_studio_id <> v_studio_id then
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

-- Grants inalterados (mesma assinatura da função, create or replace não
-- reseta grants existentes) — confirmar mesmo assim, mesmo padrão do
-- Checklist de Segurança SQL.
revoke execute on function public.create_pending_provider_upload(uuid, uuid, uuid) from public;
revoke execute on function public.create_pending_provider_upload(uuid, uuid, uuid) from anon;
grant execute on function public.create_pending_provider_upload(uuid, uuid, uuid) to authenticated;
