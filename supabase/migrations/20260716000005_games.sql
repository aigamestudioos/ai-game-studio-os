-- Domínio Games (DATA_MODEL.md §4.4).

create table games (
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
  name text not null,
  description text null,
  status game_status not null default 'DRAFT',
  bundle_identifier text null,
  package_name text null
);

create table game_versions (
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
  game_id uuid not null references games(id),
  version_number text not null,
  status version_status not null default 'DRAFT'
);

create table builds (
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
  game_version_id uuid not null references game_versions(id),
  platform_id uuid not null references platforms(id),
  status build_status not null default 'PENDING',
  artifact_url text null,
  logs_url text null
);

create table releases (
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
  game_id uuid not null references games(id),
  game_version_id uuid not null references game_versions(id),
  status release_status not null default 'DRAFT'
);

-- Já especificada literalmente em AGSOS-SPEC-003 §12.
create table game_localizations (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id),
  game_id uuid not null references games(id),
  language_code text not null,
  title text not null,
  short_description text null,
  full_description text null,
  keywords text null,
  metadata jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id, language_code)
);

create index idx_games_studio_id on games(studio_id);
create index idx_games_studio_status on games(studio_id, status) where archived_at is null;
create index idx_games_project_id on games(project_id);
create index idx_game_versions_game_id on game_versions(game_id);
create index idx_builds_game_version_id on builds(game_version_id);
create index idx_builds_platform_id on builds(platform_id);
create index idx_releases_game_id on releases(game_id);
create index idx_releases_game_version_id on releases(game_version_id);
create index idx_game_localizations_game_id on game_localizations(game_id);

alter table games enable row level security;
alter table game_versions enable row level security;
alter table builds enable row level security;
alter table releases enable row level security;
alter table game_localizations enable row level security;

create policy games_isolation on games
  using (studio_id = (select studio_id from users where id = auth.uid()));
create policy game_versions_isolation on game_versions
  using (studio_id = (select studio_id from users where id = auth.uid()));
create policy builds_isolation on builds
  using (studio_id = (select studio_id from users where id = auth.uid()));
create policy releases_isolation on releases
  using (studio_id = (select studio_id from users where id = auth.uid()));
create policy game_localizations_isolation on game_localizations
  using (studio_id = (select studio_id from users where id = auth.uid()));
