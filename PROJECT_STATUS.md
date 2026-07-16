# PROJECT_STATUS.md

Status atual do projeto AI Game Studio OS.

## Status do Projeto

| Área            | Status                        |
|-----------------|--------------------------------|
| Arquitetura     | Definida (docs/frozen importado) |
| Implementação   | Sprint 0 concluído · Sprint 1 (Application Foundation) em andamento — Dashboard Premium, Projects, Games, Knowledge, Publishing e Auth (mock) concluídos |
| Deploy          | **Produção:** https://ai-game-studio-os-web.vercel.app/ ✅ |

## Sprint 0 — Foundation

| Incremento | Objetivo | Status |
|---|---|---|
| **0.1** | **Monorepo + Turborepo + pnpm + TypeScript** | **Concluído (local)** |
| **0.2** | **Next.js + App Router** | **Concluído (local)** |
| **0.3** | **Tailwind v4 + Design Tokens + Dark Mode + ThemeProvider** | **Concluído (local)** |
| **0.4a** | **Fundação do Design System (Button, Input, Textarea, Card, Badge, Avatar) + shell do `/playground`** | **Concluído (local)** |
| **0.4b** | **Componentes avançados (Dialog, Modal, Toast, Tooltip, DropdownMenu, Alert, Spinner, Skeleton, Separator, Progress)** | **Concluído (local)** |
| 0.4c | ~~Playground completo~~ — **congelado por decisão do usuário**: o Playground cumpriu sua missão com 16+1 componentes; energia agora vai para telas reais | Frozen |
| **0.5** | **Landing Page premium** (substitui a home) | **Concluído (produção)** |
| Vercel/CI | Vercel + primeiro deploy antecipado (item antigo "0.5/0.6" do roadmap original) | **Concluído (produção)** — GitHub Actions/CI mínimo ainda não configurado |

## Sprint 1 — Application Foundation

| Incremento | Objetivo | Status |
|---|---|---|
| **1.1** | **Dashboard Premium**: Application Shell reutilizável (Header + Sidebar + Content) e primeira tela real (`/dashboard`), 100% mock, sem backend | **Concluído (produção)** |
| **1.2** | **Projects** — primeiro fluxo de negócio (Dashboard → Projects → New Project → Project Details), 100% mock | **Concluído (local)** |
| **1.3** | **Games** (Game Workspace) — Dashboard → Games → Create Game → Game Workspace, 100% mock | **Concluído (local)** |
| **1.4** | **Knowledge** — Dashboard → Knowledge → New Document → Document Details, 100% mock | **Concluído (local)** |
| **1.5** | **Publishing** — Dashboard → Publishing → New Submission → Submission Details, 100% mock | **Concluído (produção)** |
| **1.6** | 🔐 **Auth (mock)** — `/login`, rota protegida em toda a Application Shell, sessão via `localStorage` | **Concluído (local)** |
| 1.7 | 🔄 Conectar Auth e todos os módulos ao Supabase real (substituir mocks por dados reais) | Pending |

> Reordenação estratégica (2026-07-15): autenticação foi deliberadamente adiada para depois dos módulos de negócio (Projects → Games → Knowledge → Publishing). Motivo: evitar autenticar usuários para chegar a um sistema sem funcionalidade real; validar UX com mocks primeiro reduz retrabalho quando o Supabase for integrado (troca `const data = mockData` por `const data = await supabase...`, sem redesenhar telas). Ver `DECISIONS.md`.
>
> Nota adicional (1.6): não existe projeto Supabase configurado ainda (sem credenciais). O usuário optou por simular Auth (email + senha, sessão em `localStorage`, mesmo padrão dos outros stores mock) em vez de criar o projeto Supabase agora — a integração real fica inteiramente para o 1.7, que passa a cobrir Auth real **e** dados reais dos quatro módulos de negócio.

> Nota: `docs/frozen/roadmap/AGSOS-PLAN-001.md` (frozen, não editado) define uma sequência diferente das tabelas acima. A numeração operacional foi refinada e reordenada mais de uma vez por decisão explícita do usuário — ver `ADR-005-sprint-governance.md` e `DECISIONS.md` para o histórico completo dessas divergências. O que era tratado como "Incremento 0.6" (Dashboard) passou a ser o Sprint 1 formalmente, já que o usuário o descreveu como "Application Foundation" — um sprint novo, não mais um incremento do Sprint 0.

