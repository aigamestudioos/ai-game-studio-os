-- Sprint 2.11d — GATE 4 (claim atômico) + GATE 5 (idempotência: retry
-- manual nunca compete com job ativo).

-- Enfileira um job para um provider_upload já existente (criado por
-- `create_pending_provider_upload`, Sprint 2.11b/c) — nunca cria o
-- provider_upload aqui, só o trabalho de execução. Bloqueia
-- explicitamente se já existe job ativo (QUEUED/CLAIMED/RUNNING/
-- RETRY_WAIT) para o mesmo provider_upload — GATE 5, caso "retry manual
-- durante retry automático": nunca duas transferências concorrentes para
-- o mesmo provider_upload.
create or replace function public.enqueue_provider_upload_job(
  p_provider_upload_id uuid,
  p_integration_name text,
  p_operation text,
  p_actor_id uuid
)
returns integration_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_studio_id uuid;
  v_pu_status provider_upload_status;
  v_active_count integer;
  v_row integration_jobs;
begin
  select studio_id, status into v_studio_id, v_pu_status
  from provider_uploads
  where id = p_provider_upload_id;

  if v_studio_id is null then
    raise exception 'provider_upload não encontrado';
  end if;

  if v_studio_id is distinct from public.current_user_studio_id() then
    raise exception insufficient_privilege using message = 'provider_upload não pertence ao Studio do usuário atual';
  end if;

  if not public.current_user_has_permission('publishing.upload_build') then
    raise exception insufficient_privilege using message = 'sem permissão publishing.upload_build';
  end if;

  select count(*) into v_active_count
  from integration_jobs
  where provider_upload_id = p_provider_upload_id
    and status in ('QUEUED', 'CLAIMED', 'RUNNING', 'RETRY_WAIT');

  if v_active_count > 0 then
    raise exception 'já existe um job ativo para este provider_upload — aguarde terminar antes de tentar de novo';
  end if;

  insert into integration_jobs (
    studio_id, provider_upload_id, integration_name, operation, status,
    created_actor_type, created_actor_id, updated_actor_type, updated_actor_id
  ) values (
    v_studio_id, p_provider_upload_id, p_integration_name, p_operation, 'QUEUED',
    'USER', p_actor_id, 'USER', p_actor_id
  )
  returning * into v_row;

  update provider_uploads
  set status = 'QUEUED', updated_actor_type = 'USER', updated_actor_id = p_actor_id
  where id = p_provider_upload_id;

  return v_row;
end;
$$;

revoke execute on function public.enqueue_provider_upload_job(uuid, text, text, uuid) from public;
revoke execute on function public.enqueue_provider_upload_job(uuid, text, text, uuid) from anon;
grant execute on function public.enqueue_provider_upload_job(uuid, text, text, uuid) to authenticated;

-- GATE 4 — claim atômico. `for update skip locked` garante que dois
-- workers concorrentes nunca reivindicam a mesma linha: se o worker A já
-- travou a linha (mesmo antes de comitar), o worker B simplesmente pula
-- para a próxima candidata, em vez de esperar/duplicar. `service_role`
-- apenas — nunca chamável por `authenticated`/`anon` (é infraestrutura de
-- worker, não uma operação de usuário).
create or replace function public.claim_integration_jobs(
  p_worker_id text,
  p_limit integer default 5,
  p_lease_seconds integer default 120
)
returns setof integration_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update integration_jobs
  set status = 'CLAIMED',
      claimed_by = p_worker_id,
      claimed_at = now(),
      lease_expires_at = now() + (p_lease_seconds || ' seconds')::interval,
      updated_at = now(),
      updated_actor_type = 'SYSTEM'
  where id in (
    select id
    from integration_jobs
    where status in ('QUEUED', 'RETRY_WAIT')
      and scheduled_at <= now()
      and archived_at is null
    order by scheduled_at
    limit p_limit
    for update skip locked
  )
  returning *;
end;
$$;

revoke execute on function public.claim_integration_jobs(text, integer, integer) from public;
revoke execute on function public.claim_integration_jobs(text, integer, integer) from anon;
revoke execute on function public.claim_integration_jobs(text, integer, integer) from authenticated;
grant execute on function public.claim_integration_jobs(text, integer, integer) to service_role;

-- GATE 4 — recuperação de worker morto. Um job `CLAIMED`/`RUNNING` cuja
-- lease expirou nunca fica preso: volta para `QUEUED` (se ainda houver
-- tentativas) ou vai para `DEAD` (se `attempt >= max_attempts`) — nunca
-- `RUNNING` eternamente. Chamado periodicamente pelo dispatcher (mesmo
-- tick do `/api/jobs/tick`, ver ADR-006), nunca por `authenticated`.
create or replace function public.requeue_stale_jobs()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update integration_jobs
  set status = case when attempt >= max_attempts then 'DEAD'::job_status else 'QUEUED'::job_status end,
      claimed_by = null,
      claimed_at = null,
      lease_expires_at = null,
      attempt = case when attempt >= max_attempts then attempt else attempt + 1 end,
      last_error_class = 'INTERNAL',
      last_error_code = 'WORKER_LEASE_EXPIRED',
      updated_at = now(),
      updated_actor_type = 'SYSTEM'
  where status in ('CLAIMED', 'RUNNING')
    and lease_expires_at is not null
    and lease_expires_at < now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.requeue_stale_jobs() from public;
revoke execute on function public.requeue_stale_jobs() from anon;
revoke execute on function public.requeue_stale_jobs() from authenticated;
grant execute on function public.requeue_stale_jobs() to service_role;
