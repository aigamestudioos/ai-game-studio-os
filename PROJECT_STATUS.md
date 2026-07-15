# PROJECT_STATUS.md

Status atual do projeto AI Game Studio OS.

## Status do Projeto

| Área            | Status                        |
|-----------------|--------------------------------|
| Arquitetura     | Definida (docs/frozen importado) |
| Implementação   | Sprint 0 concluído · Sprint 1 (Application Foundation) em andamento — Dashboard Premium concluído |
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
| 1.2 | 📁 Projects — primeiro fluxo de negócio (Dashboard → Projects → New Project → Project Details), 100% mock | Pending |
| 1.3 | 🎮 Games (Game Workspace) | Pending |
| 1.4 | 🧠 Knowledge | Pending |
| 1.5 | 📤 Publishing | Pending |
| 1.6 | 🔐 Supabase Auth + login/logout + controle de acesso | Pending |
| 1.7 | 🔄 Conectar todos os módulos ao Supabase (substituir mocks por dados reais) | Pending |

> Reordenação estratégica (2026-07-15): autenticação foi deliberadamente adiada para depois dos módulos de negócio (Projects → Games → Knowledge → Publishing). Motivo: evitar autenticar usuários para chegar a um sistema sem funcionalidade real; validar UX com mocks primeiro reduz retrabalho quando o Supabase for integrado (troca `const data = mockData` por `const data = await supabase...`, sem redesenhar telas). Ver `DECISIONS.md`.

> Nota: `docs/frozen/roadmap/AGSOS-PLAN-001.md` (frozen, não editado) define uma sequência diferente das tabelas acima. A numeração operacional foi refinada e reordenada mais de uma vez por decisão explícita do usuário — ver `ADR-005-sprint-governance.md` e `DECISIONS.md` para o histórico completo dessas divergências. O que era tratado como "Incremento 0.6" (Dashboard) passou a ser o Sprint 1 formalmente, já que o usuário o descreveu como "Application Foundation" — um sprint novo, não mais um incremento do Sprint 0.

## Último Sprint

Sprint 1.1 — Dashboard Premium: construída a **Application Shell** reutilizável (`AppShell` = `TopBar` + `Sidebar` + `Content`), usada por `/dashboard` e projetada para ser reaproveitada por Projects, Games, Knowledge, Publishing, Marketing, Analytics, Finance e Settings sem recriar header/sidebar. `TopBar` ganhou busca global (placeholder), notificações, troca de tema, `UserMenu` (Avatar + DropdownMenu) e breadcrumb. `Sidebar` ganhou colapso (com tooltips quando recolhida) e detecção automática do item ativo via `usePathname`. `/dashboard` traz Welcome, Quick Stats, Quick Actions, Recent Projects (com progresso), Recent Activity (timeline), AI Insights e Roadmap Snapshot — tudo mockado em `components/dashboard/mock-data.ts`, pronto para ser substituído por dados reais sem alterar os componentes.

Reaproveitou `StatCard`/`ProjectCard`/`Card` já existentes em vez de criar "MetricCard"/"DashboardCard" paralelos (ver `DECISIONS.md`). Único componente novo do design system: nenhum — tudo composto a partir dos 17 componentes já existentes + novos componentes de layout/dashboard (`AppShell`, `SearchBar`, `UserMenu`, widgets do dashboard).

Um bug real de responsividade foi encontrado via screenshot mobile e corrigido: a Sidebar não colapsava/ocultava em telas estreitas, espremendo todo o conteúdo. Corrigido com um drawer off-canvas (menu hambúrguer) abaixo do breakpoint `md`. Um problema no método de screenshot também foi identificado e corrigido: a Application Shell usa scroll interno no `<main>` (header/sidebar fixos), então `fullPage` do Playwright capturava só a viewport — corrigido redimensionando o viewport para caber o conteúdo real antes de cada captura.

## Próxima Etapa

Sprint 1.2 — Projects: primeiro fluxo de negócio real (Dashboard → Projects → New Project → Project Details), 100% mockado. Supabase Auth adiado para 1.6, depois dos módulos de negócio (ver nota acima).

## Observação

`apps/web` — `components/ui/` com 16 componentes; `components/landing/` (Landing em produção); `components/layout/` agora com a Application Shell completa (`AppShell`, `TopBar`, `Sidebar`, `SearchBar`, `UserMenu`); `components/dashboard/` com cards, widgets e mock data. `/dashboard` em produção, 100% visual (sem Supabase/backend/auth). `packages/` (11 packages `@agsos/*`) e `supabase/` existem no repositório, ainda não integrados. Processo regido por `AGENT.md`/`CLAUDE.md`/`DEFINITION_OF_DONE.md`/`VISION.md`; evolução de produto rastreada em `PRODUCT_PROGRESS.md`.
