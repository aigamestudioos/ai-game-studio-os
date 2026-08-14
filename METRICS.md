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

## Sprint 1.8d-1 — Studio Bootstrap

**Data:** 2026-07-27

Studio + `public.users` + Role Owner criados automaticamente no primeiro login (função `SECURITY DEFINER`, chamada via RPC). Dois bugs pré-existentes do Sprint 1.7 corrigidos (recursão infinita em 27 políticas de RLS; GRANTs de tabela ausentes para `authenticated`). Projeto Supabase remoto recebeu o schema completo pela primeira vez (12 migrations via `supabase db push`) — até aqui só Auth tinha sido exercitado no remoto.

### Código

| Métrica | Valor |
|---|---|
| Apps | 1 (`apps/web`) |
| Packages | 11 |
| Arquivos (git-tracked) | 279 |
| Linhas de código (ts/tsx/js/jsx/sql/css) | 7145 |
| Commits totais | 41 (após este incremento) |
| Migrations | 12 (3 novas neste sprint) |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |

### Qualidade

| Métrica | Valor |
|---|---|
| Bugs reais encontrados e corrigidos | 2 (recursão RLS, GRANTs ausentes) — pré-existentes do Sprint 1.7, nunca detectados antes |
| Validação de RLS multi-tenant | 10/10 checks (dois usuários reais, projeto remoto) |
| Validação end-to-end via app real | 10/10 checks (Playwright + login real) |
| Erros de console | 0 |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Projeto Supabase remoto | Schema completo aplicado pela primeira vez (`supabase db push`, 12 migrations) |
| Funções `SECURITY DEFINER` | 2 (`bootstrap_studio_for_current_user`, `current_user_studio_id`) |

## Sprint 1.8a — Núcleo de Auth real (login/logout/sessão/middleware)

**Data:** 2026-07-16

Auth mock (`localStorage`) eliminada. Login, logout, sessão (restore + auto refresh + `onAuthStateChange`) e proteção de rotas via middleware agora usam Supabase Auth real, através de `packages/database`. Forgot/reset password, páginas 401/403 e seção de Auth no Playground ficam para os sub-sprints seguintes (1.8b/c/d — sprint dividido por exceder os limites do `CLAUDE.md`).

### Código

| Métrica | Valor |
|---|---|
| Sprints concluídos | Sprint 0 completo + Sprint 1.1–1.7 + 1.8a |
| Apps | 1 (`apps/web`) |
| Packages | 11 (`apps/web` agora consome `@agsos/database` diretamente) |
| Arquivos (git-tracked) | 271 |
| Linhas de código (ts/tsx/js/jsx/sql/css) | 6195 |
| Commits totais | 34 (após este incremento) |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |

### Qualidade

| Métrica | Valor |
|---|---|
| Testes unitários | 0 |
| Testes E2E | 0 (Playwright ad-hoc via script, não suíte configurada) |
| Cobertura (%) | 0% |
| Golden path validado (Playwright) | 14/14 checks — login, logout, sessão persistente (reload/nova aba), redirecionamento de rota protegida, redirecionamento de `/login` autenticado, erro de credenciais inválidas |
| Overflow (6 combinações breakpoint × tema) | 0 |
| Erros de console (fora do 400 esperado do teste de credencial inválida) | 0 |

### Produto

| Métrica | Valor |
|---|---|
| Páginas | 12 (inalterado — nenhuma página nova, `/login` reescrita) |
| Providers | 1 (`ThemeProvider` — `AuthProvider` dedicado ainda não existe, sessão via hook `useAuth`) |
| Hooks | 3 (`use-auth` reescrito para Supabase real) |
| Middleware | 1 (novo — `apps/web/middleware.ts`, proteção de rotas allowlist) |
| Rotas públicas | 4 (`/`, `/login`, `/forgot-password`*, `/reset-password`*) — *ainda sem página própria, criadas no 1.8b |
| ADRs | 4 |
| SPECs | 9 |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Usuário de teste | `test@aigamestudioos.com`, criado manualmente pelo usuário no projeto Supabase `dev` |
| Clientes Supabase em uso | browser + server (via middleware) — admin ainda não usado por `apps/web` |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | Pendente validação pós-push (ver relatório) |
| Supabase | `dev` conectado e em uso real pela primeira vez |

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

---

## Sprint 2.3 — Publishing real (somente leitura)

**Data:** 2026-08-03

Mesmo padrão dos Sprints 2.0/2.1/2.2: substitui `apps/web/lib/publishing-store.ts` (mock) por dados reais via `packages/database`. `submissions.release_id`/`build_id` são `NOT NULL` e não há, ainda, nenhuma UI para criar Release/Build — decisão de escopo tomada com o usuário: este sprint é somente leitura (lista/detalhe de Submissions reais), com "New Submission" desabilitado e mensagem explicativa, sem criar fluxo de Release/Build.

### Código

| Métrica | Valor |
|---|---|
| Sprints concluídos | Sprint 0–1 completos + Sprint 2.0–2.3 |
| Apps | 1 (`apps/web`) |
| Packages | 11 |
| Arquivos (git-tracked) | 305 |
| Linhas de código (ts/tsx/js/jsx/sql/css) | 8587 |
| Commits totais | 55 (antes deste commit) |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |

### Qualidade

| Métrica | Valor |
|---|---|
| Testes unitários | 0 |
| Testes E2E | 0 |
| Cobertura (%) | 0% |
| Teste manual (Playwright ad hoc, banco real local) | 3/3 checks — cards reais renderizando (Nebula Drift/Sprint Runner/Hyper Dash), botão "New Submission" desabilitado com mensagem, detalhe com "Revisões" reais a partir de `store_reviews`, zero erros de console |
| Teste manual (Playwright, produção, conta de teste dedicada) | 6/6 aprovados: deploy, login/redirecionamento, estado vazio de Publishing, botão desabilitado + mensagem, zero erros de console, isolamento RLS. 3 itens **não validados em produção** (só localmente): listagem com submissions reais, detalhe de submission, `store_reviews` reais — ausência de dados no Studio da conta de teste, não é falha |

### Produto

| Métrica | Valor |
|---|---|
| Páginas | 10 (inalterado) |
| Repositories implementados | 5 (Studio, Project, Game, KnowledgeDocument, Submission — `Submission` ganhou `listWithDetails()`/`getWithDetails()`/`listReviews()`) |
| Módulos de negócio migrados para dados reais | 4/4 (Projects, Games, Knowledge, Publishing) — mock→real do MVP original concluído; falta ainda a criação de Release/Build/Submission (fora de escopo deste sprint) |
| ADRs | 4 |
| SPECs | 9 |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Stack Supabase local (Docker) | testada e parada ao final — não fica rodando entre sessões |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | ✅ deploy do commit `b125021` (status `success`). Validação em produção **parcial**: aprovados deploy, login/redirecionamento, estado vazio de Publishing, botão "New Submission" desabilitado + mensagem, zero erros de console, isolamento RLS. **Não validados em produção** (só localmente): listagem com submissions reais, detalhe de submission, `store_reviews` reais — falta um Studio de demonstração próprio para testes de produção (ver pendência de QA no IMPLEMENTATION_LOG.md) |
| Supabase | — (schema pronto, sem projeto remoto — Sprint 1.8) |
| Ambientes | Production (`main`, deploy automático a cada push) |

---

## Sprint 2.4 — Release Pipeline: schema + repositories (sem UI)

**Data:** 2026-08-04

Primeiro dos 4 sprints em que o "Release Pipeline" completo (Game → Version → Build → Release → Submission → Store Review → Published) foi dividido — pedido original excedia os limites de sprint deste repositório (`CLAUDE.md`); divisão proposta e confirmada pelo usuário antes de implementar. Este sprint é só schema + repositories, sem UI.