## Último Sprint

Sprint 1.6 — Auth (mock): `apps/web/lib/auth-store.ts` (mesmo padrão seed + `localStorage` + pub/sub dos outros stores) e `hooks/use-auth.ts`. Nova página `/login` (email + senha — aceita qualquer combinação não vazia, sem validação real). `AppShell` agora verifica sessão e redireciona para `/login` se não houver uma — como todas as 9 páginas de produto usam `AppShell`, todas ficaram protegidas de uma vez, sem alteração por módulo. `UserMenu` mostra nome/email reais da sessão e o item "Sair" agora funciona (logout + redirecionamento). Botão "Login" da Landing agora aponta para `/login`.

Testado o fluxo completo via Playwright: acessar `/dashboard` sem sessão → redireciona para `/login` → login → volta para `/dashboard` → menu mostra o email correto → logout → volta para `/login` → tentar `/dashboard` de novo → redireciona de novo. Regressão verificada em `/projects`, `/games`, `/knowledge`, `/publishing`, `/playground` e `/` autenticado — sem quebras. Nenhum bug de layout nos 3 breakpoints × 2 temas.

### Sprint 1.5 — Publishing: quarto fluxo de negócio, mesmo padrão dos módulos anteriores (`/publishing` e `/publishing/[id]`), 100% mock. `/publishing` lista as submissões (novo `SubmissionCard`, status Em análise/Aprovado/Rejeitado/Publicado) e tem o botão **New Submission**, que abre um `Dialog` com jogo (texto livre, ver `DECISIONS.md` sobre não acoplar a `games-store.ts`), versão e seleção de loja (App Store/Google Play/Steam) e cria a submissão via `apps/web/lib/publishing-store.ts`. A página de detalhes mostra o histórico de status como timeline; ids inexistentes caem em `notFound()`. Sidebar e o Quick Action "Publish" do Dashboard agora apontam para `/publishing`.

Testado o fluxo completo (golden path) via Playwright: abrir `/publishing` → "New Submission" → preencher jogo/versão → selecionar loja → criar → toast de confirmação → clicar no card criado → chegar em `/publishing/[id]` com os dados corretos. Nenhum bug de layout encontrado nos 3 breakpoints × 2 temas.

### Sprint 1.4 — Knowledge: terceiro fluxo de negócio, mesmo padrão de Projects/Games (`/knowledge` e `/knowledge/[id]`), 100% mock. `/knowledge` lista os documentos (novo `DocumentCard`, status Rascunho/Publicado + tipo como badge) e tem o botão **New Document**, que abre um `Dialog` com título, resumo e seleção de tipo (Documento/Template/Playbook/SOP/ADR/SPEC — badges alternáveis de seleção única, mesmo padrão usado para plataformas em Games) e cria o documento via `apps/web/lib/knowledge-store.ts`. A página de detalhes mostra título, status, tipo, resumo e conteúdo; ids inexistentes caem em `notFound()`. Sidebar e o Quick Action "Knowledge" do Dashboard agora apontam para `/knowledge`.

Testado o fluxo completo (golden path) via Playwright, incluindo título com acentuação (Português): abrir `/knowledge` → "New Document" → preencher título/resumo → selecionar tipo → criar → toast de confirmação → clicar no card criado → chegar em `/knowledge/[id]` com os dados corretos. Nenhum bug de layout encontrado nos 3 breakpoints × 2 temas.

### Sprint 1.3 — Games: segundo fluxo de negócio, mesmo padrão de Projects (`/games` e `/games/[id]`), 100% mock. `/games` lista os jogos (novo `GameCard`, com plataformas como badges em vez da barra de progresso do `ProjectCard`) e tem o botão **Create Game**, que abre um `Dialog` com nome, descrição e seleção de plataformas (iOS/Android/Steam via badges alternáveis) e cria o jogo via `apps/web/lib/games-store.ts` — replica a estrutura de `projects-store.ts` (`localStorage`, ver `DECISIONS.md`). A página de detalhes (`Game Workspace`) mostra status, plataformas e a lista de builds com ícone de status (Pronta/Em build/Falhou); ids inexistentes caem em `notFound()`. Sidebar e o Quick Action "Create Game" do Dashboard agora apontam para `/games`.

