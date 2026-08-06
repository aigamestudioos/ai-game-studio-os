# CHANGELOG.md

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/), e este projeto segue versionamento a ser definido.

## [Unreleased]

### Added — Sprint 2.9 (Apple App Store Connect — integração real)
- `packages/integrations/src/apple/{types,jwt,client,errors,adapter}.ts` — `ApplePublishingAdapter` completo (connect/disconnect/health/listApps/getApp), JWT ES256 via `node:crypto`.
- `supabase/migrations/20260807000001_store_connection_secret_read.sql` — `get_store_connection_secret()` (GRANT só `service_role`), `clear_store_connection_secret()` ("Disconnect").
- `apps/web/app/settings/store-connections/{page,actions}.tsx`, `hooks/use-store-connections.ts`, `lib/store-connection-status.ts`.

### Changed — Sprint 2.9
- `packages/database/src/repositories/store-connections-repository.ts` — `getSecret()`, `clearSecret()`, `markValidationResult()` com `discoveredApps`.
- `apps/web/lib/domain-events.ts` — eventos de Store Connection ganham os 2 payloads que faltavam e o primeiro call site real.
- `apps/web/app/settings/studio/page.tsx` — link para a nova tela.
- `supabase/seed.sql`/`supabase/seed/02_demo_studio.sql` — corrigido bug real (Studio seedado sem nenhuma permission, ver DECISIONS.md).

### Added — Sprint 2.8 (Store Connections: schema + RLS + Vault, sem UI)
- `supabase/migrations/20260806000001_store_connections_vault.sql` — colunas novas em `store_connections` (`display_name`/`last_validation_at`/`last_error`/`metadata`); `create extension supabase_vault`; função `set_store_connection_secret()` (SECURITY DEFINER); trigger `store_connections_delete_secret`; permissão `studio.manage_store_connections` + RLS dividida (`_select`/`_insert`/`_update`/`_delete`).
- `packages/database/src/repositories/store-connections-repository.ts` — `listByStudio()`, `getById()`, `create()`, `update()`, `setSecret()`, `markValidationResult()`, `delete()`.
- `apps/web/lib/domain-events.ts` — payloads tipados de `StoreConnectionCreated`/`Updated`/`Validated`/`Deleted` (sem call site ainda — Sprint 2.9/2.10).

### Fixed — Sprint 2.8
- `vault.delete_secret(uuid)` não existe na versão instalada de `supabase_vault` (0.3.1) — corrigido para `delete from vault.secrets` direto na trigger, antes de qualquer commit.

### Added — Sprint 2.7 (Gerenciar membros existentes)
- `supabase/migrations/20260805000001_member_management_permissions.sql` — fecha um gap de RLS pré-existente em `users`/`user_roles` (sem gate de permissão desde o Sprint 1.7) e adiciona os gates `studio.manage_members` necessários para trocar papel/remover membro.
- `packages/database/src/repositories/roles-repository.ts` — `listByStudio()`, `changeMemberRole()`.

### Changed — Sprint 2.7
- `packages/database/src/repositories/users-repository.ts` — `archive()` (soft-delete); `listByStudioWithRoles()` filtra arquivados.
- `apps/web/hooks/use-current-studio.ts` — `roles`, `changeMemberRole()`, `removeMember()`.
- `apps/web/components/settings/studio-members-section.tsx` — papel vira `DropdownMenu` editável; botão "Remover" por membro (exceto Owner/si mesmo).

### Added — Sprint 2.6 (Eventos tipados + widgets reais de Dashboard)
- `apps/web/lib/domain-events.ts` — union discriminada `ReleasePipelineEvent` + helper `releasePipelineEvent()`.
- `apps/web/hooks/use-release-pipeline-widgets.ts`, `apps/web/components/dashboard/pipeline-widgets.tsx` — Latest Builds/Failed Builds/Pending Releases.
- `packages/database/src/repositories/builds-repository.ts` — `listRecentByStudio()`; `releases-repository.ts` — `listPendingByStudio()`.

### Changed — Sprint 2.6
- `apps/web/app/dashboard/page.tsx` — seção "Release Pipeline" com os 3 widgets reais.
- `apps/web/hooks/use-game-version.ts`, `use-game-versions.ts`, `use-publishable-releases.ts` — eventos emitidos via `releasePipelineEvent()`, não mais `event_name`/`payload` soltos.