### Código

| Métrica | Valor |
|---|---|
| Sprints concluídos | Sprint 0–1 completos + Sprint 2.0–2.4 |
| Apps | 1 (`apps/web`) |
| Packages | 11 |
| Arquivos (git-tracked) | 308 |
| Linhas de código (ts/tsx/js/jsx/sql/css) | 8753 |
| Commits totais | 58 (antes deste commit) |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |

### Qualidade

| Métrica | Valor |
|---|---|
| Testes unitários | 0 |
| Testes E2E | 0 |
| Cobertura (%) | 0% |
| Migration validada contra Postgres real | ✅ (`supabase migration up`, local/Docker) — ENUMs/colunas/`CHECK` constraint (`chk_releases_rollout_percentage`) e RLS confirmados via `\d` no psql |
| Repositories exercitados fim a fim (script ad hoc, `authenticated` role, local) | 6/6 checks — create+list de Version/Build/Release com os campos novos, valores persistidos corretos, `rollout_percentage=150` corretamente rejeitado pelo `CHECK`, dados de teste removidos |

### Produto

| Métrica | Valor |
|---|---|
| Páginas | 10 (inalterado — nenhuma tela nova neste sprint) |
| Repositories implementados | 7 (Studio, Project, Game, KnowledgeDocument, Submission, GameVersion, Release — `Build` ganhou `listByVersion()`/`getById()`/`create()`) |
| ENUMs novos | 2 (`build_type`, `release_channel` — aditivos, `AGSOS-SPEC-003` §13 permanece intacto; atualização formal do documento é débito registrado) |
| ADRs | 4 |
| SPECs | 9 |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Stack Supabase local (Docker) | testada e parada ao final — não fica rodando entre sessões |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | não aplicável — sem mudança de UI/frontend neste sprint |
| Supabase | — (schema pronto, sem projeto remoto — Sprint 1.8) |
| Ambientes | Production (`main`, deploy automático a cada push) |

---

## Sprint 2.5 — Release Pipeline: UX de criação + hardening da simulação de Build

**Data:** 2026-08-04

Terceiro incremento visível do Release Pipeline (2.4 foi só schema/repositories). Entrega a UX de criação de Version/Build/Release + Timeline, desbloqueia "New Submission" em Publishing, e adiciona um hardening (detecção de Build travada + Retry Build) pedido pelo usuário depois que o Golden Path revelou a limitação da simulação client-side.

### Código

| Métrica | Valor |
|---|---|
| Sprints concluídos | Sprint 0–1 completos + Sprint 2.0–2.5 |
| Apps | 1 (`apps/web`) |
| Packages | 11 |
| Arquivos (git-tracked) | 317 |
| Linhas de código (ts/tsx/js/jsx/sql/css) | 9945 |
| Commits totais | 59 (antes deste commit) |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |

### Qualidade

| Métrica | Valor |
|---|---|
| Testes unitários | 0 |
| Testes E2E | 0 |
| Cobertura (%) | 0% |
| Golden Path (Playwright, banco real local) | 29/29 checks — Game→Version→Build (PENDING→RUNNING→SUCCEEDED)→Release→Submission, Timeline com 5 eventos, reload, logout/login, persistência; 6/6 combinações de breakpoint×tema sem overflow horizontal; zero erros de console |
| Cenário de Build travada + Retry (Playwright, banco real local) | 16/16 checks — detecção após o limite de 20s, mensagem explicativa, Retry Build funcional, Timeline com `BuildFailed`→`BuildRetried`→`BuildFinished`; zero erros de console |
| Golden Path em produção | Bloqueado — migration do Sprint 2.4 não aplicada em produção (ver Deploy, abaixo, e IMPLEMENTATION_LOG.md); só login + criação de Project/Game confirmados em prod |

### Produto

| Métrica | Valor |
|---|---|
| Páginas | 11 (nova: `/games/[id]/versions/[versionId]`) |
| Repositories implementados | 9 (Studio, Project, Game, KnowledgeDocument, Submission, GameVersion, Release, Platform, StudioEvents — `Build` ganhou `update()`) |
| Eventos de domínio emitidos | 7 (`VersionCreated`, `BuildCreated`, `BuildFinished`, `BuildFailed`, `BuildRetried`, `ReleaseCreated`, `SubmissionCreated`) — persistidos em `studio_events` |
| Débitos técnicos registrados (backlog, não bloqueantes) | 3 — `build_number` por contagem no client, `artifact_url` mockado, N+1 em `usePublishableReleases` (ver `DECISIONS.md`) |
| ADRs | 4 |
| SPECs | 9 |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Stack Supabase local (Docker) | testada e parada ao final — não fica rodando entre sessões |
| Limite de detecção de Build travada | 20s (`BUILD_SIMULATION_STUCK_THRESHOLD_MS`, centralizado em `apps/web/lib/build-simulation.ts`) |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | ✅ deploy do commit `da76df5` (status `success`). Golden Path de produção **bloqueado**: migration do Sprint 2.4 nunca foi aplicada ao Supabase de produção (schema desatualizado — `game_versions`/`builds`/`releases` sem as colunas novas), sem `SUPABASE_ACCESS_TOKEN` disponível nesta sessão para aplicar. Confirmados em produção: login com conta de teste dedicada, criação real de Project/Game. Não exercitado em produção: Version/Build/Release/Submission (bloqueados pela migration pendente) — validado apenas localmente (29/29 + 16/16). Ver IMPLEMENTATION_LOG.md |
| Supabase | — (schema pronto, sem projeto remoto — Sprint 1.8) |
| Ambientes | Production (`main`, deploy automático a cada push) |

---

## Sprint 2.5.1 — Production Readiness

**Data:** 2026-08-04

Sprint puramente de processo — sem funcionalidade de produto, sem mudança em `apps/web`/`packages/*`. Entrega o processo/ferramenta que faltava depois de o Sprint 2.5 revelar uma migration validada localmente mas nunca aplicada em produção.

### Código

| Métrica | Valor |
|---|---|
| Sprints concluídos | Sprint 0–1 completos + Sprint 2.0–2.5.1 |
| Arquivos (git-tracked) | 319 |
| Commits totais | 61 (antes deste commit) |
| Build | ✅ (inalterado — nenhum código de app/package tocado) |
| Typecheck | ✅ |
| Lint | ✅ |

### Qualidade

| Métrica | Valor |
|---|---|
| `scripts/check-schema-sync.sh` — caminho sem credencial | ✅ falha corretamente com mensagem clara e `exit 1`, direto e via `pnpm check:schema` |
| `scripts/check-schema-sync.sh` — caminho com credencial válida | ⬜ não exercitado nesta sessão (sem `SUPABASE_ACCESS_TOKEN`/`SUPABASE_DB_URL` disponível — mesma limitação do Sprint 2.5) |

### Produto

| Métrica | Valor |
|---|---|
| Nenhum Product Delta | sprint de processo/infraestrutura (`DEFINITION_OF_DONE.md` §9) |
| Documentos operacionais novos | 1 (`DEPLOY_RUNBOOK.md`) |
| Gates formais de processo | 1 novo (`DEFINITION_OF_DONE.md` §10 — Gate de Schema/Migrations) |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Pipeline de CI | Nenhum — decisão explícita mantida (ver `DECISIONS.md`), migrations continuam aplicadas manualmente, com script de verificação + checklist em vez de automação completa |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | não aplicável — sem mudança de UI/frontend neste sprint |
| Supabase | **pendência não resolvida:** migration do Sprint 2.4 continua não aplicada em produção — falta credencial (`SUPABASE_ACCESS_TOKEN`/connection string) |
| Ambientes | Production (`main`, deploy automático a cada push) |

---

## Sprint 2.6 — Eventos tipados + widgets reais de Dashboard

