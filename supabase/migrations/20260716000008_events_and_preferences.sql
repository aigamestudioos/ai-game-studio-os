-- Event Store (AGSOS-SPEC-003 §5) — fonte única de histórico/auditoria.
-- Append-only: nenhum UPDATE/DELETE. Não criar audit_logs separado.

create table studio_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  event_version int not null,
  aggregate_type text not null,
  aggregate_id uuid not null,
  studio_id uuid not null references studios(id),
  payload jsonb not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  actor_type actor_type not null,
  actor_id uuid null
);

-- Índice composto essencial: studio_events cresce indefinidamente
-- (DATA_MODEL.md §8, risco documentado — sem partição ainda, avaliar quando
-- o volume justificar).
create index idx_studio_events_studio_occurred on studio_events(studio_id, occurred_at desc);
create index idx_studio_events_aggregate on studio_events(aggregate_type, aggregate_id);

alter table studio_events enable row level security;

create policy studio_events_isolation on studio_events
  using (studio_id = (select studio_id from users where id = auth.uid()));

create rule studio_events_no_update as on update to studio_events do instead nothing;
create rule studio_events_no_delete as on delete to studio_events do instead nothing;

-- Preferências de dashboard por usuário (AGSOS-SPEC-003 §11).
create table user_dashboard_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  studio_id uuid not null references studios(id),
  layout jsonb null,
  widgets jsonb null,
  collapsed_panels jsonb null,
  favorite_widgets jsonb null,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index idx_user_dashboard_preferences_user_id on user_dashboard_preferences(user_id);

alter table user_dashboard_preferences enable row level security;

create policy user_dashboard_preferences_isolation on user_dashboard_preferences
  using (studio_id = (select studio_id from users where id = auth.uid()));
