# AGSOS-PLAN-001 — Master Implementation Roadmap

**Versão:** 1.0.0
**Status:** EXECUTION

---

## Regras Gerais

- Nunca implementar fora das SPECs
- Um único incremento por vez
- Todo incremento termina com commit, push e CI verde
- Toda entrega permanece funcional
- Nunca quebrar funcionalidades existentes
- Nenhum refactor grande junto com feature nova

---

## Ambiente de Desenvolvimento

```
GitHub Codespaces
├── Claude Code
├── Node.js (≥ 20)
├── pnpm (≥ 9)
├── Git
├── GitHub CLI
└── Vercel CLI
```

Computador: apenas navegador. Sem instalações locais.

---

## Fluxo por Incremento (Claude Code)

```
git status → git branch → git pull
     ↓
Fase 1: Inspecionar (ARCHITECTURE.md + PROJECT_STATUS.md + código existente)
     ↓
Fase 2: Propor ajustes
     ↓
Fase 3: Implementar (escopo do incremento apenas)
     ↓
Fase 4: Validar (pnpm install → typecheck → lint → build → test)
     ↓
Fase 5: Documentar + commit atômico + push
     ↓
Aguardar GitHub Actions + Vercel Preview
     ↓
Relatório
```

---

## Prompt Padrão (Claude Code)

```
Execute o Incremento X.Y do AI Game Studio OS.

Antes de qualquer código:
1. Leia ARCHITECTURE.md
2. Leia PROJECT_STATUS.md
3. Consulte SPECs necessárias em docs/frozen/
4. Verifique branch atual e git status
5. Revise implementação existente antes de escrever código
6. Caso encontre conflito entre documentos normativos: INTERROMPA

Implemente apenas o escopo definido.
Execute todas as validações disponíveis.
Corrija todos os erros encontrados.
Faça git add, commit e push.
Aguarde GitHub Actions e Vercel Preview.
Atualize PROJECT_STATUS.md, CHANGELOG.md e DECISIONS.md.
Apresente relatório completo.

Interrompa apenas se:
- Houver conflito entre documentos normativos
- Surgir decisão arquitetural não prevista
- Houver falha não resolvível sem alterar arquitetura aprovada
```

---

## Status de PR

| Status | Significado |
|---|---|
| READY FOR LOCAL VALIDATION | Sem pnpm install real (sandbox) |
| READY FOR MERGE | CI verde + Preview Vercel OK |
| Completed | Após merge em main |

---

## Git Flow

```
main (sempre estável — tags por incremento)
   ↑
feature/increment-X-Y
```

Sem branch develop (solo founder). PR direta para main. Merge após: CI verde + Preview OK.

---

## Quando Usar Claude Opus

Apenas para: revisão arquitetural após sprint, refatorações em múltiplos packages, análise de impacto estrutural, otimizações críticas de performance. **Não usar** para CRUDs, componentes, migrations rotineiras.

---

## Roadmap de Sprints

| Sprint | Objetivo | Ferramenta |
|---|---|---|
| Sprint 0 | Fundação técnica | Sonnet |
| Sprint 1 | Application Foundation (SPEC-004) | Sonnet |
| Sprint 2 | Design System (SPEC-005) | Sonnet |
| Sprint 3 | Core Features (SPEC-006) | Sonnet |
| Sprint 4 | Projects (SPEC-007) | Sonnet |
| Sprint 5 | Games (SPEC-007) | Sonnet |
| Sprint 6 | Knowledge (SPEC-007) | Sonnet |
| Sprint 7 | Publishing (SPEC-007) | Sonnet |
| Sprint 8 | Marketing (SPEC-007) | Sonnet |
| Sprint 9 | Analytics (SPEC-007) | Sonnet |
| Sprint 10 | Finance (SPEC-007) | Sonnet |
| Sprint 11 | Integrações (SPEC-008) | Sonnet |
| Sprint 12 | Hardening | Sonnet |
| Revisões | Arquitetura | Opus |

---

## Sprint 0 — Incrementos

| Incremento | Objetivo | Critério de aceite |
|---|---|---|
| 0.1 | Monorepo + Turborepo + pnpm + TypeScript + docs | `pnpm build` verde em todos os packages |
| 0.2 | Next.js + App Router | `pnpm dev` → página em localhost:3000 |
| 0.3 | Tailwind CSS + shadcn/ui (Button, Card, Input, Dialog) | Página estilizada + todos os componentes funcionando |
| 0.4 | GitHub Actions (CI mínimo) | CI verde no primeiro PR |
| 0.5 | Vercel + primeiro deploy | URL de preview acessível |
| 0.6 | Supabase Auth + AuthProvider + login/logout + rota protegida | Login funcional em produção |
| 0.7 | Revisão geral, correções, testes, documentação | CI verde + todos os critérios |

---

## Checkpoints Obrigatórios (final de cada sprint)

1. Push para GitHub
2. Deploy na Vercel
3. Executar CI
4. Revisão rápida no Claude
5. Atualizar PROJECT_STATUS.md

---

## Critério para Avançar Sprint

Só avançar quando: CI verde, deploy funcionando, critérios de aceite cumpridos, nenhum bug crítico aberto.