**Data:** 2026-08-05

Retomada de funcionalidades de negócio após o Sprint 2.5.1 (processo). Eventos tipados do Release Pipeline + 3 widgets reais de Dashboard (Latest Builds, Failed Builds, Pending Releases). Golden Path de produção segue bloqueado pela migration pendente do Sprint 2.4 (herdada, não resolvida neste sprint).

### Código

| Métrica | Valor |
|---|---|
| Sprints concluídos | Sprint 0–1 completos + Sprint 2.0–2.6 |
| Apps | 1 (`apps/web`) |
| Packages | 11 |
| Arquivos (git-tracked) | 322 |
| Linhas de código (ts/tsx/js/jsx/sql/css) | 10246 |
| Commits totais | 62 (antes deste commit) |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |

### Qualidade

| Métrica | Valor |
|---|---|
| Testes unitários | 0 |
| Testes E2E | 0 |
| Cobertura (%) | 0% |
| Validação local (Playwright, banco real) | 12/12 checks — widgets do Dashboard com dados reais, regressão do golden path (Game→Version→Build→Release), zero erros de console em execução limpa |
| Observação | Um 401 isolado apareceu numa execução; não reproduziu em 4 tentativas limpas subsequentes (flake de renovação de token, não regressão deste sprint) |

### Produto

| Métrica | Valor |
|---|---|
| Páginas | 11 (inalterado — Dashboard ganhou seção nova, não é rota nova) |
| Widgets de Dashboard conectados a dados reais | 3 (Latest Builds, Failed Builds, Pending Releases) — os demais continuam mock |
| Eventos de domínio tipados | 7 (`ReleasePipelineEvent`, `apps/web/lib/domain-events.ts`) |
| Repositories com queries studio-wide novas | 2 (`builds-repository.listRecentByStudio()`, `releases-repository.listPendingByStudio()`) |
| ADRs | 4 |
| SPECs | 9 |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Stack Supabase local (Docker) | testada e parada ao final — não fica rodando entre sessões |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | a validar após push (pendente) |
| Supabase | **pendência não resolvida (herdada do Sprint 2.4):** migration continua não aplicada em produção — bloqueia também a validação de produção deste sprint (widgets dependem das colunas novas) |
| Ambientes | Production (`main`, deploy automático a cada push) |

---

## Sprint 2.7 — Gerenciar membros existentes (trocar papel / remover)

**Data:** 2026-08-05

Trocar papel e remover membro do Studio, fechando um gap real de RLS encontrado no planejamento (`users`/`user_roles` sem gate de permissão desde o Sprint 1.7). Duas migrations agora pendentes de produção (Sprint 2.4 + esta).

### Código

| Métrica | Valor |
|---|---|
| Sprints concluídos | Sprint 0–1 completos + Sprint 2.0–2.7 |
| Apps | 1 (`apps/web`) |
| Packages | 11 |
| Arquivos (git-tracked) | 324 |
| Linhas de código (ts/tsx/js/jsx/sql/css) | 10505 |
| Commits totais | 63 (antes deste commit) |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |

### Qualidade

| Métrica | Valor |
|---|---|
| Testes unitários | 0 |
| Testes E2E | 0 |
| Cobertura (%) | 0% |
| Migration validada contra Postgres real | ✅ (`supabase migration up`, local/Docker) — políticas confirmadas via `\d+` no psql |
| Fluxo positivo (Playwright, Owner) | 9/9 checks — troca de papel, remoção, persistência após logout/login, zero erros de console |
| Fluxo negativo (Playwright, Member sem permissão) | 5/5 checks — RLS bloqueia de verdade (não só a UI), erro amigável, nenhuma mudança persistida |

### Produto

| Métrica | Valor |
|---|---|
| Páginas | 11 (inalterado — `/settings/studio` ganhou funcionalidade, não é rota nova) |
| Repositories implementados | 10 (+ `Role`) |
| Ações de gerenciamento de membro | 2 novas (trocar papel, remover) — invite/revoke já existiam |
| Achado de segurança fechado | 1 (RLS de `users`/`user_roles` sem gate de permissão, pré-existente desde o Sprint 1.7) |
| ADRs | 4 |
| SPECs | 9 |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Stack Supabase local (Docker) | testada e parada ao final — não fica rodando entre sessões |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | ✅ deploy do commit `1a06e77` (status `success`) |
| Supabase | ✅ **as 2 migrations pendentes (Sprint 2.4 + 2.7) já estavam aplicadas em produção**, confirmado de forma independente (PostgREST + `pg_dump` do schema) — ver Sprint 2.7.1 no IMPLEMENTATION_LOG.md |
| Ambientes | Production (`main`, deploy automático a cada push) |

---

## Sprint 2.7.1 — Fechamento da validação de produção (Sprint 2.4–2.7)

**Data:** 2026-08-05

Aplicação/confirmação das 2 migrations pendentes em produção + validação funcional completa (positiva e negativa) do gerenciamento de membros direto contra o Supabase de produção. Um bug real foi encontrado e corrigido no próprio `scripts/check-schema-sync.sh` (falso negativo — reportava tudo como pendente por não saber ler o JSON da CLI).

### Qualidade

| Métrica | Valor |
|---|---|
| `pnpm check:schema` (produção, após correção do script) | ✅ verde |
| Validação funcional de produção — gerenciamento de membros | 17/17 checks — 4 fluxos negativos bloqueados pela RLS (Member sem permissão, incluindo tentativas contra o Owner) + 4 fluxos positivos do Owner (troca de papel nos dois sentidos, remoção) + proteção do Owner testada até contra si mesmo, todos com evidência via chamadas REST diretas, não só a UI |
| Contas de teste usadas | 1 dedicada (`teste@aigamestudioos.com`, Studio isolado) + 2 descartáveis criadas e removidas por completo neste sprint |
| Bug real corrigido | 1 (`check-schema-sync.sh` — parsing de JSON, commit `1a06e77`) |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | ✅ deploy do commit `1a06e77` (status `success`) |
| Supabase | ✅ Sprint 2.4 e Sprint 2.7 confirmadas aplicadas em produção. Golden Path *funcional* (não só schema) do Release Pipeline (2.4/2.5/2.6) ainda não reexecutado em produção nesta sessão — próximo passo, sem bloqueio de credencial |
| Ambientes | Production (`main`, deploy automático a cada push) |

---

## Sprint 2.8 — Store Connections: schema + RLS + Vault (sem UI)

**Data:** 2026-08-06

Primeiro dos 3 incrementos do Store Connections (Apple/Google). Auditoria de Fase 1 obrigatória encontrou 2 conflitos de arquitetura reais (resolvidos antes de qualquer código) e confirmou a divisão em 3 sprints. Sem funcionalidade visível — só backend (RLS + Vault + repository).

### Código

| Métrica | Valor |
|---|---|
| Sprints concluídos | Sprint 0–1 completos + Sprint 2.0–2.8 |
| Apps | 1 (`apps/web`) |
| Packages | 11 |
| Arquivos (git-tracked) | 326 |
| Linhas de código (ts/tsx/js/jsx/sql/css) | 10907 |
| Commits totais | 66 (antes deste commit) |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |

### Qualidade

| Métrica | Valor |
|---|---|
| Testes unitários | 0 |
| Testes E2E | 0 |
| Cobertura (%) | 0% |
| Migration validada contra Postgres real | ✅ (`supabase db reset`, reconstrução completa do zero) — colunas/policies/trigger/extensão confirmados via `\d`/`\dx`/`\df` no psql |
| Validação funcional (script Node, 2 contas reais, Studio de teste descartável) | 18/18 checks — RLS positiva/negativa (create/select/update/delete), Vault grava/lê/limpa corretamente, segredo nunca em texto puro na tabela nem acessível via API |
| Bug real corrigido | 1 (`vault.delete_secret()` não existe na versão instalada — corrigido para `DELETE` direto em `vault.secrets`, achado testando contra Postgres real) |

