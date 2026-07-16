# METRICS.md

Snapshot técnico **e de produto** do projeto, atualizado ao final de cada sprint. Gerado com `./scripts/metrics.sh` (ajustar manualmente os campos que o script não coleta — ver `DEFINITION_OF_DONE.md` §3 para a lista completa e como cada métrica é medida).

A partir do Incremento 0.4a, cada entrada passa a ter 5 seções: Código, Qualidade, **Produto** (páginas, rotas, componentes, providers, hooks, features, ADRs, SPECs, deploys), Infraestrutura, Deploy. Entradas anteriores não são reescritas retroativamente — o histórico de cada sprint reflete o que era medido naquele momento.

Ver também: [IMPLEMENTATION_LOG.md](IMPLEMENTATION_LOG.md) para o "porquê" de cada sprint, e [RELEASE_NOTES.md](RELEASE_NOTES.md) para o changelog em linguagem simples.

---

## Sprint 0 — Foundation (Release 0.1)

**Data:** 2026-07-15

### Código

| Métrica | Valor |
|---|---|
| Sprints concluídos | 1 |
| Apps | 0 |
| Packages | 11 |
| Arquivos (git-tracked) | 69 |
| Linhas de código (ts/tsx/js/jsx/sql) | 11 |
| Commits totais | 5 |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |

### Qualidade

| Métrica | Valor |
|---|---|
| Testes unitários | 0 |
| Testes E2E | 0 |
| Cobertura (%) | 0% |

### Produto

| Métrica | Valor |
|---|---|
| Módulos implementados | 0 |
| Integrações implementadas | 0 |
| Telas implementadas | 0 |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Tempo do CI | — (CI ainda não configurado) |
| Tempo do build | — (medir a partir do próximo sprint) |
| Tempo do pnpm install | — (medir a partir do próximo sprint) |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | — (ainda não configurado) |
| Supabase | — (ainda não configurado) |
| Ambientes | — (nenhum ambiente publicado) |

---

## Sprint 0 — Foundation (Incremento 0.2)

**Data:** 2026-07-15

### Código

| Métrica | Valor |
|---|---|
| Sprints concluídos | 2 |
| Apps | 1 (`apps/web`) |
| Packages | 11 |
| Arquivos (git-tracked) | 81 |
| Linhas de código (ts/tsx/js/jsx/sql) | 59 |
| Commits totais | 6 (após este incremento) |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |

### Qualidade

| Métrica | Valor |
|---|---|
| Testes unitários | 0 |
| Testes E2E | 0 |
| Cobertura (%) | 0% |

### Produto

| Métrica | Valor |
|---|---|
| Módulos implementados | 0 |
| Integrações implementadas | 0 |
| Telas implementadas | 1 (home `/`) |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Tempo do CI | — (CI ainda não configurado, Incremento 0.4) |
| Tempo do build (monorepo completo) | ~33s (`pnpm build`, cache frio, 12 workspaces) |
| Tempo do pnpm install | — (medir no próximo sprint) |
| Tempo do build (apps/web isolado) | ~28s (`pnpm --filter web build`) |
| Tempo de start do dev server (apps/web) | ~3s (`next dev` até "Ready in") |
| Tempo do typecheck (apps/web isolado) | ~2s (`pnpm --filter web typecheck`) |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | — (ainda não configurado, Incremento 0.5) |
| Supabase | — (ainda não configurado, Incremento 0.6) |
| Ambientes | — (nenhum ambiente publicado; commit local apenas) |

---

## Sprint 0 — Foundation (Incremento 0.3)

**Data:** 2026-07-15

### Código

| Métrica | Valor |
|---|---|
| Sprints concluídos | 3 |
| Apps | 1 (`apps/web`) |
| Packages | 11 |
| Arquivos (git-tracked) | 88 |
| Linhas de código (ts/tsx/js/jsx/sql/css) | 235 |
| Commits totais | 9 (após este incremento) |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |

### Qualidade

| Métrica | Valor |
|---|---|
| Testes unitários | 0 |
| Testes E2E | 0 |
| Cobertura (%) | 0% |

### Produto

