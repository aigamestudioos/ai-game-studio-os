-- Entry point de seed (gerado a partir de seed/*.sql -- ver cada arquivo
-- fonte para o contexto de negocio de cada bloco). Supabase CLI aplica
-- este arquivo via protocolo Postgres direto, sem suporte a meta-comandos
-- psql (backslash-i), por isso esta concatenado em vez de referenciado.

-- ============================================================
-- source: seed/01_global.sql
-- ============================================================
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

-- ============================================================
-- source: seed/02_demo_studio.sql
-- ============================================================
-- Seed de desenvolvimento — espelha os dados mock já usados em
-- apps/web/lib/{projects,games,knowledge,publishing}-store.ts, para que a
-- demonstração fique consistente quando o Sprint 1.8 conectar de verdade.
--
-- auth.users inserido diretamente (padrão de seed local do Supabase CLI;
-- em staging/produção o usuário é criado via signup real, nunca por seed).

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) values (
  '00000000-0000-0000-0000-000000000000',
  '50000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated',
  'founder@aigamestudio.os',
  crypt('demo-password-local-only', gen_salt('bf')),
  now(), now(), now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}'
);

-- environments: precisa existir antes de studios.active_environment_id.
insert into environments (id, studio_id, type, name, created_actor_type, updated_actor_type) values
  ('60000000-0000-0000-0000-000000000001', null, 'LOCAL', 'Local Development', 'SYSTEM', 'SYSTEM');

insert into studios (
  id, name, timezone, currency, locale, active_environment_id,
  owner_user_id, created_actor_type, updated_actor_type
) values (
  '70000000-0000-0000-0000-000000000001',
  'AI Game Studio OS',
  'America/Sao_Paulo', 'BRL', 'pt-BR',
  '60000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000001',
  'SYSTEM', 'SYSTEM'
);

update environments set studio_id = '70000000-0000-0000-0000-000000000001'
  where id = '60000000-0000-0000-0000-000000000001';

insert into users (id, studio_id, email, name, created_actor_type, updated_actor_type) values (
  '50000000-0000-0000-0000-000000000001',
  '70000000-0000-0000-0000-000000000001',
  'founder@aigamestudio.os',
  'Fundador',
  'USER', 'USER'
);

insert into roles (id, studio_id, name, description, created_actor_type, updated_actor_type) values
  ('80000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'Owner', 'Acesso completo ao Studio', 'SYSTEM', 'SYSTEM');

insert into user_roles (studio_id, user_id, role_id) values
  ('70000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001');

-- ============================================================
-- source: seed/03_projects.sql
-- ============================================================
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

-- ============================================================
-- source: seed/04_games.sql
-- ============================================================
-- Espelha SEED_GAMES de apps/web/lib/games-store.ts. Games no mock não
-- distingue Version de Build (cada build carrega sua própria "version"
-- string) — no schema real, Version é a entidade e Build pertence a ela; o
-- seed abaixo cria uma game_version por build para preservar os mesmos
-- números de versão exibidos hoje na UI mock.

insert into games (id, studio_id, project_id, name, description, status, created_actor_type, updated_actor_type) values
  ('a0000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 'Nebula Drift', 'Puzzle mobile — protótipo em desenvolvimento.', 'IN_DEVELOPMENT', 'USER', 'USER'),
  ('a0000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000002', 'Sprint Runner', 'Runner casual — aguardando revisão de arte.', 'TESTING', 'USER', 'USER'),
  ('a0000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000003', 'Hyper Dash', 'Hyper-casual — publicado nas lojas.', 'PUBLISHED', 'USER', 'USER');

insert into game_versions (id, studio_id, game_id, version_number, status, created_actor_type, updated_actor_type) values
  ('b0000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '0.1.0', 'READY', 'USER', 'USER'),
  ('b0000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '0.2.0', 'IN_DEVELOPMENT', 'USER', 'USER'),
  ('b0000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '1.0.0-rc1', 'TESTING', 'USER', 'USER'),
  ('b0000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '0.9.0', 'READY', 'USER', 'USER'),
  ('b0000000-0000-0000-0000-000000000005', '70000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', '1.2.0', 'RELEASED', 'USER', 'USER'),
  ('b0000000-0000-0000-0000-000000000006', '70000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', '1.1.0', 'DEPRECATED', 'USER', 'USER');

-- platform_id: iOS/Android -> App Store/Google Play; Steam -> Steam (ver 01_global.sql).
insert into builds (id, studio_id, game_version_id, platform_id, status, created_actor_type, updated_actor_type) values
  ('e0000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'SUCCEEDED', 'USER', 'USER'),
  ('e0000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'RUNNING', 'USER', 'USER'),
  ('e0000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'SUCCEEDED', 'USER', 'USER'),
  ('e0000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'SUCCEEDED', 'USER', 'USER'),
  ('e0000000-0000-0000-0000-000000000005', '70000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'SUCCEEDED', 'USER', 'USER'),
  ('e0000000-0000-0000-0000-000000000006', '70000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'SUCCEEDED', 'USER', 'USER');

insert into releases (id, studio_id, game_id, game_version_id, status, created_actor_type, updated_actor_type) values
  ('c0000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'READY_FOR_SUBMISSION', 'USER', 'USER'),
  ('c0000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'READY_FOR_SUBMISSION', 'USER', 'USER'),
  ('c0000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000005', 'PUBLISHED', 'USER', 'USER');

-- ============================================================
-- source: seed/05_knowledge.sql
-- ============================================================
-- Espelha SEED_DOCUMENTS de apps/web/lib/knowledge-store.ts.
-- Mapeamento de status: mock só tem Rascunho/Publicado; ENUM real tem 6
-- valores (ver DATA_MODEL.md §7) — Rascunho -> DRAFT, Publicado -> PUBLISHED.

insert into knowledge_documents (id, studio_id, title, type, status, created_actor_type, updated_actor_type) values
  ('d0000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'Onboarding Playbook', 'PLAYBOOK', 'PUBLISHED', 'USER', 'USER'),
  ('d0000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', 'Code Review SOP', 'SOP', 'PUBLISHED', 'USER', 'USER'),
  ('d0000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000001', 'Convenções de Nomenclatura', 'TECHNICAL_DOCUMENT', 'DRAFT', 'USER', 'USER');

insert into knowledge_document_versions (studio_id, document_id, version_number, content, summary, created_actor_type) values
  ('70000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 1,
    '1. Acesso ao repositório e ferramentas. 2. Leitura de VISION.md e ARCHITECTURE.md. 3. Primeira tarefa guiada com um par.',
    'Passo a passo para novos membros do estúdio.', 'USER'),
  ('70000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 1,
    'Todo PR precisa de pelo menos uma aprovação. Rodar lint/typecheck/build localmente antes de abrir o PR. Revisar por correção, simplicidade e cobertura de testes.',
    'Procedimento padrão para revisão de pull requests.', 'USER'),
  ('70000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 1,
    'Em elaboração — consolidar com o UL-001 antes de publicar.',
    'Rascunho sobre padrões de nomes de entidades e componentes.', 'USER');

-- ============================================================
-- source: seed/06_publishing.sql
-- ============================================================
-- Espelha SEED_SUBMISSIONS de apps/web/lib/publishing-store.ts. O "history"
-- do mock vira store_reviews aqui — no schema real, o histórico completo de
-- status também é reconstruível via studio_events (ver DATA_MODEL.md §7),
-- mas store_reviews guarda especificamente as decisões de revisão da loja.

insert into submissions (id, studio_id, release_id, platform_id, build_id, status, created_actor_type, updated_actor_type) values
  ('f0000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'IN_REVIEW', 'USER', 'USER'),
  ('f0000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000003', 'REJECTED', 'USER', 'USER'),
  ('f0000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000005', 'PUBLISHED', 'USER', 'USER');

insert into store_reviews (studio_id, submission_id, decision, reviewed_at, created_actor_type, updated_actor_type) values
  ('70000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'IN_REVIEW', now() - interval '2 hours', 'USER', 'USER'),

  ('70000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', 'IN_REVIEW', now() - interval '3 days', 'USER', 'USER'),
  ('70000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', 'REJECTED', now() - interval '1 day', 'USER', 'USER'),

  ('70000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000003', 'IN_REVIEW', now() - interval '8 days', 'USER', 'USER'),
  ('70000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000003', 'APPROVED', now() - interval '6 days', 'USER', 'USER'),
  ('70000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000003', 'PUBLISHED', now() - interval '5 days', 'USER', 'USER');

