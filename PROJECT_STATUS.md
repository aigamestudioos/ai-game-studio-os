# PROJECT_STATUS.md

Status atual do projeto AI Game Studio OS.

## Status do Projeto

| Área            | Status                        |
|-----------------|--------------------------------|
| Arquitetura     | Definida (docs/frozen importado) |
| Implementação   | Sprint 0 em andamento — Incrementos 0.1, 0.2, 0.3 e 0.6 (Vercel, antecipado) concluídos |
| Deploy          | **Produção:** https://ai-game-studio-os-web.vercel.app/ ✅ |

## Sprint 0 — Foundation

| Incremento | Objetivo | Status |
|---|---|---|
| **0.1** | **Monorepo + Turborepo + pnpm + TypeScript** | **Concluído (local)** |
| **0.2** | **Next.js + App Router** | **Concluído (local)** |
| **0.3** | **Tailwind v4 + Design Tokens + Dark Mode + ThemeProvider** | **Concluído (local)** |
| 0.4 | shadcn/ui (Button, Input, Card, Dialog, Toast) + página `/playground` | Pending |
| 0.5 | GitHub Actions (CI mínimo) | Pending |
| **0.6** | **Vercel + primeiro deploy** | **Concluído (produção) — antecipado antes do 0.4/0.5, a pedido do usuário** |
| 0.7 | Supabase Auth + login/logout + rota protegida | Pending |
| 0.8 | Revisão geral, testes, documentação | Pending |

> Nota: `docs/frozen/roadmap/AGSOS-PLAN-001.md` define 0.3 como "Tailwind + shadcn/ui" combinado. A tabela acima diverge dessa numeração apenas na *sequência de execução* (Tailwind isolado de shadcn, para respeitar o limite de ~50 arquivos/sprint de `CLAUDE.md`) — o documento frozen não foi alterado. Ver `DECISIONS.md`.

## Último Sprint

Incremento 0.6 (antecipado) — Deploy em produção: `git push origin main` (repositório já estava sincronizado com os 9 commits locais até o 0.3), projeto conectado à Vercel pelo usuário via dashboard (Root Directory `apps/web`), deploy automático a cada push em `main`. Validado: `https://ai-game-studio-os-web.vercel.app/` responde HTTP 200, título e conteúdo corretos, CSS com tokens Tailwind compilados (`--color-background: var(--surface-background)`).

## Próxima Etapa

Incremento 0.4 — shadcn/ui (Button, Input, Card, Dialog, Toast) + página `/playground` para demonstrar todos os componentes (temas, estados, responsividade).

## Observação

`apps/web` (Next.js, App Router, Tailwind v4 + tokens + dark mode, **em produção na Vercel**) — com `features/`, `components/ui/`, `lib/` ainda vazios, `providers/` e `hooks/` já com o `ThemeProvider`/`useTheme`, conforme ADR-002/ARCHITECTURE.md §3 —, `packages/` (11 packages `@agsos/*`) e `supabase/` agora existem no repositório. Ainda sem shadcn/ui, CI ou Supabase Auth (entram nos próximos incrementos). Repositório agora sincronizado com `origin/main`; deploy automático via GitHub → Vercel ativo.