| Métrica | Valor |
|---|---|
| Módulos implementados | 0 |
| Integrações implementadas | 0 |
| Telas implementadas | 1 (home `/`, agora com tokens + dark mode) |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Tempo do CI | — (CI ainda não configurado, Incremento 0.5) |
| Tempo do build (monorepo completo) | ~40s (`pnpm build`, cache frio, 12 workspaces) |
| Tempo do pnpm install | — (medir no próximo sprint) |
| Tempo do build (apps/web isolado) | ~28s (`pnpm --filter web build`) |
| Tempo de start do dev server (apps/web) | ~3s (`next dev` até "Ready in") |
| Tempo do typecheck (apps/web isolado) | ~3s (`pnpm --filter web typecheck`) |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | ✅ https://ai-game-studio-os-web.vercel.app/ (antecipado, Incremento 0.6) |
| Supabase | — (ainda não configurado, Incremento 0.7) |
| Ambientes | Production (`main`, deploy automático via Git) |

---

## Sprint 0 — Foundation (Incremento 0.6, antecipado)

**Data:** 2026-07-15

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | ✅ https://ai-game-studio-os-web.vercel.app/ — HTTP 200, validado |
| Supabase | — (ainda não configurado, Incremento 0.7) |
| Ambientes | Production (`main`, deploy automático a cada push) |
| GitHub → Vercel | Conectado via dashboard (Root Directory `apps/web`) |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Tempo do CI | — (CI ainda não configurado, Incremento 0.5) |
| Push para origin/main | 9 commits (repositório já estava sincronizado nesta etapa) |

---

## Sprint 0 — Foundation (Incremento 0.4a)

**Data:** 2026-07-15

### Código

| Métrica | Valor |
|---|---|
| Sprints concluídos | 5 (0.1, 0.2, 0.3, 0.4a, 0.6) |
| Apps | 1 (`apps/web`) |
| Packages | 11 |
| Arquivos (git-tracked) | 96 |
| Linhas de código (ts/tsx/js/jsx/sql/css) | 672 |
| Commits totais | 11 (após este incremento) |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |

### Qualidade

| Métrica | Valor |
|---|---|
| Testes unitários | 0 |
| Testes E2E | 0 |
| Cobertura (%) | 0% |

### Produto

| Métrica | Valor |
|---|---|
| Módulos implementados | 0 |
| Componentes de design system | 6 (Button, Input, Textarea, Card, Badge, Avatar) |
| Telas implementadas | 2 (home `/`, `/playground`) |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Tempo do build (monorepo completo) | ~1s (cache quente; ~40s em cache frio) |
| Tempo do build (apps/web isolado) | ~30s (`pnpm --filter web build`) |
| Tempo de start do dev server (apps/web) | ~3s |
| Tempo do typecheck (apps/web isolado) | ~3s |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | ✅ https://ai-game-studio-os-web.vercel.app/ (será atualizado após push deste incremento) |
| Supabase | — (ainda não configurado, Incremento 0.7) |
| Ambientes | Production (`main`, deploy automático a cada push) |

---

## Sprint 0 — Foundation (Incremento 0.4a — fechamento + DoD)

**Data:** 2026-07-15

Fecha o 0.4a: correção do bug de `max-w-md`, validação visual com Playwright e formalização do `DEFINITION_OF_DONE.md`. Primeira entrada usando o template de 5 seções completo (ver `DEFINITION_OF_DONE.md` §3).

### Código

| Métrica | Valor |
|---|---|
| Sprints concluídos | 5 (0.1, 0.2, 0.3, 0.4a, 0.6) |
| Apps | 1 (`apps/web`) |
| Packages | 11 |
| Arquivos (git-tracked) | 103 |
| Linhas de código (ts/tsx/js/jsx/sql/css) | 672 |
| Commits totais | 14 (após este incremento) |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |

### Qualidade

| Métrica | Valor |
|---|---|
| Testes unitários | 0 |
| Testes E2E | 0 |
| Cobertura (%) | 0% |

### Produto

