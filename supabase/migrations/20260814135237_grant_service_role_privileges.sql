-- Bug real encontrado testando o worker Google (Sprint 2.11d-2c) contra
-- Postgres real: `service_role` nunca recebeu privilégios de tabela
-- (GRANT) em nenhuma migration anterior — só RLS foi configurado, e
-- `authenticated` teve o mesmo gap corrigido no Sprint 1.7
-- (`20260717000003_grant_authenticated_privileges.sql`). Até agora,
-- todo código que usava `createAdminClient()` (service_role) só tocava
-- tabelas via RPC SECURITY DEFINER (`get_store_connection_secret` etc.)
-- ou nunca fazia `.from(...).select()` direto — o worker
-- (`googlePlayProcessor`, GATE 13) é o primeiro código a fazer acesso
-- direto de tabela como `service_role` (`provider_uploads`,
-- `build_artifacts`, `builds`, `game_versions`, `games`,
-- `store_connections`), e falhou com "permission denied for table
-- provider_uploads" — GRANT (nível de statement) é exigido pelo Postgres
-- ANTES de RLS ser avaliado, independente de `service_role` ter
-- `bypassrls` (que só pula policies, nunca dispensa o GRANT de tabela).
--
-- Conceder privilégio total de tabela a `service_role` não reduz
-- segurança: `service_role` já tem acesso irrestrito por design (é a
-- chave administrativa, já bypassa RLS inteiramente) — este GRANT só
-- torna esse acesso já assumido utilizável via `.from()` direto, não só
-- via RPC.
grant select, insert, update, delete on all tables in schema public to service_role;

-- Garante que tabelas criadas por migrations futuras também recebam o
-- mesmo grant automaticamente, mesmo padrão já usado para `authenticated`.
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