### Added — Sprint 2.5.1 (Production Readiness)
- `DEPLOY_RUNBOOK.md` — processo operacional de deploy de schema (checklist, como aplicar migrations em produção, decisão de manter manual+scriptado em vez de CI).
- `scripts/check-schema-sync.sh` (+ `pnpm check:schema`) — compara migrations locais × aplicadas em produção, falha explicitamente se houver divergência ou credencial ausente.

### Changed — Sprint 2.5.1
- `DEFINITION_OF_DONE.md` — nova seção 10, "Gate de Schema/Migrations": sprint com migration nova só é "Concluído" com os 4 itens do checklist confirmados.
- `CLAUDE.md` — pointer para o runbook/gate.

### Added — Sprint 2.5 (Release Pipeline: UX de criação + hardening da simulação de Build)
- `apps/web/hooks/use-game-versions.ts`, `use-game-version.ts`, `use-publishable-releases.ts`.
- `apps/web/app/games/[id]/versions/[versionId]/page.tsx` — Version detail: Builds (criação + progresso simulado), Releases (criação), Timeline (`studio_events`).
- `apps/web/lib/version-status.ts`, `release-status.ts`, `build-simulation.ts` (parâmetros centralizados da simulação de Build e `isBuildStuck()`).
- `packages/database/src/repositories/platforms-repository.ts`, `studio-events-repository.ts`.
- Ação **Retry Build** para Builds mockadas travadas em `RUNNING` (detecção via `isBuildStuck()`, limite `BUILD_SIMULATION_STUCK_THRESHOLD_MS = 20s`), com eventos `BuildFailed` + `BuildRetried`.
- Aviso permanente na tela de Version: a simulação de Build é client-side, sem CI/CD real.

### Changed — Sprint 2.5
- `apps/web/app/games/[id]/page.tsx` — seção "Versions" com criação.
- `apps/web/app/publishing/page.tsx` — "New Submission" desbloqueado (seleciona Release real + Build/Platform disponíveis).
- `packages/database/src/repositories/builds-repository.ts` — `update()`; `releases-repository.ts` — `list()`.
- `apps/web/lib/build-status.ts` — `buildTypeLabel()`.

### Added — Sprint 2.4 (Release Pipeline: schema + repositories, sem UI)
- `supabase/migrations/20260804000001_release_pipeline_extensions.sql` — ENUMs `build_type`/`release_channel` + colunas aditivas em `game_versions`/`builds`/`releases`.
- `packages/database/src/repositories/game-versions-repository.ts`, `releases-repository.ts`.

### Changed — Sprint 2.4
- `packages/database/src/repositories/builds-repository.ts` — `listByVersion()`, `getById()`, `create()`.
- `packages/database/src/generated/database.types.ts` — tipos `BuildType`/`ReleaseChannel` e colunas novas (hand-maintained, ver comentário no arquivo).

### Added — Sprint 2.3 (Publishing real, somente leitura)
- `apps/web/hooks/use-submissions.ts`, `use-submission.ts`.
- `apps/web/lib/submission-status.ts`.

### Changed — Sprint 2.3
- `packages/database/src/repositories/submissions-repository.ts` — `listWithDetails()`, `getWithDetails()`, `listReviews()`.
- `apps/web/app/publishing/page.tsx` / `app/publishing/[id]/page.tsx` — dados reais; criação desabilitada (sem Release ainda nesse sprint).
- `apps/web/components/publishing/cards.tsx` — enum `submission_status` real.

### Removed — Sprint 2.3
- `apps/web/lib/publishing-store.ts` — mock eliminado.

### Added — Sprint 2.2 (Knowledge real)
- `apps/web/hooks/use-knowledge-documents.ts`, `use-knowledge-document.ts`.
- `apps/web/lib/knowledge-status.ts`, `knowledge-type.ts`.
- `packages/database/src/repositories/knowledge-documents-repository.ts` — `listWithLatestSummary()`, `getLatestVersion()`.

### Fixed — Sprint 2.2
- `knowledge-documents-repository.ts`'s `createVersion()` omitia `created_actor_type`/`created_actor_id` (NOT NULL na tabela) — corrigido antes de qualquer teste real.

### Changed — Sprint 2.2
- `apps/web/app/knowledge/page.tsx` / `app/knowledge/[id]/page.tsx` — dados reais; criar documento cria a versão 1 junto.
- `apps/web/components/knowledge/cards.tsx` — status/tipo soltos (`string`).

### Removed — Sprint 2.2
- `apps/web/lib/knowledge-store.ts` — mock eliminado.

