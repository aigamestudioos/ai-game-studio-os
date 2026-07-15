# AGSOS-SPEC-004 — Application Foundation

**Versão:** 1.0.0 (inclui Revision 1)
**Status:** APPROVED FROZEN
**Classificação:** Documento Normativo

---

## 1. Objetivo

Define a arquitetura da aplicação, organização interna e serviços fundamentais sobre os quais todas as funcionalidades serão implementadas.

---

## 2. Providers Globais (ordem obrigatória)

```
ThemeProvider → SupabaseProvider → AuthProvider → QueryProvider →
NotificationProvider → AIContextProvider → ApplicationProvider
```

**AIContextProvider** mantém: Conversation ativa, AI Agent selecionado, modelo ativo, histórico resumido, preferências de sessão, estado do AI Orchestrator. Não executa IA — apenas mantém contexto.

---

## 3. Event Bus

Comunicação entre features: síncrono, tipado, desacoplado, sem dependências circulares.

```typescript
interface EventBus {
  publish(event: DomainEvent): void
  subscribe(eventType: string, handler: EventHandler): void
  unsubscribe(eventType: string, handler: EventHandler): void
}
```

**Regra crítica:** Event Bus nunca executa processamento pesado. Subscribers criam Jobs; não executam o trabalho.

**Fluxo:**
```
Command → Transaction → Event Bus (síncrono) → Job Dispatcher → jobs → Job Worker → Processamento
```

---

## 4. Command Bus

Operações que alteram estado. Validação Zod obrigatória. Retorno tipado. Transação quando aplicável (via PostgreSQL RPC para múltiplas tabelas). Emite evento após sucesso.

**Transações:** Commands que alteram múltiplas entidades usam PostgreSQL Functions (RPC). Operações simples: Supabase Client normal.

---

## 5. Query Layer

Somente leitura. Cacheável. Sem efeitos colaterais. Nunca usar Commands para leitura.

---

## 6. Background Jobs e Scheduler

**Scheduler:** Supabase Cron + Edge Functions.
**Tipos:** Agendada (limpeza temp, sincronização) e Sob demanda (IA, builds, importações).

Cada Job: JobId, Status, Progress, Logs, Resultado.
Todo Job é idempotente.

---

## 7. Notification Service

Tipos: in-app, toast, e-mail, push (futuro), webhook (futuro).
Toda notificação origina de um evento.

**Fluxo:**
```
Domain Event → Notification Service → Notification →
NotificationDelivery → Channel → Entrega
```

O serviço não cria um segundo modelo — apenas orquestra o domínio Infrastructure.

---

## 8. Gerenciamento de Estado

| Tecnologia | Uso |
|---|---|
| TanStack Query | Dados remotos, cache, invalidação, sincronização |
| Zustand | Estado temporário da interface, preferências do usuário, UI state |

**Nunca** armazenar dados persistentes do negócio em Zustand.

---

## 9. Autenticação

Supabase Auth exclusivamente.

**Fluxo:** Login → Sessão JWT → Studio Ativo → Permissões → Aplicação

**Três camadas de autorização:**
1. Interface (UX — oculta elementos)
2. Aplicação (valida antes de executar Command)
3. Banco (RLS — fonte definitiva)

---

## 10. Observabilidade

Package: `@agsos/observability`. Responsável por: logs estruturados, métricas, tracing, captura de exceções.

Toda requisição possui `correlation_id`, propagado obrigatoriamente para: `studio_events`, Jobs, Logs, Integrações.

---

## 11. Configuração

`@agsos/config` — dois adapters:
- `NodeAdapter` — para Next.js (`process.env`)
- `DenoAdapter` — para Edge Functions (`Deno.env`)

API pública idêntica. Features **nunca** usam `process.env` diretamente.

---

## 12. Integrações

Cada integração externa: adapter próprio. Features nunca consomem APIs externas diretamente.

---

## 13. Segurança

Proibido: armazenar secrets no cliente, chamadas diretas com Service Role, acesso ao banco sem RLS, bypass de autorização.

---

## 14. Estrutura de packages

| Package | Responsabilidade |
|---|---|
| `@agsos/ui` | Design System |
| `@agsos/database` | Clientes Supabase + tipos gerados |
| `@agsos/auth` | Autenticação e autorização |
| `@agsos/events` | Event Bus + contratos de Domain Events |
| `@agsos/config` | Configuração (Node + Deno adapters) |
| `@agsos/validation` | Schemas Zod reutilizáveis |
| `@agsos/observability` | Logs, tracing, métricas |
| `@agsos/integrations` | Adapters de serviços externos |
| `@agsos/storage` | Abstração de Storage |
| `@agsos/testing` | Fixtures e factories de teste |
| `@agsos/i18n` | next-intl + mensagens |

**`@agsos/types` não existe** — tipos distribuídos por: packages/database (banco), features (domínio), package proprietário (compartilhados).

---

## 15. Ordem de Implementação (Sprint 1)

1. Configuração do monorepo
2. Packages compartilhados
3. Providers
4. Autenticação
5. Configuração
6. Observabilidade
7. Event Bus
8. Command Bus
9. Query Layer
10. Notification Service
11. Scheduler
12. Background Jobs
