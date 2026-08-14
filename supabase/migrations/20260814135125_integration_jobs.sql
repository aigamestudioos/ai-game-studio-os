-- Sprint 2.11d — Provider Transfer Engine. GATE 2: reaproveita
-- `integration_jobs` como o próprio AGSOS-SPEC-008 §9 já documentava
-- (fila persistida, nunca implementada até agora) — nenhuma tabela nova
-- `provider_upload_jobs` foi criada. Separação conceitual mantida:
-- `provider_uploads` = fato de domínio ("este artifact foi enviado a este
-- provider, com este resultado"); `integration_jobs` = mecanismo
-- operacional de execução/retry (claim, lease, checkpoint, tentativas).
--
-- O shape original do SPEC (`id, integration_name, operation, payload,
-- status, retry_count, scheduled_at, correlation_id`) foi estendido com os
-- campos que um claim atômico + lease + checkpoint exigem — nunca
-- documentados no SPEC original porque a fila nunca tinha sido
-- implementada de verdade. Nenhum campo do shape original foi removido.
create type job_status as enum ('QUEUED', 'CLAIMED', 'RUNNING', 'RETRY_WAIT', 'SUCCEEDED', 'FAILED', 'DEAD');
create type job_error_class as enum ('RETRYABLE', 'NON_RETRYABLE', 'AUTH', 'RATE_LIMIT', 'PROVIDER_REJECTED', 'INTERNAL');

create table integration_jobs (
  id                    uuid primary key default gen_random_uuid(),
  studio_id             uuid not null references studios(id),
  provider_upload_id    uuid not null references provider_uploads(id),
  integration_name      text not null,
  operation             text not null,
  status                job_status not null default 'QUEUED',
  attempt               integer not null default 1,
  max_attempts          integer not null default 5,
  claimed_by            text null,
  claimed_at            timestamptz null,
  lease_expires_at      timestamptz null,
  scheduled_at          timestamptz not null default now(),
  last_error_code       text null,
  last_error_class      job_error_class null,
  -- Checkpoint operacional (progresso de retomada) — NUNCA segredos.
  -- Google: {"bytesUploaded": N} (a session URI em si é referência ao
  -- Vault, nunca plaintext aqui — ver `provider_uploads.
  -- google_resumable_session_ref`). Apple: {"completedOperationIndexes":
  -- [0,1], "buildUploadId": "...", "buildUploadFileId": "..."} — os IDs
  -- da Apple são estáveis e não-sensíveis (não são credencial nem
  -- capability), diferente da session URI do Google.
  checkpoint            jsonb not null default '{}'::jsonb,
  correlation_id        uuid not null default gen_random_uuid(),
  archived_at           timestamptz null,
  archived_actor_type   actor_type null,
  archived_actor_id     uuid null,
  created_at            timestamptz not null default now(),
  created_actor_type    actor_type not null,
  created_actor_id      uuid null,
  updated_at            timestamptz not null default now(),
  updated_actor_type    actor_type not null,
  updated_actor_id      uuid null
);

-- Índice obrigatório (já previsto em AGSOS-SPEC-008 §9): claim atômico
-- sempre filtra por status+scheduled_at.
create index idx_integration_jobs_claim on integration_jobs(status, scheduled_at);
create index idx_integration_jobs_provider_upload on integration_jobs(provider_upload_id);
create index idx_integration_jobs_studio on integration_jobs(studio_id);

alter table integration_jobs enable row level security;

-- SELECT aberto ao Studio (observabilidade — "em que estado está o job?"),
-- mesmo padrão de `provider_uploads`. Nenhum INSERT/UPDATE/DELETE via
-- `authenticated` — só o RPC `enqueue_provider_upload_job` (que já runs
-- SECURITY DEFINER com suas próprias checagens) e o worker (`service_role`,
-- bypassa RLS) escrevem nesta tabela.
create policy integration_jobs_select on integration_jobs
  for select
  using (studio_id = public.current_user_studio_id());

-- GATE 3 — ProviderUpload ganha QUEUED/PROCESSING (Job e ProviderUpload
-- NÃO compartilham os mesmos estados, decisão do sprint). `ALTER TYPE ...
-- ADD VALUE` não pode rodar dentro do mesmo bloco de transação que já usa
-- o tipo — migrations do Supabase CLI rodam cada arquivo em sua própria
-- transação, então isso é seguro como statement isolado no início deste
-- arquivo.
alter type provider_upload_status add value if not exists 'QUEUED';
alter type provider_upload_status add value if not exists 'PROCESSING';

-- Campos novos de observabilidade/idempotência em provider_uploads —
-- fatos de domínio (não mecanismo de job): quantos bytes concluídos,
-- quando o próximo retry automático deve acontecer (visível à UI sem
-- join em integration_jobs), e a referência (nunca plaintext) da sessão
-- resumível do Google no Vault.
alter table provider_uploads
  add column bytes_transferred bigint null,
  add column total_bytes bigint null,
  add column next_retry_at timestamptz null,
  add column google_resumable_session_ref text null;
