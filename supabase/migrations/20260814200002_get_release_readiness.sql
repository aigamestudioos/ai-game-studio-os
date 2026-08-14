-- Sprint 2.12a — GATE 2/7: Readiness DERIVADA de uma Release.
--
-- Decisão arquitetural (ver DECISIONS.md): readiness é uma RPC pura
-- calculada on-demand — nada é persistido. Uma view não serve porque o
-- resultado é uma lista heterogênea de checks por Submission (não uma
-- linha por entidade) e porque a autorização precisa ser explícita e
-- falhar alto em cross-Studio. Materializar (coluna `is_ready`, tabela de
-- resultados) foi descartado: readiness depende de sete tabelas que mudam
-- por caminhos independentes (worker de upload, Vault, metadata do Game),
-- e qualquer cópia ficaria stale sem um enxame de triggers. Sendo pura,
-- ela é determinística e sobrevive a reload/login/outro dispositivo por
-- construção — não existe estado de UI envolvido.
--
-- Segurança: SECURITY DEFINER (precisa ler tabelas de várias entidades
-- com RLS), com autorização explícita — o `studio_id` é SEMPRE derivado
-- da própria Release no servidor, nunca recebido do client, e toda query
-- interna é escopada por esse `studio_id`. O retorno nunca inclui
-- `credentials_ref`, IDs de Vault, URLs de upload, tokens ou headers —
-- apenas o veredito booleano derivado deles.

-- Monta um check já enriquecido com os metadados do catálogo (GATE 3).
create or replace function public.readiness_check_entry(
  p_code text,
  p_status text,
  p_message text,
  p_entity_type text,
  p_entity_id uuid,
  p_submission_id uuid default null,
  p_platform_name text default null
)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'code', d.code,
    'status', p_status,
    'category', d.category,
    'severity', d.severity,
    -- Um check só bloqueia se o catálogo diz que bloqueia E ele falhou.
    'blocking', d.blocking and p_status = 'FAIL',
    'implementationStatus', d.implementation_status,
    'message', p_message,
    'entityType', p_entity_type,
    'entityId', p_entity_id,
    'submissionId', p_submission_id,
    'platform', p_platform_name
  )
  from readiness_check_definitions d
  where d.code = p_code;
$$;

