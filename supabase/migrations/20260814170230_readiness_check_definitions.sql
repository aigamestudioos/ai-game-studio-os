-- Sprint 2.12a — GATE 3: catálogo formal de checks de Readiness.
--
-- Por que uma TABELA global (e não uma constante tipada em
-- packages/database): o avaliador de readiness é uma RPC Postgres
-- (`get_release_readiness`, migration seguinte) — a fonte da verdade
-- precisa estar ao lado de quem avalia, senão o SQL teria códigos
-- literais duplicando uma constante TS que ninguém consegue impor. É
-- exatamente o mesmo padrão já usado para `permissions` (Sprint 1.8d-4)
-- e `platforms` (Sprint 2.x): catálogo global, sem `studio_id`, semeado
-- por migration, legível por qualquer usuário autenticado. O TypeScript
-- consome o catálogo via a RPC (que já devolve severity/blocking em cada
-- check), não por uma cópia paralela.
create table if not exists public.readiness_check_definitions (
  code text primary key,
  category text not null check (
    category in ('ARTIFACT', 'PROVIDER_UPLOAD', 'STORE_CONNECTION', 'METADATA', 'VERSION', 'PLATFORM', 'SUBMISSION')
  ),
  description text not null,
  -- BLOCKER impede a submissão; WARNING é informativo e nunca bloqueia.
  severity text not null check (severity in ('BLOCKER', 'WARNING')),
  -- Redundante com severity por desenho: `blocking` é o que a RPC lê para
  -- decidir READY/NOT_READY. Manter os dois explícitos evita que uma
  -- futura severidade nova (ex: 'INFO') mude silenciosamente o gate.
  blocking boolean not null,
  -- Tabela/coluna de onde o veredito é derivado — documentação executável
  -- de "quem manda" em cada check (GATE 2: readiness é DERIVADA).
  source_of_truth text not null,
  -- null = vale para todas as plataformas; senão o `platforms.name` exato.
  platform_scope text,
  -- Honestidade do modelo (GATE 6): IMPLEMENTED = a RPC realmente avalia;
  -- NOT_YET_MODELED = o requisito de loja existe no mundo real mas não há
  -- schema para ele ainda, então a RPC devolve status NOT_APPLICABLE em
  -- vez de fabricar um PASS.
  implementation_status text not null default 'IMPLEMENTED'
    check (implementation_status in ('IMPLEMENTED', 'NOT_YET_MODELED')),
  created_at timestamptz not null default now()
);

alter table public.readiness_check_definitions enable row level security;

-- Catálogo global, igual a `platforms`: leitura para autenticados,
-- escrita só por migration/service_role. Nunca contém dados de Studio.
drop policy if exists readiness_check_definitions_read on public.readiness_check_definitions;
create policy readiness_check_definitions_read
  on public.readiness_check_definitions
  for select
  to authenticated
  using (true);

grant select on public.readiness_check_definitions to authenticated;

insert into public.readiness_check_definitions
  (code, category, description, severity, blocking, source_of_truth, platform_scope, implementation_status)
