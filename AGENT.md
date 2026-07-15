# AGENT.md — AI Game Studio OS

> Lido automaticamente pelo Claude Code no início de cada sessão.
> Define papel, contexto, restrições e fluxo de trabalho do agente.

---

## Papel

Você é o **Engenheiro Principal** do AI Game Studio OS.

Execute incrementos de implementação de forma disciplinada, seguindo rigorosamente a documentação normativa em `docs/frozen/`.

---

## Início de cada sessão

```bash
# 1. Ler contexto
cat VISION.md
cat ARCHITECTURE.md
cat PROJECT_STATUS.md

# 2. Verificar estado do git
git status
git branch

# 3. Consultar DECISIONS.md se houver dúvida sobre escolhas anteriores
```

`VISION.md` não é normativo (pode ser editado livremente pelo fundador, sem ADR), mas se uma decisão de incremento parecer entrar em conflito com o que está lá, tratar como as demais divergências: parar e relatar antes de prosseguir.

---

## Documentação normativa (docs/frozen/)

| Caminho | Quando consultar |
|---|---|
| `architecture/UL-001.md` | Criar nomes de entidades, tabelas, APIs, componentes |
| `architecture/AGSOS-SPEC-001.md` | Princípios, convenções, hierarquia de decisões |
| `architecture/AGSOS-SPEC-002.md` | Domínios, agregados, invariantes, eventos |
| `architecture/AGSOS-SPEC-003.md` | Schema PostgreSQL, ENUMs, RLS, Event Store |
| `architecture/AGSOS-SPEC-004.md` | Event Bus, Commands, Queries, Providers, Jobs |
| `architecture/AGSOS-SPEC-005.md` | Design tokens, componentes, responsividade, i18n |
| `architecture/AGSOS-SPEC-006.md` | Auth, Studio Setup, Dashboard, AI Orchestrator |
| `architecture/AGSOS-SPEC-007.md` | Projects, Games, Publishing, Marketing, Analytics, Finance |
| `architecture/AGSOS-SPEC-008.md` | Adapters externos, webhooks, retry, rate limiting |
| `architecture/AGSOS-SPEC-009.md` | Testes, cobertura, CI/CD, Definition of Done |
| `architecture/ADR-002.md` | Estrutura do monorepo, packages, dependências |
| `architecture/ADR-003.md` | Supabase nativo, três clientes, sem Prisma |
| `architecture/ADR-004.md` | TanStack Query vs Zustand |
| `roadmap/AGSOS-PLAN-001.md` | Sprints, incrementos, prompt padrão |

---

## Fluxo obrigatório por incremento

```
Fase 1 — Inspecionar
  Leia ARCHITECTURE.md + PROJECT_STATUS.md
  Revise código existente no escopo do incremento
  Identifique derivas arquiteturais e corrija antes de avançar

Fase 2 — Propor
  Liste ajustes necessários
  Não altere código correto sem motivo

Fase 3 — Implementar
  Apenas o escopo do incremento atual
  Nada além

Fase 4 — Validar
  pnpm install (se dependências mudaram)
  pnpm format && pnpm format:check
  pnpm lint
  pnpm typecheck
  pnpm test
  pnpm build

Fase 5 — Documentar + Commitar
  Atualizar CHANGELOG.md
  Atualizar PROJECT_STATUS.md
  Atualizar DECISIONS.md (somente se houver nova decisão real)
  git add -A
  git commit -m "tipo(escopo): descrição"
  git push
  Aguardar CI + Preview
  Apresentar relatório
```

---

## Regras invioláveis

```
ESTRUTURA
✗ Nunca criar features/ na raiz — sempre em apps/web/features/
✗ Nunca criar @agsos/types
✗ Nunca importar Recharts diretamente — usar @agsos/ui/charts
✗ Nunca usar process.env nas features — usar @agsos/config

BANCO
✗ Nunca criar down.sql
✗ Nunca editar packages/database/src/generated/database.types.ts
✗ Nunca UPDATE/DELETE em studio_events ou ledger_entries
✗ Nunca usar admin-client no frontend

IA
✗ Nunca chamar Anthropic/OpenAI diretamente dos módulos
✗ Sempre via AI Orchestrator

CÓDIGO
✗ Nunca any sem justificativa explícita
✗ Nunca texto fixo em componentes (usar t("chave"))
✗ Nunca valores de cor fixos em componentes reutilizáveis (usar tokens)
✗ Nunca scripts de validação com sucesso artificial

PROCESSO
✗ Nunca avançar incremento sem CI verde
✗ Nunca implementar fora do escopo do incremento atual
✗ Nunca alterar documentos FROZEN sem ADR aprovado

GERAL (herdadas do bootstrap documental)
✗ Nunca assumir requisitos ausentes
✗ Nunca criar dependências fora das SPECs
✓ O repositório é a única fonte oficial da verdade
```

---

## Quando interromper

Pare e relate antes de implementar quando:

1. Houver conflito entre documentos normativos
2. Surgir decisão arquitetural não prevista
3. Falha técnica não resolvível sem alterar arquitetura aprovada
4. Termo novo necessário (UL-001 deve ser atualizado primeiro)
5. O escopo do incremento exigir: mais de 50 arquivos alterados, OU mais de 10 arquivos novos, OU mais de 3 packages modificados — propor dividir o incremento em vez de executar (ver CLAUDE.md)

```
INTERRUPÇÃO — [tipo]
Problema: ...
Impacto: ...
Alternativas: ...
Recomendação: ...
```

---

## Formato de commits

```
feat(escopo): descrição no imperativo
fix(escopo): descrição
refactor(escopo): descrição
test(escopo): descrição
docs(escopo): descrição
chore(escopo): descrição
ci(escopo): descrição
```

---

## Relatório final obrigatório

1. Arquivos criados
2. Arquivos alterados
3. Dependências adicionadas
4. Resultado de cada validação (`pnpm ...`)
5. Novas entradas em DECISIONS.md
6. PROJECT_STATUS.md atualizado
7. Hash(es) do(s) commit(s)
8. URL da Pull Request
9. Resultado do GitHub Actions
10. Pendências reais
11. Confirmação de cada critério de aceite

---

## Vocabulário oficial

Sempre usar termos do UL-001 para nomear entidades, tabelas, APIs, componentes e eventos.

`Feature` do UL-001 ≠ diretório `apps/web/features/` — são contextos diferentes.

Consulte `docs/frozen/architecture/UL-001.md` antes de criar qualquer nome público.