### Added — Sprint 2.1 (Games real)
- `packages/database/src/repositories/builds-repository.ts` — `listByGame()`.
- `apps/web/hooks/use-games.ts`, `apps/web/hooks/use-game.ts`.
- `apps/web/lib/game-status.ts`, `apps/web/lib/build-status.ts`.

### Changed — Sprint 2.1
- `apps/web/app/games/page.tsx` / `app/games/[id]/page.tsx` — dados reais; seletor de Project obrigatório na criação (Game exige `project_id`).
- `apps/web/components/games/cards.tsx` — status solto (`string`), `platforms` opcional (derivado de builds).

### Removed — Sprint 2.1
- `apps/web/lib/games-store.ts` — mock eliminado.

### Added — Sprint 2.0 (Projects real)
- `packages/database/src/repositories/epics-repository.ts` — `listByProject()`.
- `apps/web/hooks/use-projects.ts`, `apps/web/hooks/use-project.ts`.
- `apps/web/lib/project-status.ts` — mapeia `project_status` (enum do banco) para rótulos em português.

### Changed — Sprint 2.0
- `apps/web/app/projects/page.tsx` / `app/projects/[id]/page.tsx` — dados reais via `packages/database`, com estados de loading/vazio/erro.
- `apps/web/components/dashboard/cards.tsx` — `ProjectStatus` relaxado para `string` (fallback de variant), sem quebrar Dashboard/Playground.

### Removed — Sprint 2.0
- `apps/web/lib/projects-store.ts` — mock (`localStorage`) eliminado.

### Added — Sprint 1.8d-4 (Papéis e permissões reais)
- `supabase/migrations/20260729000001_roles_and_permissions.sql` — catálogo `permissions`, `current_user_has_permission()`, RLS de `invites`/`studios` reforçada por permissão, 3 papéis (Owner/Admin/Member) com grants corretos criados junto com o Studio.
- `packages/database/src/repositories/users-repository.ts` — `listByStudioWithRoles()`.

### Changed — Sprint 1.8d-4
- `apps/web/app/settings/studio/actions.ts` — `inviteMember()` recebe o papel (Admin/Member).
- `apps/web/hooks/use-current-studio.ts` — `updateStudio`/`revokeInvite` retornam `{ error? }` em vez de lançar.
- `apps/web/components/settings/studio-members-section.tsx` — seletor de papel no convite, badge de papel real por membro.

### Fixed — Sprint 1.8d-4
- `revokeInvite`/`updateStudio` sem tratamento de erro podiam gerar unhandled promise rejection quando RLS bloqueava a ação (usuário sem permissão) — agora retornam erro amigável.

### Added — Sprint 1.8d-3 (Convites)
- `supabase/migrations/20260728000001_invites.sql` — tabela `invites` + `bootstrap_studio_for_current_user` estendido para reconhecer convite pendente.
- `apps/web/app/settings/studio/actions.ts` — Server Action `inviteMember()` (usa `admin.auth.admin.inviteUserByEmail`).
- `packages/database/src/repositories/invites-repository.ts`.

### Changed — Sprint 1.8d-3
- `apps/web/hooks/use-current-studio.ts` — `pendingInvites`, `revokeInvite`.
- `apps/web/components/settings/studio-members-section.tsx` — formulário de convite, lista de pendentes, badge Owner/Member.

### Fixed — Sprint 1.8d-3
- Detecção de erro de convite duplicado agora usa `error.code` (SQLSTATE), não substring de `.message`.
- Rate-limit de envio de email do Supabase (`over_email_send_rate_limit`) não é mais mascarado como sucesso — mensagem amigável + convite revogado (nenhuma conta foi criada).

### Added — Sprint 1.8d-2 (Studio Settings)
- `apps/web/app/settings/studio/page.tsx` — nome/logo do Studio + lista de membros.
- `apps/web/components/settings/{studio-info,studio-members}-section.tsx`.
- `apps/web/hooks/use-current-studio.ts`.
- `packages/database/src/repositories/users-repository.ts` — `getById()`, `listByStudio()`.
- `apps/web/lib/supabase-client.ts` — singleton do browser client (extraído de `use-auth.ts`).

### Changed — Sprint 1.8d-2
- `packages/database/src/repositories/studios-repository.ts` — `update()`.
- `apps/web/components/layout/sidebar.tsx` — "Studio"/"Settings" agora navegam (eram placeholders sem `href`).