### Produto

| Métrica | Valor |
|---|---|
| Nenhum Product Delta | sprint de backend/infraestrutura — UI chega no Sprint 2.10 (`DEFINITION_OF_DONE.md` §9) |
| Repositories implementados | 11 (+ `StoreConnections`) |
| Mecanismo de segredo implementado | Supabase Vault (extensão nativa) — primeira vez usado no projeto |
| Conflitos de arquitetura resolvidos antes de codificar | 2 (`encrypted_credentials` vs `credentials_ref`; chamadas ad hoc vs Adapter Pattern de `AGSOS-SPEC-008`) |
| ADRs | 4 |
| SPECs | 9 |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Stack Supabase local (Docker) | testada e parada ao final — não fica rodando entre sessões |
| Extensões novas | `supabase_vault` |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | não aplicável — sem mudança de UI/frontend neste sprint |
| Supabase | migration validada localmente; aplicação em produção pendente de credencial (mesmo processo do `DEPLOY_RUNBOOK.md`) |
| Ambientes | Production (`main`, deploy automático a cada push) |

---

## Sprint 2.9 — Apple App Store Connect (infraestrutura da integração completa)

**Data:** 2026-08-06

Primeira integração externa real do AGSOS (`AGSOS-SPEC-008`) — adapter Apple completo, UI de Store Connections, validação real (não simulada) contra a API da Apple. Google Play e publicação de verdade explicitamente fora de escopo.

### Código

| Métrica | Valor |
|---|---|
| Sprints concluídos | Sprint 0–1 completos + Sprint 2.0–2.9 |
| Apps | 1 (`apps/web`) |
| Packages | 11 (`@agsos/integrations` ganha implementação real pela primeira vez) |
| Arquivos (git-tracked) | 336 |
| Linhas de código (ts/tsx/js/jsx/sql/css) | 12007 |
| Commits totais | 67 (antes deste commit) |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |

### Qualidade

| Métrica | Valor |
|---|---|
| Testes unitários | 0 |
| Testes E2E | 0 |
| Cobertura (%) | 0% |
| Golden Path (Playwright, UI real, banco real) | 15/15 checks — criar/validar (chamada real à Apple)/persistência/disconnect/remover, zero erros de console |
| Fluxo negativo de permissão/RLS (script direto, banco real) | 9/9 checks — `get_store_connection_secret` inacessível até para o Owner autenticado (só `service_role`), `clear_store_connection_secret` bloqueado para Member sem permissão |
| Validação com credenciais Apple reais | ⬜ não realizada — sem conta de teste disponível (não é uma falha, é uma pendência documentada) |
| `pnpm check:schema` | ⬜ não executado — sem `SUPABASE_ACCESS_TOKEN` nesta sessão |

### Produto

| Métrica | Valor |
|---|---|
| Páginas | 12 (nova: `/settings/store-connections`) |
| Adapters de integração implementados | 1 (`ApplePublishingAdapter` — `AGSOS-SPEC-008`) |
| Eventos de domínio com call site real | 6 de 6 (`StoreConnectionCreated/Updated/Validated/Deleted/HealthChecked`, `StoreAppsDiscovered`) |
| Bugs reais corrigidos | 3 (`@types/node` faltando, Studio seedado sem permissions, `seed.sql` gerado não sincronizado com `seed/*.sql`) |
| ADRs | 4 |
| SPECs | 9 |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Stack Supabase local (Docker) | testada e parada ao final — não fica rodando entre sessões |
| Dependências novas | `@types/node` em `packages/integrations` (sem dependência de runtime nova — JWT ES256 via `node:crypto`) |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | não deployado nesta sessão — usuário pediu para parar ao final do Sprint 2.9 sem push automático |
| Supabase | 2 migrations pendentes de produção (Sprint 2.8 + esta) |
| Ambientes | Production (`main`, deploy automático a cada push) |

---

## Sprint 2.9.1 — Fechamento de produção + correção de segurança crítica

**Data:** 2026-08-07

Aplicação das 2 migrations pendentes (2.8+2.9) em produção + achado e correção de um gap de segurança real (`anon` conseguia chamar `get_store_connection_secret()`) — não detectável localmente, só validando produção de verdade.

### Qualidade

| Métrica | Valor |
|---|---|
| `pnpm check:schema` (produção) | ✅ verde, 3 migrations em sincronia |
| Verificação independente pós-deploy (PostgREST + `db dump --linked`) | ✅ — foi essa verificação que revelou o gap de `GRANT` |
| Chamada REST anônima real (antes da correção) | ❌ `get_store_connection_secret` executava sem erro — gap confirmado |
| Chamada REST anônima real (depois da correção) | ✅ `401 permission denied` nas 3 funções |
| Achado crítico de segurança | 1 — `anon` com `EXECUTE` indevido em 3 funções `SECURITY DEFINER`, corrigido no mesmo ciclo |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | ✅ deploy do commit `a30a6c7` confirmado `success` |
| Supabase | ✅ 3 migrations aplicadas em produção (`20260806000001`, `20260807000001`, `20260807000002` — a última é a correção de segurança) |
| Ambientes | Production (`main`, deploy automático a cada push) |

## Sprint 2.10 — Google Play Integration Foundation

**Data:** 2026-08-08

`GooglePlayPublishingAdapter` (OAuth2 Service Account, RS256) sobre um framework compartilhado novo (`packages/integrations/src/core/`) — Apple retrofitado sobre o mesmo framework no mesmo sprint, sem duplicar adapter por provider. Sem migration nova (schema já agnóstico de provider desde o Sprint 2.8/2.9).

### Código

| Métrica | Valor |
|---|---|
| Apps | 1 |
| Packages | 11 |
| Arquivos (git-tracked) | 337 |
| Linhas de código (ts/tsx/js/jsx/sql/css) | 12187 |
| Commits totais | 70 |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |
| Novos arquivos (`packages/integrations/src/core/`, `google-play/`) | 8 |
| Packages modificados | 2 (`@agsos/integrations`, `web`) |

### Qualidade

| Métrica | Valor |
|---|---|
| `pnpm turbo run build lint typecheck` | ✅ 36/36 tasks |
| Teste negativo real contra Google (Service Account fabricada, chamada real a `oauth2.googleapis.com/token`) | ✅ rejeitado pelo Google, erro sanitizado sem vazar a chave |
| Vault local — `set_store_connection_secret()` autenticado | ✅ |
| Vault local — `get_store_connection_secret()` como `authenticated` | ❌ bloqueado (`403`, esperado) |
| Vault local — `get_store_connection_secret()` como `anon` | ❌ bloqueado (`401`, esperado) |
| Vault local — `get_store_connection_secret()` como `service_role` | ✅ (`200`) |
| SQL Security Checklist (`DEFINITION_OF_DONE.md` §11) | N/A — nenhuma função `SECURITY DEFINER` nova neste sprint |

### Produto

| Métrica | Valor |
|---|---|
| Páginas | 18 |
| Rotas | 18 |
| Componentes UI | 16 |
| Providers | 1 |
| Hooks | 18 |
| ADRs | 4 |
| SPECs | 9 |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Tempo do build (monorepo completo, cache quente) | 1s |
| Tempo do build (apps/web isolado) | 78s |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | não deployado nesta sessão — commit local, push pendente de autorização |
| Supabase | nenhuma migration nova (schema reusado sem alteração) |
| Ambientes | Local (Docker) validado; Production não tocado neste sprint |

## Sprint 2.10.1 — Integration Health / Observability

**Data:** 2026-08-09

