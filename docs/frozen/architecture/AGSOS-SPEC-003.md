# AGSOS-SPEC-003 — Data Architecture

**Versão:** 1.0.0 (inclui Revision 1 das Partes A e B)
**Status:** APPROVED FROZEN
**Classificação:** Documento Normativo

---

## Parte A — Logical Data Model

### 1. Princípios

- **Fonte única** — cada informação tem uma representação oficial
- **Integridade** — garantida pelo banco, não pelo frontend
- **Normalização** — preferencialmente 3FN; desnormalizações exigem justificativa de performance
- **Identificadores** — toda entidade tem `id` (UUID v7 quando disponível; fallback UUID v4 com ADR)
- **Soft delete** — usar `archived_at` + `archived_actor_type` + `archived_actor_id` (exceto: Event Store, logs temporários, cache)

### 2. Convenções

| Elemento | Convenção |
|---|---|
| Tabelas | snake_case, plural (`game_versions`) |
| Colunas | snake_case |
| FKs | `entidade_id` (`project_id`, `studio_id`) |
| Índices | `idx_tabela_coluna` |
| Constraints | `chk_`, `fk_`, `uq_` |

### 3. Colunas Obrigatórias em Toda Tabela de Negócio

```sql
id                   UUID PRIMARY KEY DEFAULT gen_random_uuid()
studio_id            UUID NOT NULL REFERENCES studios(id)
created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
created_actor_type   actor_type NOT NULL
created_actor_id     UUID NULL
updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_actor_type   actor_type NOT NULL
updated_actor_id     UUID NULL
archived_at          TIMESTAMPTZ NULL
archived_actor_type  actor_type NULL
archived_actor_id    UUID NULL
```

**Modelo de ator:**
- `actor_type`: USER | SYSTEM | INTEGRATION (PostgreSQL ENUM)
- `actor_id`: UUID nullable — obrigatório para USER, opcional para SYSTEM/INTEGRATION
- Integridade do actor_id garantida por validação de aplicação e CHECK constraints (sem FK polimórfica)
- Informações adicionais do ator (ex: `integration_name`, `correlation_id`) no campo `metadata` JSONB

### 4. Workspace

**Não possui tabela própria.** Workspace é conceito lógico mapeado para o Studio ativo na sessão do usuário.

### 5. Aggregate Roots Persistentes

```
studios, projects, games, ai_agents, campaigns, dashboards,
revenue_ledgers, users, submissions, environments
```

### 6. Modelo Relacional

```
Studio 1:N Projects 1:N Games 1:N Game Versions 1:N Builds 1:N Submissions N:1 Platforms
Studio 1:N Ideas (Idea 0:1 Project; ideas.converted_project_id + projects.source_idea_id)
Studio 1:N Users
Studio 1:N Revenue Ledger → Ledger Entries
Studio 1:N AI Agents → Prompt Templates → Prompt Executions → Conversations
Studio 1:N Knowledge Documents
Games 1:N Campaigns 1:N Creatives
Games 1:N Game Localizations
Environments 1:N Deployments, Repositories, Webhooks
```

### 7. Ideas — Relacionamento

- Ideas existem antes de Projects: `Studio 1:N Ideas`
- Uma Idea aprovada pode gerar um Project: `Idea 0:1 Project`
- `ideas.converted_project_id` referencia o Project gerado
- `projects.source_idea_id` referencia a Idea origem
- Referência circular requer FKs deferíveis na migration

### 8. RevenueLedger

```sql
-- Tabelas
revenue_ledgers      -- Aggregate Root (livro razão por Studio)
ledger_entries       -- Lançamentos individuais (append-only)

-- Campos mínimos de ledger_entries:
id, studio_id, revenue_ledger_id, entry_type, amount, currency,
occurred_at, source_type, source_id, description, metadata,
actor_type, actor_id, created_at
```

**Imutabilidade:** apenas INSERT. UPDATE e DELETE proibidos. Proteção via permissões, políticas e trigger de proteção.

### 9. Knowledge

```sql
knowledge_documents           -- identidade, tipo, estado atual
knowledge_document_versions   -- versões imutáveis do conteúdo
knowledge_document_relations  -- relaciona a Projects, Games, Ideas, Tasks, etc.
```

Documentos publicados não são sobrescritos — uma alteração cria nova versão.

### 10. Tabelas Globais (sem studio_id)

```
platforms, countries, languages, currencies, timezones,
notification_channel_definitions, build_targets
```

Somente leitura para usuários comuns. Populadas via seed versionado.

### 11. User Dashboard Preferences

```sql
user_dashboard_preferences (
  id, user_id, studio_id,
  layout JSONB,
  widgets JSONB,
  collapsed_panels JSONB,
  favorite_widgets JSONB,
  updated_at
)
```

### 12. Game Localizations

```sql
game_localizations (
  id, studio_id, game_id, language_code,
  title, short_description, full_description,
  keywords, metadata
)
```

### 13. ENUMs Oficiais

