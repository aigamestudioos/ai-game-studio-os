-- Espelha SEED_PROJECTS de apps/web/lib/projects-store.ts.

insert into projects (id, studio_id, name, description, status, progress, created_actor_type, updated_actor_type) values
  ('90000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'Project Alpha', 'Puzzle mobile — protótipo em desenvolvimento.', 'ACTIVE', 45, 'USER', 'USER'),
  ('90000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', 'Project Beta', 'Runner casual — aguardando revisão de arte.', 'ACTIVE', 78, 'USER', 'USER'),
  ('90000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000001', 'Project Gamma', 'Hyper-casual — publicado nas lojas.', 'COMPLETED', 100, 'USER', 'USER');

insert into epics (studio_id, project_id, title, status, created_actor_type, updated_actor_type) values
  ('70000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 'Definir mecânica principal', 'COMPLETED', 'USER', 'USER'),
  ('70000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 'Protótipo jogável (greybox)', 'COMPLETED', 'USER', 'USER'),
  ('70000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 'Onboarding do jogador', 'NOT_STARTED', 'USER', 'USER'),
  ('70000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 'Sistema de níveis', 'NOT_STARTED', 'USER', 'USER'),
  ('70000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000002', 'Core loop de corrida', 'COMPLETED', 'USER', 'USER'),
  ('70000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000002', 'Sistema de power-ups', 'COMPLETED', 'USER', 'USER'),
  ('70000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000002', 'Revisão de arte final', 'NOT_STARTED', 'USER', 'USER'),
  ('70000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000003', 'MVP completo', 'COMPLETED', 'USER', 'USER'),
  ('70000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000003', 'Submissão às lojas', 'COMPLETED', 'USER', 'USER'),
  ('70000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000003', 'Lançamento', 'COMPLETED', 'USER', 'USER');