Painel de Integration Health por Store Connection, sobre um evento operacional novo (`StoreConnectionCallCompleted`) agregado em read-side sobre `studio_events` já existente — sem migration, sem tabela de métricas nova.

### Código

| Métrica | Valor |
|---|---|
| Apps | 1 |
| Packages | 11 |
| Arquivos (git-tracked) | 345 |
| Linhas de código (ts/tsx/js/jsx/sql/css) | 12731 |
| Commits totais | 71 |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |
| Arquivos alterados/novos neste sprint | 13 (3 novos: `integration-health.ts`, `health-actions.ts`, `use-integration-health.ts`) |
| Packages modificados | 2 (`@agsos/database`, `@agsos/integrations`) + `web` |

### Qualidade

| Métrica | Valor |
|---|---|
| `pnpm turbo run build lint typecheck` | ✅ 36/36 tasks |
| Fixtures de agregação (`node --experimental-strip-types`) | ✅ 21/21 assertions, 12 cenários (10 pedidos + 2 extras) |
| Supabase local — insert autenticado `StoreConnectionCallCompleted` | ✅ `201` (sucesso e falha) |
| Supabase local — insert com `studio_id` de outro Studio | ❌ bloqueado (`403`, RLS também cobre insert) |
| Supabase local — isolamento de leitura entre Studios | ✅ segundo Studio vê `[]`, founder vê só as suas 2 linhas |
| Playwright — clique real em Validate atualiza o painel ao vivo | ✅ (Google Play, credencial fabricada, chamada real ao Google) |
| Playwright — light/dark, desktop/tablet/mobile | ✅ sem overflow, contraste ok nos dois temas |
| Playwright — erros de console | ✅ nenhum reproduzível (um `401` isolado não se repetiu numa segunda execução idêntica) |
| SQL Security Checklist (`DEFINITION_OF_DONE.md` §11) | N/A — nenhuma função `SECURITY DEFINER` nova |

### Produto

| Métrica | Valor |
|---|---|
| Páginas | 18 |
| Rotas | 18 |
| Componentes UI | 16 |
| Providers | 1 |
| Hooks | 19 |
| ADRs | 4 |
| SPECs | 9 |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Tempo do build (monorepo completo, cache quente) | 0s |
| Tempo do build (apps/web isolado) | 69s |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | não deployado nesta sessão — commit local, push pendente de autorização |
| Supabase | nenhuma migration nova |
| Ambientes | Local (Docker, serviços reduzidos) validado; Production não tocado neste sprint |

## Fase 0 do Sprint 2.11 — Fechamento de produção do Sprint 2.10.1

**Data:** 2026-08-09

Smoke-check de produção do painel Integration Health (conta de teste), que revelou e corrigiu um achado crítico pré-existente desde o Sprint 2.8 (`platforms` vazia em produção — ninguém nunca conseguiu criar uma Store Connection real).

### Qualidade

| Métrica | Valor |
|---|---|
| Achado crítico encontrado e corrigido no mesmo ciclo | 1 — `platforms` vazia em produção desde o Sprint 2.8 |
| `pnpm check:schema` (produção, pós-migration) | ✅ verde |
| Verificação independente (REST autenticado) | ✅ 3 linhas de `platforms` confirmadas |
| Smoke-check Playwright produção — golden path completo (criar → validate → status/erro/métricas → limpeza) | ✅ Apple e Google, sem vazamento de segredo, zero erros de console |
| Conta de teste restaurada ao estado original | ✅ confirmado por screenshot |

### Migrations

| Métrica | Valor |
|---|---|
| Migrations novas | 1 (`20260809000001_platforms_seed_backfill.sql`) |
| Testada localmente antes de produção | ✅ `supabase db reset` completo |
| Aplicada em produção | ✅ `supabase db push --linked` (dry-run revisado antes) |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | não redeployado (mudança é só de dados via migration, sem alteração de código de app) |
| Supabase | 1 migration aplicada em produção |
| Ambientes | Production tocado e validado nesta entrada — smoke-check real de ponta a ponta pela UI, primeira vez na história do projeto |

## Sprint 2.11a — Artifact Storage Foundation

**Data:** 2026-08-07

### Código

| Métrica | Valor |
|---|---|
| Apps | 1 |
| Packages | 11 |
| Arquivos (git-tracked) | 349 (antes de commitar este sprint) |
| Linhas de código (ts/tsx/js/jsx/sql/css) | 13084 (antes de commitar este sprint) |
| Commits | 73 |
| Typecheck | ✅ |
| Lint | ✅ |
| Build | ✅ (73s monorepo completo) |
| Migrations novas | 1 (`20260810000001_build_artifacts.sql`) |
| Packages tocados | 3 (`@agsos/database`, `@agsos/storage`, `web`) — dentro do limite de 3 do `CLAUDE.md` |

### Qualidade

| Métrica | Valor |
|---|---|
| Casos de validação estrutural testados manualmente | 7/7 corretos (AAB válido, IPA válido, ZIP corrompido, AAB sem manifest base, oversized, extensão inválida) |
| Casos de segurança testados contra Postgres/Storage real local | 12/12 confirmados via REST/RPC/Storage API (anon bloqueado, permission gate, isolamento cross-Studio em tabela e em Storage, download/remoção só via service_role) |
| Checklist de Segurança SQL (`DEFINITION_OF_DONE.md` §11) | ✅ aplicado e confirmado (`pg_proc.proacl` sem `anon`) |
| Testes automatizados (unit/E2E) | 0 — nenhuma suíte existe no repositório para nenhum package/app (gap pré-existente, fora do escopo deste sprint) |

### Produto

| Métrica | Valor |
|---|---|
| Novo componente de UI | `BuildArtifactPanel` (upload/progresso/cancelamento/download/remoção por Build) |
| Novo hook | `useBuildArtifacts` |
| Novas Server Actions | 5 (`createPendingArtifact`, `markArtifactUploadFailed`, `confirmArtifactStored`, `getArtifactDownloadUrl`, `archiveArtifact`) |
| Eventos novos | 7 (`BuildArtifactUploadStarted/Stored/UploadFailed/ValidationStarted/Validated/ValidationFailed/Removed`) |

### Deploy

| Métrica | Valor |
|---|---|
| Supabase (local) | migration aplicada e revalidada 2x via `supabase db reset` completo, incluindo bucket `builds` e policy de `storage.objects` |
| Supabase (produção) | ✅ `20260810000001_build_artifacts.sql` aplicada via `supabase db push`; `check-schema-sync.sh` verde 2x (antes e depois do restante do trabalho) |
| Vercel | ✅ commits `8b3680c` e `925ba09` deployados e confirmados via `gh api .../status` (`state: success`) |

## Sprint 2.11a — Fechamento do Gate de Produção

**Data:** 2026-08-07 (sessão separada, credenciais fornecidas via arquivo local)

### Segurança (produção real)

| Métrica | Valor |
|---|---|
| Casos de segurança testados contra produção real (REST/RPC/Storage) | 14/14 confirmados |
| Checklist de Segurança SQL (`create_pending_build_artifact`) | ✅ 6/6 itens, `anon` sem EXECUTE confirmado em produção |
| Golden Path backend (sem UI) | ✅ upload→confirmação→validação→persistência→cancelamento→retry→arquivamento, dados reais de produção |
| Golden Path E2E/UI real (Playwright contra a app deployada) | ✅ 22/22 itens, TUS real via `tus-js-client`, 0 erros de console, 0 padrão de secret, 0 overflow (light/dark × desktop/mobile) |
| Bugs encontrados pelo E2E e corrigidos no mesmo ciclo | 1 — cancelamento gravava `FAILED` em vez de `CANCELED` (commit `925ba09`) |

### Cleanup de dados de teste

