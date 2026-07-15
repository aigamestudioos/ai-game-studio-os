# ARCHITECTURE.md — AI Game Studio OS

> Manual operacional para implementação diária.
> Versão condensada das SPECs normativas em `docs/frozen/`.
> Em conflito com qualquer SPEC: a SPEC prevalece (SPEC-001 §22).

---

## 1. Visão geral

Sistema Operacional para Estúdios de Jogos Mobile AI-First. Um empreendedor individual opera um estúdio capaz de lançar dezenas de jogos por ano usando IA como força principal. Ciclo: ideia → desenvolvimento → publicação → operação.

---

## 2. Stack

Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4 · shadcn/ui · Supabase · pnpm + Turborepo · Vercel · GitHub Actions · Vitest · Playwright · next-intl · Recharts

**Sem:** Prisma · `@agsos/types` · localStorage/sessionStorage · bibliotecas de componentes além de shadcn/ui

---

## 3. Estrutura do monorepo

```
ai-game-studio-os/
├── apps/web/
│   ├── app/              App Router (layout, page, error, loading, not-found)
│   ├── features/         Módulos por domínio de negócio ← NUNCA na raiz
│   ├── components/ui/    Componentes locais (shadcn copies)
│   ├── lib/              utils (cn, etc.)
│   ├── providers/        Providers globais
│   └── hooks/
│
├── packages/
│   ├── ui/               @agsos/ui
│   ├── database/         @agsos/database
│   ├── auth/             @agsos/auth
│   ├── events/           @agsos/events
│   ├── config/           @agsos/config
│   ├── validation/       @agsos/validation
│   ├── observability/    @agsos/observability
│   ├── integrations/     @agsos/integrations
│   ├── storage/          @agsos/storage
│   ├── testing/          @agsos/testing
│   └── i18n/             @agsos/i18n
│
├── supabase/
│   ├── migrations/       ← fonte oficial do schema
│   ├── functions/        Edge Functions (Deno)
│   └── tests/            testes de RLS
│
└── docs/frozen/          documentação normativa (não editar)
```

---

## 4. Direção de dependências

```
apps/web → features/ → packages/
```

- Packages **nunca** importam de `apps/web` ou de outras features
- Features **nunca** importam arquivos internos de outras features
- Toda API pública via `index.ts`
- `@agsos/ui/server` para Server Components · `@agsos/ui/client` para Client Components

---

## 5. Estrutura de cada feature

```
apps/web/features/<dominio>/
├── components/   componentes visuais
├── actions/      Server Actions (Commands)
├── queries/      leitura (Queries)
├── hooks/        hooks específicos
├── schemas/      Zod schemas
├── services/     lógica de negócio
├── types/        tipos locais
├── tests/        testes
└── index.ts      API pública
```

---

## 6. Providers globais (ordem)

```
ThemeProvider → SupabaseProvider → AuthProvider → QueryProvider →
NotificationProvider → AIContextProvider → ApplicationProvider
```

---

## 7. Fluxo de leitura

```
UI Component
  → useQuery (TanStack Query)
  → Query function
  → @agsos/database (server-client)
  → PostgreSQL via RLS
```

---

## 8. Fluxo de escrita

```
UI Component
  → Server Action
  → Command (validação Zod obrigatória)
  → PostgreSQL Function/RPC (para múltiplas tabelas)
    ou Supabase client (operação simples)
  → Domain Event emitido
  → Event Bus (síncrono)
  → Subscribers
  → [Job Dispatcher → Job Worker] se processamento longo
```

---

## 9. Fluxo de IA

```
Módulo → Command → AI Orchestrator (camada, sem tabela própria)
       → PromptExecution → Job → Adapter Anthropic/OpenAI
       → Resultado via Domain Event → UI (Realtime ou polling)
```

**Regra:** módulos **nunca** chamam Anthropic/OpenAI diretamente.

---

## 10. Fluxo de autenticação

```
Login (e-mail ou OAuth)
  → Supabase Auth → JWT
  → AuthProvider
  → Studio ativo selecionado
  → Permissões carregadas
  → Aplicação disponível
```

Três camadas de autorização: Interface (UX) → Aplicação → Banco (RLS, definitivo).

---

## 11. Fluxo de eventos de domínio

```typescript
// Estrutura obrigatória
{
  eventId: string
  eventName: string          // "GameCreated"
  eventVersion: number       // 1 (inteiro — nunca "GameCreated.v1")
  occurredAt: string         // ISO UTC
  aggregateId: string
  aggregateType: string
  studioId: string
  payload: object
  metadata: {
    correlationId: string    // propagado em toda a cadeia
    actorType: "USER" | "SYSTEM" | "INTEGRATION"
    actorId: string | null
  }
}
```

