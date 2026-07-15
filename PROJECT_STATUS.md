# PROJECT_STATUS.md

Status atual do projeto AI Game Studio OS.

## Status do Projeto

| Área            | Status                        |
|-----------------|--------------------------------|
| Arquitetura     | Definida (docs/frozen importado) |
| Implementação   | Sprint 0 em andamento — Incrementos 0.1, 0.2 e 0.3 concluídos |

## Sprint 0 — Foundation

| Incremento | Objetivo | Status |
|---|---|---|
| **0.1** | **Monorepo + Turborepo + pnpm + TypeScript** | **Concluído (local)** |
| **0.2** | **Next.js + App Router** | **Concluído (local)** |
| **0.3** | **Tailwind v4 + Design Tokens + Dark Mode + ThemeProvider** | **Concluído (local)** |
| 0.4 | shadcn/ui (Button, Input, Card, Dialog, Toast) | Pending |
| 0.5 | GitHub Actions (CI mínimo) | Pending |
| 0.6 | Vercel + primeiro deploy | Pending |
| 0.7 | Supabase Auth + login/logout + rota protegida | Pending |
| 0.8 | Revisão geral, testes, documentação | Pending |

> Nota: `docs/frozen/roadmap/AGSOS-PLAN-001.md` define 0.3 como "Tailwind + shadcn/ui" combinado. A tabela acima diverge dessa numeração apenas na *sequência de execução* (Tailwind isolado de shadcn, para respeitar o limite de ~50 arquivos/sprint de `CLAUDE.md`) — o documento frozen não foi alterado. Ver `DECISIONS.md`.

## Último Sprint

Incremento 0.3 — Tailwind v4 + Design Tokens + Dark Mode + ThemeProvider: tokens de superfície e semânticos (SPEC-005 §4) em `apps/web/app/globals.css`, dark-first com override `[data-theme="light"]`, `ThemeProvider`/`useTheme` sem persistência (localStorage/sessionStorage proibidos; Supabase Auth ainda não existe), anti-flash via script inline. `pnpm install`, `pnpm build`, `pnpm typecheck` e `pnpm lint` verdes em todos os 12 workspaces; verificado manualmente via `next dev` que os tokens compilam e o toggle de tema funciona. Ver `IMPLEMENTATION_LOG.md` para detalhes.

## Próxima Etapa

Incremento 0.4 — shadcn/ui (Button, Input, Card, Dialog, Toast).

## Observação

`apps/web` (Next.js, App Router, Tailwind v4 + tokens + dark mode) — com `features/`, `components/ui/`, `lib/` ainda vazios, `providers/` e `hooks/` já com o `ThemeProvider`/`useTheme`, conforme ADR-002/ARCHITECTURE.md §3 —, `packages/` (11 packages `@agsos/*`) e `supabase/` agora existem no repositório. Ainda sem shadcn/ui, Supabase real ou Auth (entram nos próximos incrementos). Commit local apenas; nenhum push foi feito para `origin`.
