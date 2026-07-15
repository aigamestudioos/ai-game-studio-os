# CHANGELOG.md

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/), e este projeto segue versionamento a ser definido.

## [Unreleased]

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
