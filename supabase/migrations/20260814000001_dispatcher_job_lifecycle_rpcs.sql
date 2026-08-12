-- Sprint 2.11d-2 (GATEs 6/9/10) — RPCs de ciclo de vida de um job já
-- reivindicado (`claim_integration_jobs`, Sprint 2.11d-1). Todas exigem
-- `p_worker_id` e validam `claimed_by = p_worker_id` antes de qualquer
-- transição — essa checagem é a defesa central contra double-completion:
-- se o lease de um worker expirou e `requeue_stale_jobs()` (2.11d-1) já
-- reivindicou o job para outro worker, `claimed_by` mudou, e a chamada do
-- worker antigo (zumbi) falha aqui em vez de sobrescrever o progresso do
-- worker novo. Todas `service_role`-only — só o dispatcher chama.

-- GATE 9/10 — transição explícita CLAIMED->RUNNING. Feita separada do
-- claim para que fique visível em `integration_jobs.status` a diferença
-- entre "reivindicado, ainda não começou a trabalhar" (CLAIMED) e
-- "efetivamente processando" (RUNNING) — útil para observabilidade
-- (GATE 26) e para decidir, numa recuperação, se o worker chegou a
-- iniciar trabalho de verdade.
create or replace function public.start_integration_job_running(
  p_job_id uuid,
  p_worker_id text
)
returns integration_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row integration_jobs;
begin
  update integration_jobs
  set status = 'RUNNING'::job_status,
      updated_at = now()
  where id = p_job_id
    and claimed_by = p_worker_id
    and status = 'CLAIMED'::job_status
  returning * into v_row;

  if v_row.id is null then
    raise exception 'job % não está CLAIMED por worker % (lease pode ter expirado ou já ter sido concluído)', p_job_id, p_worker_id;
  end if;

  return v_row;
end;
$$;

revoke execute on function public.start_integration_job_running(uuid, text) from public;
revoke execute on function public.start_integration_job_running(uuid, text) from anon;
revoke execute on function public.start_integration_job_running(uuid, text) from authenticated;
grant execute on function public.start_integration_job_running(uuid, text) to service_role;

-- GATE 10 — heartbeat de lease. Chamado pelo dispatcher durante uma
-- operação individual que pode ultrapassar o lease original (ex.: um
-- upload de chunk que demora mais que o `lease_seconds` do claim) — sem
-- isso, `requeue_stale_jobs()` poderia reivindicar o mesmo job para outro
-- worker enquanto o primeiro ainda está legitimamente trabalhando.
create or replace function public.renew_integration_job_lease(
  p_job_id uuid,
  p_worker_id text,
  p_lease_seconds integer default 120
)
returns integration_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row integration_jobs;
begin
  update integration_jobs
  set lease_expires_at = now() + (p_lease_seconds || ' seconds')::interval,
      updated_at = now()
  where id = p_job_id
    and claimed_by = p_worker_id
    and status in ('CLAIMED'::job_status, 'RUNNING'::job_status)
  returning * into v_row;

  if v_row.id is null then
    raise exception 'job % não está CLAIMED/RUNNING por worker % — lease não renovado (pode já ter sido perdido)', p_job_id, p_worker_id;
  end if;

  return v_row;
end;
$$;

revoke execute on function public.renew_integration_job_lease(uuid, text, integer) from public;
revoke execute on function public.renew_integration_job_lease(uuid, text, integer) from anon;
revoke execute on function public.renew_integration_job_lease(uuid, text, integer) from authenticated;
grant execute on function public.renew_integration_job_lease(uuid, text, integer) to service_role;