create or replace function public.get_release_readiness(p_release_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_studio_id uuid;
  v_game_id uuid;
  v_game_version_id uuid;
  v_release_status release_status;
  v_release_notes text;
  v_checks jsonb := '[]'::jsonb;
  v_sub record;
  v_platform_name text;
  v_expected_ext text;
  v_artifact record;
  v_any_artifact record;
  v_conn record;
  v_pu record;
  v_pu_inprogress boolean;
  v_pu_failed boolean;
  v_localization record;
  v_blockers integer;
  v_artifact_ok boolean;
begin
  select studio_id, game_id, game_version_id, status, release_notes
    into v_studio_id, v_game_id, v_game_version_id, v_release_status, v_release_notes
    from releases
    where id = p_release_id;

  if v_studio_id is null then
    -- Mesma mensagem para "não existe" e "existe em outro Studio" seria
    -- ideal, mas aqui a informação já é indistinguível: a Release de
    -- outro Studio cai no ramo de autorização abaixo com erro genérico.
    raise exception 'release não encontrada';
  end if;

  if v_studio_id is distinct from public.current_user_studio_id() then
    raise exception insufficient_privilege using message = 'release não pertence ao Studio do usuário atual';
  end if;

  -- ---------- Checks de nível Release ----------
  v_checks := v_checks || readiness_check_entry(
    'RELEASE_STATUS_NOT_SUBMITTABLE',
    case when v_release_status in ('DRAFT', 'READY_FOR_SUBMISSION', 'SUBMISSION_IN_PROGRESS', 'PARTIALLY_PUBLISHED')
      then 'PASS' else 'FAIL' end,
    format('Status da Release: %s', v_release_status),
    'RELEASE', p_release_id);

  v_checks := v_checks || readiness_check_entry(
    'METADATA_RELEASE_NOTES_MISSING',
    case when coalesce(btrim(v_release_notes), '') = '' then 'WARN' else 'PASS' end,
    case when coalesce(btrim(v_release_notes), '') = ''
      then 'A Release não tem release notes — recomendado antes de publicar.'
      else 'Release notes preenchidas.' end,
    'RELEASE', p_release_id);

  select * into v_localization
    from game_localizations
    where game_id = v_game_id and studio_id = v_studio_id
    order by (language_code = 'en-US') desc, language_code asc
    limit 1;

  v_checks := v_checks || readiness_check_entry(
    'METADATA_LISTING_MISSING',
    case when v_localization.id is null then 'FAIL' else 'PASS' end,
    case when v_localization.id is null
      then 'Nenhuma ficha de loja cadastrada para este Game.'
      else format('Ficha de loja encontrada (%s).', v_localization.language_code) end,
    'GAME', v_game_id);

  if v_localization.id is not null then
    v_checks := v_checks || readiness_check_entry(
      'METADATA_DESCRIPTION_MISSING',
      case when coalesce(btrim(v_localization.full_description), '') = '' then 'WARN' else 'PASS' end,
      case when coalesce(btrim(v_localization.full_description), '') = ''
        then 'A ficha de loja não tem descrição completa.'
        else 'Descrição completa preenchida.' end,
      'GAME_LOCALIZATION', v_localization.id);
  end if;

  -- GATE 6 — requisitos de loja reais que o schema ainda não modela.
  -- Emitidos como NOT_APPLICABLE (nunca PASS) para não fingir cobertura.
  v_checks := v_checks
    || readiness_check_entry('METADATA_SCREENSHOTS_MISSING', 'NOT_APPLICABLE',
         'Screenshots de loja ainda não são modelados no AGSOS.', 'GAME', v_game_id)
    || readiness_check_entry('METADATA_ICON_MISSING', 'NOT_APPLICABLE',
         'Ícone de loja ainda não é modelado no AGSOS.', 'GAME', v_game_id)
    || readiness_check_entry('METADATA_CONTENT_RATING_MISSING', 'NOT_APPLICABLE',
         'Classificação indicativa ainda não é modelada no AGSOS.', 'GAME', v_game_id)
    || readiness_check_entry('METADATA_PRIVACY_POLICY_MISSING', 'NOT_APPLICABLE',
         'Política de privacidade ainda não é modelada no AGSOS.', 'GAME', v_game_id);

  -- A Release chega até Build/Artifact pelas suas Submissions
  -- (submissions.release_id + submissions.build_id, schema original do
  -- Sprint 1.x). GATE 4: esse vínculo já é explícito e inequívoco — não
  -- há FK nova aqui, e em nenhum momento se usa "último artifact do
  -- Studio" como heurística.
  if not exists (
    select 1 from submissions
    where release_id = p_release_id and studio_id = v_studio_id and archived_at is null
  ) then
    v_checks := v_checks || readiness_check_entry(
      'SUBMISSION_TARGETS_MISSING', 'FAIL',
      'A Release não tem nenhuma plataforma-alvo (Submission) definida.',
      'RELEASE', p_release_id);
  end if;

  -- ---------- Checks por Submission ----------
  for v_sub in
    select s.id as submission_id, s.status as submission_status, s.platform_id, s.build_id,
           p.name as platform_name,
           b.status as build_status, b.game_version_id as build_version_id,
           b.platform_id as build_platform_id, b.studio_id as build_studio_id
      from submissions s
      join platforms p on p.id = s.platform_id
      join builds b on b.id = s.build_id
     where s.release_id = p_release_id
       and s.studio_id = v_studio_id
       and s.archived_at is null
     order by p.name asc, s.created_at asc
  loop
    v_platform_name := v_sub.platform_name;
    v_artifact_ok := false;

    if v_sub.submission_status not in ('DRAFT', 'WAITING') then
      v_checks := v_checks || readiness_check_entry(
        'SUBMISSION_ALREADY_SENT', 'WARN',
        format('Submission já está em %s.', v_sub.submission_status),
        'SUBMISSION', v_sub.submission_id, v_sub.submission_id, v_platform_name);
    end if;

    v_expected_ext := case v_platform_name
      when 'Google Play' then 'aab'
      when 'App Store' then 'ipa'
      else null
    end;

    v_checks := v_checks || readiness_check_entry(
      'PLATFORM_NOT_SUPPORTED',
      case when v_expected_ext is null then 'FAIL' else 'PASS' end,
      case when v_expected_ext is null
        then format('%s ainda não tem pipeline de publicação no AGSOS.', v_platform_name)
        else format('Plataforma suportada: %s.', v_platform_name) end,
      'PLATFORM', v_sub.platform_id, v_sub.submission_id, v_platform_name);

    v_checks := v_checks || readiness_check_entry(
      'BUILD_PLATFORM_MISMATCH',
      case when v_sub.build_platform_id = v_sub.platform_id then 'PASS' else 'FAIL' end,
      case when v_sub.build_platform_id = v_sub.platform_id
        then 'Build corresponde à plataforma da Submission.'
        else 'O Build desta Submission foi gerado para outra plataforma.' end,
      'BUILD', v_sub.build_id, v_sub.submission_id, v_platform_name);

    v_checks := v_checks || readiness_check_entry(
      'BUILD_VERSION_MISMATCH',
      case when v_sub.build_version_id = v_game_version_id then 'PASS' else 'FAIL' end,
      case when v_sub.build_version_id = v_game_version_id
        then 'Build pertence à Game Version da Release.'
        else 'O Build desta Submission pertence a outra Game Version.' end,
      'BUILD', v_sub.build_id, v_sub.submission_id, v_platform_name);

    v_checks := v_checks || readiness_check_entry(
      'BUILD_NOT_SUCCEEDED',
      case when v_sub.build_status = 'SUCCEEDED' then 'PASS' else 'FAIL' end,
      format('Status do Build: %s.', v_sub.build_status),
      'BUILD', v_sub.build_id, v_sub.submission_id, v_platform_name);

    -- Metadata específica de loja (assimétrica por desenho — GATE 3).
    if v_platform_name = 'Google Play' then
      v_checks := v_checks || readiness_check_entry(
        'METADATA_PACKAGE_NAME_MISSING',
        case when exists (
          select 1 from games g
          where g.id = v_game_id and g.studio_id = v_studio_id
            and coalesce(btrim(g.package_name), '') <> ''
        ) then 'PASS' else 'FAIL' end,
        'Package Name do Game (obrigatório no Google Play).',
        'GAME', v_game_id, v_sub.submission_id, v_platform_name);
    elsif v_platform_name = 'App Store' then
      v_checks := v_checks || readiness_check_entry(
        'METADATA_BUNDLE_IDENTIFIER_MISSING',
        case when exists (
          select 1 from games g
          where g.id = v_game_id and g.studio_id = v_studio_id
            and coalesce(btrim(g.bundle_identifier), '') <> ''
        ) then 'PASS' else 'FAIL' end,
        'Bundle Identifier do Game (obrigatório na App Store).',
        'GAME', v_game_id, v_sub.submission_id, v_platform_name);
    end if;

    -- ---------- ARTIFACT ----------
    -- Escolha determinística: entre os artefatos do Build com a extensão
    -- correta para a loja, prefere um STORED+VALID; empate resolvido por
    -- created_at desc, id desc. Nunca cruza Build nem Studio.
    -- SELECT INTO incondicional de propósito: um `if` em volta deixaria o
    -- record não-atribuído em plataformas sem extensão esperada, e
    -- `v_artifact.id` levantaria erro em vez de ser NULL.
    select * into v_artifact
      from build_artifacts a
      where a.build_id = v_sub.build_id
        and a.archived_at is null
        and v_expected_ext is not null
        and lower(a.file_extension) = v_expected_ext
      order by (a.upload_status = 'STORED' and a.validation_status = 'VALID') desc,
               a.created_at desc, a.id desc
      limit 1;

    select * into v_any_artifact
      from build_artifacts a
      where a.build_id = v_sub.build_id and a.archived_at is null
      order by a.created_at desc, a.id desc
      limit 1;

    if v_any_artifact.id is null then
      v_checks := v_checks || readiness_check_entry(
        'ARTIFACT_MISSING', 'FAIL',
        'Nenhum artefato enviado para este Build.',
        'BUILD', v_sub.build_id, v_sub.submission_id, v_platform_name);
    elsif v_artifact.id is null then
      v_checks := v_checks || readiness_check_entry(
        'ARTIFACT_WRONG_FORMAT', 'FAIL',
        format('Este Build não tem artefato .%s, exigido por %s.', coalesce(v_expected_ext, '?'), v_platform_name),
        'BUILD_ARTIFACT', v_any_artifact.id, v_sub.submission_id, v_platform_name);
    else
      v_checks := v_checks || readiness_check_entry(
        'ARTIFACT_MISSING', 'PASS',
        format('Artefato %s encontrado.', v_artifact.original_filename),
        'BUILD_ARTIFACT', v_artifact.id, v_sub.submission_id, v_platform_name);

      v_checks := v_checks || readiness_check_entry(
        'ARTIFACT_WRONG_FORMAT', 'PASS',
        format('Formato .%s compatível com %s.', v_expected_ext, v_platform_name),
        'BUILD_ARTIFACT', v_artifact.id, v_sub.submission_id, v_platform_name);

      v_checks := v_checks || readiness_check_entry(
        'ARTIFACT_STUDIO_MISMATCH',
        case when v_artifact.studio_id = v_studio_id then 'PASS' else 'FAIL' end,
        'Propriedade do artefato (Studio).',
        'BUILD_ARTIFACT', v_artifact.id, v_sub.submission_id, v_platform_name);

      v_checks := v_checks || readiness_check_entry(
        'ARTIFACT_NOT_STORED',
        case when v_artifact.upload_status = 'STORED' then 'PASS' else 'FAIL' end,
        format('Upload do artefato: %s.', v_artifact.upload_status),
        'BUILD_ARTIFACT', v_artifact.id, v_sub.submission_id, v_platform_name);

      v_checks := v_checks || readiness_check_entry(
        'ARTIFACT_INVALID',
        case when v_artifact.validation_status = 'VALID' then 'PASS' else 'FAIL' end,
        format('Validação do artefato: %s.', v_artifact.validation_status),
        'BUILD_ARTIFACT', v_artifact.id, v_sub.submission_id, v_platform_name);

      v_artifact_ok := v_artifact.studio_id = v_studio_id
        and v_artifact.upload_status = 'STORED'
        and v_artifact.validation_status = 'VALID';
    end if;

    -- ---------- STORE_CONNECTION ----------
    select * into v_conn
      from store_connections sc
      where sc.studio_id = v_studio_id
        and sc.platform_id = v_sub.platform_id
        and sc.archived_at is null
      order by (sc.status = 'CONNECTED' and sc.credentials_ref is not null) desc,
               sc.updated_at desc, sc.id desc
      limit 1;

    if v_conn.id is null then
      v_checks := v_checks || readiness_check_entry(
        'STORE_CONNECTION_MISSING', 'FAIL',
        format('O Studio não tem conexão configurada com %s.', v_platform_name),
        'PLATFORM', v_sub.platform_id, v_sub.submission_id, v_platform_name);
    else
      v_checks := v_checks || readiness_check_entry(
        'STORE_CONNECTION_MISSING', 'PASS',
        format('Conexão com %s encontrada.', v_platform_name),
        'STORE_CONNECTION', v_conn.id, v_sub.submission_id, v_platform_name);

      v_checks := v_checks || readiness_check_entry(
        'STORE_CONNECTION_INVALID',
        case when v_conn.status = 'CONNECTED' then 'PASS' else 'FAIL' end,
        format('Status da conexão: %s.', v_conn.status),
        'STORE_CONNECTION', v_conn.id, v_sub.submission_id, v_platform_name);

      -- Só a PRESENÇA da referência é observada; o valor jamais é lido
      -- nem devolvido.
      v_checks := v_checks || readiness_check_entry(
        'STORE_CONNECTION_CREDENTIALS_MISSING',
        case when v_conn.credentials_ref is not null then 'PASS' else 'FAIL' end,
        case when v_conn.credentials_ref is not null
          then 'Credenciais guardadas no Vault.'
          else 'A conexão não tem credenciais guardadas.' end,
        'STORE_CONNECTION', v_conn.id, v_sub.submission_id, v_platform_name);
    end if;

    -- ---------- PROVIDER_UPLOAD ----------
    -- GATE 5: só conta o upload DESTE artifact por uma Store Connection
    -- DESTE Studio e DESTA plataforma. Um SUCCEEDED de outro artifact, de
    -- outra loja ou de outro Studio nunca satisfaz a Release.
    if v_artifact_ok then
      select pu.* into v_pu
        from provider_uploads pu
        join store_connections sc on sc.id = pu.store_connection_id
       where pu.build_artifact_id = v_artifact.id
         and pu.studio_id = v_studio_id
         and sc.studio_id = v_studio_id
         and sc.platform_id = v_sub.platform_id
         and pu.archived_at is null
         and pu.status = 'SUCCEEDED'
       order by pu.completed_at desc nulls last, pu.attempt desc, pu.id desc
       limit 1;

      if v_pu.id is not null then
        v_checks := v_checks || readiness_check_entry(
          'PROVIDER_UPLOAD_MISSING', 'PASS',
          format('Artefato já transferido para %s.', v_platform_name),
          'PROVIDER_UPLOAD', v_pu.id, v_sub.submission_id, v_platform_name);

        if v_platform_name = 'Google Play' then
          v_checks := v_checks || readiness_check_entry(
            'GOOGLE_VERSION_CODE_MISSING',
            case when v_pu.version_code is not null then 'PASS' else 'FAIL' end,
            case when v_pu.version_code is not null
              then format('versionCode %s confirmado pelo Google Play.', v_pu.version_code)
              else 'O Google Play não devolveu versionCode para este envio.' end,
            'PROVIDER_UPLOAD', v_pu.id, v_sub.submission_id, v_platform_name);
        elsif v_platform_name = 'App Store' then
          v_checks := v_checks || readiness_check_entry(
            'APPLE_BUILD_UPLOAD_REF_MISSING',
            case when v_pu.apple_build_upload_id is not null then 'PASS' else 'FAIL' end,
            case when v_pu.apple_build_upload_id is not null
              then 'Build Upload confirmado pela App Store.'
              else 'A App Store não devolveu referência de Build Upload para este envio.' end,
            'PROVIDER_UPLOAD', v_pu.id, v_sub.submission_id, v_platform_name);
        end if;
      else
        select
          bool_or(pu.status in ('PENDING', 'QUEUED', 'UPLOADING', 'PROCESSING')),
          bool_or(pu.status = 'FAILED')
          into v_pu_inprogress, v_pu_failed
          from provider_uploads pu
          join store_connections sc on sc.id = pu.store_connection_id
         where pu.build_artifact_id = v_artifact.id
           and pu.studio_id = v_studio_id
           and sc.studio_id = v_studio_id
           and sc.platform_id = v_sub.platform_id
           and pu.archived_at is null;

        if coalesce(v_pu_inprogress, false) then
          v_checks := v_checks || readiness_check_entry(
            'PROVIDER_UPLOAD_IN_PROGRESS', 'FAIL',
            format('Transferência para %s ainda em andamento.', v_platform_name),
            'BUILD_ARTIFACT', v_artifact.id, v_sub.submission_id, v_platform_name);
        elsif coalesce(v_pu_failed, false) then
          v_checks := v_checks || readiness_check_entry(
            'PROVIDER_UPLOAD_FAILED', 'FAIL',
            format('A última transferência para %s falhou.', v_platform_name),
            'BUILD_ARTIFACT', v_artifact.id, v_sub.submission_id, v_platform_name);
        else
          v_checks := v_checks || readiness_check_entry(
            'PROVIDER_UPLOAD_MISSING', 'FAIL',
            format('O artefato ainda não foi transferido para %s.', v_platform_name),
            'BUILD_ARTIFACT', v_artifact.id, v_sub.submission_id, v_platform_name);
        end if;
      end if;
    end if;
  end loop;

  select count(*) into v_blockers
    from jsonb_array_elements(v_checks) c
   where (c ->> 'blocking')::boolean;

  return jsonb_build_object(
    'releaseId', p_release_id,
    'studioId', v_studio_id,
    'status', case when v_blockers = 0 then 'READY' else 'NOT_READY' end,
    'blockerCount', v_blockers,
    'evaluatedAt', now(),
    'checks', v_checks
  );
end;
$$;

revoke execute on function public.get_release_readiness(uuid) from public;
revoke execute on function public.get_release_readiness(uuid) from anon;
grant execute on function public.get_release_readiness(uuid) to authenticated;

revoke execute on function public.readiness_check_entry(text, text, text, text, uuid, uuid, text) from public;
revoke execute on function public.readiness_check_entry(text, text, text, text, uuid, uuid, text) from anon;
grant execute on function public.readiness_check_entry(text, text, text, text, uuid, uuid, text) to authenticated;
