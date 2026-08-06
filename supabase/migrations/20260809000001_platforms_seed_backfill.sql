-- Backfill de produção: `platforms` nunca foi populada fora do ambiente
-- local. `supabase/seed.sql`/`supabase/seed/01_global.sql` só são aplicados
-- por `supabase db reset` (local) — o CLI nunca aplica `seed.sql` a um
-- projeto hospedado/linkado, só `supabase/migrations/`. Como nenhuma
-- migration jamais fez `insert into platforms`, a tabela ficou vazia em
-- produção desde a criação (Sprint 1.7/2.8), o que impediu qualquer conta
-- real de criar uma Store Connection pela UI (`Add Connection` fica
-- desabilitado sem nenhuma platform disponível) — achado no smoke-check de
-- produção do Sprint 2.10.1, Fase 0.
--
-- Mesmos UUIDs fixos do seed local (`seed/01_global.sql`) — não UUIDs
-- gerados agora — para que qualquer referência hardcoded a esses IDs em
-- código/documentação/testes já escritos continue válida em produção.
-- `on conflict do nothing` torna a migration segura para reexecução (embora
-- o ledger de migrations já garanta isso não rodar duas vezes).
insert into platforms (id, name, kind) values
  ('10000000-0000-0000-0000-000000000001', 'App Store', 'MOBILE'),
  ('10000000-0000-0000-0000-000000000002', 'Google Play', 'MOBILE'),
  ('10000000-0000-0000-0000-000000000003', 'Steam', 'DESKTOP')
on conflict (id) do nothing;
