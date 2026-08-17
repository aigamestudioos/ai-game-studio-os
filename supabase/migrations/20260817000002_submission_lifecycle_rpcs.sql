-- Sprint 2.16a (cont.) — separado de 20260817000001 porque Postgres não
-- permite usar um valor de enum recém-criado (`ALTER TYPE ... ADD VALUE`)
-- na mesma transação em que foi adicionado; cada arquivo de migration do
-- Supabase CLI já roda em transação própria, então basta a ordem de
-- arquivos (nome > timestamp) para garantir que 000001 comita antes.

-- ---------------------------------------------------------------------
-- GATE 8 — permissão nova. "Quem pode CRIAR uma Submission necessariamente
-- pode ENVIÁ-LA à loja?" Decisão: NÃO — enviar à loja é uma ação de maior
-- risco/irreversibilidade (dispara transporte real, ocupa quota de
-- provider, e no futuro Production Validation, review real) do que criar o
-- registro local. `publishing.submit` é uma permissão nova e distinta de
-- `publishing.create_submission`.
-- ---------------------------------------------------------------------
insert into permissions (key, description) values
  ('publishing.submit', 'Transicionar uma Submission: preparar envio, enviar à loja, retry após falha')
on conflict (key) do nothing;

insert into role_permissions (studio_id, role_id, permission_id)
select r.studio_id, r.id, p.id
from roles r
join permissions p on p.key = 'publishing.submit'
where r.name in ('Owner', 'Admin')
on conflict do nothing;

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
  where key in (
    'studio.invite_members', 'studio.manage_members', 'studio.manage_store_connections',
    'publishing.read', 'publishing.create_submission', 'publishing.submit'
  );

  insert into role_permissions (studio_id, role_id, permission_id)
  select v_studio_id, v_member_role_id, id from permissions
  where key = 'publishing.read';

  insert into user_roles (studio_id, user_id, role_id)
  values (v_studio_id, v_user_id, v_owner_role_id);

  return v_studio_id;
end;
$$;

-- ---------------------------------------------------------------------
-- GATE 12/13 — job de execução de Submission reaproveita `integration_jobs`
-- (mesma tabela, mesmo dispatcher, mesmo claim/lease/checkpoint/retry do
-- Sprint 2.11d). `provider_upload_id` era NOT NULL (um job só existia para
-- transporte de artifact); passa a aceitar OU um provider_upload OU uma
-- submission, nunca os dois nem nenhum — não criamos uma tabela
-- `submission_jobs` paralela.
-- ---------------------------------------------------------------------
alter table integration_jobs alter column provider_upload_id drop not null;
alter table integration_jobs add column submission_id uuid null references submissions(id);
alter table integration_jobs add constraint integration_jobs_exactly_one_target check (
  (provider_upload_id is not null and submission_id is null)
  or (provider_upload_id is null and submission_id is not null)
);
create index idx_integration_jobs_submission on integration_jobs(submission_id);

-- ---------------------------------------------------------------------
-- GATE 16 — eventos observáveis de lifecycle. Tabela append-only dedicada
-- (não existe barramento de domain events genérico no schema hoje — audit
-- em DECISIONS.md desta auditoria; `studio_events` existente é usado só
-- para outra finalidade e não foi redesenhado aqui, fora de escopo GATE 26
-- "não refatorar features/"). Payload nunca contém segredo — só IDs,
-- plataforma, attempt, errorCode, durationMs.
-- ---------------------------------------------------------------------
create table submission_events (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id),
  submission_id uuid not null references submissions(id),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  actor_type actor_type not null,
  actor_id uuid null
);

create index idx_submission_events_submission on submission_events(submission_id, occurred_at);
create index idx_submission_events_studio on submission_events(studio_id);

alter table submission_events enable row level security;

create policy submission_events_select on submission_events
  for select
  using (
    studio_id = public.current_user_studio_id()
    and public.current_user_has_permission('publishing.read')
  );
-- Nenhuma policy de insert para `authenticated`/`anon`: só os RPCs
-- SECURITY DEFINER abaixo (que já validam auth/permission antes de
-- escrever) e o worker (`service_role`, bypassa RLS) gravam aqui.

