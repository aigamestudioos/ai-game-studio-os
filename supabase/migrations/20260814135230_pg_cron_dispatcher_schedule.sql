-- Sprint 2.11d-2 (GATE 8) — scheduler: pg_cron dispara pg_net a cada
-- minuto contra o dispatcher (`/api/jobs/tick`), conforme ADR-006. O
-- scheduler NUNCA contém lógica de transferência — só "acorda" o
-- dispatcher; toda durabilidade fica em `integration_jobs`.
--
-- Confirmado contra a documentação oficial atual do Supabase antes de
-- implementar (não por memória): `pg_cron` e `pg_net` são extensões
-- suportadas (schema dedicado `cron`/`net`), `cron.schedule()` aceita
-- expressões padrão de 5 campos (mínimo granularidade de minuto — não
-- confundir com o "sub-minuto" mencionado pelo usuário, que existe em
-- versões recentes do pg_cron via `cron.schedule` com sintaxe estendida
-- "* * * * * seconds", indisponível na versão empacotada pelo Supabase
-- local no momento deste sprint; adotado 1 minuto como intervalo padrão,
-- documentado como parâmetro, não hardcoded sem explicação); `pg_net`
-- expõe `net.http_post` assíncrono (enfileira a requisição, resposta em
-- `net._http_response`, não bloqueia o job do cron). Supabase recomenda
-- manter jobs de cron curtos — alinhado com o desenho bounded do GATE 9.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Config do dispatcher (URL + segredo) NUNCA em texto puro nem em
-- `cron.job.command` (visível a qualquer role com select em `cron.job`) —
-- mesma classe de problema do `google_resumable_session_ref` (2.11d-1):
-- o segredo do dispatcher também é uma bearer capability. `tick_url` não é
-- segredo por si (é só um endpoint), mas fica na mesma tabela de config
-- por coesão; `secret_ref` é sempre um ponteiro pro Vault.
create table if not exists public.job_dispatcher_config (
  id smallint primary key default 1,
  tick_url text,
  secret_ref text,
  updated_at timestamptz not null default now(),
  constraint job_dispatcher_config_singleton check (id = 1)
);

alter table public.job_dispatcher_config enable row level security;
-- Nenhuma policy — RLS ligada sem policy nega tudo por padrão a
-- `anon`/`authenticated`; só `postgres`/`service_role` (bypass de RLS)
-- leem/escrevem. Reforço explícito via revoke, mesmo padrão das outras
-- tabelas operacionais deste sprint.
revoke all on public.job_dispatcher_config from public;
revoke all on public.job_dispatcher_config from anon;
revoke all on public.job_dispatcher_config from authenticated;

-- Setter — nunca expõe o segredo de volta (retorna void), mesmo padrão do
-- `set_provider_upload_resumable_session` (2.11d-1). `service_role`-only:
-- só operação administrativa (deploy/setup), nunca chamada do browser.
create or replace function public.set_job_dispatcher_config(
  p_tick_url text,
  p_secret text
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
  select secret_ref into v_existing_ref from job_dispatcher_config where id = 1;

  if v_existing_ref is not null then
    perform vault.update_secret(v_existing_ref::uuid, p_secret);
    v_secret_id := v_existing_ref::uuid;
  else
    v_secret_id := vault.create_secret(p_secret, 'job_dispatcher_secret');
  end if;

  insert into job_dispatcher_config (id, tick_url, secret_ref, updated_at)
  values (1, p_tick_url, v_secret_id::text, now())
  on conflict (id) do update set tick_url = excluded.tick_url, secret_ref = excluded.secret_ref, updated_at = now();
end;
$$;

revoke execute on function public.set_job_dispatcher_config(text, text) from public;
revoke execute on function public.set_job_dispatcher_config(text, text) from anon;
revoke execute on function public.set_job_dispatcher_config(text, text) from authenticated;
grant execute on function public.set_job_dispatcher_config(text, text) to service_role;

-- Chamada pelo cron job (que corre como `postgres`, dono da função —
-- SECURITY DEFINER aqui não é sobre elevar privilégio de um caller
-- externo, é sobre poder ler `vault.decrypted_secrets` dentro da mesma
-- função que faz o POST). GATE 27 (scheduler failure): se
-- `job_dispatcher_config` não estiver preenchido (ambiente novo, ainda
-- não configurado), a função é um no-op silencioso — não polui
-- `cron.job_run_details` com erro em todo ambiente onde o dispatcher
-- ainda não foi configurado.
create or replace function public.invoke_jobs_dispatcher()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text;
  v_secret text;
begin
  select tick_url into v_url from job_dispatcher_config where id = 1;
  if v_url is null then
    return;
  end if;

  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where id = (select secret_ref from job_dispatcher_config where id = 1)::uuid;

  if v_secret is null then
    return;
  end if;

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object('content-type', 'application/json', 'x-dispatcher-secret', v_secret),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
end;
$$;

-- Nenhum grant de execute a `authenticated`/`anon`/`public` — só o cron
-- job (rodando como `postgres`) e `service_role` chamam.
revoke execute on function public.invoke_jobs_dispatcher() from public;
revoke execute on function public.invoke_jobs_dispatcher() from anon;
revoke execute on function public.invoke_jobs_dispatcher() from authenticated;
grant execute on function public.invoke_jobs_dispatcher() to service_role;

-- Agendamento em si — declarativo, versionado nesta migration (nunca
-- configuração manual invisível). Intervalo de 1 minuto: bounded execution
-- (GATE 9) do dispatcher já assume que várias invocations por minuto de
-- fila grande são normais, não excepcionais.
do $$
begin
  if not exists (select 1 from cron.job where jobname = 'jobs-dispatcher-tick') then
    perform cron.schedule('jobs-dispatcher-tick', '* * * * *', $job$select public.invoke_jobs_dispatcher()$job$);
  end if;
end;
$$;