| Métrica | Valor |
|---|---|
| Páginas | 2 (`/`, `/playground`) |
| Rotas | 2 |
| Componentes UI | 6 (Button, Input, Textarea, Card, Badge, Avatar) |
| Componentes avançados | 0 (entram no 0.4b) |
| Providers | 1 (ThemeProvider) |
| Hooks | 1 (useTheme) |
| Features | 0 |
| Fluxos completos | 0 |
| Deploys | 5 (pushes para `main` com deploy validado em produção) |
| ADRs | 4 (002, 003, 004, 005) |
| SPECs | 9 (`docs/frozen/architecture/AGSOS-SPEC-*`) |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Tempo do build (monorepo completo) | ~40s (cache frio) |
| Tempo médio de deploy | — (sem token da Vercel para medir via API; manual/TBD) |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | ✅ https://ai-game-studio-os-web.vercel.app/ — bug de layout corrigido e validado |
| Supabase | — (ainda não configurado, Incremento 0.7) |
| Ambientes | Production (`main`, deploy automático a cada push) |

---

## Sprint 0 — Foundation (Incremento 0.4b)

**Data:** 2026-07-15

10 componentes avançados (Dialog, Modal, Toast, Tooltip, DropdownMenu, Alert, Spinner, Skeleton, Separator, Progress). Três bugs encontrados via revisão visual e corrigidos no mesmo incremento (hidratação, Alert, overlay). Ver `IMPLEMENTATION_LOG.md`/`DECISIONS.md`.

### Código

| Métrica | Valor |
|---|---|
| Sprints concluídos | 6 (0.1, 0.2, 0.3, 0.4a, 0.4b, 0.6) |
| Apps | 1 (`apps/web`) |
| Packages | 11 |
| Arquivos (git-tracked) | 123 |
| Linhas de código (ts/tsx/js/jsx/sql/css) | 1399 |
| Commits totais | 15 (após este incremento) |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |

### Qualidade

| Métrica | Valor |
|---|---|
| Testes unitários | 0 |
| Testes E2E | 0 (sugestão do usuário para 0.4c/0.5 — reaproveitar Playwright) |
| Cobertura (%) | 0% |

### Produto

| Métrica | Valor |
|---|---|
| Páginas | 2 (`/`, `/playground`) |
| Rotas | 2 |
| Componentes UI (arquivos) | 15 (`components/ui/`) |
| Componentes UI (contagem lógica) | 16 (Button, Input, Textarea, Card, Badge, Avatar, Dialog, Modal, Toast, Tooltip, DropdownMenu, Alert, Spinner, Skeleton, Separator, Progress) |
| Componentes avançados | 10 (Dialog, Modal, Toast, Tooltip, DropdownMenu, Alert, Spinner, Skeleton, Separator, Progress) |
| Providers | 1 (ThemeProvider) — TooltipProvider/ToastProvider do Radix não contam como próprios |
| Hooks | 2 (useTheme, useToast) |
| Features | 0 |
| Fluxos completos | 0 |
| Deploys | 6 (pushes para `main` com deploy validado em produção) |
| ADRs | 4 (002, 003, 004, 005) |
| SPECs | 9 |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Tempo do build (monorepo completo) | ~34s |
| Tempo médio de deploy | — (manual/TBD) |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | ✅ (será validado após push deste incremento) |
| Supabase | — (ainda não configurado, Incremento 0.7) |
| Ambientes | Production (`main`, deploy automático a cada push) |

---

## Sprint 0 — Foundation (Incremento 0.5 — Landing Page premium)

**Data:** 2026-07-15

Playground congelado (0.4c não executado, decisão do usuário). Landing Page premium substitui a home. Dashboard visual (Incremento 0.6) commitado localmente como checkpoint, ainda não formalizado/pushado — não contabilizado como "concluído" nesta entrada.

### Código

| Métrica | Valor |
|---|---|
| Sprints concluídos | 7 (0.1, 0.2, 0.3, 0.4a, 0.4b, 0.5, 0.6-antecipado/Vercel) |
| Apps | 1 (`apps/web`) |
| Packages | 11 |
| Arquivos (git-tracked) | 144 |
| Linhas de código (ts/tsx/js/jsx/sql/css) | 2266 |
| Commits totais | 18 (após este incremento) |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |

### Qualidade

| Métrica | Valor |
|---|---|
| Testes unitários | 0 |
| Testes E2E | 0 (sugestão do usuário, ainda pendente) |
| Cobertura (%) | 0% |

### Produto

