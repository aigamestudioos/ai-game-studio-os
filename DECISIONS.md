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

## Incremento 0.2 — Next.js + App Router

### [2026-07-15] `apps/web` criado manualmente, sem `create-next-app`
**Contexto:** `create-next-app` gera Tailwind, ESLint config e estrutura próprios que conflitam com as convenções do monorepo (ADR-002, ARCHITECTURE.md §3) e com o escopo do incremento, que exclui Tailwind/shadcn/Supabase.
**Decisão:** Scaffold manual de `apps/web` (package.json, tsconfig.json estendendo `tsconfig.base.json`, next.config.mjs, `app/layout.tsx|page.tsx|loading.tsx|error.tsx|not-found.tsx`), usando Next 15.5.20 + React 19.2.7 (últimas versões estáveis das linhas 15/19 no momento do incremento).
**Motivo:** Controle total sobre estrutura e convenções desde o início; evita remover/desfazer artefatos gerados que não seriam usados.
**Impacto:** Nenhum arquivo de configuração duplicado ou conflitante; `apps/web` segue o mesmo padrão de `packages/*` (tsconfig via `extends`, scripts padronizados).

### [2026-07-15] `verbatimModuleSyntax: false` em `apps/web/tsconfig.json`
**Contexto:** `tsconfig.base.json` define `verbatimModuleSyntax: true` (Incremento 0.1), mas os arquivos de tipos gerados pelo Next (`next-env.d.ts`, `.next/types/**`) e a convenção de `next.config.mjs` não seguem essa exigência de `import type` explícito.
**Decisão:** Sobrescrever para `false` apenas em `apps/web/tsconfig.json`.
**Motivo:** Evitar atrito com arquivos gerados pelo próprio Next.js, que a ferramenta regenera automaticamente e não podemos ajustar.
**Impacto:** Restrito a `apps/web`; todos os `packages/*` continuam com `verbatimModuleSyntax: true`.

### [2026-07-15] `turbo.json`: `outputs` do task `build` inclui `.next/**`
**Contexto:** O pipeline `build` original só declarava `dist/**` como output (válido para os packages), mas o build do Next gera `.next/**`, causando warning "no output files found" no cache do Turborepo.
**Decisão:** `"outputs": ["dist/**", ".next/**", "!.next/cache/**"]`.
**Motivo:** Cache correto do Turborepo para `apps/web`, excluindo o diretório de cache interno do Next (não determinístico, não deve ser cacheado pelo Turborepo).
**Impacto:** Nenhum impacto nos packages existentes (continuam gerando apenas `dist/**`).

## Ajustes de processo pós-0.2

### [2026-07-15] Estrutura de `apps/web` mantida conforme frozen (sem `src/` nem `shared/`)
**Contexto:** Foi sugerido adotar `apps/web/src/{app,features,shared,hooks,lib,providers,components}`, mas essa estrutura diverge de `ADR-002` e `ARCHITECTURE.md §3` (frozen), que definem `apps/web/{app,features,components/ui,lib,providers,hooks}` sem wrapper `src/` e sem pasta `shared/`.
**Decisão:** Manter a estrutura frozen. Criadas as pastas vazias já previstas (`features/`, `components/ui/`, `lib/`, `providers/`, `hooks/`, cada uma com `.gitkeep`), sem `src/` nem `shared/`.
**Motivo:** Evitar divergência entre código e documentação normativa sem um ADR formal; alterar a estrutura oficial exigiria revisão aprovada de `ADR-002`/`ARCHITECTURE.md`, o que não foi solicitado.
**Impacto:** Nenhum. Se `src/`/`shared/` vier a ser desejado no futuro, requer ADR próprio antes da implementação.

### [2026-07-15] Sequência de execução do Sprint 0 divergente da numeração em `AGSOS-PLAN-001.md` (frozen)
**Contexto:** O roadmap frozen define o Incremento 0.3 como "Tailwind CSS + shadcn/ui" combinado. Foi pedido separar em dois incrementos (Tailwind+tokens+dark mode+ThemeProvider primeiro; shadcn/ui depois), para respeitar o limite de ~50 arquivos por sprint (`CLAUDE.md`), já que shadcn gera muitos arquivos de componente.
**Decisão:** Não editar `AGSOS-PLAN-001.md` (continua frozen, como registro da intenção original). A sequência real de execução passa a ser rastreada apenas em `PROJECT_STATUS.md`/`IMPLEMENTATION_LOG.md`: 0.3 = Tailwind v4 + tokens + dark mode + ThemeProvider; 0.4 = shadcn/ui; 0.5–0.8 = CI, Vercel, Supabase Auth, revisão geral (cada um deslocado uma posição).
**Motivo:** Cumprir a regra de tamanho de sprint sem exigir aprovação de ADR para uma mudança que é apenas de sequenciamento de execução, não de arquitetura.
**Impacto:** Nenhum impacto arquitetural. Ao final do Sprint 0, o escopo total entregue é o mesmo do roadmap original — só a ordem/numeração operacional muda.