-- GATE 9 — continuação bounded. Uma invocation do dispatcher processa uma
-- quantidade limitada de trabalho (ex.: N chunks) e devolve o job para
-- QUEUED com o checkpoint atualizado — SEM incrementar `attempt` (isso não
-- é uma falha nem um retry, é a mesma tentativa continuando na próxima
-- invocation) e SEM alterar `max_attempts`. Libera o claim imediatamente
-- (`claimed_by`/`lease_expires_at` = null) para que a próxima invocation do
-- dispatcher (ou outro worker, tanto faz — o checkpoint é o que importa)
-- possa reivindicar e continuar de onde parou.
create or replace function public.checkpoint_and_release_integration_job(
  p_job_id uuid,
  p_worker_id text,
  p_checkpoint jsonb
)
returns integration_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row integration_jobs;
begin
  update integration_jobs
  set checkpoint = p_checkpoint,
      status = 'QUEUED'::job_status,
      claimed_by = null,
      claimed_at = null,
      lease_expires_at = null,
      scheduled_at = now(),
      updated_at = now()
  where id = p_job_id
    and claimed_by = p_worker_id
    and status in ('CLAIMED'::job_status, 'RUNNING'::job_status)
  returning * into v_row;

  if v_row.id is null then
    raise exception 'job % não está CLAIMED/RUNNING por worker % — checkpoint não persistido', p_job_id, p_worker_id;
  end if;

  return v_row;
end;
$$;

revoke execute on function public.checkpoint_and_release_integration_job(uuid, text, jsonb) from public;
revoke execute on function public.checkpoint_and_release_integration_job(uuid, text, jsonb) from anon;
revoke execute on function public.checkpoint_and_release_integration_job(uuid, text, jsonb) from authenticated;
grant execute on function public.checkpoint_and_release_integration_job(uuid, text, jsonb) to service_role;

-- GATE 17 — transição terminal/retry genérica. `p_status` deve ser
-- 'SUCCEEDED', 'RETRY_WAIT', 'FAILED' ou 'DEAD' — QUEUED/CLAIMED/RUNNING
-- não fazem sentido aqui (são responsabilidade de claim/checkpoint). Só
-- RETRY_WAIT incrementa `attempt` (é a semântica de "essa tentativa
-- terminou em erro retryable, a próxima tentativa começa em
-- p_next_attempt_at"); SUCCEEDED/FAILED/DEAD são terminais, não
-- incrementam nada.
create or replace function public.complete_integration_job(
  p_job_id uuid,
  p_worker_id text,
  p_status job_status,
  p_checkpoint jsonb,
  p_error_code text,
  p_error_class job_error_class,
  p_next_attempt_at timestamptz
)
returns integration_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row integration_jobs;
begin
  if p_status not in ('SUCCEEDED'::job_status, 'RETRY_WAIT'::job_status, 'FAILED'::job_status, 'DEAD'::job_status) then
    raise exception 'complete_integration_job: status % não é uma transição terminal/retry válida', p_status;
  end if;

  update integration_jobs
  set status = p_status,
      checkpoint = coalesce(p_checkpoint, checkpoint),
      last_error_code = p_error_code,
      last_error_class = p_error_class,
      attempt = case when p_status = 'RETRY_WAIT'::job_status then attempt + 1 else attempt end,
      scheduled_at = case when p_status = 'RETRY_WAIT'::job_status then coalesce(p_next_attempt_at, now()) else scheduled_at end,
      claimed_by = null,
      claimed_at = null,
      lease_expires_at = null,
      updated_at = now()
  where id = p_job_id
    and claimed_by = p_worker_id
    and status in ('CLAIMED'::job_status, 'RUNNING'::job_status)
  returning * into v_row;

  if v_row.id is null then
    raise exception 'job % não está CLAIMED/RUNNING por worker % — conclusão não persistida', p_job_id, p_worker_id;
  end if;

  return v_row;
end;
$$;

revoke execute on function public.complete_integration_job(uuid, text, job_status, jsonb, text, job_error_class, timestamptz) from public;
revoke execute on function public.complete_integration_job(uuid, text, job_status, jsonb, text, job_error_class, timestamptz) from anon;
revoke execute on function public.complete_integration_job(uuid, text, job_status, jsonb, text, job_error_class, timestamptz) from authenticated;
grant execute on function public.complete_integration_job(uuid, text, job_status, jsonb, text, job_error_class, timestamptz) to service_role;
