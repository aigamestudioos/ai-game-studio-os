# AGSOS-SPEC-007 — Business Features

**Versão:** 1.0.0 (inclui Revision 1)
**Status:** APPROVED FROZEN
**Classificação:** Documento Normativo

---

## Ordem de Implementação

**Fase 1:** Projects → Games → Knowledge
**Fase 2:** Publishing → Marketing
**Fase 3:** Analytics → Finance

---

## Cross Module Rules

Todos os módulos devem: emitir Domain Events, usar Commands, usar Queries, respeitar RLS, gerar telemetria, registrar auditoria, usar Notification Service.

**IA:** toda funcionalidade de IA opera via AI Orchestrator. Proibido que módulos chamem OpenAI/Anthropic diretamente.

**Integrações:** módulos consomem integrações apenas via adapters oficiais.

**Permissões por módulo:** Viewer, Editor, Manager, Admin.

---

## 1. Projects (Sprint 4)

**Objetivo:** Transformar ideias em produtos executáveis.

**Funcionalidades:** Captura de ideias, Refinamento com IA, Backlog, Epics, Features, Tasks, Roadmap, Milestones, Dependências, Priorização, Conversão Idea → Project.

**IA:** quebrar Epics em Tasks, sugerir prioridades, estimar esforço, identificar riscos, detectar bloqueios.

**Integração:** GitHub (Projects, AI Orchestrator).

### Commands
`CreateIdea`, `ApproveIdea`, `CreateProject`, `CreateEpic`, `CreateTask`, `CompleteTask`, `ArchiveProject`

### Queries
`GetProject`, `ListProjects`, `GetRoadmap`, `ListIdeas`, `ListTasks`

### Domain Events
`IdeaCreated`, `IdeaApproved`, `ProjectCreated`, `TaskCompleted`, `MilestoneCompleted`, `ProjectArchived`

---

## 2. Games (Sprint 5)

**Objetivo:** Gerenciar todo o ciclo de vida dos jogos.

**Funcionalidades:** Cadastro, Plataformas, Builds, Releases, Assets, Localizações (`game_localizations`), Monetização, Versionamento.

**ASO (Games):** revisão de descrições, otimização de metadados, validação de screenshots, checklist para publicação.

**Integrações:** Apple App Store Connect, Google Play Developer API (via Publishing).

### Commands
`CreateGame`, `CreateVersion`, `CreateBuild`, `CreateRelease`, `ArchiveGame`

### Queries
`GetGame`, `ListGames`, `GetBuild`, `GetRelease`

### Domain Events
`GameCreated`, `VersionCreated`, `BuildStarted`, `BuildFinished`, `ReleaseReadyForSubmission`, `ReleasePublished`

---

## 3. Knowledge (Sprint 6)

**Objetivo:** Centralizar o conhecimento do Studio. Presente desde a Fase 1 pois fornece contexto ao AI Orchestrator e habilita RAG.

**Funcionalidades:** Documentos (`knowledge_documents` + `knowledge_document_versions` + `knowledge_document_relations`), Versionamento, Templates, Playbooks, SOPs, ADRs, SPECs, Busca, Relações entre documentos.

**IA:** resumir documentos, sugerir links, localizar duplicidades, responder perguntas usando Knowledge Base.

### Commands
`CreateDocument`, `PublishDocument`, `ArchiveDocument`, `LinkDocument`

### Queries
`GetDocument`, `SearchDocuments`, `ListDocuments`

### Domain Events
`DocumentCreated`, `DocumentPublished`, `DocumentArchived`

---

## 4. Publishing (Sprint 7)

**Objetivo:** Publicar jogos nas plataformas. **Não possui Release** — consome via evento.

**Fluxo obrigatório:**
```
ReleaseReadyForSubmission → Publishing → CreateSubmission → Store Review → SubmissionPublished
```

Publishing **nunca acessa** o módulo Games diretamente.

**Funcionalidades:** Submissões, certificados, status, histórico, revisões, distribuição.

**IA:** checklist pré-publicação, validação de metadados, identificação de riscos, geração de changelog.

**Integrações:** Apple App Store Connect, Google Play Console.

### Commands
`CreateSubmission`, `SubmitBuild`, `CancelSubmission`, `RetrySubmission`

### Queries
`GetSubmission`, `ListSubmissions`, `SubmissionHistory`

### Domain Events
`SubmissionCreated`, `SubmissionSent`, `SubmissionApproved`, `SubmissionRejected`, `SubmissionPublished`

---

## 5. Marketing (Sprint 8)

**Objetivo:** Gerenciar aquisição de usuários.

**ASO (Marketing):** pesquisa de keywords, análise de concorrentes, ranking, oportunidades, experimentos, testes de criativos.

**Funcionalidades:** campanhas, criativos, calendário, landing pages, ASO (estratégia), testes A/B, palavras-chave.

**IA:** geração de textos/títulos/descrições/anúncios (versão inicial); geração de imagens **diferida** para após SPEC-008 com adapters de visão.

**Integrações:** Meta Ads, Google Ads.

### Commands
`CreateCampaign`, `PauseCampaign`, `ResumeCampaign`, `ArchiveCampaign`

### Queries
`GetCampaign`, `ListCampaigns`, `CampaignMetrics`

### Domain Events
`CampaignCreated`, `CampaignStarted`, `CampaignPaused`, `CampaignFinished`

---

## 6. Analytics (Sprint 9)

**Objetivo:** Centralizar métricas. **Não é owner de sessões** — consome eventos de outros domínios para gerar métricas agregadas.

**Funcionalidades:** dashboards, KPIs, retenção, funis, LTV, CAC, receita, coortes, sessões (via eventos).

**IA:** detectar anomalias, explicar mudanças, sugerir ações, prever tendências.

**Integrações:** PostHog, RevenueCat (via Domain Events — não chamada direta).

### Commands
`ImportMetrics`, `RefreshDashboard`, `RecalculateMetrics`

### Queries
`GetDashboard`, `GetRetention`, `GetLTV`, `GetCAC`

### Domain Events
`MetricsImported`, `DashboardUpdated`, `AnomalyDetected`

---

## 7. Finance (Sprint 10)

**Objetivo:** Controlar a saúde financeira.

**Implementação parcial na Fase 3:** lançamento manual imediato; importação automática de receitas depende de SPEC-008 (Integrações).

**Funcionalidades:** RevenueLedger (append-only), receitas, despesas, assinaturas, previsões, fluxo de caixa, margem, custos por projeto.

**IA:** previsão financeira, alertas, simulações, otimização de orçamento.

**Integrações:** Stripe (cobrança B2B do próprio AGSOS), RevenueCat (receitas de jogos via Domain Events).

### Commands
`RegisterRevenue`, `RegisterExpense`, `CreateForecast`

### Queries
`CashFlow`, `RevenueReport`, `ExpenseReport`, `ForecastReport`

### Domain Events
`RevenueRegistered`, `ExpenseRegistered`, `ForecastUpdated`
