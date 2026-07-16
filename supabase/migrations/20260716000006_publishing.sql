-- Domínio Publishing (DATA_MODEL.md §4.5). Publishing nunca acessa Games
-- diretamente em código de aplicação (Command handler reage a
-- ReleaseReadyForSubmission via Event Bus) — as FKs abaixo existem só para
-- integridade referencial no banco, não autorizam leitura direta cross-domain.

create table certificates (
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
  platform_id uuid not null references platforms(id),
  name text not null,
  expires_at timestamptz null
);

create table provision_profiles (
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
  platform_id uuid not null references platforms(id),
  certificate_id uuid not null references certificates(id),
  name text not null,
  expires_at timestamptz null
);

create table store_connections (
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
  platform_id uuid not null references platforms(id),
  status integration_status not null default 'DISCONNECTED',
  credentials_ref text null -- referência a Supabase Secrets; nunca a credencial em si
);

create table submissions (
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
  release_id uuid not null references releases(id),
  platform_id uuid not null references platforms(id),
  build_id uuid not null references builds(id),
  status submission_status not null default 'DRAFT'
);

create table store_reviews (
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
  submission_id uuid not null references submissions(id),
  reviewer_notes text null,
  decision submission_status null,
  reviewed_at timestamptz null
);

create index idx_certificates_studio_id on certificates(studio_id);
create index idx_provision_profiles_studio_id on provision_profiles(studio_id);
create index idx_store_connections_studio_id on store_connections(studio_id);
create index idx_submissions_studio_id on submissions(studio_id);
create index idx_submissions_studio_status on submissions(studio_id, status) where archived_at is null;
create index idx_submissions_release_id on submissions(release_id);
create index idx_store_reviews_submission_id on store_reviews(submission_id);

alter table certificates enable row level security;
alter table provision_profiles enable row level security;
alter table store_connections enable row level security;
alter table submissions enable row level security;
alter table store_reviews enable row level security;

create policy certificates_isolation on certificates
  using (studio_id = (select studio_id from users where id = auth.uid()));
create policy provision_profiles_isolation on provision_profiles
  using (studio_id = (select studio_id from users where id = auth.uid()));
create policy store_connections_isolation on store_connections
  using (studio_id = (select studio_id from users where id = auth.uid()));
create policy submissions_isolation on submissions
  using (studio_id = (select studio_id from users where id = auth.uid()));
create policy store_reviews_isolation on store_reviews
  using (studio_id = (select studio_id from users where id = auth.uid()));