values
  -- SUBMISSION / VERSION / PLATFORM
  ('SUBMISSION_TARGETS_MISSING', 'SUBMISSION',
   'A Release não tem nenhuma Submission (nenhuma plataforma-alvo definida)', 'BLOCKER', true,
   'submissions.release_id', null, 'IMPLEMENTED'),
  ('RELEASE_STATUS_NOT_SUBMITTABLE', 'SUBMISSION',
   'A Release está num status que não admite nova submissão', 'BLOCKER', true,
   'releases.status', null, 'IMPLEMENTED'),
  ('SUBMISSION_ALREADY_SENT', 'SUBMISSION',
   'Esta Submission já saiu de DRAFT/WAITING — readiness é informativo a partir daqui', 'WARNING', false,
   'submissions.status', null, 'IMPLEMENTED'),
  ('BUILD_VERSION_MISMATCH', 'VERSION',
   'O Build da Submission pertence a outra Game Version que não a da Release', 'BLOCKER', true,
   'builds.game_version_id vs releases.game_version_id', null, 'IMPLEMENTED'),
  ('BUILD_NOT_SUCCEEDED', 'VERSION',
   'O Build da Submission não terminou com sucesso', 'BLOCKER', true,
   'builds.status', null, 'IMPLEMENTED'),
  ('BUILD_PLATFORM_MISMATCH', 'PLATFORM',
   'O Build foi gerado para outra plataforma que não a da Submission', 'BLOCKER', true,
   'builds.platform_id vs submissions.platform_id', null, 'IMPLEMENTED'),
  ('PLATFORM_NOT_SUPPORTED', 'PLATFORM',
   'A plataforma-alvo ainda não tem pipeline de publicação implementado', 'BLOCKER', true,
   'platforms.name', null, 'IMPLEMENTED'),

  -- ARTIFACT
  ('ARTIFACT_MISSING', 'ARTIFACT',
   'O Build não tem nenhum artefato enviado', 'BLOCKER', true,
   'build_artifacts.build_id', null, 'IMPLEMENTED'),
  ('ARTIFACT_NOT_STORED', 'ARTIFACT',
   'O artefato ainda não está armazenado (upload_status <> STORED)', 'BLOCKER', true,
   'build_artifacts.upload_status', null, 'IMPLEMENTED'),
  ('ARTIFACT_INVALID', 'ARTIFACT',
   'O artefato não passou na validação estrutural (validation_status <> VALID)', 'BLOCKER', true,
   'build_artifacts.validation_status', null, 'IMPLEMENTED'),
  ('ARTIFACT_WRONG_FORMAT', 'ARTIFACT',
   'O formato do artefato não corresponde à loja-alvo (.aab para Google Play, .ipa para App Store)', 'BLOCKER', true,
   'build_artifacts.file_extension vs platforms.name', null, 'IMPLEMENTED'),
  ('ARTIFACT_STUDIO_MISMATCH', 'ARTIFACT',
   'O artefato pertence a outro Studio que não o da Release', 'BLOCKER', true,
   'build_artifacts.studio_id vs releases.studio_id', null, 'IMPLEMENTED'),

  -- STORE_CONNECTION
  ('STORE_CONNECTION_MISSING', 'STORE_CONNECTION',
   'O Studio não tem Store Connection para esta loja', 'BLOCKER', true,
   'store_connections.platform_id', null, 'IMPLEMENTED'),
  ('STORE_CONNECTION_INVALID', 'STORE_CONNECTION',
   'A Store Connection existe mas não está CONNECTED', 'BLOCKER', true,
   'store_connections.status', null, 'IMPLEMENTED'),
  ('STORE_CONNECTION_CREDENTIALS_MISSING', 'STORE_CONNECTION',
   'A Store Connection não tem credenciais guardadas no Vault', 'BLOCKER', true,
   'store_connections.credentials_ref (presença apenas — o valor nunca é lido)', null, 'IMPLEMENTED'),

  -- PROVIDER_UPLOAD
  ('PROVIDER_UPLOAD_MISSING', 'PROVIDER_UPLOAD',
   'O artefato ainda não foi transferido para a loja', 'BLOCKER', true,
   'provider_uploads (build_artifact_id + store_connection_id)', null, 'IMPLEMENTED'),
  ('PROVIDER_UPLOAD_IN_PROGRESS', 'PROVIDER_UPLOAD',
   'A transferência para a loja ainda está em andamento', 'BLOCKER', true,
   'provider_uploads.status', null, 'IMPLEMENTED'),
  ('PROVIDER_UPLOAD_FAILED', 'PROVIDER_UPLOAD',
   'A última tentativa de transferência para a loja falhou e não há nenhuma bem-sucedida', 'BLOCKER', true,
   'provider_uploads.status/attempt', null, 'IMPLEMENTED'),
  ('GOOGLE_VERSION_CODE_MISSING', 'PROVIDER_UPLOAD',
   'O upload para o Google Play concluiu sem versionCode devolvido pela API', 'BLOCKER', true,
   'provider_uploads.version_code', 'Google Play', 'IMPLEMENTED'),
  ('APPLE_BUILD_UPLOAD_REF_MISSING', 'PROVIDER_UPLOAD',
   'O upload para a App Store concluiu sem referência de Build Upload da Apple', 'BLOCKER', true,
   'provider_uploads.apple_build_upload_id', 'App Store', 'IMPLEMENTED'),

  -- METADATA (o que já é modelado hoje)
  ('METADATA_PACKAGE_NAME_MISSING', 'METADATA',
   'O Game não tem Package Name definido (obrigatório no Google Play)', 'BLOCKER', true,
   'games.package_name', 'Google Play', 'IMPLEMENTED'),
  ('METADATA_BUNDLE_IDENTIFIER_MISSING', 'METADATA',
   'O Game não tem Bundle Identifier definido (obrigatório na App Store)', 'BLOCKER', true,
   'games.bundle_identifier', 'App Store', 'IMPLEMENTED'),
  ('METADATA_LISTING_MISSING', 'METADATA',
   'O Game não tem nenhuma ficha de loja (game_localizations) cadastrada', 'BLOCKER', true,
   'game_localizations.game_id', null, 'IMPLEMENTED'),
  ('METADATA_DESCRIPTION_MISSING', 'METADATA',
   'A ficha de loja não tem descrição completa preenchida', 'WARNING', false,
   'game_localizations.full_description', null, 'IMPLEMENTED'),
  ('METADATA_RELEASE_NOTES_MISSING', 'METADATA',
   'A Release não tem release notes', 'WARNING', false,
   'releases.release_notes', null, 'IMPLEMENTED'),

  -- METADATA ainda NÃO modelada (GATE 6). A RPC devolve estes checks com
  -- status NOT_APPLICABLE — nunca PASS — para que a UI (2.12b) mostre
  -- honestamente que o requisito de loja existe mas o sistema ainda não
  -- sabe verificá-lo. Não bloqueiam porque não há como o usuário
  -- satisfazê-los dentro do produto hoje.
  ('METADATA_SCREENSHOTS_MISSING', 'METADATA',
   'Screenshots de loja ainda não são modelados no schema', 'WARNING', false,
   '(sem tabela — pendente)', null, 'NOT_YET_MODELED'),
  ('METADATA_ICON_MISSING', 'METADATA',
   'Ícone de loja ainda não é modelado no schema', 'WARNING', false,
   '(sem tabela — pendente)', null, 'NOT_YET_MODELED'),
  ('METADATA_CONTENT_RATING_MISSING', 'METADATA',
   'Classificação indicativa ainda não é modelada no schema', 'WARNING', false,
   '(sem tabela — pendente)', null, 'NOT_YET_MODELED'),
  ('METADATA_PRIVACY_POLICY_MISSING', 'METADATA',
   'Política de privacidade ainda não é modelada no schema', 'WARNING', false,
   '(sem tabela — pendente)', null, 'NOT_YET_MODELED')
on conflict (code) do update set
  category = excluded.category,
  description = excluded.description,
  severity = excluded.severity,
  blocking = excluded.blocking,
  source_of_truth = excluded.source_of_truth,
  platform_scope = excluded.platform_scope,
  implementation_status = excluded.implementation_status;
