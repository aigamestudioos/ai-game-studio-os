# AGSOS-SPEC-008 — Integrations & External Services

**Versão:** 1.0.0 (inclui Revision 1)
**Status:** APPROVED FROZEN
**Classificação:** Documento Normativo

---

## 1. Princípios

- Todas as integrações usam Adapter Pattern
- Cada integração possui contrato próprio
- Nenhuma API externa é conhecida pelas features
- Toda integração gera telemetria e é auditável
- Todas as integrações são resilientes a falhas e substituíveis

---

## 2. Estrutura

```
packages/integrations/
├── core/
├── github/
├── apple/
├── google-play/
├── revenuecat/
├── posthog/
├── anthropic/
├── openai/
├── stripe/
├── meta/
└── google-ads/

packages/storage/        ← separado de integrations (ADR)
```

Cada integração contém: `adapter/`, `client/`, `contracts/`, `dto/`, `errors/`, `mappers/`, `tests/`.

---

## 3. Contrato Base dos Adapters

```typescript
interface IntegrationAdapter {
  connect(): Promise<void>
  disconnect(): Promise<void>
  health(): Promise<HealthStatus>
}
// Cada adapter expõe interface especializada própria além do base:
interface ApplePublishingAdapter extends IntegrationAdapter {
  uploadBuild(params: ...): Promise<...>
  submitForReview(params: ...): Promise<...>
  getSubmissionStatus(id: string): Promise<...>
}
```

---

## 4. Integrações Oficiais

| Integração | Consumido por | Observações |
|---|---|---|
| GitHub | Projects, AI Orchestrator | repositórios, branches, commits, PRs, workflows |
| Apple App Store Connect | Publishing | certificados, provisioning, builds, TestFlight, submissões |
| Google Play Developer API | Publishing | uploads, tracks, releases, status |
| Anthropic | AI Orchestrator exclusivamente | geração de texto, revisão, planejamento |
| OpenAI | AI Orchestrator exclusivamente | modelos compatíveis, embeddings (futuro), visão (futuro) |
| RevenueCat | Analytics + Finance via Domain Events | nunca chamada direta dos módulos |
| PostHog | Analytics | eventos, sessões, funis; feature flags separados |
| Stripe | Finance | cobrança B2B do próprio AGSOS (não receitas de jogos) |
| Meta Ads | Marketing | campanhas, conjuntos, anúncios, métricas |
| Google Ads | Marketing | campanhas, keywords, métricas |

---

## 5. Notification Providers

```
packages/integrations/notifications/  (futuro)
```
Resend (e-mail), Web Push (futuro), Slack (futuro), Discord (futuro).
Consumidos exclusivamente pelo Notification Service.

---

## 6. Storage

Movido para `packages/storage` (fora de packages/integrations).
Abstração de buckets, upload, download, políticas.
Implementação inicial: Supabase Storage. Futuras: Amazon S3, Cloudflare R2.
Features nunca acessam o provedor diretamente.

---

## 7. Arquitetura de Webhooks

```
Sistema Externo
      ↓
Webhook Endpoint (Edge Function — Deno)
      ↓
Validação de assinatura + timestamp + idempotência
      ↓
Webhook Router (identifica provedor + tipo de evento)
      ↓
Converte para evento interno
      ↓
Event Bus → Subscribers
```

Nenhum módulo de negócio recebe webhooks diretamente.
Eventos internos: `SubmissionStatusChanged`, `StripeInvoicePaid`, `RevenueImported`, `SubscriptionRenewed`, `TestFlightBuildProcessed`.

---

## 8. Retry Policy

- **Falhas temporárias:** exponential backoff + jitter + máximo 5 tentativas
- **Falhas permanentes:** registrar evento, gerar notificação, interromper processamento

---

## 9. Rate Limiting

Fila persistida em PostgreSQL:

```sql
integration_jobs (
  id, integration_name, operation, payload, status,
  retry_count, scheduled_at, correlation_id
)
-- Índice obrigatório: (integration_name, status, scheduled_at)
```

---

## 10. Timeouts Padrão

| Operação | Timeout |
|---|---|
| Leitura | 10s |
| Escrita | 30s |
| Upload | 120s |
| Download | 60s |
| Webhook | 5s |

Adapters podem reduzir; nunca aumentar sem justificativa documentada.

---

## 11. Observabilidade

Toda chamada registra: `integration_name`, `operation`, `duration_ms`, `success`, `correlation_id`, `actor_type`, `actor_id`, `studio_id`.

---

## 12. Secrets

Nunca em: frontend, código, migrations.
Usar: Supabase Secrets, Vercel Environment Variables.

---

## 13. Sandbox

Integrações com suporte a sandbox (Stripe, Apple, Google Play) devem implementá-lo. Troca entre sandbox e produção configurável por Environment.

---

## 14. Feature Flags

PostHog é responsável por eventos (Analytics). Feature Flags separados — quando adotados: `packages/feature-flags` com adapter próprio.

---

## 15. Ordem de Implementação (Sprint 11)

GitHub → Anthropic → OpenAI → Apple → Google Play → RevenueCat → PostHog → Stripe → Meta Ads → Google Ads → Notification Providers