| Métrica | Valor |
|---|---|
| Páginas | 3 (`/`, `/dashboard` [WIP], `/playground`) |
| Rotas | 3 + `robots.txt`/`sitemap.xml` |
| Componentes UI | 17 (16 + Accordion) |
| Componentes de página (landing/layout/dashboard) | 10 (Header, Hero, HowItWorks, WhyUs, Platform, Benefits, Roadmap, Faq, Footer, Reveal) + 4 (Sidebar, TopBar, ProjectCard, StatCard) |
| Providers | 1 (ThemeProvider) |
| Hooks | 2 (useTheme, useToast) |
| Features | 0 |
| Fluxos completos | 0 (tudo visual, sem backend) |
| Deploys | 7 (pushes para `main` com deploy validado) |
| ADRs | 4 (002, 003, 004, 005) |
| SPECs | 9 |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Tempo do build (monorepo completo) | ~41s |
| Rotas geradas | 8 (`/`, `/_not-found`, `/dashboard`, `/playground`, `/robots.txt`, `/sitemap.xml`) |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | ✅ (a validar após push deste incremento) |
| Supabase | — (ainda não configurado, Incremento 0.7) |
| Ambientes | Production (`main`, deploy automático a cada push) |

---

## Sprint 1 — Application Foundation (Incremento 1.1 — Dashboard Premium)

**Data:** 2026-07-15

Application Shell reutilizável (Header + Sidebar + Content) construída e usada em `/dashboard`. Sem Supabase/backend/auth — 100% mock.

### Código

| Métrica | Valor |
|---|---|
| Sprints concluídos | Sprint 0 completo (0.1–0.5) + Sprint 1.1 |
| Apps | 1 (`apps/web`) |
| Packages | 11 |
| Arquivos (git-tracked) | 154 |
| Linhas de código (ts/tsx/js/jsx/sql/css) | 2728 |
| Commits totais | 20 (após este incremento) |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |

### Qualidade

| Métrica | Valor |
|---|---|
| Testes unitários | 0 |
| Testes E2E | 0 (sugestão do usuário, ainda pendente) |
| Cobertura (%) | 0% |

### Produto

| Métrica | Valor |
|---|---|
| Páginas | 3 (`/`, `/dashboard`, `/playground`) |
| Rotas | 3 + `robots.txt`/`sitemap.xml` |
| Componentes UI (design system) | 16 |
| Componentes de layout (Application Shell) | 5 (AppShell, TopBar, Sidebar, SearchBar, UserMenu) |
| Componentes de dashboard | 8 (ProjectCard, StatCard, SectionHeader, QuickActionCard, ActivityItem, AiInsightsCard, RoadmapSnapshotCard + mock-data) |
| Providers | 1 (ThemeProvider) |
| Hooks | 2 (useTheme, useToast) |
| Features | 0 |
| Fluxos completos | 0 (tudo visual, sem backend) |
| Deploys | 8 (pushes para `main` com deploy validado) |
| ADRs | 4 (002, 003, 004, 005) |
| SPECs | 9 |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Tempo do build (monorepo completo) | ~43s |
| Rotas geradas | 8 |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | ✅ (a validar após push deste incremento) |
| Supabase | — (ainda não configurado, Sprint 1.2) |
| Ambientes | Production (`main`, deploy automático a cada push) |

## Sprint 1 — Application Foundation (Incremento 1.2 — Projects)

**Data:** 2026-07-15

### Código

| Métrica | Valor |
|---|---|
| Sprints concluídos | Sprint 0 completo (0.1–0.5) + Sprint 1.1 + Sprint 1.2 |
| Apps | 1 (`apps/web`) |
| Packages | 11 |
| Arquivos (git-tracked) | 154 (+6 neste incremento) |
| Linhas de código (ts/tsx/js/jsx/sql/css) | 2740 |
| Commits totais | 22 (após este incremento) |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |

### Qualidade

| Métrica | Valor |
|---|---|
| Testes unitários | 0 |
| Testes E2E | 0 (sugestão do usuário, ainda pendente) |
| Cobertura (%) | 0% |

### Produto