-- ---------------------------------------------------------------------
-- GATE 7/9 — fonte única server-side de transição. Uma única RPC,
-- `transition_submission`, cobre as ações que um usuário autenticado pode
-- disparar: PREPARE (DRAFT → READY_TO_SUBMIT), SUBMIT (READY_TO_SUBMIT ou
-- FAILED → SUBMITTING, com enqueue atômico do job) e RETRY (alias de
-- SUBMIT a partir de FAILED — mantido como ação nomeada separada só para
-- clareza de intenção na UI/eventos, a transição de estado é idêntica).
-- Nunca aceita `studio_id` do client — deriva da própria linha de
-- `submissions` e de `current_user_studio_id()`.
--
-- Idempotência (GATE 13): duplo clique / retry de rede no mesmo estado-alvo
-- não cria um segundo job nem levanta erro — `select ... for update` trava
-- a linha (serializa chamadas concorrentes na mesma Submission) e, se o
-- estado atual já é (ou passou) o estado-alvo desta ação, a função retorna
-- o estado atual sem re-executar o efeito.
-- ---------------------------------------------------------------------
create or replace function public.transition_submission(
  p_submission_id uuid,
  p_action text,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_studio_id uuid;
  v_sub submissions%rowtype;
  v_readiness jsonb;
  v_platform_name text;
  v_integration_name text;
  v_job integration_jobs%rowtype;
begin
  if p_action not in ('PREPARE', 'SUBMIT', 'RETRY') then
    raise exception 'transition_submission: ação % desconhecida', p_action;
  end if;

  v_studio_id := public.current_user_studio_id();

  if not public.current_user_has_permission('publishing.submit') then
    raise exception insufficient_privilege using message = 'sem permissão publishing.submit';
  end if;

  -- Lock de linha: serializa chamadas concorrentes na mesma Submission
  -- (duplo clique, worker + retry manual simultâneos) — GATE 13.
  select * into v_sub from submissions where id = p_submission_id for update;

  if v_sub.id is null then
    raise exception 'submission não encontrada';
  end if;

  if v_sub.studio_id is distinct from v_studio_id then
    raise exception insufficient_privilege using message = 'submission não pertence ao Studio do usuário atual';
  end if;

  if v_sub.archived_at is not null then
    raise exception 'submission arquivada — nenhuma transição permitida';
  end if;

  select name into v_platform_name from platforms where id = v_sub.platform_id;
  v_integration_name := case v_platform_name
    when 'Google Play' then 'submission_google_play'
    when 'App Store' then 'submission_apple'
    else null
  end;

  if p_action = 'PREPARE' then
    -- Idempotente: já preparada ou além não é erro, é no-op.
    if v_sub.status in ('READY_TO_SUBMIT', 'SUBMITTING', 'SUBMITTED') then
      return jsonb_build_object('submission', to_jsonb(v_sub), 'noop', true);
    end if;

    if v_sub.status <> 'DRAFT' then
      raise exception 'transição inválida: % → READY_TO_SUBMIT', v_sub.status;
    end if;

    -- GATE 9 — readiness recalculada no servidor, nunca herdada da UI.
    v_readiness := public.get_release_readiness(v_sub.release_id);
    if v_readiness ->> 'status' is distinct from 'READY' then
      raise exception 'READINESS_NOT_READY: a Release não está pronta para submissão (blockers: %)', v_readiness ->> 'blockerCount';
    end if;

    update submissions
    set status = 'READY_TO_SUBMIT',
        updated_at = now(), updated_actor_type = 'USER', updated_actor_id = p_actor_id
    where id = p_submission_id and status = v_sub.status
    returning * into v_sub;

    insert into submission_events (studio_id, submission_id, event_type, payload, actor_type, actor_id)
    values (v_studio_id, p_submission_id, 'SubmissionReadyToSubmit',
      jsonb_build_object('releaseId', v_sub.release_id, 'platform', v_platform_name), 'USER', p_actor_id);

    return jsonb_build_object('submission', to_jsonb(v_sub), 'noop', false);
  end if;

  -- SUBMIT e RETRY convergem no mesmo efeito (enviar/reenviar) — só o nome
  -- da ação difere, para intenção clara nos eventos/UI.
  if p_action in ('SUBMIT', 'RETRY') then
    -- Idempotente: já em voo ou já terminado — nunca um segundo job.
    if v_sub.status in ('SUBMITTING', 'SUBMITTED') then
      return jsonb_build_object('submission', to_jsonb(v_sub), 'noop', true);
    end if;

    if v_sub.status not in ('READY_TO_SUBMIT', 'FAILED') then
      raise exception 'transição inválida: % → SUBMITTING', v_sub.status;
    end if;

    if v_integration_name is null then
      raise exception 'PLATFORM_NOT_SUPPORTED: % não tem pipeline de envio', v_platform_name;
    end if;

    -- Defesa em profundidade (GATE 9): readiness recalculada de novo, não
    -- confia no resultado do PREPARE (pode ter ficado obsoleto — ex.: a
    -- Store Connection caiu entre o PREPARE e o SUBMIT).
    v_readiness := public.get_release_readiness(v_sub.release_id);
    if v_readiness ->> 'status' is distinct from 'READY' then
      raise exception 'READINESS_NOT_READY: a Release não está mais pronta para submissão (blockers: %)', v_readiness ->> 'blockerCount';
    end if;

    -- GATE 13 continuação — nunca permitir job ativo duplicado para a
    -- mesma submission (mesmo padrão de enqueue_provider_upload_job).
    if exists (
      select 1 from integration_jobs
      where submission_id = p_submission_id
        and status in ('QUEUED', 'CLAIMED', 'RUNNING', 'RETRY_WAIT')
    ) then
      raise exception 'já existe um job de envio ativo para esta submission';
    end if;

    update submissions
    set status = 'SUBMITTING',
        updated_at = now(), updated_actor_type = 'USER', updated_actor_id = p_actor_id
    where id = p_submission_id and status = v_sub.status
    returning * into v_sub;

    insert into integration_jobs (
      studio_id, submission_id, integration_name, operation, status,
      created_actor_type, created_actor_id, updated_actor_type, updated_actor_id
    ) values (
      v_studio_id, p_submission_id, v_integration_name, 'submission.dispatch', 'QUEUED',
      'USER', p_actor_id, 'USER', p_actor_id
    )
    returning * into v_job;

    insert into submission_events (studio_id, submission_id, event_type, payload, actor_type, actor_id)
    values (v_studio_id, p_submission_id, 'SubmissionSubmissionStarted',
      jsonb_build_object('releaseId', v_sub.release_id, 'platform', v_platform_name, 'jobId', v_job.id, 'attempt', v_job.attempt,
        'retried', p_action = 'RETRY'),
      'USER', p_actor_id);

    if p_action = 'RETRY' then
      insert into submission_events (studio_id, submission_id, event_type, payload, actor_type, actor_id)
      values (v_studio_id, p_submission_id, 'SubmissionRetried',
        jsonb_build_object('jobId', v_job.id), 'USER', p_actor_id);
    end if;

    return jsonb_build_object('submission', to_jsonb(v_sub), 'job', to_jsonb(v_job), 'noop', false);
  end if;
end;
$$;

revoke execute on function public.transition_submission(uuid, text, uuid) from public;
revoke execute on function public.transition_submission(uuid, text, uuid) from anon;
grant execute on function public.transition_submission(uuid, text, uuid) to authenticated;

-- ---------------------------------------------------------------------
-- GATE 12 — conclusão do lado do worker (`service_role` apenas). Chamada
-- pelo processor do job (`submission_google_play`/`submission_apple`)
-- depois de `complete_integration_job` já ter marcado o job em si;
-- transiciona a Submission (SUBMITTING → SUBMITTED ou FAILED) e emite o
-- evento correspondente na mesma chamada — nunca dois passos separados que
-- poderiam divergir (job SUCCEEDED com submission ainda SUBMITTING).
-- CAS por `status = 'SUBMITTING'`: nunca sobrescreve uma submission que já
-- saiu desse estado (proteção contra double-completion do worker, mesmo
-- padrão de `claimed_by` nos outros RPCs de job).
-- ---------------------------------------------------------------------
create or replace function public.complete_submission_job(
  p_job_id uuid,
  p_submission_id uuid,
  p_result text, -- 'SUBMITTED' | 'FAILED'
  p_error_code text default null,
  p_duration_ms integer default null
)
returns submissions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub submissions%rowtype;
  v_studio_id uuid;
  v_platform_name text;
begin
  if p_result not in ('SUBMITTED', 'FAILED') then
    raise exception 'complete_submission_job: resultado % inválido', p_result;
  end if;

  select * into v_sub from submissions where id = p_submission_id for update;
  if v_sub.id is null then
    raise exception 'submission não encontrada';
  end if;
  v_studio_id := v_sub.studio_id;
  select name into v_platform_name from platforms where id = v_sub.platform_id;

  if v_sub.status <> 'SUBMITTING' then
    -- Não é erro fatal: pode ser uma segunda chamada de um worker zumbi
    -- (lease expirado, job já reivindicado de novo) — no-op idempotente.
    return v_sub;
  end if;

  update submissions
  set status = p_result::submission_status,
      updated_at = now(), updated_actor_type = 'SYSTEM', updated_actor_id = null
  where id = p_submission_id and status = 'SUBMITTING'
  returning * into v_sub;

  insert into submission_events (studio_id, submission_id, event_type, payload, actor_type, actor_id)
  values (
    v_studio_id, p_submission_id,
    case when p_result = 'SUBMITTED' then 'SubmissionSubmitted' else 'SubmissionSubmissionFailed' end,
    jsonb_build_object('jobId', p_job_id, 'platform', v_platform_name, 'errorCode', p_error_code, 'durationMs', p_duration_ms),
    'SYSTEM', null
  );

  return v_sub;
end;
$$;

revoke execute on function public.complete_submission_job(uuid, uuid, text, text, integer) from public;
revoke execute on function public.complete_submission_job(uuid, uuid, text, text, integer) from anon;
revoke execute on function public.complete_submission_job(uuid, uuid, text, text, integer) from authenticated;
grant execute on function public.complete_submission_job(uuid, uuid, text, text, integer) to service_role;
