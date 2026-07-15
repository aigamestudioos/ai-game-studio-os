# AGSOS-SPEC-006 — Core Features

**Versão:** 1.0.0 (inclui Revision 1)
**Status:** APPROVED FROZEN
**Classificação:** Documento Normativo

---

## Ordem Oficial de Implementação (Sprint 3)

1. Authentication
2. Studio Setup
3. Workspace
4. Dashboard
5. Global Navigation
6. Global Search
7. Global Command Palette
8. Notification Center
9. User Settings
10. AI Orchestrator

---

## 1. Authentication

**Objetivo:** Autenticação segura via Supabase Auth.

Funcionalidades: login por e-mail, OAuth (Google, GitHub), logout, recuperação de senha, atualização de senha, refresh automático de sessão, verificação de e-mail, convite de usuários (futuro).

Critérios: sessão persistente, renovação automática de token, redirecionamento seguro, tratamento de sessão expirada.

---

## 2. Studio Setup

**Primeira experiência do usuário. Dividido em duas fases:**

**Fase 1 (obrigatória) — Studio Ready:**
```
Criar conta → Criar Studio → Selecionar plataformas-alvo → Configurações iniciais → Workspace pronto
```
Coleta: Nome do Studio, Idioma, Fuso horário, Moeda, Plataformas-alvo (iOS, Android, Web).
Todo progresso salvo automaticamente. Ao final: `studio_ready = TRUE`.

**Fase 2 (opcional) — via Studio > Integrations (SPEC-008):**
GitHub, Apple Developer, Google Play Console, RevenueCat, OpenAI, Anthropic, PostHog, outras.
Sistema exibe checklist mas **não bloqueia** o uso do produto.

---

## 3. Workspace

**Estrutura:** TopBar, Sidebar, Content Area, Inspector Panel (opcional), Bottom Status Bar.

Funcionalidades: restaurar layout, redimensionar painéis, favoritos, histórico recente, atalhos.

---

## 4. Dashboard

**Widgets iniciais:** Projetos ativos, Jogos publicados, Builds recentes, Execuções do AI, Notificações, Próximas tarefas, Indicadores financeiros, Integridade do sistema.

Widgets: movíveis, ocultáveis, redimensionáveis. Configuração por usuário persistida em `user_dashboard_preferences` (layout e widgets em JSONB).

---

## 5. Global Navigation

Sidebar: Dashboard, Studio, Projects, Games, AI, Publishing, Marketing, Analytics, Finance, Knowledge, Settings.
Suporte a: favoritos, itens recentes, expansão/retração, pesquisa.

---

## 6. Global Search

**Entidades pesquisáveis:** Projects, Games, Ideas, Tasks, Documents, Campaigns, Prompts, Conversations, Users.

Características: busca incremental, atalhos, filtros, histórico, resultados agrupados.

**Implementação:**
- Fase 1: PostgreSQL Full-Text Search (tsvector + tsquery + índices GIN)
- Fase 2: serviço externo via ADR se necessário
- Features sempre usam `SearchService` — nunca diretamente

---

## 7. Global Command Palette

**Atalho:** Ctrl+K / ⌘+K

**Capacidades:** buscar páginas/comandos/projetos/jogos/usuários/documentos/ações; executar: criar projeto, criar ideia, executar prompt, abrir configuração, navegar, iniciar automações.

**Ranking:** considera contexto atual, frequência de uso, histórico, favoritos, permissões.

---

## 8. Notification Center

**Origem:** Notification Service.
Exibe: notificações recentes, prioridade, categoria (ENUM `notification_category`), origem, data, status.
Permite: marcar como lida, marcar todas, filtrar, pesquisar.
**Realtime obrigatório** via canal `studio:{studio_id}:notifications`.
NotificationCenter **nunca acessa** `studio_events` diretamente.

---

## 9. User Settings

Seções: Perfil, Aparência, Idioma, Atalhos, Notificações, Segurança, Sessões, Personal Accounts.

**Personal Accounts** (não confundir com integrações do Studio): conta GitHub pessoal diferente da do Studio, preferência de modelo de IA, chaves pessoais autorizadas, preferências de notificações.

Salvamento automático por alteração.

---

## 10. AI Orchestrator

**Centro operacional para tarefas de IA. Não possui tabela própria** — camada de orquestração sobre: `jobs`, `prompt_executions`, `studio_events`, `conversations`.

Responsabilidades: listar tarefas, iniciar automações, acompanhar execução, exibir progresso, apresentar prompts, registrar histórico, permitir reexecução.

**Estados** (derivados do Job): Waiting, Running, Paused, Completed, Failed, Cancelled.

Cada execução: ExecutionId, Prompt, Modelo, Tempo, Tokens, Resultado, Logs.

---

## 11. Estados Obrigatórios (todos os módulos)

Loading, Empty, Error, Permission Denied, Offline, Success.

---

## 12. Permissões

Cada módulo declara: quem visualiza, quem edita, quem administra. Nunca depender apenas da interface.

---

## 13. Telemetria

Todos os módulos emitem para `studio_events`. Eventos mínimos: abriu módulo, criou registro, editou registro, removeu registro (arquivamento), executou ação, falhou ação. Campos obrigatórios: `correlation_id`, `studio_id`, `actor_type`, `actor_id`.
