-- Sprint 2.9.1 — correção de segurança urgente, achada validando produção
-- (não em código local): `get_store_connection_secret()`,
-- `set_store_connection_secret()` e `clear_store_connection_secret()`
-- estavam com EXECUTE concedido a `anon` em produção — nenhuma das três
-- deveria ser chamável por um usuário não autenticado, e
-- `get_store_connection_secret()` não deveria ser chamável por
-- `authenticated` também (só `service_role`).
--
-- Causa raiz: as migrations 20260806000001/20260807000001 faziam
-- `revoke execute ... from public`, mas este projeto Supabase concede
-- EXECUTE em toda função nova diretamente às roles nomeadas
-- (`anon`/`authenticated`/`service_role`) via privilégios padrão do
-- projeto — não ao pseudo-role PUBLIC. `revoke ... from public` nunca
-- tocou esses grants nomeados, então eles continuaram valendo mesmo depois
-- do revoke. Confirmado com uma chamada REST anônima de verdade contra
-- produção (retornou sem erro de permissão) antes de escrever este fix —
-- não foi uma suposição.
revoke execute on function public.get_store_connection_secret(uuid) from anon, authenticated, public;
grant execute on function public.get_store_connection_secret(uuid) to service_role;

revoke execute on function public.set_store_connection_secret(uuid, text, uuid) from anon, public;
grant execute on function public.set_store_connection_secret(uuid, text, uuid) to authenticated;

revoke execute on function public.clear_store_connection_secret(uuid, uuid) from anon, public;
grant execute on function public.clear_store_connection_secret(uuid, uuid) to authenticated;
