# PROJECT BIBLE — AI Game Studio OS

> Referência operacional consolidada. Derivado de `docs/frozen/`.
> Em conflito com qualquer SPEC: a SPEC prevalece.
> Atualizado a cada revisão normativa relevante.

---

## O que é

Sistema Operacional para Estúdios de Jogos Mobile AI-First. Permite que um empreendedor individual opere um estúdio capaz de lançar dezenas de jogos por ano usando IA como força principal. Ciclo completo: ideia → desenvolvimento → publicação → operação.

**Não é:** dashboard, CRM, ERP, painel administrativo.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript strict |
| Estilo | Tailwind CSS v4 + shadcn/ui + `@theme{}` |
| Cores | oklch (gamut amplo) |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions) |
| Migrations | Supabase CLI + SQL nativo (sem Prisma) |
| Server State | TanStack Query |
| UI State | Zustand |
| Validação | Zod |
| Monorepo | pnpm workspaces + Turborepo |
| Deploy | Vercel |
| CI/CD | GitHub Actions |
| Testes | Vitest (unit/int) + Playwright (E2E) |
| i18n | next-intl |
| Gráficos | Recharts → sempre via `@agsos/ui/charts` |
| Ícones | Lucide |
| Animações | Framer Motion (uso restrito) |
| Ambiente | GitHub Codespaces + Claude Code |

---

## Estrutura do repositório

```
ai-game-studio-os/
├── AGENT.md                ← lido pelo Claude Code
├── PROJECT_BIBLE.md        ← este arquivo
├── ARCHITECTURE.md         ← manual operacional diário
├── PROJECT_STATUS.md       ← estado atual por incremento
├── DECISIONS.md            ← decisões operacionais
├── CHANGELOG.md
│
├── apps/web/
│   ├── app/                ← App Router
│   ├── features/           ← NUNCA na raiz
│   ├── components/ui/      ← componentes locais (shadcn copies)
│   ├── lib/                ← utils (cn, etc.)
│   └── ...
│
├── packages/
│   ├── ui/           @agsos/ui         Design System
│   ├── database/     @agsos/database   Clientes Supabase + tipos
│   ├── auth/         @agsos/auth       Autenticação
│   ├── events/       @agsos/events     Event Bus + contratos
│   ├── config/       @agsos/config     Config (Node + Deno)
│   ├── validation/   @agsos/validation Schemas Zod
│   ├── observability/@agsos/observability Logs + tracing
│   ├── integrations/ @agsos/integrations Adapters externos
│   ├── storage/      @agsos/storage    Abstração de Storage
│   ├── testing/      @agsos/testing    Fixtures + factories
│   └── i18n/         @agsos/i18n       next-intl
│
├── supabase/
│   ├── migrations/   ← fonte oficial do schema
│   ├── functions/    ← Edge Functions (Deno)
│   └── tests/        ← testes RLS
│
└── docs/
    └── frozen/       ← documentação normativa (não editar)
        ├── INDEX.md
        ├── architecture/   UL-001, SPEC-001 a 009, ADRs
        └── roadmap/        PLAN-001
```

---

## Domínios e ownership

| Domínio | Aggregate Root | Owner exclusivo de |
|---|---|---|
| Studio | Studio | Identidade, configurações, integrations |
| Projects | Project | Ideas, Epics, Tasks, Milestones |
| Games | Game | Versions, Builds, **Releases**, Assets, ASO metadados |
| AI | AIAgent | Prompts, Execuções, Conversations |
| Publishing | Submission | Submissões (consome Release via evento) |
| Marketing | Campaign | Campanhas, Criativos, ASO estratégia/keywords |
| Analytics | Dashboard | Métricas agregadas (consome eventos) |
| Finance | RevenueLedger | LedgerEntries append-only |
| Knowledge | SpecificationDocument | Documentos, Versões, Relações |
| Administration | User | Roles, Permissions, Sessions |
| Infrastructure | Environment | Deployments, Webhooks, Notifications |