### Added — Sprint 1.8d-1 (Studio Bootstrap)
- `supabase/migrations/20260717000001_bootstrap_studio.sql` — `bootstrap_studio_for_current_user()`, cria Studio + profile + Role Owner no primeiro login.
- `apps/web/hooks/use-ensure-studio.ts` — dispara o bootstrap uma vez por sessão a partir do `AppShell`.

### Fixed — Sprint 1.8d-1 (bugs pré-existentes do Sprint 1.7, nunca detectados)
- `supabase/migrations/20260717000002_fix_rls_recursion.sql` — corrige recursão infinita em 27 políticas de RLS (`current_user_studio_id()`).
- `supabase/migrations/20260717000003_grant_authenticated_privileges.sql` — concede GRANTs de tabela ausentes ao role `authenticated`.

### Changed — Sprint 1.8d-1
- `packages/database/src/repositories/studios-repository.ts` — `bootstrapForCurrentUser()`.
- `apps/web/hooks/use-auth.ts` — `ensureStudio()`.
- `apps/web/components/layout/app-shell.tsx` — dispara o bootstrap; não bloqueia a UI se falhar.

### Added — Sprint 1.8c (User Workspace)
- `apps/web/app/settings/account/page.tsx` — Perfil, Preferências, Segurança e Zona de risco em uma página.
- `apps/web/components/settings/{profile,preferences,security,danger-zone}-section.tsx`.

### Changed — Sprint 1.8c (User Workspace)
- `apps/web/hooks/use-auth.ts` — `updateProfile(fields)` (grava em `user_metadata`), `signOutEverywhere()`.
- `apps/web/providers/theme-provider.tsx` — tema lido de/persistido em `user_metadata.theme` para usuários autenticados.
- `apps/web/components/layout/user-menu.tsx` — "Perfil"/"Configurações" consolidados em "Configurações da conta", agora navegável.

### Added — Sprint 1.8b (Password Recovery)
- `apps/web/app/forgot-password/page.tsx` — formulário de email, mensagem de sucesso genérica (anti-enumeração de usuários).
- `apps/web/app/reset-password/page.tsx` — trata `?code=` (PKCE) e `#access_token=` (implicit grant); formulário de nova senha com medidor de força, validação de confirmação, toast de sucesso.
- `apps/web/lib/password-strength.ts` — `evaluatePasswordStrength()`.
- `apps/web/hooks/use-auth.ts` — `requestPasswordReset()`, `exchangeRecoveryCode()`, `establishSessionFromHash()`, `updatePassword()`.

### Added — Sprint 1.8a (Núcleo de Auth real)
- `apps/web/middleware.ts` — proteção de rotas por allowlist (`/`, `/login`, `/forgot-password`, `/reset-password` públicas; todo o resto protegido), usando `packages/database` (`createServerClient`) e `supabase.auth.getUser()` (valida o token no servidor, não só lê o cookie).
- `packages/database/src/index.ts` — re-exporta `Session`/`User`/`AuthError` de `@supabase/supabase-js` (único ponto de acesso a esses tipos; `apps/web` não importa `@supabase/supabase-js` diretamente).

### Changed — Sprint 1.8a (Núcleo de Auth real)
- `apps/web/hooks/use-auth.ts` — reescrito: login/logout reais via Supabase Auth (`signInWithPassword`/`signOut`), sessão restaurada com `getSession()` e mantida sincronizada via `onAuthStateChange` (cobre refresh automático de token e expiração). Client singleton no módulo para evitar múltiplas instâncias de `GoTrueClient`. Inclui `mapAuthError()` — traduz erros do Supabase para mensagens amigáveis em português.
- `apps/web/app/login/page.tsx` — login real com estados de loading/erro, redireciona para `?redirect=` (setado pelo middleware) ou `/dashboard`, link "Esqueceu a senha?" (página ainda não existe — 1.8b).
- `apps/web/components/layout/app-shell.tsx` — gate de sessão real (mantém a responsabilidade centralizada; nenhuma página individual verifica auth).
- `apps/web/components/layout/user-menu.tsx` — nome/email/avatar vêm do `user_metadata`/`email` da sessão real do Supabase; logout com estado de loading.
- `apps/web/package.json` — adicionada dependência `@agsos/database` (workspace).

### Removed — Sprint 1.8a (Núcleo de Auth real)
- `apps/web/lib/auth-store.ts` — mock de auth (`localStorage`) eliminado por completo.

