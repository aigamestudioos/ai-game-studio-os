-- Studio (raiz) + Administration/Auth (DATA_MODEL.md §4.1-4.2).
-- Correção registrada em DATA_MODEL.md §1: sem organizations/memberships —
-- UL-001 define Studio -> User direto, sem camada de membership.

create table environments (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid, -- referenciado por studios.active_environment_id; sem NOT NULL aqui (definido depois)
  type environment_type not null,
  name text not null,
  created_at timestamptz not null default now(),
  created_actor_type actor_type not null,
  created_actor_id uuid null,
  updated_at timestamptz not null default now(),
  updated_actor_type actor_type not null,
  updated_actor_id uuid null,
  archived_at timestamptz null,
  archived_actor_type actor_type null,
  archived_actor_id uuid null
);

create table studios (
  id uuid primary key default gen_random_uuid(),
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
  logo_url text null,
  color_palette jsonb null,
  timezone text not null default 'UTC',
  currency text not null default 'USD',
  locale text not null default 'pt-BR',
  active_environment_id uuid null references environments(id),
  owner_user_id uuid not null -- FK para users(id) adicionada depois de users existir (ver abaixo)
);

-- profiles de usuário — users.id É o mesmo UUID de auth.users (padrão Supabase
-- de tabela de perfil 1:1), populada via trigger on_auth_user_created (ver
-- migration de triggers, ainda não escrita — depende de projeto real linkado).
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  studio_id uuid not null references studios(id) deferrable initially deferred,
  email text not null unique,
  name text not null,
  avatar_url text null,
  created_at timestamptz not null default now(),
  created_actor_type actor_type not null,
  created_actor_id uuid null,
  updated_at timestamptz not null default now(),
  updated_actor_type actor_type not null,
  updated_actor_id uuid null,
  archived_at timestamptz null,
  archived_actor_type actor_type null,
  archived_actor_id uuid null
);

alter table studios
  add constraint fk_studios_owner_user_id
  foreign key (owner_user_id) references users(id) deferrable initially deferred;

alter table environments
  add constraint fk_environments_studio_id
  foreign key (studio_id) references studios(id);

-- permissions: catálogo fixo de capacidades do sistema, não varia por Studio
-- (ver DATA_MODEL.md §4.2 "ponto em aberto" — decidido aqui como global).
create table permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text null,
  created_at timestamptz not null default now()
);

-- roles: varia por Studio (cada Studio pode nomear suas próprias Roles).
create table roles (
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
  description text null
);

create table role_permissions (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id),
  role_id uuid not null references roles(id),
  permission_id uuid not null references permissions(id),
  created_at timestamptz not null default now(),
  unique (role_id, permission_id)
);

create table user_roles (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id),
  user_id uuid not null references users(id),
  role_id uuid not null references roles(id),
  created_at timestamptz not null default now(),
  unique (user_id, role_id)
);

create index idx_users_studio_id on users(studio_id);
create index idx_roles_studio_id on roles(studio_id);
create index idx_role_permissions_studio_id on role_permissions(studio_id);
create index idx_user_roles_studio_id on user_roles(studio_id);
create index idx_environments_studio_id on environments(studio_id);

-- RLS
alter table studios enable row level security;
alter table users enable row level security;
alter table roles enable row level security;
alter table permissions enable row level security;
alter table role_permissions enable row level security;
alter table user_roles enable row level security;
alter table environments enable row level security;

-- studios: usuário só vê o Studio ao qual pertence (não filtra por studio_id
-- porque é a própria raiz).
create policy studios_isolation on studios
  using (id = (select studio_id from users where id = auth.uid()));

create policy users_isolation on users
  using (studio_id = (select studio_id from users where id = auth.uid()));

create policy roles_isolation on roles
  using (studio_id = (select studio_id from users where id = auth.uid()));

create policy role_permissions_isolation on role_permissions
  using (studio_id = (select studio_id from users where id = auth.uid()));

create policy user_roles_isolation on user_roles
  using (studio_id = (select studio_id from users where id = auth.uid()));

create policy environments_isolation on environments
  using (studio_id = (select studio_id from users where id = auth.uid()));

-- permissions: catálogo global, leitura pública autenticada.
create policy permissions_read on permissions for select to authenticated using (true);
