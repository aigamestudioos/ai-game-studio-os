-- Tabelas globais (AGSOS-SPEC-003 §10) — sem studio_id, somente leitura para
-- usuários comuns, populadas via seed versionado (ver supabase/seed/).

create table platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  kind text not null,
  created_at timestamptz not null default now()
);

create table countries (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table languages (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table currencies (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  symbol text not null,
  created_at timestamptz not null default now()
);

create table timezones (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table notification_channel_definitions (
  id uuid primary key default gen_random_uuid(),
  type notification_channel_type not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table build_targets (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references platforms(id),
  name text not null,
  created_at timestamptz not null default now()
);

create index idx_build_targets_platform_id on build_targets(platform_id);

-- Leitura pública autenticada; escrita restrita ao admin-client (sem RLS de
-- isolamento por studio_id — não se aplica a tabelas globais).
alter table platforms enable row level security;
alter table countries enable row level security;
alter table languages enable row level security;
alter table currencies enable row level security;
alter table timezones enable row level security;
alter table notification_channel_definitions enable row level security;
alter table build_targets enable row level security;

create policy platforms_read on platforms for select to authenticated using (true);
create policy countries_read on countries for select to authenticated using (true);
create policy languages_read on languages for select to authenticated using (true);
create policy currencies_read on currencies for select to authenticated using (true);
create policy timezones_read on timezones for select to authenticated using (true);
create policy notification_channel_definitions_read on notification_channel_definitions for select to authenticated using (true);
create policy build_targets_read on build_targets for select to authenticated using (true);
