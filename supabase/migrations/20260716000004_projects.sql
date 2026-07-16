-- Domínio Projects (DATA_MODEL.md §4.3). ideas <-> projects tem referência
-- circular (Idea 0:1 Project) — resolvida com FK adiável, mesmo padrão de
-- studios <-> users.

create table ideas (
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
  description text null,
  status idea_status not null default 'CAPTURED',
  converted_project_id uuid null -- FK adicionada depois de projects existir
);

create table projects (
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
  name text not null,
  description text null,
  status project_status not null default 'DRAFT',
  source_idea_id uuid null references ideas(id) deferrable initially deferred,
  -- progress: decisão registrada em DATA_MODEL.md §4.3/§8 — persistido e
  -- recalculado por trigger (ver migration de triggers, 1.8+), não calculado
  -- em cada query, para manter as listagens rápidas sem agregação por request.
  progress smallint not null default 0 check (progress between 0 and 100)
);

alter table ideas
  add constraint fk_ideas_converted_project_id
  foreign key (converted_project_id) references projects(id) deferrable initially deferred;

create table epics (
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
  project_id uuid not null references projects(id),
  title text not null,
  description text null,
  status task_status not null default 'NOT_STARTED'
);

create table features (
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
  epic_id uuid not null references epics(id),
  title text not null,
  description text null,
  status task_status not null default 'NOT_STARTED'
);

-- estimate: unidade decidida como story points (ver DATA_MODEL.md §8) —
-- número inteiro pequeno, não horas (evita a falsa precisão de estimativas
-- em horas neste estágio do produto).
create table tasks (
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
  epic_id uuid not null references epics(id),
  feature_id uuid null references features(id),
  title text not null,
  status task_status not null default 'NOT_STARTED',
  priority task_priority not null default 'MEDIUM',
  due_date date null,
  estimate smallint null check (estimate is null or estimate >= 0)
);

create table milestones (
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
  project_id uuid not null references projects(id),
  title text not null,
  due_date date null,
  completed_at timestamptz null
);

create index idx_ideas_studio_id on ideas(studio_id);
create index idx_projects_studio_id on projects(studio_id);
create index idx_projects_studio_status on projects(studio_id, status) where archived_at is null;
create index idx_epics_project_id on epics(project_id);
create index idx_features_epic_id on features(epic_id);
create index idx_tasks_epic_id on tasks(epic_id);
create index idx_tasks_feature_id on tasks(feature_id);
create index idx_milestones_project_id on milestones(project_id);

alter table ideas enable row level security;
alter table projects enable row level security;
alter table epics enable row level security;
alter table features enable row level security;
alter table tasks enable row level security;
alter table milestones enable row level security;

create policy ideas_isolation on ideas
  using (studio_id = (select studio_id from users where id = auth.uid()));
create policy projects_isolation on projects
  using (studio_id = (select studio_id from users where id = auth.uid()));
create policy epics_isolation on epics
  using (studio_id = (select studio_id from users where id = auth.uid()));
create policy features_isolation on features
  using (studio_id = (select studio_id from users where id = auth.uid()));
create policy tasks_isolation on tasks
  using (studio_id = (select studio_id from users where id = auth.uid()));
create policy milestones_isolation on milestones
  using (studio_id = (select studio_id from users where id = auth.uid()));
