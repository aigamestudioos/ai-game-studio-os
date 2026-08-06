-- Sprint 2.9 — Apple App Store Connect (integração real): funções que
-- faltavam para o fluxo "Validate Connection" ler o segredo do Vault
-- server-side (Server Action → ApplePublishingAdapter) e para "Disconnect"
-- limpar a credencial sem apagar a linha inteira.

-- Achado de segurança real revisando o Sprint 2.8 antes de estender: por
-- padrão o Postgres concede EXECUTE em toda função nova a PUBLIC (diferente
-- de tabelas, onde é preciso GRANT explícito) — `set_store_connection_secret()`
-- nunca teve um `revoke ... from public`, então tecnicamente qualquer role,
-- inclusive `anon`, tinha permissão de EXECUTAR a função (a segurança real
-- vinha só das checagens internas de studio/permissão, não da grant). Não
-- era explorável na prática (a checagem de `current_user_has_permission`
-- já barra `anon`/qualquer um sem a role certa), mas é uma camada de defesa
-- a menos do que deveria. Corrigido aqui e replicado nas funções novas.
revoke execute on function public.set_store_connection_secret(uuid, text, uuid) from public;
grant execute on function public.set_store_connection_secret(uuid, text, uuid) to authenticated;

-- Lê o segredo do Vault para uso EXCLUSIVAMENTE server-side (o adapter da
-- Apple precisa do JSON de credenciais para montar o JWT). Diferente de
-- `set_store_connection_secret()`, esta função NUNCA é chamada pelo
-- browser — só por `apps/web` via Server Action, usando `admin-client.ts`
-- (service_role, já proibido de rodar no browser por um guard de runtime
-- próprio). Por isso o EXECUTE vai só para `service_role`, nunca para
-- `authenticated` — mesmo com a checagem de posse/permissão dentro da
-- função, expor isso a qualquer usuário autenticado devolveria o segredo
-- em texto puro pela API, violando "nunca retornar secrets pelas APIs".
create or replace function public.get_store_connection_secret(
  p_store_connection_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref text;
begin
  select credentials_ref into v_ref from store_connections where id = p_store_connection_id;
  if v_ref is null then
    return null;
  end if;
  return (select decrypted_secret from vault.decrypted_secrets where id = v_ref::uuid);
end;
$$;

revoke execute on function public.get_store_connection_secret(uuid) from public;
grant execute on function public.get_store_connection_secret(uuid) to service_role;

-- "Disconnect": limpa a credencial (Vault + `credentials_ref`) sem apagar a
-- linha — diferente de "Remover" (DELETE real, já existente desde o Sprint
-- 2.8, que também limpa o Vault via trigger). Mesmas checagens de posse/
-- permissão de `set_store_connection_secret()`.
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

  if v_studio_id <> public.current_user_studio_id() then
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

revoke execute on function public.clear_store_connection_secret(uuid, uuid) from public;
grant execute on function public.clear_store_connection_secret(uuid, uuid) to authenticated;
