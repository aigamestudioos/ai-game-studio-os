-- Domínio Knowledge — já inteiramente especificado em AGSOS-SPEC-003 §9.

create table knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id),
  created_at timestamptz not null default now(),
  created_actor_type actor_type not null,
  created_actor_id uuid null,
  updated_at timestamptz not null default now(),
  updated_actor_type actor_type not null,
  updated_actor_id uuid null,
  archived_at timestamptz null,
  archived_actor_type actor_type null,
  archived_actor_id uuid null,
  title text not null,
  type knowledge_document_type not null,
  status knowledge_document_status not null default 'DRAFT'
);

-- Imutável após criada — só INSERT, nunca UPDATE (documentos publicados não
-- são sobrescritos; uma alteração cria nova versão).
create table knowledge_document_versions (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id),
  created_at timestamptz not null default now(),
  created_actor_type actor_type not null,
  created_actor_id uuid null,
  document_id uuid not null references knowledge_documents(id),
  version_number int not null,
  content text not null,
  summary text null,
  unique (document_id, version_number)
);

-- related_type/related_id: polimórfico sem FK, mesmo padrão de actor_id
-- (integridade garantida por validação de aplicação, não pelo banco).
create table knowledge_document_relations (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id),
  created_at timestamptz not null default now(),
  created_actor_type actor_type not null,
  created_actor_id uuid null,
  document_id uuid not null references knowledge_documents(id),
  related_type text not null check (related_type in ('project', 'game', 'idea', 'task')),
  related_id uuid not null
);

create index idx_knowledge_documents_studio_id on knowledge_documents(studio_id);
create index idx_knowledge_documents_search on knowledge_documents using gin (to_tsvector('portuguese', title));
create index idx_knowledge_document_versions_document_id on knowledge_document_versions(document_id);
create index idx_knowledge_document_relations_document_id on knowledge_document_relations(document_id);
create index idx_knowledge_document_relations_related on knowledge_document_relations(related_type, related_id);

alter table knowledge_documents enable row level security;
alter table knowledge_document_versions enable row level security;
alter table knowledge_document_relations enable row level security;

create policy knowledge_documents_isolation on knowledge_documents
  using (studio_id = (select studio_id from users where id = auth.uid()));
create policy knowledge_document_versions_isolation on knowledge_document_versions
  using (studio_id = (select studio_id from users where id = auth.uid()));
create policy knowledge_document_relations_isolation on knowledge_document_relations
  using (studio_id = (select studio_id from users where id = auth.uid()));

-- Imutabilidade de knowledge_document_versions: bloqueia UPDATE/DELETE para
-- todos os roles exceto service_role (mesmo padrão de ledger_entries/studio_events).
create rule knowledge_document_versions_no_update as on update to knowledge_document_versions do instead nothing;
create rule knowledge_document_versions_no_delete as on delete to knowledge_document_versions do instead nothing;