| Métrica | Valor |
|---|---|
| Páginas | 5 (`/`, `/dashboard`, `/playground`, `/projects`, `/projects/[id]`) |
| Rotas | 5 + `robots.txt`/`sitemap.xml` |
| Componentes UI (design system) | 16 |
| Componentes de layout (Application Shell) | 5 (AppShell, TopBar, Sidebar, SearchBar, UserMenu) |
| Componentes de dashboard | 8 (ProjectCard, StatCard, SectionHeader, QuickActionCard, ActivityItem, AiInsightsCard, RoadmapSnapshotCard + mock-data) |
| Stores mock client-side | 1 (`lib/projects-store.ts`, localStorage) |
| Providers | 1 (ThemeProvider) |
| Hooks | 2 (useTheme, useToast) |
| Features | 0 |
| Fluxos completos | 1 (Dashboard → Projects → New Project → Project Details, 100% mock) |
| Deploys | 8 (pushes para `main` com deploy validado; este incremento ainda não deployado) |
| ADRs | 4 (002, 003, 004, 005) |
| SPECs | 9 |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Tempo do build (monorepo completo) | ~39s |
| Rotas geradas | 8 |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | Pendente (a validar após push deste incremento) |
| Supabase | — (ainda não configurado, Sprint 1.6) |
| Ambientes | Production (`main`, deploy automático a cada push) |

## Sprint 1 — Application Foundation (Incremento 1.3 — Games)

**Data:** 2026-07-15

### Código

| Métrica | Valor |
|---|---|
| Sprints concluídos | Sprint 0 completo (0.1–0.5) + Sprint 1.1 + Sprint 1.2 + Sprint 1.3 |
| Apps | 1 (`apps/web`) |
| Packages | 11 |
| Arquivos (git-tracked) | 171 (+17 neste incremento, incluindo screenshots) |
| Linhas de código (ts/tsx/js/jsx/sql/css) | 3087 |
| Commits totais | 23 (após este incremento) |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |

### Qualidade

| Métrica | Valor |
|---|---|
| Testes unitários | 0 |
| Testes E2E | 0 (sugestão do usuário, ainda pendente) |
| Cobertura (%) | 0% |

### Produto

| Métrica | Valor |
|---|---|
| Páginas | 7 (`/`, `/dashboard`, `/playground`, `/projects`, `/projects/[id]`, `/games`, `/games/[id]`) |
| Rotas | 7 + `robots.txt`/`sitemap.xml` |
| Componentes UI (design system) | 16 |
| Componentes de layout (Application Shell) | 5 (AppShell, TopBar, Sidebar, SearchBar, UserMenu) |
| Componentes de dashboard | 8 |
| Componentes de games | 1 (GameCard) |
| Stores mock client-side | 2 (`projects-store.ts`, `games-store.ts`, ambos localStorage) |
| Providers | 1 (ThemeProvider) |
| Hooks | 2 (useTheme, useToast) |
| Features | 0 |
| Fluxos completos | 2 (Projects e Games, ambos Dashboard → Lista → Criar → Detalhes, 100% mock) |
| Deploys | 9 (pushes para `main` com deploy validado; este incremento ainda não deployado) |
| ADRs | 4 (002, 003, 004, 005) |
| SPECs | 9 |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Tempo do build (monorepo completo) | ~34s |
| Rotas geradas | 10 |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | Pendente (a validar após push deste incremento) |
| Supabase | — (ainda não configurado, Sprint 1.6) |
| Ambientes | Production (`main`, deploy automático a cada push) |

## Sprint 1 — Application Foundation (Incremento 1.4 — Knowledge)

**Data:** 2026-07-15

### Código

| Métrica | Valor |
|---|---|
| Sprints concluídos | Sprint 0 completo (0.1–0.5) + Sprint 1.1 + Sprint 1.2 + Sprint 1.3 + Sprint 1.4 |
| Apps | 1 (`apps/web`) |
| Packages | 11 |
| Arquivos (git-tracked) | 189 (+18 neste incremento, incluindo screenshots) |
| Linhas de código (ts/tsx/js/jsx/sql/css) | 3523 |
| Commits totais | 24 (após este incremento) |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |

### Qualidade

| Métrica | Valor |
|---|---|
| Testes unitários | 0 |
| Testes E2E | 0 (sugestão do usuário, ainda pendente) |
| Cobertura (%) | 0% |