| Métrica | Valor |
|---|---|
| Studios/Users QA residuais ao final | 0 (3 pares limpos — 2 da suíte de segurança, 1 do E2E) |
| Achado de infraestrutura no cleanup | FK circular `studios.owner_user_id` ↔ `users.studio_id`; resolvido via script SQL administrativo com guardrails (rodado pelo usuário no SQL Editor), incluindo prova de que todo `studio_events` residual era de teste antes de removê-lo |
| Verificação final independente | ✅ zero resíduo em `auth.users`, `public.users`, `studios`, `build_artifacts`, `studio_events`, `roles`, `invites`, `projects`, `games`, `builds`, `game_versions`, `user_roles`, `role_permissions`, e no bucket `builds` |

### Deploy

| Métrica | Valor |
|---|---|
| Supabase | migration aplicada em produção, schema sync verde |
| Vercel | 2 deploys confirmados (`8b3680c`, `925ba09`) |
| Classificação final | **Sprint 2.11a — CONCLUÍDO** |

## Sprint 2.11b — Google Play AAB Upload (TRANSPORTE VALIDADO / FUNCIONAL PENDENTE)

**Data:** 2026-08-10/11

### Código

| Métrica | Valor |
|---|---|
| Arquivos alterados (2 commits de código) | 20 |
| Migrations novas | 2 (`20260811000001_provider_uploads.sql`, `20260811000002_fix_studios_users_deferrable_fk.sql` — hotfix) |
| Packages tocados | 3 (`database`, `integrations`, `web`) |
| Build/lint/typecheck | ✅ 13/13 tasks |

### Segurança (produção real)

| Métrica | Valor |
|---|---|
| Casos de segurança confirmados via chamada real | 6/6 |
| Grants da função `create_pending_provider_upload` | ✅ sem `anon`, confirmado via dump independente |
| Golden Path backend + UI real (Playwright) | ✅ OAuth real rejeitado, erro sanitizado, persistência, retry, limite de 150MB, 0 console errors, 0 secret leak |

### Incidente crítico e correção

| Métrica | Valor |
|---|---|
| Regressão encontrada | `bootstrap_studio_for_current_user()` bloqueado para toda conta nova desde o cleanup do GATE 9 do Sprint 2.11a |
| Causa raiz | `ALTER CONSTRAINT ... NOT DEFERRABLE` incorreto num script de cleanup anterior |
| Correção | `20260811000002_fix_studios_users_deferrable_fk.sql`, aplicada em produção, revalidada com conta real (`200`) |
| Débito novo registrado | política oficial de lifecycle/deletion de Studio (`DECISIONS.md`) |

### Cleanup

| Métrica | Valor |
|---|---|
| Dado operacional mutável removido | 100% (11 tabelas + Storage + Vault) |
| Studios/Users QA residuais (intencional, auditável) | 2 Studios + 2 `public.users` owner + 8 `studio_events` — nunca removíveis por design (Event Store append-only) |
| `auth.users` QA | banidos (`ban_duration` ≈100 anos), login confirmado rejeitado |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | ✅ commits `ab1448e`, `905bd6f` (`state: success`) |
| Supabase | ✅ 2 migrations aplicadas, `check:schema` verde |
| Classificação final | **TRANSPORTE VALIDADO / FUNCIONAL PENDENTE** — Sprint 2.11b CONCLUÍDO |

## Sprint 2.11d-1 — Provider Transfer Engine: GATEs 0-5 + primitivas de streaming/resumable/checkpoint (PARCIAL, split deliberado)

**Data:** 2026-08-13

### Código

| Métrica | Valor |
|---|---|
| Arquivos alterados/criados (não commitado ainda) | 17 |
| Migrations novas | 4 (`null_safe_studio_checks`, `integration_jobs`, `job_claim_and_enqueue`, `resumable_session_vault`) |
| Packages tocados | 3 (`storage`, `integrations`, migrations do `supabase`) — dentro do limite do `CLAUDE.md` |
| ADRs novos | 1 (`ADR-006-provider-transfer-worker.md`) |
| Build/lint/typecheck | ✅ monorepo completo (12/12 tasks) |

### GATEs concluídos

| Gate | Resultado |
|---|---|
| GATE 0 (NULL-safety) | ✅ `IS DISTINCT FROM` em 4 funções SECURITY DEFINER, testado (4 casos) |
| GATE 1 (ADR infra worker) | ✅ Option E (`integration_jobs`+pg_cron/pg_net+dispatcher bounded) |
| GATE 2/3 (reuso `integration_jobs` + state machines) | ✅ enums `job_status`/`job_error_class`, RLS só-leitura |
| GATE 4 (claim atômico + lease) | ✅ `FOR UPDATE SKIP LOCKED` confirmado sem double-claim em teste paralelo real; `requeue_stale_jobs()` testado (QUEUED e DEAD) |
| GATE 5 (idempotência de enqueue) | ✅ guarda contra retry manual concorrente, testado; os outros 6 casos do sprint dependem do worker real (2.11d-2) |

### Primitivas de transferência

| Item | Resultado |
|---|---|
| Streaming/range read do Storage | ✅ `downloadObjectRange`/`getObjectSizeViaRange`, 206+Content-Range confirmado empiricamente |
| Benchmark de memória (leitura por Range, 10-200MB) | ✅ delta RSS ~48-64MB, aproximadamente constante — critério do sprint atingido para esta primitiva (benchmark do fluxo completo fica para 2.11d-2) |
| Google resumable upload (adapter) | ✅ `createResumableSession`/`uploadResumableChunk`/`queryResumableProgress` |
| Vault para `google_resumable_session_ref` | ✅ set/get/clear, `service_role`-only, round-trip + overwrite + clear testados |
| Apple checkpoint por `uploadOperation` (primitiva) | ✅ `startIndex`/`onOperationComplete` no client/adapter — integração com `integration_jobs.checkpoint` fica para 2.11d-2 |

### Escopo explicitamente não coberto (proposto como 2.11d-2)

Worker `/api/jobs/tick`; `pg_cron`/`pg_net` habilitado+agendado; Server Actions enqueue-and-return; UI de polling; benchmark do fluxo completo; 14 dos 20 testes mandatórios do sprint original.

### Deploy

| Métrica | Valor |
|---|---|
| Produção | Não tocada — autorização de produção não solicitada nem dada para este sub-sprint |
| Classificação final | **PARCIAL por divisão deliberada** (não por falha) — ver `IMPLEMENTATION_LOG.md` |

## Sprint 2.11d-2a — Dispatcher + Scheduler (GATEs 6-10, 17 parcial, 22, 23)

**Data:** 2026-08-14

### Código

| Métrica | Valor |
|---|---|
| Arquivos alterados/criados | 16 (10 novos) |
| Migrations novas | 2 (`dispatcher_job_lifecycle_rpcs`, `pg_cron_dispatcher_schedule`) |
| Packages tocados | 3 (`web`, `database`, migrations do `supabase`) — dentro do limite do `CLAUDE.md` |
| Build/lint/typecheck | ✅ monorepo completo |
| `supabase db reset` (banco do zero) | ✅ todas as migrations em ordem |

### GATEs concluídos (parcial ou total)

