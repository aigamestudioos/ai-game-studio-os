-- Seed de tabelas globais — dados mínimos para desenvolvimento local.

insert into platforms (id, name, kind) values
  ('10000000-0000-0000-0000-000000000001', 'App Store', 'MOBILE'),
  ('10000000-0000-0000-0000-000000000002', 'Google Play', 'MOBILE'),
  ('10000000-0000-0000-0000-000000000003', 'Steam', 'DESKTOP');

insert into languages (id, code, name) values
  ('20000000-0000-0000-0000-000000000001', 'pt-BR', 'Português (Brasil)'),
  ('20000000-0000-0000-0000-000000000002', 'en-US', 'English (US)');

insert into currencies (id, code, symbol) values
  ('30000000-0000-0000-0000-000000000001', 'USD', '$'),
  ('30000000-0000-0000-0000-000000000002', 'BRL', 'R$');

insert into countries (id, code, name) values
  ('40000000-0000-0000-0000-000000000001', 'BR', 'Brasil'),
  ('40000000-0000-0000-0000-000000000002', 'US', 'United States');