---

## 12. Fluxo de webhooks

```
Sistema externo
  → Edge Function (Deno) — validação de assinatura + idempotência
  → Webhook Router — identifica provedor e tipo
  → Evento interno
  → Event Bus → Subscribers
```

---

## 13. Clientes Supabase

| Cliente | Onde usar | RLS |
|---|---|---|
| `browser-client` | Client Components | ✅ Sempre |
| `server-client` | Server Components, Server Actions | ✅ Contexto de sessão |
| `admin-client` | Webhooks, jobs admin — **apenas servidor** | ❌ Bypass com auditoria |

---

## 14. Banco de dados — convenções

```sql
-- Toda tabela de negócio:
id                   UUID PRIMARY KEY
studio_id            UUID NOT NULL REFERENCES studios(id)  -- multi-tenancy
created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
created_actor_type   actor_type NOT NULL
created_actor_id     UUID NULL
updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_actor_type   actor_type NOT NULL
updated_actor_id     UUID NULL
archived_at          TIMESTAMPTZ NULL  -- soft delete
archived_actor_type  actor_type NULL
archived_actor_id    UUID NULL
```

- Migrations: **forward-only** (nunca `down.sql`)
- Destrutivas: estratégia **expand-and-contract**
- Tipos: `supabase gen types typescript` → `packages/database/src/generated/database.types.ts`
- **Nunca editar** o arquivo de tipos gerado

---

## 15. Design System

```css
/* globals.css — Tailwind v4 */
@import "tailwindcss";

@theme {
  /* tokens de cor (oklch), radius, spacing */
  --color-surface-background: ...;
  --color-text-primary: ...;
  --color-border-default: ...;
}
```

**Regras:**
- Nunca usar `bg-slate-900`, `text-white` direto — sempre tokens
- Todo texto ao usuário: `t("dominio.chave")` — nunca strings fixas
- Recharts: sempre `@agsos/ui/charts` — nunca importar direto

---

## 16. Pacotes @agsos — responsabilidades

| Package | Responsabilidade |
|---|---|
| `@agsos/ui` | Design System (server/, client/, shared/, charts/) |
| `@agsos/database` | browser-client, server-client, admin-client, tipos gerados |
| `@agsos/auth` | Autenticação, sessão, autorização |
| `@agsos/events` | Event Bus, contratos de Domain Events |
| `@agsos/config` | Config centralizada — NodeAdapter e DenoAdapter |
| `@agsos/validation` | Schemas Zod reutilizáveis |
| `@agsos/observability` | Logs estruturados, tracing, correlation_id |
| `@agsos/integrations` | Adapters externos (GitHub, Anthropic, Apple...) |
| `@agsos/storage` | Abstração de Storage (Supabase → S3/R2 no futuro) |
| `@agsos/testing` | Fixtures, factories, utilitários de teste |
| `@agsos/i18n` | next-intl, mensagens, formatadores |

---

## 17. Realtime — canais autorizados

```
studio:{studio_id}:notifications
studio:{studio_id}:builds
studio:{studio_id}:ai-executions
```

Toda subscription valida sessão e filtra por `studio_id`. Proibido assinar tabelas inteiras.

---

## 18. Checklist para nova feature

**Antes de começar:**
- [ ] SPEC aprovada existe?
- [ ] Termos no UL-001?
- [ ] Domínio owner definido?

**Durante:**
- [ ] TypeScript strict (sem `any`)
- [ ] Zod em todo Command
- [ ] RLS ativa + `studio_id` presente
- [ ] Domain Event emitido + `correlation_id` propagado
- [ ] Strings via `t("chave")` + tokens de design

**Antes do commit:**
- [ ] Build verde · lint · typecheck · testes
- [ ] Cobertura de domínio ≥ meta da fase atual
- [ ] Estados: Loading, Empty, Error, Permission Denied
- [ ] DoD da SPEC-009 atendido

---

## 19. Contrato de execução por incremento

**Início:**
> Antes de qualquer código: leia ARCHITECTURE.md e PROJECT_STATUS.md, verifique branch e git status, revise código existente, reporte conflitos antes de implementar.

**Final:**
> Ao concluir: liste arquivos criados/alterados, decisões tomadas, comandos executados, resultado de cada validação, critérios de aceite atendidos, próximo incremento.

---

## 20. Quando usar Claude Opus

Apenas para: revisão arquitetural após sprint completo, refatorações em múltiplos packages, análise de impacto estrutural, otimizações críticas.

**Não usar** para: CRUDs, componentes, migrations rotineiras, correções de lint.
