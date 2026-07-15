# CHANGELOG.md

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/), e este projeto segue versionamento a ser definido.

## [Unreleased]

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
