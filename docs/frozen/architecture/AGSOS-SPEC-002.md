# AGSOS-SPEC-002 — Domain Blueprint

**Versão:** 1.0.0 (inclui Revision 1)
**Status:** APPROVED FROZEN
**Classificação:** Documento Normativo

---

## 1. Objetivo

Define o modelo de domínio oficial do AI Game Studio OS: linguagem do negócio, limites dos domínios, agregados, entidades, eventos de domínio e regras permanentes — antes da modelagem do banco de dados e da implementação.

**Este documento não define:** banco de dados, tabelas, APIs, componentes React, páginas, layout, infraestrutura.

---

## 2. Princípios

- **Business First** — todo elemento existe por necessidade do negócio
- **Linguagem Única** — todos os termos obedecem ao UL-001
- **Baixo Acoplamento** — domínios comunicam-se por eventos e contratos
- **Alta Coesão** — responsabilidades claras por domínio
- **Ownership** — toda entidade pertence a exatamente um domínio

---

## 3. Domínios

Studio, Projects, Games, Artificial Intelligence, Publishing, Marketing, Analytics, Finance, Knowledge, Administration, Infrastructure.

Cada domínio é um Bounded Context. Nenhum domínio acessa diretamente entidades internas de outro. Comunicação exclusiva por: Eventos, Serviços públicos, Contratos, Interfaces.

Infrastructure e Administration são **domínios transversais** — suportam todos os outros.

---

## 4. Domínio Studio

**Objetivo:** Representar o estúdio proprietário. Domínio raiz.
**Aggregate Root:** Studio
**Entidades:** Studio, Brand, DeveloperAccount, Integration, TechnologyStack, StudioSettings, DeploymentTarget
**Value Objects:** StudioName, Logo, ColorPalette, Timezone, Currency, Locale
**Nota:** Studio referencia apenas `active_environment_id` — Environment pertence ao domínio Infrastructure.

**Invariantes:**
- Um Studio possui exatamente um Owner
- Um Studio deve possuir uma configuração ativa
- Um Studio nunca pode existir sem identidade

**Eventos:** StudioCreated, StudioUpdated, StudioArchived, IntegrationConnected, IntegrationDisconnected, DeveloperAccountAdded

---

## 5. Domínio Projects

**Objetivo:** Gerenciar a transformação de uma Idea em um Game publicado.
**Aggregate Root:** Project
**Entidades:** Idea, Project, Epic, Feature, Task, Milestone, Requirement
**Value Objects:** Priority, Effort, Status, DueDate, Estimate

**Invariantes:**
- Toda Idea pertence a um Studio (Studio 1:N Ideas)
- Uma Idea pode existir antes de um Project
- Todo Project nasce de uma Idea (Idea 0:1 Project)
- Todo Project possui um Status
- Um Project pode gerar vários Games
- `ideas` nunca é Aggregate Root — pertence ao agregado `projects`

**Eventos:** IdeaCreated, IdeaApproved, ProjectCreated, MilestoneCompleted, TaskCompleted, ProjectArchived

---

## 6. Domínio Games

**Objetivo:** Representar os produtos digitais desenvolvidos pelo Studio.
**Aggregate Root:** Game
**Entidades:** Game, GameVersion, Build, Release, GameAsset, Localization, MonetizationProfile
**Value Objects:** VersionNumber, BundleIdentifier, PackageName, StoreIdentifier

**ASO Boundary:** Games é owner dos **metadados** (nome, descrição, screenshots, ícone, categorias). Marketing é owner da **estratégia** (keywords, análise competitiva, ranking).

**Invariantes:**
- Todo Game pertence a um Project
- Todo Build pertence a uma Version
- Uma Release pertence a Games (Publishing consome via evento, não possui)
- Uma Version pode possuir vários Builds

**Eventos:** GameCreated, VersionCreated, BuildStarted, BuildFinished, **ReleaseReadyForSubmission**, ReleasePublished

---

## 7. Domínio Artificial Intelligence

**Objetivo:** Gerenciar toda interação entre o sistema e modelos de IA.
**Aggregate Root:** AIAgent
**Entidades:** AIAgent, Prompt, PromptTemplate, PromptExecution, Automation, Conversation

**Invariantes:**
- Toda execução possui Prompt
- Todo Prompt pertence a um Template ou foi criado manualmente
- Toda Automation possui um responsável
- Toda Conversation pertence a exatamente um Studio
- Uma Conversation pode estar associada opcionalmente a: Project, Game, Idea ou Task
- `ai_agent_id` é opcional em Conversation

**Eventos:** PromptGenerated, PromptExecuted, AutomationStarted, AutomationFinished, ReviewCompleted

---

## 8. Domínio Publishing

**Objetivo:** Gerenciar o processo operacional de distribuição de jogos. **Não possui Release** — consome Releases via evento.
**Aggregate Root:** Submission
**Entidades:** Submission, StoreReview, Certificate, ProvisionProfile, StoreConnection