Testado o fluxo completo (golden path) via Playwright: abrir `/games` → "Create Game" → preencher nome/descrição → selecionar plataformas → criar → toast de confirmação → clicar no card criado → chegar em `/games/[id]` com os dados corretos. Nenhum bug de layout encontrado nos 3 breakpoints × 2 temas.

### Sprint 1.2 — Projects: primeiro fluxo de negócio real construído sobre a Application Shell (`/projects` e `/projects/[id]`), 100% mock. `/projects` lista os projetos (reaproveita `ProjectCard`) e tem o botão **New Project**, que abre um `Dialog` com `Input`/`Textarea` e cria o projeto via `apps/web/lib/projects-store.ts` — um store simples com persistência em `localStorage` (ver `DECISIONS.md`), necessário para que o projeto recém-criado apareça de verdade em `/projects/[id]` ao navegar, e não apenas na mesma renderização. A página de detalhes mostra status, descrição, lista de epics (checklist visual) e progresso; ids inexistentes caem em `notFound()`. Sidebar e Dashboard (`New Project`, Recent Projects) agora apontam para `/projects`.

Testado o fluxo completo (golden path) via Playwright: abrir `/projects` → clicar "New Project" → preencher nome/descrição → criar → toast de confirmação → clicar no card criado → chegar em `/projects/[id]` com os dados corretos. Nenhum bug de layout encontrado nos 3 breakpoints × 2 temas.

### Sprint 1.1 — Dashboard Premium: construída a **Application Shell** reutilizável (`AppShell` = `TopBar` + `Sidebar` + `Content`), usada por `/dashboard` e projetada para ser reaproveitada por Projects, Games, Knowledge, Publishing, Marketing, Analytics, Finance e Settings sem recriar header/sidebar. `TopBar` ganhou busca global (placeholder), notificações, troca de tema, `UserMenu` (Avatar + DropdownMenu) e breadcrumb. `Sidebar` ganhou colapso (com tooltips quando recolhida) e detecção automática do item ativo via `usePathname`. `/dashboard` traz Welcome, Quick Stats, Quick Actions, Recent Projects (com progresso), Recent Activity (timeline), AI Insights e Roadmap Snapshot — tudo mockado em `components/dashboard/mock-data.ts`, pronto para ser substituído por dados reais sem alterar os componentes.

Reaproveitou `StatCard`/`ProjectCard`/`Card` já existentes em vez de criar "MetricCard"/"DashboardCard" paralelos (ver `DECISIONS.md`). Único componente novo do design system: nenhum — tudo composto a partir dos 17 componentes já existentes + novos componentes de layout/dashboard (`AppShell`, `SearchBar`, `UserMenu`, widgets do dashboard).

Um bug real de responsividade foi encontrado via screenshot mobile e corrigido: a Sidebar não colapsava/ocultava em telas estreitas, espremendo todo o conteúdo. Corrigido com um drawer off-canvas (menu hambúrguer) abaixo do breakpoint `md`. Um problema no método de screenshot também foi identificado e corrigido: a Application Shell usa scroll interno no `<main>` (header/sidebar fixos), então `fullPage` do Playwright capturava só a viewport — corrigido redimensionando o viewport para caber o conteúdo real antes de cada captura.

## Próxima Etapa

Sprint 1.7 — conectar Auth e os quatro módulos de negócio ao Supabase real (projeto Supabase precisa ser criado/conectado primeiro — ver `DECISIONS.md`).

## Observação

`apps/web` — `components/ui/` com 16 componentes; `components/landing/` (Landing em produção); `components/layout/` agora com a Application Shell completa (`AppShell`, `TopBar`, `Sidebar`, `SearchBar`, `UserMenu`) **e proteção de rota** (mock); `components/dashboard/` com cards, widgets e mock data; `app/projects/`, `app/games/`, `app/knowledge/`, `app/publishing/` (lista + detalhes cada) com seus stores mock (`localStorage`); `app/login/` com `lib/auth-store.ts` — cinco stores mock client-side, mesmo padrão. `/dashboard`, `/projects`, `/games`, `/knowledge` e `/publishing` em produção; `/login` local (ainda não deployado), todos 100% visual (sem Supabase/backend real). `packages/` (11 packages `@agsos/*`) e `supabase/` existem no repositório, ainda não integrados — nenhum projeto Supabase criado. Processo regido por `AGENT.md`/`CLAUDE.md`/`DEFINITION_OF_DONE.md`/`VISION.md`; evolução de produto rastreada em `PRODUCT_PROGRESS.md`.
