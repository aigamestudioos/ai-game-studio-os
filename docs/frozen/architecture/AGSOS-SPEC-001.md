# AGSOS-SPEC-001 — Engineering Handbook

**Versão:** 1.0.0
**Status:** APPROVED FROZEN
**Classificação:** Documento Normativo
**Obrigatoriedade:** Total

---

## 1. Propósito

Estabelece os princípios, padrões, convenções, arquitetura, metodologia de desenvolvimento e regras permanentes para a implementação do AI Game Studio OS.

Este documento constitui a principal referência técnica e prevalece sobre qualquer decisão tomada durante a implementação, salvo quando substituído por versão posterior aprovada.

---

## 2. Visão do Produto

O AI Game Studio OS é um **Sistema Operacional para Estúdios de Jogos AI-First**.

Não é: painel administrativo, dashboard, CRM, ERP, conjunto de telas.

Objetivo: centralizar todo o ciclo de vida de desenvolvimento de jogos mobile, da concepção até a operação em produção, permitindo que um empreendedor individual opere um estúdio capaz de lançar dezenas de jogos por ano usando IA como força principal de desenvolvimento.

---

## 3. Princípios Fundamentais

### 3.1 Single Source of Truth
Cada informação possui apenas uma fonte oficial. Nunca existirão dois locais oficiais para o mesmo dado.

### 3.2 Modularidade
Módulos independentes com comunicação por contratos bem definidos.

### 3.3 Componentização
Nenhum elemento visual duplicado. Todo componente reutilizável existe apenas uma vez.

### 3.4 Tipagem Completa
TypeScript em modo estrito. Proibido `any` indiscriminado. Toda interface pública com tipos explícitos.

### 3.5 Clean Architecture
Separação clara entre: Interface → Aplicação → Domínio → Infraestrutura.

### 3.6 Domain Driven Design (DDD)
Sistema organizado por domínios de negócio: Studio, Projects, Games, Marketing, Finance, Knowledge, Analytics, AI. Nunca organizar apenas por tipo de arquivo.

### 3.7 Escalabilidade
Módulos suportam crescimento sem reescrita. Sem soluções temporárias.

### 3.8 IA como Primeiro Cidadão
A IA é parte da arquitetura. Toda arquitetura deve facilitar geração, análise, documentação e evolução automáticas.

---

## 4. Objetivos de Engenharia

Priorizar: Clareza, Manutenibilidade, Performance, Escalabilidade, Testabilidade, Observabilidade, Segurança, Reutilização.

Evitar decisões que privilegiem velocidade em detrimento desses objetivos.

---

## 5. Stack Tecnológica Oficial

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Supabase |
| Banco | PostgreSQL |
| Estado servidor | TanStack Query |
| Estado cliente | Zustand |
| Validação | Zod |
| Formulários | React Hook Form |
| Autenticação | Supabase Auth |
| Storage | Supabase Storage (abstração em packages/storage) |
| Deploy | Vercel |
| Versionamento | GitHub |
| CI/CD | GitHub Actions |
| Testes unitários | Vitest |
| Testes E2E | Playwright |
| Qualidade | ESLint, Prettier, Husky, lint-staged |
| i18n | next-intl |
| Gráficos | Recharts (encapsulado em @agsos/ui/charts) |
| Monorepo | pnpm workspaces + Turborepo |

**Removido da stack:** Prisma (substituído por Supabase CLI + migrations SQL + tipos gerados).

---

## 6. Papel das Ferramentas

| Ferramenta | Responsabilidade |
|---|---|
| ChatGPT | Arquiteto — arquitetura, documentação, decisões técnicas, governança |
| Claude Sonnet | Engenheiro Principal — implementação diária (~98% do desenvolvimento) |
| Claude Opus | Conselho Técnico — auditorias, revisões arquiteturais, grandes refatorações |
| GitHub | Única fonte oficial do código |
| Vercel | Ambiente de publicação |
| Supabase | Camada de persistência e serviços backend |

---

## 7. Fluxo Oficial de Desenvolvimento

```
Requisito → SPEC → Revisão → Claude Sonnet → Código → GitHub → Testes → Deploy Preview → Validação → Merge → Produção
```

---

## 8. Gestão de Contexto

Todo desenvolvimento ocorre no Project "AI Game Studio OS" no Claude. A continuidade depende da documentação oficial e do código versionado, nunca apenas da memória de conversa.

---

## 9. Filosofia de Engenharia

O sistema é desenvolvido como produto comercial de longa duração. Toda decisão considera que o sistema crescerá continuamente.

- Código difícil de compreender = defeito
- Código duplicado = defeito
- Arquitetura inconsistente = defeito

---

## 10. Princípios de Desenvolvimento

