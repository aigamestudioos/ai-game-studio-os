# PROJECT_STATUS.md

Status atual do projeto AI Game Studio OS.

## Status do Projeto

| Área            | Status                        |
|-----------------|--------------------------------|
| Arquitetura     | Definida (docs/frozen importado) |
| Implementação   | Sprint 0 em andamento — Incrementos 0.1, 0.2, 0.3, 0.4a, 0.4b e 0.6 (Vercel, antecipado) concluídos |
| Deploy          | **Produção:** https://ai-game-studio-os-web.vercel.app/ ✅ |

## Sprint 0 — Foundation

| Incremento | Objetivo | Status |
|---|---|---|
| **0.1** | **Monorepo + Turborepo + pnpm + TypeScript** | **Concluído (local)** |
| **0.2** | **Next.js + App Router** | **Concluído (local)** |
| **0.3** | **Tailwind v4 + Design Tokens + Dark Mode + ThemeProvider** | **Concluído (local)** |
| **0.4a** | **Fundação do Design System (Button, Input, Textarea, Card, Badge, Avatar) + shell do `/playground`** | **Concluído (local)** |
| **0.4b** | **Componentes avançados (Dialog, Modal, Toast, Tooltip, DropdownMenu, Alert, Spinner, Skeleton, Separator, Progress)** | **Concluído (local)** |
| 0.4c | Playground completo (Checkbox, Switch, RadioGroup, Select, Tabs, Accordion + seções Typography/Spacing/Icons/Colors/Animations/Dark Mode) | Pending |
| 0.5 | GitHub Actions (CI mínimo) | Pending |
| **0.6** | **Vercel + primeiro deploy** | **Concluído (produção) — antecipado antes do 0.4b/0.4c/0.5, a pedido do usuário** |
| 0.7 | Supabase Auth + login/logout + rota protegida | Pending |
| 0.8 | Revisão geral, testes, documentação | Pending |

> Nota: `docs/frozen/roadmap/AGSOS-PLAN-001.md` (frozen, não editado) define 0.3 como "Tailwind + shadcn/ui" combinado. A tabela acima é a sequência de execução real, refinada em subincrementos por limite de tamanho de sprint e governança — ver `ADR-005-sprint-governance.md` e `DECISIONS.md`.

## Último Sprint

Incremento 0.4b — Componentes avançados: `Dialog`, `Modal` (AlertDialog), `Toast`, `Tooltip`, `DropdownMenu`, `Alert`, `Spinner`, `Skeleton`, `Separator`, `Progress` em `apps/web/components/ui/`, todos via tokens (novo token `--backdrop` para overlays). `TooltipProvider`/`Toaster` globais em `layout.tsx`. `/playground` ganhou 6 novas seções, todas interativas (abrir Dialog/Modal, disparar Toast, hover Tooltip, abrir Dropdown). Três bugs encontrados via revisão visual com Playwright e corrigidos no mesmo incremento: hidratação (`suppressHydrationWarning` faltando desde o 0.3), `Alert` com título/descrição lado a lado, overlay de Dialog/Modal não escurecendo em dark mode. `pnpm install`, `pnpm build`, `pnpm typecheck`, `pnpm lint` verdes; screenshots + revisão visual completos (`docs/screenshots/sprint-0.4b/`), incluindo capturas de cada componente interativo aberto.

## Próxima Etapa

Incremento 0.4c — Playground completo (Checkbox, Switch, RadioGroup, Select, Tabs, Accordion + seções restantes), ou — conforme sugestão do usuário — já avaliar construir uma tela real de produto reaproveitando só os componentes existentes, em vez de perguntar "qual componente falta".

## Observação

`apps/web` (Next.js, App Router, Tailwind v4 + tokens + dark mode, **em produção na Vercel**) — `components/ui/` agora com 16 componentes (6 da fundação + 10 avançados); `features/`/`lib/` (além de `utils.ts`) ainda mínimos; `providers/`/`hooks/` com `ThemeProvider`/`useTheme`/`useToast` (tema sem persistência), conforme ADR-002/ARCHITECTURE.md §3. `packages/` (11 packages `@agsos/*`) e `supabase/` existem no repositório. Ainda sem Playground 100% completo, CI ou Supabase Auth (entram nos próximos incrementos). Processo regido por `AGENT.md`/`CLAUDE.md`/`DEFINITION_OF_DONE.md`/`VISION.md`; evolução de produto rastreada em `PRODUCT_PROGRESS.md`.