### Produto

| Métrica | Valor |
|---|---|
| Páginas | 9 (`/`, `/dashboard`, `/playground`, `/projects`, `/projects/[id]`, `/games`, `/games/[id]`, `/knowledge`, `/knowledge/[id]`) |
| Rotas | 9 + `robots.txt`/`sitemap.xml` |
| Componentes UI (design system) | 16 |
| Componentes de layout (Application Shell) | 5 (AppShell, TopBar, Sidebar, SearchBar, UserMenu) |
| Componentes de dashboard | 8 |
| Componentes de games | 1 (GameCard) |
| Componentes de knowledge | 1 (DocumentCard) |
| Stores mock client-side | 3 (`projects-store.ts`, `games-store.ts`, `knowledge-store.ts`, todos localStorage) |
| Providers | 1 (ThemeProvider) |
| Hooks | 2 (useTheme, useToast) |
| Features | 0 |
| Fluxos completos | 3 (Projects, Games, Knowledge — todos Dashboard → Lista → Criar → Detalhes, 100% mock) |
| Deploys | 10 (pushes para `main` com deploy validado; este incremento ainda não deployado) |
| ADRs | 4 (002, 003, 004, 005) |
| SPECs | 9 |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Tempo do build (monorepo completo) | ~41s |
| Rotas geradas | 12 |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | Pendente (a validar após push deste incremento) |
| Supabase | — (ainda não configurado, Sprint 1.6) |
| Ambientes | Production (`main`, deploy automático a cada push) |

## Sprint 1 — Application Foundation (Incremento 1.5 — Publishing)

**Data:** 2026-07-15

### Código

| Métrica | Valor |
|---|---|
| Sprints concluídos | Sprint 0 completo (0.1–0.5) + Sprint 1.1 + Sprint 1.2 + Sprint 1.3 + Sprint 1.4 + Sprint 1.5 |
| Apps | 1 (`apps/web`) |
| Packages | 11 |
| Arquivos (git-tracked) | 207 (+18 neste incremento, incluindo screenshots) |
| Linhas de código (ts/tsx/js/jsx/sql/css) | 3881 |
| Commits totais | 25 (após este incremento) |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |

### Qualidade

| Métrica | Valor |
|---|---|
| Testes unitários | 0 |
| Testes E2E | 0 (sugestão do usuário, ainda pendente) |
| Cobertura (%) | 0% |

### Produto

| Métrica | Valor |
|---|---|
| Páginas | 11 (`/`, `/dashboard`, `/playground`, `/projects`, `/projects/[id]`, `/games`, `/games/[id]`, `/knowledge`, `/knowledge/[id]`, `/publishing`, `/publishing/[id]`) |
| Rotas | 11 + `robots.txt`/`sitemap.xml` |
| Componentes UI (design system) | 16 |
| Componentes de layout (Application Shell) | 5 (AppShell, TopBar, Sidebar, SearchBar, UserMenu) |
| Componentes de dashboard | 8 |
| Componentes de games | 1 (GameCard) |
| Componentes de knowledge | 1 (DocumentCard) |
| Componentes de publishing | 1 (SubmissionCard) |
| Stores mock client-side | 4 (`projects-store.ts`, `games-store.ts`, `knowledge-store.ts`, `publishing-store.ts`, todos localStorage) |
| Providers | 1 (ThemeProvider) |
| Hooks | 2 (useTheme, useToast) |
| Features | 0 |
| Fluxos completos | 4 (Projects, Games, Knowledge, Publishing — todos Dashboard → Lista → Criar → Detalhes, 100% mock) |
| Deploys | 11 (pushes para `main` com deploy validado; este incremento ainda não deployado) |
| ADRs | 4 (002, 003, 004, 005) |
| SPECs | 9 |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Tempo do build (monorepo completo) | ~42s |
| Rotas geradas | 14 |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | ✅ Publishing validado em produção |
| Supabase | — (ainda não configurado, Sprint 1.7) |
| Ambientes | Production (`main`, deploy automático a cada push) |

---

## Sprint 1 — Application Foundation (Sprint 1.6 — Auth mock)

**Data:** 2026-07-15