### Added — Ambiente de integração Supabase
- `apps/web/.env.example` — todas as variáveis necessárias, documentadas, sem valores.
- `apps/web/.env.local` — credenciais reais do projeto Supabase `dev` (URL + publishable key); `SUPABASE_SECRET_KEY` deixada vazia, sinalizada para preenchimento manual. Não versionado (protegido por `.gitignore` da raiz).
- `apps/web/lib/env.ts` — módulo centralizado e tipado de acesso a variáveis de ambiente; falha cedo com mensagem clara se uma variável obrigatória faltar, em vez de `undefined` silencioso.

### Changed — Ambiente de integração Supabase
- `packages/database/src/{browser,server,admin}-client.ts` — migrados de `NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` (nomenclatura antiga do Supabase) para `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`/`SUPABASE_SECRET_KEY` (nomenclatura atual), para bater com as credenciais reais do projeto criado.
- `SUPABASE_SECRET_KEY` padronizada como nomenclatura oficial do projeto (auditoria confirmou zero referências restantes a `SUPABASE_SERVICE_ROLE_KEY`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` em código-fonte — ver `DECISIONS.md`).

### Added — Sprint 1.7 (Foundation for Supabase)
- `packages/database/src/{browser,server,admin}-client.ts` — os três clientes de `ADR-003`.
- `packages/database/src/generated/database.types.ts` — hand-written (pendente `supabase gen types` real).
- `packages/database/src/repositories/{studios,projects,games,knowledge-documents,submissions}-repository.ts`.
- `supabase/migrations/` — 9 migrations (ENUMs, tabelas globais, Studio/Administration, Projects, Games, Publishing, Knowledge, Event Store/preferências, trigger de auth).
- `supabase/seed/` + `supabase/seed.sql` — dados de desenvolvimento espelhando os stores mock.
- `DATA_MODEL.md` (na verdade do Sprint anterior, mas é a base direta desta implementação).
- `packages/database/README.md` — documentação da estrutura e pendências.

### Fixed — Sprint 1.7
- Seed de `store_reviews` sem `updated_actor_type` (NOT NULL) — só detectado ao validar contra Postgres real via Docker, não por revisão visual do SQL.
- `database.types.ts` inicial não seguia o formato `GenericSchema` exigido pelo `supabase-js` (faltava `Relationships`/`Views`/`Functions`/`Enums`/`CompositeTypes`), causando `never` nos métodos `.insert()`/`.update()` dos repositories.

### Added — Sprint 1.6 (Auth mock)
- `apps/web/lib/auth-store.ts` — store mock (localStorage + pub/sub): `login(email, password)`, `logout()`, `getSession()`, `subscribe()`.
- `apps/web/hooks/use-auth.ts` — hook `useAuth()` reativo à sessão.
- `apps/web/app/login/page.tsx` — formulário de login (email + senha, mock).
- `apps/web/components/layout/app-shell.tsx` — agora redireciona para `/login` quando não há sessão (protege as 9 páginas de produto de uma vez).
- `apps/web/components/layout/user-menu.tsx` — mostra nome/email reais da sessão; "Sair" agora desloga de verdade.
- `apps/web/components/landing/header.tsx` — botão "Login" aponta para `/login`.

### Added — Sprint 1.5 (Publishing)
- `apps/web/lib/publishing-store.ts` — store mock cliente (localStorage), mesmo padrão dos módulos anteriores: `useSubmissions`/`useSubmission`/`addSubmission`/`getSubmission`, seed com submissões de Nebula Drift/Sprint Runner/Hyper Dash (loja, versão, status, histórico de eventos).
- `apps/web/components/publishing/cards.tsx` — `SubmissionCard` (status Em análise/Aprovado/Rejeitado/Publicado + loja/versão).
- `apps/web/app/publishing/page.tsx` — lista de submissões + diálogo "New Submission" (jogo, versão, seleção de loja — App Store/Google Play/Steam — via badges alternáveis).
- `apps/web/app/publishing/[id]/page.tsx` — página de detalhes com histórico de status (timeline com ícone por evento); `notFound()` para ids inexistentes.

### Changed — Sprint 1.5
- `apps/web/components/layout/sidebar.tsx` — item "Publishing" ganhou `href="/publishing"`.
- `apps/web/app/dashboard/page.tsx` — Quick Action "Publish" agora navega para `/publishing`.

### Added — Sprint 1.4 (Knowledge)
- `apps/web/lib/knowledge-store.ts` — store mock cliente (localStorage), mesmo padrão de `projects-store.ts`/`games-store.ts`: `useDocuments`/`useDocument`/`addDocument`/`getDocument`, seed com Onboarding Playbook/Code Review SOP/Convenções de Nomenclatura (título, resumo, tipo, status, conteúdo).
- `apps/web/components/knowledge/cards.tsx` — `DocumentCard` (status Rascunho/Publicado + tipo como badge outline).
- `apps/web/app/knowledge/page.tsx` — lista de documentos + diálogo "New Document" (título, resumo, seleção de tipo — Documento/Template/Playbook/SOP/ADR/SPEC — via badges alternáveis, seleção única).
- `apps/web/app/knowledge/[id]/page.tsx` — página de detalhes do documento (título, status, tipo, resumo, conteúdo); `notFound()` para ids inexistentes.

### Changed — Sprint 1.4
- `apps/web/components/layout/sidebar.tsx` — item "Knowledge" ganhou `href="/knowledge"`.
- `apps/web/app/dashboard/page.tsx` — Quick Action "Knowledge" agora navega para `/knowledge`.

### Added — Sprint 1.3 (Games — Game Workspace)
- `apps/web/lib/games-store.ts` — store mock cliente (localStorage), mesmo padrão de `projects-store.ts`: `useGames`/`useGame`/`addGame`/`getGame`, seed com Nebula Drift/Sprint Runner/Hyper Dash (status, plataformas, builds).
- `apps/web/components/games/cards.tsx` — `GameCard` (status + plataformas como badges), paralelo ao `ProjectCard` mas com campos próprios de Games.
- `apps/web/app/games/page.tsx` — lista de jogos + diálogo "Create Game" (nome, descrição, seleção de plataformas via badges alternáveis).
- `apps/web/app/games/[id]/page.tsx` — workspace do jogo: status, plataformas, lista de builds com ícone de status (Pronta/Em build/Falhou); `notFound()` para ids inexistentes.

### Changed — Sprint 1.3
- `apps/web/components/layout/sidebar.tsx` — item "Games" ganhou `href="/games"`.
- `apps/web/app/dashboard/page.tsx` — Quick Action "Create Game" agora navega para `/games`.

### Added — Sprint 1.2 (Projects — primeiro fluxo de negócio)
- `apps/web/lib/projects-store.ts` — store mock cliente (localStorage) com `useProjects`/`useProject`/`addProject`/`getProject`, seed com Project Alpha/Beta/Gamma (mesmos dados do Dashboard, agora com `id` e `epics`). Substituído por Supabase no Incremento 1.7.
- `apps/web/app/projects/page.tsx` — lista de projetos (grid de `ProjectCard` já existente) + diálogo "New Project" (`Dialog` + `Input` + `Textarea`) que cria um projeto e navega/permanece na lista com toast de confirmação.
- `apps/web/app/projects/[id]/page.tsx` — página de detalhes do projeto (status, descrição, lista de epics com checklist visual, progresso); `notFound()` para ids inexistentes.

### Changed — Sprint 1.2
- `apps/web/components/layout/sidebar.tsx` — item "Projects" ganhou `href="/projects"` (antes sem link).
- `apps/web/app/dashboard/page.tsx` — "New Project" (Quick Action e botão da seção Recent Projects) e os cards de Recent Projects agora navegam para `/projects`.

### Added — Sprint 1.1 (Dashboard Premium / Application Foundation)
- `apps/web/components/layout/app-shell.tsx` — Application Shell reutilizável (Header + Sidebar + Content), base para todos os módulos futuros.
- `apps/web/components/layout/{search-bar,user-menu}.tsx` — busca global (placeholder) e menu do usuário (Avatar + DropdownMenu).
- `apps/web/components/layout/topbar.tsx` — expandido: breadcrumb, busca, notificações, tema, menu do usuário, menu hambúrguer (mobile).
- `apps/web/components/layout/sidebar.tsx` — colapso (com tooltips), detecção automática de rota ativa via `usePathname`, drawer off-canvas em mobile.
- `apps/web/components/dashboard/mock-data.ts` — dados fictícios centralizados (Quick Stats, Recent Projects, Recent Activity, AI Insights, Roadmap Snapshot), preparados para substituição futura por dados reais.
- `apps/web/components/dashboard/widgets.tsx` — `SectionHeader`, `QuickActionCard`, `ActivityItem`, `AiInsightsCard`, `RoadmapSnapshotCard`.
- `apps/web/app/dashboard/page.tsx` reescrito — Welcome, Quick Stats, Quick Actions, Recent Projects, Recent Activity, AI Insights, Roadmap Snapshot.

### Fixed — Sprint 1.1
- Sidebar não colapsava em telas estreitas (mobile), espremendo todo o conteúdo — corrigido com drawer off-canvas abaixo do breakpoint `md`.
- Screenshots do Dashboard capturavam só a viewport (a Application Shell usa scroll interno no `<main>`, não no documento) — corrigido redimensionando o viewport ao tamanho real do conteúdo antes de cada captura.

### Added — Incremento 0.5 (Landing Page premium)
- `apps/web/app/page.tsx` reescrito por completo — Header sticky, Hero (grid/glow/blur via tokens), How It Works, Why Us, Platform (8 módulos), Benefits, Roadmap (timeline), FAQ.
- `apps/web/components/landing/{header,hero,features,platform,roadmap-faq,footer,reveal}.tsx` — novos componentes de página, compostos com os primitivos existentes do design system.
- `apps/web/components/ui/accordion.tsx` — único componente novo do design system nesta etapa (necessário para o FAQ).
- `apps/web/app/robots.ts`, `apps/web/app/sitemap.ts` — SEO técnico. `layout.tsx` com metadata completo (title template, OG, Twitter Card, canonical, robots).
- Animações `--animate-accordion-down/up/fade-in` em `globals.css`, com `prefers-reduced-motion` respeitado.

### Fixed — Incremento 0.5
- `Button`: `asChild` quebrava o build (Radix Slot exige exatamente 1 filho; o componente passava um `null` condicional + `children` = 2 filhos). Só detectado agora porque nenhuma tela anterior usava `Button asChild` diretamente (usos anteriores eram `<Trigger asChild><Button>` — o `asChild` ficava no Trigger, não no Button).

### Added — Incremento 0.4b (Componentes avançados)
- `apps/web/components/ui/{dialog,toast,tooltip,dropdown-menu,alert,spinner,skeleton,separator,progress}.tsx` + `apps/web/hooks/use-toast.ts` — Dialog, Modal (AlertDialog), Toast, Tooltip, Dropdown Menu, Alert, Spinner, Skeleton, Separator, Progress. Todos usando tokens (nenhuma cor/espaçamento hardcoded).
- Novo token `--backdrop` em `globals.css` — overlay de Dialog/Modal, mesmo valor em ambos os temas (escurece o conteúdo por trás independentemente do tema ativo).
- `apps/web/app/layout.tsx` — `TooltipProvider` e `Toaster` adicionados globalmente.
- `/playground` — seções Dialogs & Modals, Toasts, Tooltips, Dropdown Menu, Alerts, Feedback (Spinner/Skeleton/Separator/Progress).
- `PRODUCT_PROGRESS.md` e seção "Product Delta" no `DEFINITION_OF_DONE.md`.

### Fixed — Incremento 0.4b
- Hidratação: `<html>` recebe `suppressHydrationWarning` (o script anti-flash muda `data-theme` antes da hidratação; sem isso, React acusava mismatch em toda carga com `prefers-color-scheme: light`). Bug pré-existente desde o 0.3, encontrado ao checar o console do navegador — não apenas o log do servidor — pela primeira vez.
- `Alert`: título e descrição renderizavam lado a lado em vez de empilhados (`flex` sem `flex-col`).

### Added — Governança de processo (Definition of Done)
- `DEFINITION_OF_DONE.md` — SPEC de processo (não frozen): Definition of Done obrigatória, Sprint Review, métricas de produto, screenshots + revisão visual obrigatórios para UI, limites de escopo, checklist de encerramento.
- `RELEASE_NOTES.md` — changelog em linguagem simples, para acompanhar o produto sem contexto técnico (complementa `CHANGELOG.md`, que continua técnico).
- `scripts/metrics.sh` — agora coleta métricas de produto (páginas, rotas, componentes UI, providers, hooks, features, ADRs, SPECs).
- `AGENT.md` — Fase 4/5/relatório final atualizados para exigir screenshots + revisão visual, RELEASE_NOTES.md, métricas de produto, Sprint Review e checklist de encerramento em todo sprint.

### Added — Incremento 0.4a (Fundação do Design System + shell do `/playground`)
- `apps/web/lib/utils.ts` (`cn`), `apps/web/components/ui/{button,input,textarea,card,badge,avatar}.tsx` — componentes com variantes via `class-variance-authority`, todos usando apenas tokens (nenhuma cor/espaçamento/raio/sombra hardcoded), estados default/hover/focus/disabled/loading/success/warning/error onde aplicável.
- `apps/web/app/playground/page.tsx` — shell interativo com navegação e 5 seções (Buttons, Inputs, Cards, Badges, Avatars).
- Tokens `success`/`warning` adicionados a `globals.css` (extensão à SPEC-005 §4).
- Dependências: `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `@radix-ui/react-slot`, `@radix-ui/react-avatar`.
- Tema permanece **sem persistência** nesta etapa (decisão explícita do usuário — ver `DECISIONS.md`); componentes avançados e demais seções do playground ficam para 0.4b/0.4c (`ADR-005-sprint-governance.md`).

### Added — Incremento 0.6 (antecipado — Deploy em produção)
- Repositório sincronizado com `origin/main` (GitHub) pela primeira vez.
- Projeto conectado à Vercel (dashboard, Root Directory `apps/web`); deploy automático a cada push em `main`.
- Produção: https://ai-game-studio-os-web.vercel.app/ — validado (HTTP 200, tokens Tailwind compilados).

### Added — Incremento 0.3 (Tailwind v4 + Design Tokens + Dark Mode + ThemeProvider)
- `apps/web/app/globals.css` — Tailwind v4 (`@import "tailwindcss"`), tokens de superfície e semânticos (SPEC-005 §4) via `@theme`, dark-first com override em `[data-theme="light"]`.
- `apps/web/providers/theme-provider.tsx` + `apps/web/hooks/use-theme.ts` — `ThemeProvider` (Client Component) com `toggleTheme`/`setTheme`, sem persistência (localStorage/sessionStorage proibidos; Supabase Auth ainda não existe).
- `apps/web/app/layout.tsx` — script inline anti-flash (lê `prefers-color-scheme` antes do primeiro paint, sem usar storage), `ThemeProvider` envolvendo `children`.
- `apps/web/postcss.config.mjs` — `@tailwindcss/postcss`.
- Sem shadcn/ui nesta etapa (isolado no Incremento 0.4 para respeitar o limite de arquivos por sprint).

### Added — Incremento 0.2 (Next.js + App Router)
- `apps/web` — Next.js 15.5.20 + React 19.2.7, App Router (`app/layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`), `tsconfig.json` estendendo `tsconfig.base.json`, `next.config.mjs`.
- Sem Tailwind, shadcn/ui ou Supabase nesta etapa (escopo explícito do incremento).

### Changed — Incremento 0.2
- `turbo.json`: `outputs` do task `build` passa a incluir `.next/**` (excluindo `.next/cache/**`), além de `dist/**`.

### Added — Incremento 0.1 (Monorepo Bootstrap)
- `package.json` raiz — pnpm workspaces, scripts (`build`, `dev`, `lint`, `typecheck`, `test`, `test:e2e`, `format`, `format:check`, `clean`) via Turborepo.
- `pnpm-workspace.yaml` (`apps/*`, `packages/*`), `turbo.json` (pipelines conforme ADR-002), `tsconfig.base.json` (strict mode).
- `.editorconfig`, `.gitignore`, `eslint.config.mjs` (flat config, ESLint 9 + typescript-eslint), `prettier.config.mjs`.
- Diretórios `apps/`, `supabase/`, `scripts/` (vazios, com `.gitkeep`).
- 11 packages internos scaffolded com estrutura mínima (`package.json` + `tsconfig.json` + `src/index.ts` stub, sem implementação): `@agsos/ui`, `@agsos/database`, `@agsos/auth`, `@agsos/events`, `@agsos/config`, `@agsos/validation`, `@agsos/observability`, `@agsos/integrations`, `@agsos/storage`, `@agsos/testing`, `@agsos/i18n`.

### Added
- Estrutura documental inicial do repositório (bootstrap): `docs/`, `AGENT.md`, `ARCHITECTURE.md`, `PROJECT_STATUS.md`, `DECISIONS.md`, `CHANGELOG.md`.
- Documentação normativa oficial importada para `docs/frozen/`: `UL-001`, `AGSOS-SPEC-001` a `009`, `ADR-002` a `004`, `AGSOS-PLAN-001`.
- `PROJECT_BIBLE.md` — referência operacional consolidada, derivada de `docs/frozen/`.

### Changed
- `AGENT.md` e `ARCHITECTURE.md` substituídos pelas versões oficiais importadas de `docs/frozen/`.
- `DECISIONS.md` atualizado para referenciar os ADRs oficiais em `docs/frozen/architecture/`.

### Removed
- Placeholders `docs/specifications/`, `docs/decisions/` e `docs/roadmap/` (Sprint -1), superados pela documentação oficial em `docs/frozen/`.
