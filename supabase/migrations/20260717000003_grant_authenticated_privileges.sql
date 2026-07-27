-- Segundo bug real encontrado testando o bootstrap contra Postgres real:
-- nenhuma migration do Sprint 1.7 concedeu privilégios de tabela (GRANT) ao
-- role `authenticated` — só RLS (row-level) foi habilitado, mas o Postgres
-- exige o GRANT de tabela (statement-level) como primeiro portão, antes de
-- RLS sequer ser avaliado. Sem isso, toda query autenticada falhava com
-- "permission denied for table X", independente de RLS estar correto.
--
-- RLS continua sendo o controle de acesso real (ADR-003) — este GRANT é só
-- a permissão de baixo nível que o Postgres exige para RLS entrar em cena.
grant usage on schema public to authenticated;

grant select, insert, update, delete on all tables in schema public to authenticated;

-- Garante que tabelas criadas por migrations futuras também recebam o
-- mesmo grant automaticamente, sem precisar lembrar disso de novo.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