Autenticação simulada (email + senha, `localStorage`) protegendo as 9 páginas de produto via `AppShell`. Sem projeto Supabase — ver `DECISIONS.md`.

### Código

| Métrica | Valor |
|---|---|
| Sprints concluídos | Sprint 0 completo + Sprint 1.1–1.6 |
| Apps | 1 (`apps/web`) |
| Packages | 11 |
| Arquivos (git-tracked) | 238 |
| Linhas de código (ts/tsx/js/jsx/sql/css) | 4477 |
| Commits totais | 28 (após este incremento) |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |

### Qualidade

| Métrica | Valor |
|---|---|
| Testes unitários | 0 |
| Testes E2E | 0 |
| Cobertura (%) | 0% |

### Produto

| Métrica | Valor |
|---|---|
| Páginas | 10 (`/`, `/login`, `/dashboard`, `/projects`(+`[id]`), `/games`(+`[id]`), `/knowledge`(+`[id]`), `/publishing`(+`[id]`), `/playground`) |
| Rotas | 12 + `robots.txt`/`sitemap.xml` |
| Componentes UI (design system) | 16 |
| Componentes de layout | 5 |
| Fluxos completos | 5 (Projects, Games, Knowledge, Publishing + Login/Logout — todos mock) |
| Rotas protegidas | 9 (todas as páginas de produto, via `AppShell`) |
| Deploys | 11 (este incremento ainda não deployado) |
| ADRs | 4 |
| SPECs | 9 |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Tempo do build (monorepo completo) | ~37s |
| Rotas geradas | 15 |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | ✅ (Auth mock validado em produção) |
| Supabase | — (schema/clientes prontos localmente; sem projeto remoto — Sprint 1.8) |
| Ambientes | Production (`main`, deploy automático a cada push) |

---

## Sprint 1 — Application Foundation (Sprint 1.7 — Foundation for Supabase)

**Data:** 2026-07-15

`packages/database` real (clientes/tipos/repositories) + 9 migrations + seeds, validados localmente via Docker. Sem conectar a nenhum projeto Supabase remoto — nenhuma tela alterada, nenhum mock removido.

### Código

| Métrica | Valor |
|---|---|
| Sprints concluídos | Sprint 0 completo + Sprint 1.1–1.7 |
| Apps | 1 (`apps/web`) |
| Packages | 11 (`@agsos/database` agora com implementação real) |
| Arquivos (git-tracked) | 269 |
| Linhas de código (ts/tsx/js/jsx/sql/css) | 6122 |
| Commits totais | 31 (após este incremento) |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |

### Qualidade

| Métrica | Valor |
|---|---|
| Testes unitários | 0 |
| Testes E2E | 0 |
| Cobertura (%) | 0% |
| Migrations validadas contra Postgres real | 9/9 (Docker local) |
| Testes de RLS (`supabase/tests/`) | 0 — pendência explícita |

### Produto

| Métrica | Valor |
|---|---|
| Páginas | 10 (inalterado — nenhuma tela mudou neste incremento) |
| Tabelas de banco (schema) | 27 (studios, users, roles, permissions, role_permissions, user_roles, environments, ideas, projects, epics, features, tasks, milestones, games, game_versions, builds, releases, game_localizations, certificates, provision_profiles, store_connections, submissions, store_reviews, knowledge_documents, knowledge_document_versions, knowledge_document_relations, platforms + studio_events + user_dashboard_preferences + 5 tabelas globais) |
| Repositories implementados | 5 (Studio, Project, Game, KnowledgeDocument, Submission) |
| Clientes Supabase | 3 (browser, server, admin — `ADR-003`) |
| Migrations | 9 |
| Fluxos completos (produto) | 5 (inalterado — mock continua sendo a fonte de dados real da UI) |
| ADRs | 4 |
| SPECs | 9 |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Tempo do build (monorepo completo) | ~40s |
| Stack Supabase local (Docker) | testada e parada ao final — não fica rodando entre sessões |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | ✅ (nenhuma mudança de UI neste incremento — deploy não necessário para validação) |
| Supabase | — (schema pronto, sem projeto remoto — Sprint 1.8) |
| Ambientes | Production (`main`, deploy automático a cada push) |