| Gate | Resultado |
|---|---|
| GATE 6 (dispatcher endpoint) | ✅ `/api/jobs/tick`, bounded, sem fire-and-forget |
| GATE 7 (autenticação do dispatcher) | ✅ `timingSafeEqual`, 401/415/413/405 testados via curl real; bug de middleware encontrado e corrigido |
| GATE 8 (scheduler) | ✅ `pg_cron`+`pg_net`, config via Vault, `net._http_response` confirmou chamada HTTP real |
| GATE 9 (bounded execution) | ✅ deadline explícito, testado (checkpoint/continue em 3 invocations separadas) |
| GATE 10 (lease heartbeat) | ✅ `renewLease()` sem erro em ~15 chamadas; recovery de worker morto testado nos dois sentidos (requeue e DEAD) |
| GATE 12/18 (duplicate enqueue) | ✅ mecânica confirmada (guarda inalterada do 2.11d-1, já validada via HTTP real) |
| GATE 17 (retry automático) | ✅ parcial — RETRYABLE/NON_RETRYABLE/exaustão testados com jobs reais; falta `Retry-After` de provider real |
| GATE 22 (crash/stale lease) | ✅ parcial — os 2 casos testáveis sem provider real, testados |
| GATE 23 (concorrência) | ✅ parcial — 3 dispatchers simultâneos, 0 double-processing em 9 jobs |

### Bug encontrado e corrigido

| Item | Detalhe |
|---|---|
| Middleware bloqueando `/api/jobs/tick` | `307` para `/login` mesmo com secret correto — corrigido excluindo a rota do `matcher` (ver `DECISIONS.md`) |
| Tipos desincronizados (débito do 2.11d-1) | `ProviderUploadStatus`/`ProviderUploadsRow` sem os campos novos, `IntegrationJobsRow` inexistente — corrigido, revelado por erro real de `tsc` |

### Deploy

| Métrica | Valor |
|---|---|
| Produção | Não tocada |
| Classificação final | **PARCIAL por divisão deliberada** (não por falha) — ver `IMPLEMENTATION_LOG.md` |

## Sprint 2.11d-2b — Server Actions enqueue-and-return + UI assíncrona

**Data:** 2026-08-14

### Código

| Métrica | Valor |
|---|---|
| Arquivos alterados | 6 (`provider-upload-actions.ts`, `apple-provider-upload-actions.ts`, `use-provider-uploads.ts`, `google-play-send-section.tsx`, `apple-send-section.tsx`, `domain-events.ts`) |
| Migrations novas | 0 |
| Packages tocados | 1 (`web`) |
| Build/lint/typecheck | ✅ monorepo completo |

### GATEs concluídos (parcial ou total)

| Gate | Resultado |
|---|---|
| GATE 11 (Server Actions enqueue-and-return) | ✅ nenhuma chamada a Google/Apple resta no request web (confirmado por leitura de código + build) |
| GATE 12 (duplicate enqueue) | ✅ parcial — guarda de banco inalterada/já validada; reforço de UI feito, não testado com browser real |
| GATE 19 (UI assíncrona) | ✅ toasts não fingem resultado, estado real vem do banco |
| GATE 20 (polling) | ✅ só enquanto não-terminal, para no unmount/terminal, sem infra nova |
| GATE 21 (progresso monótono) | ✅ nenhum percentual fabricado (nem antes nem agora) |

### Deploy

| Métrica | Valor |
|---|---|
| Produção | Não tocada |
| Classificação final | **PARCIAL por divisão deliberada** (não por falha) — falta processor real de provider para fechar o ciclo completo |

## Sprint 2.11d-2c — Google worker real

**Data:** 2026-08-14/15

### Código

| Métrica | Valor |
|---|---|
| Arquivos alterados/criados | 5 (`google-play.ts` novo, `registry.ts`, `types.ts`, `dispatcher.ts`, `database.types.ts`) |
| Migrations novas | 1 (`grant_service_role_privileges` — bug pré-existente corrigido) |
| Packages tocados | 2 (`web`, `database`) + migrations |
| Build/lint/typecheck | ✅ monorepo completo |
| `supabase db reset` | ✅ |

### Bug real encontrado e corrigido

| Item | Detalhe |
|---|---|
| `service_role` sem GRANT de tabela | Pré-existente desde o início do projeto, nunca percebido (todo acesso anterior via RPC SECURITY DEFINER); mesma classe do bug já corrigido para `authenticated` no Sprint 1.7 |

### Teste empírico (metodologia 2.11b: credencial sintética + chave RSA real contra Google real)

| Caso | Resultado |
|---|---|
| Fixture completa (Studio→Game→Build→BuildArtifact 2MB no Storage→StoreConnection+Vault) | ✅ criada e removida ao final |
| Dispatcher real processando o job `google_play` | ✅ alcançou `oauth2.googleapis.com` real, rejeição real classificada, retry agendado |
| Reaproveitamento de `editId` via checkpoint plantado | ✅ confirmado (não recriado) |
| Auditoria de secret leak (events/checkpoint/logs) | ✅ 0 ocorrências |

### Deploy

| Métrica | Valor |
|---|---|
| Produção | Não tocada |
| Classificação final | **TRANSPORTE VALIDADO / FUNCIONAL PENDENTE** (mesma classificação de 2.11b/c) — CONCLUÍDO dentro desse limite |

## Sprint 2.11d-2d — Apple worker real

**Data:** 2026-08-15

### Código

| Métrica | Valor |
|---|---|
| Arquivos alterados/criados | 4 (`apple-app-store.ts` novo, `registry.ts`, `database.types.ts`, migration nova) |
| Migrations novas | 1 (`20260815000002_apple_operations_vault.sql`) |
| Packages tocados | 2 (`web`, `database`) + migrations |
| Build/lint/typecheck | ✅ monorepo completo (12/12 tasks) |
| Migration aplicada no Postgres local | ✅ (já estava aplicada ao retomar; confirmada via `\d`/`\df`) |

### Validação

| Caso | Resultado |
|---|---|
| Round-trip Vault (`create_secret`/`update_secret`/`decrypted_secrets`) | ✅ testado diretamente contra Postgres local |
| Contrato do adapter Apple (7 métodos usados pelo processor) | ✅ confirmado por leitura — assinatura bate |
| GRANT `service_role` cobre nova coluna sem migration extra | ✅ (`ON ALL TABLES` + `ALTER DEFAULT PRIVILEGES`, de 2.11d-2c) |
| Fixture completa + dispatcher real contra Apple sintética/real | ❌ não executado neste sprint (gap explícito) |

### Deploy

| Métrica | Valor |
|---|---|
| Produção | Não tocada |
| Classificação final | **CÓDIGO COMPLETO / TRANSPORTE NÃO REEXERCITADO** — build/lint/typecheck verdes, lógica revisada, teste de ponta a ponta contra a Apple pendente de credencial |

## Sprint 2.11d-2e — Validação final (concorrência, crash/recovery, lost-response, memória)

**Data:** 2026-08-15

### Código

| Métrica | Valor |
|---|---|
| Arquivos de produto alterados | 0 (sprint só de validação — nenhuma mudança de código do produto) |
| Scripts de teste criados | temporários, fora do repo (scratchpad da sessão), não commitados |
| Build/lint/typecheck | ✅ monorepo completo (12/12 tasks), reexecutado ao final |

### Checklist de validação (contra Postgres local real + dev server real + Apple/Google reais via rede)

| Item | Resultado |
|---|---|
| Concorrência (2 dispatchers HTTP simultâneos) | ✅ PASS — zero jobs processados por ambos (`FOR UPDATE SKIP LOCKED` confirmado) |
| Duplicate enqueue (2 chamadas HTTP concorrentes, sessão real) | ✅ PASS — exatamente 1 aceita, 1 rejeitada |
| Crash/recovery (lease morto) | ✅ PASS — job volta a QUEUED sem `claimed_by` após lease expirar |
| Lost-response reconciliation — Apple (commit "perdido") | ✅ PASS — 2 cenários (Apple já processou / Apple não processou) |
| Lost-response reconciliation — Google (chunk "perdido") | ✅ PASS — reconciliação via `queryResumableProgress` nunca reenvia bytes já aceitos |
| Retry (classificação observada) | ✅ PASS — INTERNAL→RETRY_WAIT com backoff, attempt incrementado |
| Lease (claim + expiração + requeue) | ✅ PASS |
| Secret leakage (checkpoint/eventos/resposta HTTP) | ✅ PASS — 0 ocorrências de segredo |
| Regressão Google (2.11d-2c) | ✅ PASS — processado pelo dispatcher real sem erro novo |
| Regressão Apple (2.11d-2d) | ✅ PASS — processado pelo dispatcher real sem erro novo |
| Polling da UI parando em estado terminal | ⚠️ NÃO TESTÁVEL nesta sessão (exige browser real) |
| Persistência após reload/logout-login | ⚠️ NÃO TESTÁVEL nesta sessão (exige browser real) |

