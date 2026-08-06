-- Seed de tabelas globais — dados mínimos para desenvolvimento local.

-- on conflict do nothing (Sprint 2.10.1): migration 20260809000001 agora
-- também insere estas 3 linhas (backfill de produção, onde este seed nunca
-- roda) — sem isso, `supabase db reset` local quebra com duplicate key,
-- já que a migration roda antes deste seed.
insert into platforms (id, name, kind) values
  ('10000000-0000-0000-0000-000000000001', 'App Store', 'MOBILE'),
  ('10000000-0000-0000-0000-000000000002', 'Google Play', 'MOBILE'),
  ('10000000-0000-0000-0000-000000000003', 'Steam', 'DESKTOP')
on conflict (id) do nothing;

insert into languages (id, code, name) values
  ('20000000-0000-0000-0000-000000000001', 'pt-BR', 'Português (Brasil)'),
  ('20000000-0000-0000-0000-000000000002', 'en-US', 'English (US)');

insert into currencies (id, code, symbol) values
  ('30000000-0000-0000-0000-000000000001', 'USD', '$'),
  ('30000000-0000-0000-0000-000000000002', 'BRL', 'R$');

insert into countries (id, code, name) values
  ('40000000-0000-0000-0000-000000000001', 'BR', 'Brasil'),
  ('40000000-0000-0000-0000-000000000002', 'US', 'United States');