**Fluxo obrigatório:**
```
ReleaseReadyForSubmission → Publishing → CreateSubmission → Store Review → SubmissionPublished
```

**Invariantes:**
- Toda Submission pertence exatamente a uma Release
- Toda Submission possui exatamente uma Platform
- Nenhuma Submission pode existir sem um Build válido

**Eventos consumidos:** ReleaseReadyForSubmission, BuildApproved, ReleaseCancelled
**Eventos emitidos:** SubmissionCreated, SubmissionApproved, SubmissionRejected, SubmissionPublished, StoreReviewReceived

---

## 9. Domínio Marketing

**Objetivo:** Gerenciar aquisição de usuários e estratégia ASO.
**Aggregate Root:** Campaign
**Entidades:** Campaign, Creative, Audience, Keyword, LandingPage

**Invariantes:** Toda Campaign pertence a um Game.
**Eventos:** CampaignStarted, CampaignFinished, CreativePublished

---

## 10. Domínio Analytics

**Objetivo:** Centralizar métricas. Analytics **não é owner de sessões** — consome eventos de outros domínios para gerar métricas agregadas.
**Aggregate Root:** Dashboard
**Entidades:** Metric, Dashboard, Chart, Funnel, Cohort, Retention

**Invariantes:**
- Toda métrica possui origem identificável
- Nenhum relatório pode alterar dados históricos

**Eventos:** MetricImported, DashboardUpdated, AnomalyDetected

---

## 11. Domínio Finance

**Objetivo:** Controlar a saúde financeira do Studio.
**Aggregate Root:** RevenueLedger (append-only — apenas INSERT; correções via REVERSAL/ADJUSTMENT)
**Entidades:** Revenue, Expense, Invoice, Forecast, CashFlow, Subscription

**Invariantes:**
- RevenueLedger é imutável
- Somente operações de inclusão (append) são permitidas
- Receitas nunca podem ser alteradas após conciliação

**Eventos:** RevenueRegistered, ExpenseRegistered, ForecastUpdated

---

## 12. Domínio Knowledge

**Objetivo:** Centralizar o conhecimento produzido pelo Studio.
**Entidades:** SpecificationDocument, ArchitectureDecisionRecord, SOPDocument, GuideDocument, TemplateDocument, PlaybookDocument, KnowledgeEntry

**Nota:** Estas entidades representam conteúdos armazenados pelo sistema, não os documentos normativos originais de desenvolvimento.

**Invariantes:**
- Todo documento possui versão
- Nenhuma SPEC aprovada pode ser alterada diretamente

**Eventos:** KnowledgeCreated, KnowledgeUpdated, SpecificationApproved

---

## 13. Domínio Administration

**Objetivo:** Gerenciar usuários e segurança.
**Aggregate Root:** User
**Entidades:** User, Role, Permission, Session, AuditLog

**Invariantes:**
- Todo usuário pertence a um Studio
- Toda Role possui Permissions

**Eventos:** UserCreated, RoleGranted, PermissionRevoked, SessionStarted, SessionEnded

---

## 14. Domínio Infrastructure (Transversal)

**Objetivo:** Representar integrações técnicas e serviços de suporte.
**Aggregate Root:** Environment

**Dois módulos internos (SPEC-004):**
- **Platform Infrastructure:** Environment, Deployment, Repository, Webhook, SecretReference
- **Communication Infrastructure:** Notification, NotificationTemplate, NotificationChannel, NotificationDelivery

**Invariantes:**
- Nenhum Secret pode ser armazenado em texto puro
- Todo Deployment pertence a um Environment
- Todo Environment possui um tipo: LOCAL | DEVELOPMENT | STAGING | PRODUCTION

**Eventos:** DeploymentStarted, DeploymentFinished, WebhookReceived, NotificationQueued, NotificationDelivered, NotificationFailed

---

## 15. Hierarquia de Domínios

```
                         Studio
                            │
      ┌─────────────────────┼──────────────────────┐
      │                     │                      │
 Projects          Artificial Intelligence     Knowledge
      │
    Games
      │
      ├──────────────┬───────────────┬─────────────┐
      │              │               │             │
Publishing      Marketing       Analytics      Finance
```
Infrastructure e Administration: domínios transversais (suportam todos).

---

## 16. Eventos de Domínio — Campos Obrigatórios

```typescript
{
  eventId: string
  eventName: string          // ex: "GameCreated"
  eventVersion: number       // ex: 1 (inteiro, nunca "GameCreated.v1")
  occurredAt: string         // ISO UTC
  aggregateId: string
  aggregateType: string
  studioId: string
  payload: object
  metadata: object           // inclui correlationId, actorType, actorId
}
```

---

## 17. Aggregate Roots Oficiais

Studio, Project, Game, AIAgent, Release, Campaign, Dashboard, RevenueLedger, SpecificationDocument (Knowledge), User, Submission, Environment