- **Clareza acima de inteligência** — solução simples e legível preferida
- **Legibilidade acima de concisão** — código deve ser fácil de ler
- **Explícito acima de implícito** — sem efeitos colaterais ou comportamentos ocultos
- **Componentes pequenos** — uma responsabilidade por componente
- **Funções pequenas** — uma responsabilidade por função
- **Acoplamento mínimo** — módulos conhecem apenas o necessário
- **Alta coesão** — tudo do mesmo domínio permanece junto

---

## 11. Convenções Gerais

- **Idioma do código:** Inglês
- **Idioma da documentação:** Português
- **Nomeação:** nomes que explicam finalidade, sem abreviações obscuras
- **Estrutura:** por domínio de negócio, não por tipo de arquivo

---

## 12. Estrutura Oficial do Repositório

```
ai-game-studio-os/
├── apps/
│   └── web/
│       ├── app/
│       ├── features/        ← NUNCA features/ na raiz
│       ├── components/
│       ├── providers/
│       ├── hooks/
│       ├── lib/
│       └── tests/
├── packages/
│   ├── ui/
│   ├── database/
│   ├── auth/
│   ├── events/
│   ├── config/
│   ├── validation/
│   ├── observability/
│   ├── integrations/
│   ├── storage/
│   ├── testing/
│   └── i18n/
├── supabase/
│   ├── migrations/
│   ├── seed/
│   ├── functions/
│   └── tests/
├── docs/
│   └── frozen/
├── scripts/
└── .github/workflows/
```

---

## 13. Design System

Todo elemento visual pertence ao Design System (`packages/ui`). Proibido criar componentes específicos sem verificar equivalente reutilizável.

Requisitos de todo componente: reutilizável, tipado, documentado, testado, acessível, independente.

---

## 14. Sistema de Eventos

O sistema é orientado a eventos. Toda ação relevante produz um evento.

Estrutura obrigatória de evento:
```typescript
{
  eventId: string
  eventName: string
  eventVersion: number       // número inteiro, nunca "GameCreated.v1"
  occurredAt: string         // ISO UTC
  aggregateId: string
  aggregateType: string
  studioId: string
  payload: object            // tipado por evento
  metadata: {
    correlationId: string
    actorType: "USER" | "SYSTEM" | "INTEGRATION"
    actorId: string | null
  }
}
```

---

## 15. Observabilidade

Todo módulo produz informações para diagnóstico: erros, avisos, eventos importantes, ações do usuário, operações demoradas, integrações. Nunca mensagens genéricas como "Erro desconhecido".

---

## 16. Tratamento de Erros

Erros classificados em: `ValidationError`, `AuthenticationError`, `AuthorizationError`, `BusinessRuleError`, `IntegrationError`, `InfrastructureError`, `UnexpectedError`.

Nunca lançar `Error` genérico. Separar erro técnico de mensagem amigável.

---

## 17. Sistema Global de Notificações

`NotificationService` exclusivo — nenhum módulo implementa notificações próprias. Tipos: Success, Info, Warning, Error. Toast para temporárias, Modal para decisões críticas, Banner para problemas persistentes.

---

## 18. Performance

Desde o início: lazy loading, code splitting, memoização, paginação, virtualização, cache adequado, consultas eficientes.

---

## 19. Segurança

Princípio do menor privilégio. Nunca dados sensíveis no cliente. Autorização validada também no backend (RLS). Segredos nunca no código-fonte.

---

## 20. Acessibilidade

WCAG 2.2 AA. Desde a primeira implementação — não como melhoria futura. Requisitos: teclado, foco visível, contraste, leitores de tela, responsividade.

---

## 21. Papel da IA no Projeto

A IA é ferramenta de engenharia, não autoridade técnica. A autoridade pertence à documentação oficial. Nenhuma conversa com IA constitui documentação oficial.

---

## 22. Hierarquia das Decisões

```
Visão do Produto
↓ Engineering Handbook (SPEC-001)
↓ Demais SPECs
↓ ADR
↓ Governança
↓ SOP
↓ Código
↓ Comentários
```

Código nunca contradiz uma SPEC. Em conflito, prevalece o documento superior.

---

## 23. Definition of Done

Funcionalidade concluída quando:
- ✔ Implementação concluída
- ✔ Código revisado
- ✔ Tipagem completa
- ✔ Testes executados
- ✔ Build aprovado
- ✔ Linter aprovado
- ✔ Documentação atualizada
- ✔ Commits realizados
- ✔ Deploy Preview funcionando
- ✔ Critérios da SPEC atendidos

---

## 24. Princípio da Simplicidade

Quando duas soluções são tecnicamente equivalentes, escolher a mais simples. Complexidade desnecessária = dívida técnica.
