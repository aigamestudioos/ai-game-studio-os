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
