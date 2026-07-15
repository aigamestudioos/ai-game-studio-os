# DECISIONS.md

Índice das decisões arquiteturais (ADRs) do AI Game Studio OS.

## Objetivo

_A ser definido. Este documento serve como índice central para os Architecture Decision Records do projeto._

## Índice de ADRs

| ADR      | Título | Status          |
|----------|--------|-----------------|
| [ADR-002](docs/frozen/architecture/ADR-002.md) | Monorepo: pnpm + Turborepo | FROZEN |
| [ADR-003](docs/frozen/architecture/ADR-003.md) | Supabase nativo, RLS, sem Prisma | FROZEN |
| [ADR-004](docs/frozen/architecture/ADR-004.md) | TanStack Query + Zustand | FROZEN |

## Observação

Numeração inicia em ADR-002 conforme definido no bootstrap documental; nenhum ADR-001 foi criado. Os ADRs foram importados de `docs/frozen/architecture/` e não devem ser editados diretamente (mudanças exigem novo ADR ou revisão aprovada).

Este arquivo (`DECISIONS.md`) é o registro de decisões operacionais do dia a dia (não arquiteturais) — decisões técnicas livres tomadas durante a implementação, quando as SPECs não determinam uma escolha específica.

## Formato

```markdown
### [YYYY-MM-DD] Título
**Contexto:** Por que surgiu.
**Decisão:** O que foi decidido.
**Motivo:** Por que essa opção.
**Impacto:** O que muda ou deve ser observado.
```

---

## Incremento 0.1 — Monorepo Bootstrap

### [2026-07-15] pnpm 10.32.1 fixado no `packageManager`
**Contexto:** ADR-002 exige `packageManager` fixado no `package.json` raiz, mas não define a versão (SPECs só fixam o piso `pnpm ≥9`).
**Decisão:** `"packageManager": "pnpm@10.32.1"`.
**Motivo:** Versão já disponível e verificada no ambiente de desenvolvimento (Codespace).
**Impacto:** Builds reproduzíveis com essa versão exata; atualizar aqui se o ambiente mudar de versão.

### [2026-07-15] TypeScript strict, `target: ES2022`, `moduleResolution: Bundler`
**Contexto:** SPEC-001 exige apenas "TypeScript em modo estrito", sem enumerar flags específicas.
**Decisão:** `tsconfig.base.json` com `strict: true`, `noUncheckedIndexedAccess: true`, `moduleResolution: "Bundler"`, `verbatimModuleSyntax: true`, `module: "ESNext"`.
**Motivo:** Configuração padrão atual para monorepos que consumirão Next.js (Incremento 0.2) via bundler, sem exigir extensões explícitas em imports relativos.
**Impacto:** Todos os packages herdam via `extends`. Qualquer package com necessidade diferente deve justificar o desvio aqui.

### [2026-07-15] ESLint 9 flat config, sem Husky/lint-staged nesta etapa
**Contexto:** SPEC-001 lista ESLint, Prettier, Husky e lint-staged como ferramentas de qualidade, mas o escopo explícito do Incremento 0.1 pediu apenas `eslint.config.mjs` e `prettier.config.mjs`.
**Decisão:** `eslint.config.mjs` (flat config) com `@eslint/js` + `typescript-eslint` recommended + `eslint-config-prettier`. Husky/lint-staged adiados.
**Motivo:** Respeitar o escopo explícito do incremento ("apenas estrutura"); hooks de commit fazem mais sentido quando já houver código de aplicação sendo commitado com frequência.
**Impacto:** Nenhuma validação automática de lint no pre-commit ainda — lint roda apenas via `pnpm lint` manual/CI (CI ainda não existe, é o Incremento 0.4).
