# PROJECT_STATUS.md

Status atual do projeto AI Game Studio OS.

## Status do Projeto

| Área            | Status                        |
|-----------------|--------------------------------|
| Arquitetura     | Definida (docs/frozen importado) |
| Implementação   | Sprint 0 em andamento — Incrementos 0.1, 0.2, 0.3, 0.4a e 0.6 (Vercel, antecipado) concluídos |
| Deploy          | **Produção:** https://ai-game-studio-os-web.vercel.app/ ✅ |

## Sprint 0 — Foundation

| Incremento | Objetivo | Status |
|---|---|---|
| **0.1** | **Monorepo + Turborepo + pnpm + TypeScript** | **Concluído (local)** |
| **0.2** | **Next.js + App Router** | **Concluído (local)** |
| **0.3** | **Tailwind v4 + Design Tokens + Dark Mode + ThemeProvider** | **Concluído (local)** |
| **0.4a** | **Fundação do Design System (Button, Input, Textarea, Card, Badge, Avatar) + shell do `/playground`** | **Concluído (local)** |
| 0.4b | Componentes avançados (Dialog, Modal, Toast, Tooltip, DropdownMenu, Alert, Spinner, Skeleton, Separator, Progress) | Pending |
| 0.4c | Playground completo (Checkbox, Switch, RadioGroup, Select, Tabs, Accordion + seções Typography/Spacing/Icons/Colors/Animations/Dark Mode) | Pending |
| 0.5 | GitHub Actions (CI mínimo) | Pending |
| **0.6** | **Vercel + primeiro deploy** | **Concluído (produção) — antecipado antes do 0.4b/0.4c/0.5, a pedido do usuário** |
| 0.7 | Supabase Auth + login/logout + rota protegida | Pending |
| 0.8 | Revisão geral, testes, documentação | Pending |

> Nota: `docs/frozen/roadmap/AGSOS-PLAN-001.md` (frozen, não editado) define 0.3 como "Tailwind + shadcn/ui" combinado. A tabela acima é a sequência de execução real, refinada em subincrementos por limite de tamanho de sprint e governança — ver `ADR-005-sprint-governance.md` e `DECISIONS.md`.

## Último Sprint

Incremento 0.4a — Fundação do Design System: `Button`, `Input`, `Textarea`, `Card` (+ subcomponentes), `Badge`, `Avatar` em `apps/web/components/ui/`, todos usando exclusivamente tokens do Tailwind (nenhuma cor/espaçamento/raio/sombra hardcoded), com estados default/hover/focus/disabled/loading/success/warning/error onde aplicável. Tokens `success`/`warning` adicionados a `globals.css` (extensão a SPEC-005 §4, não coberta lá). Shell de `/playground` criado com navegação e 5 seções interativas. Tema **sem persistência** (apenas em memória durante a sessão — decisão explícita do usuário; persistência real fica para o 0.7, junto com Supabase Auth). `pnpm install`, `pnpm build`, `pnpm typecheck` e `pnpm lint` verdes; `/` e `/playground` verificados manualmente via `next dev` (HTTP 200, sem erros/warnings no log do servidor).

## Próxima Etapa

Incremento 0.4b — Componentes avançados (overlays e feedback): Dialog, Modal, Toast, Tooltip, DropdownMenu, Alert, Spinner, Skeleton, Separator, Progress.

## Observação

`apps/web` (Next.js, App Router, Tailwind v4 + tokens + dark mode, **em produção na Vercel**) — `components/ui/` e `lib/` agora com a fundação do design system; `features/` ainda vazio; `providers/`/`hooks/` com `ThemeProvider`/`useTheme` (sem persistência), conforme ADR-002/ARCHITECTURE.md §3. `packages/` (11 packages `@agsos/*`) e `supabase/` existem no repositório. Ainda sem componentes avançados/Playground completo, CI ou Supabase Auth (entram nos próximos incrementos).