### Benchmark de memória (artifact de 96MB, chunks de 8MB, amostragem de `process.memoryUsage().rss` por tick)

| Worker | RSS min/max entre ticks | Delta | Limite (30% do artifact) | Resultado |
|---|---|---|---|---|
| Google | 97.2MB / 124.7MB | 27.5MB | 28.8MB | ✅ PASS |
| Apple | 114.1MB / 114.2MB | 0.1MB | 28.8MB | ✅ PASS |

Confirma consumo ~constante em relação ao tamanho do artifact (streaming via Range reads), não linear.

### Deploy

| Métrica | Valor |
|---|---|
| Produção | Não tocada |
| Classificação final | **VALIDAÇÃO CONCLUÍDA DENTRO DO ESCOPO LOCAL** — 10/12 itens do checklist passaram com evidência real; 2 itens (polling de UI, reload/logout-login) exigem browser e ficam como gap explícito |

## Sprint 2.11d-2 — Production Validation / Final Closure (2026-08-14)

Fechamento em produção do ciclo 2.11d-2 (a-e): scheduler `pg_cron`/`pg_net` configurado com `JOBS_DISPATCHER_SECRET` real, validado ao vivo contra `https://ai-game-studio-os-web.vercel.app/api/jobs/tick`.

| Item | Resultado |
|---|---|
| Scheduler real (`pg_cron` → `pg_net` → dispatcher) | ✅ PASS — dezenas de ticks consecutivos, `status_code=200` |
| Segurança do dispatcher (sem secret / secret inválido / método errado / content-type errado / body grande) | ✅ PASS — 401/401/405/415/413 |
| Secret correto → 200 | ✅ PASS (via ticks reais do cron, mais forte que teste manual isolado) |
| Golden path assíncrono Google (produção) | ✅ TRANSPORTE VALIDADO / FUNCIONAL PENDENTE (falha esperada por falta de credencial real: `MISSING_PACKAGE_NAME`) |
| Golden path assíncrono Apple (produção) | ✅ TRANSPORTE VALIDADO / FUNCIONAL PENDENTE (falha esperada: `MISSING_BUNDLE_IDENTIFIER`) |
| Concorrência (3 dispatchers simulados, 6 jobs) | ✅ PASS — 3+3+0, zero double-claim |
| Crash/recovery (lease expirado + checkpoint parcial) | ✅ PASS — requeue com `WORKER_LEASE_EXPIRED`, checkpoint persistido |
| Scheduler failure/recovery (cron desativado e reativado) | ✅ PASS — job ficou QUEUED durante a queda, retomado automaticamente após reativação |
| Cleanup QA | ✅ feito para dados desta sessão; resíduo intencional documentado (Google jobs de sessão anterior, `studio_events` append-only) |

| Métrica | Valor |
|---|---|
| Produção | Tocada (scheduler validado, dados de teste isolados, sem efeito irreversível em provider real) |
| Classificação final do Sprint 2.11d-2 | **PASS** — único gap remanescente é Fase 7 (Playwright E2E com login humano), documentado como pendência separada que não bloqueia o PASS |

## Sprint 2.12a — Readiness Model + Backend Readiness API (2026-08-14)

Primeira camada de Readiness sobre a infraestrutura de publishing do 2.11a-d. Nada de UI (2.12b) e nada aplicado em produção.

| Métrica | Valor |
|---|---|
| Apps | 1 |
| Packages | 11 |
| Arquivos (git-tracked) | 390 |
| Linhas de código (ts/tsx/js/jsx/sql/css) | 18878 |
| Commits | 90 (antes do commit deste sprint) |
| Typecheck | ✅ |
| Lint | ✅ |
| Build | ✅ (`npx turbo run build lint typecheck` — 36/36 tasks) |
| Tempo do build (apps/web isolado) | 53s |
| Páginas / Rotas | 18 / 18 |
| ADRs / SPECs | 5 / 9 |

### Escopo do sprint (limites do CLAUDE.md)

| Métrica de tamanho | Valor | Limite |
|---|---|---|
| Arquivos alterados | 7 | ≤ 50 (ideal ~30) |
| Arquivos novos | 5 | ≤ 10 |
| Packages tocados | 2 (`database`, `supabase`) | ≤ 3 |
| Migrations novas | 2 | — |

### Qualidade

| Item | Resultado |
|---|---|
| Testes de readiness (`bash scripts/test-readiness.sh`) | ✅ 42/42 asserções, banco local em ROLLBACK |
| Transição NOT_READY → READY (Google Play) | ✅ 10 etapas, um blocker por vez |
| Transição NOT_READY → READY (App Store) | ✅ |
| Matriz de segurança (anon, cross-Studio, release inexistente, artifact/upload de outro Studio) | ✅ |
| Vazamento de credenciais/Vault/storage path no payload | ✅ nenhum |

### Deploy

| Métrica | Valor |
|---|---|
| Produção | Não tocada (migrations aplicadas só no Docker local — pendência de deploy para 2.12d) |

## Sprint 2.12b — UI de Release Readiness + Submission Gate (2026-08-14)

Segundo sub-sprint do 2.12 (Release Readiness & Publishing Orchestration). Só UI/Server Action sobre o RPC puro do 2.12a — nenhuma migration nova, nenhuma mudança de lógica de readiness.

| Métrica | Valor |
|---|---|
| Apps | 1 |
| Packages | 11 |
| Commits (antes deste sprint) | 92 |
| Typecheck | ✅ (`npx turbo run typecheck` — 12/12 tasks) |
| Lint | ✅ (`npx turbo run lint` — 12/12 tasks) |
| Build | ✅ (`npx turbo run build` — 12/12 tasks) |
| Testes | ✅ 8/8 (`npx turbo run test` — primeira suíte de componente React do projeto) |

### Escopo do sprint (limites do CLAUDE.md)

| Métrica de tamanho | Valor | Limite |
|---|---|---|
| Arquivos alterados | 15 (incl. `pnpm-lock.yaml`) | ≤ 50 (ideal ~30) |
| Arquivos novos | 8 | ≤ 10 |
| Packages tocados | 2 (`apps/web`, `packages/database`) | ≤ 3 |
| Migrations novas | 0 | — |

### Entregas

| Item | Resultado |
|---|---|
| GATE 7 — Server Action `getReleaseReadinessAction` | ✅ auth via sessão, `studio_id` nunca recebido do client |
| GATE 8 — `ReadinessPanel` (READY/NOT_READY, blocking vs WARN/NOT_APPLICABLE, link "Corrigir", loading/erro/vazio) | ✅ na tela de detalhe de Submission e no diálogo "New Submission" |
| GATE 9 — Submission Gate (botão desabilitado se NOT_READY) | ✅ sem alterar o fluxo de criação em si |
| GATE 10 — recarregamento pós-ação | ✅ `reload()` explícito, sem polling novo |
| Infra de teste de componente React (Vitest + Testing Library) | ✅ criada do zero — não existia em nenhum package antes |

### Deploy

| Métrica | Valor |
|---|---|
| Produção | Não tocada (sem migrations; só código de `apps/web`/`packages/database`, deploy normal via Vercel quando autorizado) |
