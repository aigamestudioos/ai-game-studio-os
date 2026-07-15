# PROJECT_STATUS.md

Status atual do projeto AI Game Studio OS.

## Status do Projeto

| Área            | Status                        |
|-----------------|--------------------------------|
| Arquitetura     | Definida (docs/frozen importado) |
| Implementação   | Sprint 0 em andamento — Incrementos 0.1, 0.2, 0.3, 0.4a, 0.4b, 0.5 e 0.6 (Vercel, antecipado) concluídos |
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
| **0.5** | **Landing Page premium** (substitui a home) | **Concluído (local)** |
| Vercel/CI | Vercel + primeiro deploy antecipado (item antigo "0.5/0.6" do roadmap original) | **Concluído (produção)** — GitHub Actions/CI mínimo ainda não configurado |
| 0.6 | Dashboard visual (layout completo, sem backend) | Em andamento — scaffold pronto (commit local, sem push) |
| 0.7 | Supabase Auth + login/logout + controle de acesso | Pending |
| 0.8 | Módulo Projects (primeiro fluxo funcional de negócio) | Pending |

> Nota: `docs/frozen/roadmap/AGSOS-PLAN-001.md` (frozen, não editado) define uma sequência diferente da tabela acima. A numeração operacional foi refinada e reordenada mais de uma vez por decisão explícita do usuário (Landing antes do Dashboard, Playground congelado) — ver `ADR-005-sprint-governance.md` e `DECISIONS.md` para o histórico completo dessas divergências.

## Último Sprint

Incremento 0.5 — Landing Page premium: substitui inteiramente a home antiga. Header sticky com efeito de scroll, Hero com grid/glow/blur (tokens, sem cor hardcoded), seções Como Funciona, Por que Nós, Plataforma (8 módulos), Benefícios, Roadmap (timeline) e FAQ (novo componente `Accordion`, único componente criado nesta etapa). Scroll-reveal via `IntersectionObserver`. SEO completo (metadata, OG, Twitter Card, `robots.ts`, `sitemap.ts`, canonical). 100% composta pelos componentes já existentes (só Accordion é novo). Sem Supabase, sem login funcional, sem dashboard funcional — só UI.

Um bug real de build foi encontrado e corrigido: `Button` com `asChild` quebrava o Radix Slot (passava 2 filhos em vez de 1) — nunca detectado antes porque nenhuma tela anterior usava `Button asChild` diretamente. Um artefato de processo também foi identificado: screenshots `fullPage` do Playwright não disparam scroll real, então conteúdo com scroll-reveal aparecia "invisível" nas capturas — corrigido rolando a página programaticamente antes de cada screenshot.

Em paralelo, o Dashboard visual (Sidebar per SPEC-005 §9, TopBar, Recent Projects, Statistics) foi construído e commitado localmente como checkpoint do Incremento 0.6 — ainda sem push, aguardando execução formal desse incremento.

## Próxima Etapa

Incremento 0.6 — formalizar o Dashboard visual já commitado localmente (validação completa, documentação, push, deploy), seguido de 0.7 (Supabase Auth) e 0.8 (Projects).

## Observação

`apps/web` (Next.js, App Router, Tailwind v4 + tokens + dark mode, **Landing em produção na Vercel**) — `components/ui/` com 17 componentes (16 + Accordion); `components/landing/` (novo) com Header/Hero/seções/Footer/Reveal; `components/layout/` e `components/dashboard/` (Sidebar/TopBar/cards) prontos mas ainda não formalizados como sprint concluído. `packages/` (11 packages `@agsos/*`) e `supabase/` existem no repositório. Ainda sem CI, Supabase Auth ou funcionalidades de negócio. Processo regido por `AGENT.md`/`CLAUDE.md`/`DEFINITION_OF_DONE.md`/`VISION.md`; evolução de produto rastreada em `PRODUCT_PROGRESS.md`.
