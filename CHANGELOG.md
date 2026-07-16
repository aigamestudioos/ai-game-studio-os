# CHANGELOG.md

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/), e este projeto segue versionamento a ser definido.

## [Unreleased]

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