```sql
actor_type:              USER | SYSTEM | INTEGRATION
environment_type:        LOCAL | DEVELOPMENT | STAGING | PRODUCTION
project_status:          DRAFT | PLANNING | ACTIVE | ON_HOLD | COMPLETED | ARCHIVED
idea_status:             CAPTURED | UNDER_REVIEW | PROMISING | APPROVED | CONVERTED | REJECTED | ARCHIVED
task_status:             NOT_STARTED | IN_PROGRESS | BLOCKED | COMPLETED | CANCELLED
task_priority:           LOW | MEDIUM | HIGH | CRITICAL
game_status:             DRAFT | IN_DEVELOPMENT | TESTING | READY_FOR_RELEASE | PUBLISHED | SUSPENDED | ARCHIVED
version_status:          DRAFT | IN_DEVELOPMENT | TESTING | READY | RELEASED | DEPRECATED
build_status:            PENDING | RUNNING | SUCCEEDED | FAILED | CANCELLED
release_status:          DRAFT | READY_FOR_SUBMISSION | SUBMISSION_IN_PROGRESS | PARTIALLY_PUBLISHED | PUBLISHED | REJECTED | CANCELLED | ARCHIVED
submission_status:       DRAFT | WAITING | SUBMITTED | IN_REVIEW | APPROVED | REJECTED | PUBLISHED | CANCELLED
campaign_status:         PLANNED | RUNNING | PAUSED | FINISHED | ARCHIVED
notification_status:     QUEUED | PROCESSING | DELIVERED | FAILED | CANCELLED
notification_channel_type: IN_APP | EMAIL | WEBHOOK | PUSH
notification_category:   SYSTEM | AI | PROJECT | BUILD | PUBLISHING | MARKETING | FINANCE | SECURITY | INTEGRATION
ledger_entry_type:       REVENUE | EXPENSE | ADJUSTMENT | TRANSFER | REFUND | REVERSAL
knowledge_document_type: SPEC | ADR | SOP | GUIDE | PLAYBOOK | TEMPLATE | POLICY | LESSON_LEARNED | TECHNICAL_DOCUMENT
knowledge_document_status: DRAFT | IN_REVIEW | APPROVED | PUBLISHED | OBSOLETE | ARCHIVED
integration_status:      DISCONNECTED | CONNECTING | CONNECTED | DEGRADED | ERROR | DISABLED
```

---

## Parte B — Persistence Architecture

### 1. Stack Oficial

PostgreSQL (Supabase), Supabase Auth, Supabase CLI, supabase-js, SQL Migrations, PostgreSQL Functions, Edge Functions (runtime: **Deno**), Storage, Realtime.

**Prisma não faz parte da arquitetura.**

### 2. Estrutura

```
supabase/
├── migrations/    ← fonte oficial do schema
├── seed/
├── functions/     ← Edge Functions (Deno)
├── tests/         ← testes de RLS e políticas
└── config.toml
```

### 3. Migrações

- **Forward-only** — nunca criar `down.sql`
- Uma migration = um contexto de negócio
- Correções sempre por nova migration
- Mudanças destrutivas: estratégia **expand-and-contract**
- Produção recebe apenas migrations aprovadas (local → staging → produção)

### 4. Row Level Security (RLS)

- Habilitado em **todas** as tabelas de negócio
- Toda consulta respeita `studio_id = current_user_studio`
- O isolamento é garantido pelo banco, não apenas por filtros de frontend
- Testes obrigatórios: usuário sem auth, usuário autenticado, usuário de outro Studio, admin, membro comum

### 5. Event Store

```sql
-- Tabela: studio_events (append-only)
id, event_name, event_version, aggregate_type, aggregate_id,
studio_id, payload, metadata, occurred_at, actor_type, actor_id
```

**Fonte única de histórico.** UPDATE e DELETE proibidos. Não criar tabela `audit_logs` separada.

**Duas camadas de auditoria:**
- Campos nas tabelas = estado atual (`created_actor_type`, `updated_actor_type`, etc.)
- `studio_events` = histórico completo e imutável

### 6. Clientes Supabase

| Cliente | Uso | RLS |
|---|---|---|
| browser-client | Client Components | ✅ Sempre sujeito |
| server-client | Server Components, Server Actions | ✅ Contexto de sessão |
| admin-client | Operações administrativas, webhooks | ❌ Bypass com auditoria obrigatória |

### 7. Realtime

Restrito a casos autorizados: notificações in-app, progresso de builds, AI Orchestrator, progresso de tarefas longas.

**Canais obrigatórios:** `studio:{studio_id}:notifications`, `studio:{studio_id}:builds`, `studio:{studio_id}:ai-executions`

Toda subscription valida sessão e filtra por `studio_id`. Proibido assinar tabelas inteiras sem filtro.

### 8. Storage

```
Buckets: game-assets, marketing-assets, documents, builds, user-uploads, temp
```

`temp` bucket: privado, TTL 24h, path `{studio_id}/{user_id}/{upload_id}/{filename}`, limpeza idempotente.

### 9. Edge Functions

Runtime: **Deno**. Sem APIs exclusivas de Node.js. Nunca armazenar segredos no código. Validar assinatura de webhooks. Implementar idempotência. Usar Supabase Secrets para credenciais.

### 10. Tipos TypeScript

Gerados por: `supabase gen types typescript`
Destino: `packages/database/src/generated/database.types.ts`
**Nunca editar manualmente.**

### 11. Busca Global

- **Fase 1:** PostgreSQL Full-Text Search (`tsvector` + `tsquery` + índices GIN)
- **Fase 2:** Serviço externo via ADR quando métricas indicarem necessidade
- Features sempre acessam via `SearchService` — nunca diretamente

### 12. UUID

Verificar suporte a UUID v7 no PostgreSQL do Supabase antes da primeira migration. Fallback para UUID v4 com registro em ADR.