**Regras críticas de ownership:**
- Release: Games cria → Publishing consome via `ReleaseReadyForSubmission`
- ASO: metadados em Games, estratégia em Marketing
- Environment: pertence a Infrastructure; Studio tem só `active_environment_id`
- Analytics: não é owner de sessões — consome eventos

---

## Fluxos principais

### Leitura
```
UI → useQuery (TanStack Query) → Query → server-client → PostgreSQL (RLS)
```

### Escrita
```
UI → Server Action → Command (Zod) → RPC (múltiplas tabelas) ou Supabase client
   → Domain Event → Event Bus → [Job se processamento longo]
```

### IA
```
Módulo → Command → AI Orchestrator → PromptExecution → Job
       → Adapter Anthropic/OpenAI → Domain Event → UI
```

### Notificações
```
Domain Event → Notification Service → Realtime: studio:{studio_id}:notifications
             → NotificationCenter
```

### Webhooks
```
Sistema externo → Edge Function → validação + idempotência → Webhook Router
               → evento interno → Event Bus → Subscribers
```

---

## Banco de dados — regras rápidas

| O quê | Como |
|---|---|
| Soft delete | `archived_at` + `archived_actor_type` + `archived_actor_id` |
| Auditoria (estado) | `created_actor_type/id` + `updated_actor_type/id` |
| Auditoria (histórico) | `studio_events` — append-only, fonte única |
| Multi-tenancy | `studio_id` em todo registro de negócio |
| Migrations | Forward-only; nunca `down.sql`; expand-and-contract para destrutivas |
| Tipos | `supabase gen types typescript` → nunca editar manualmente |
| RevenueLedger | Apenas INSERT; REVERSAL/ADJUSTMENT para correções |
| Event Store | `studio_events` — sem UPDATE nem DELETE |

---

## Design System — regras rápidas

| Regra | Detalhe |
|---|---|
| Tema | Dark-first; light opcional |
| Cores | oklch; nunca valores fixos em componentes |
| Tokens obrigatórios | surface-*, text-*, border-* via `@theme{}` |
| Acessibilidade | WCAG 2.2 AA desde o início |
| Bundle shell | ≤ 450 KB gzip |
| i18n | `t("dominio.chave")` — proibido texto fixo em componentes |
| Recharts | Sempre via `@agsos/ui/charts` |
| Boundary | `@agsos/ui/server` vs `@agsos/ui/client` |

---

## Qualidade — metas progressivas

| Fase | Domain | Application | UI |
|---|---|---|---|
| Fase 1 (Sprint 0–3) | ≥ 80% | ≥ 70% | ≥ 60% |
| Fase 2 (Sprint 4–11) | ≥ 90% | ≥ 80% | ≥ 70% |
| v1.0.0 | ≥ 90% | ≥ 85% | ≥ 80% |

---

## Checklist para nova feature

**Antes:**
- [ ] SPEC aprovada existe?
- [ ] Termos existem no UL-001?
- [ ] Domínio owner definido?
- [ ] Sem acesso direto a outro módulo?

**Durante:**
- [ ] TypeScript strict — sem `any`
- [ ] Zod em todo Command
- [ ] RLS ativa
- [ ] `studio_id` presente
- [ ] Domain Event emitido
- [ ] `correlation_id` propagado
- [ ] Strings via `t("chave")`
- [ ] Tokens de design — sem valores fixos

**Antes do commit:**
- [ ] Build verde
- [ ] Lint e typecheck passando
- [ ] Testes aprovados + cobertura da fase
- [ ] Estados: Loading, Empty, Error, Permission Denied
- [ ] DoD da SPEC-009 atendido

---

## Comandos frequentes

```bash
# Dev
pnpm dev                     # next dev --turbopack

# Qualidade
pnpm typecheck               # tsc --noEmit
pnpm lint                    # ESLint
pnpm format:check            # Prettier
pnpm test                    # Vitest
pnpm build                   # next build

# Supabase
supabase start
supabase db diff --file supabase/migrations/XXX_description.sql
supabase gen types typescript --project-id REF \
  > packages/database/src/generated/database.types.ts

# Git
git checkout -b feature/increment-X-Y
git commit -m "feat(escopo): descrição"
git push origin feature/increment-X-Y
```
