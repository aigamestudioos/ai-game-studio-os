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
| [ADR-005](ADR-005-sprint-governance.md) | Governança de execução em subincrementos (roadmap operacional vs. `AGSOS-PLAN-001.md`) | APPROVED |

## Observação

Numeração inicia em ADR-002 conforme definido no bootstrap documental; nenhum ADR-001 foi criado. ADR-002 a ADR-004 foram importados de `docs/frozen/architecture/` e não devem ser editados diretamente (mudanças exigem novo ADR ou revisão aprovada). A partir do ADR-005, novos ADRs são autorados pelo próprio projeto na raiz do repositório (`ADR-00N-*.md`), não em `docs/frozen/` — ver ADR-005 para o motivo.

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

## Incremento 0.3 — Tailwind v4 + Design Tokens + Dark Mode + ThemeProvider

### [2026-07-15] Tokens e ThemeProvider ficam em `apps/web`, não em `packages/ui`
**Contexto:** SPEC-005 §5 define tokens/providers dentro de `packages/ui/{tokens,providers}`, mas isso faz parte da estrutura completa do design system (`server/client/shared/base/composed/...`), cuja implementação a própria SPEC-005 §14 agenda para o "Sprint 2", não para este incremento.
**Decisão:** Tokens Tailwind em `apps/web/app/globals.css`; `ThemeProvider`/`useTheme` em `apps/web/providers/` e `apps/web/hooks/` (pastas já scaffolded no Incremento 0.2). `packages/ui` permanece stub.
**Motivo:** Escolha explícita do usuário para não antecipar a estrutura completa de `packages/ui` antes da hora, mantendo o incremento pequeno e focado.
**Impacto:** Quando `packages/ui` for construído no Sprint 2, o `ThemeProvider` e os tokens precisarão ser migrados/generalizados para lá (hoje acoplados a `apps/web`). Nenhum outro app consome esses tokens ainda, então não há duplicação por enquanto.

### [2026-07-15] Sem persistência de tema neste incremento
**Contexto:** ARCHITECTURE.md proíbe `localStorage`/`sessionStorage`. Persistência real de preferência de usuário dependeria de Supabase Auth, que só chega no Incremento 0.7.
**Decisão:** `ThemeProvider` mantém o tema apenas em memória (React state) nesta etapa; dark-first por padrão; detecção de `prefers-color-scheme` via script inline no `<head>` do `layout.tsx` (executa antes do primeiro paint, sem usar storage) evita flash na carga inicial, mas a escolha explícita do usuário não sobrevive a um reload.
**Motivo:** Escolha explícita do usuário — persistência real fica para quando houver Auth/preferência de usuário no banco.
**Impacto:** Toggle de tema funciona durante a sessão (validado manualmente via `next dev`), mas reseta para o padrão do sistema a cada reload até o Incremento 0.7.

## Incremento 0.6 (antecipado) — Deploy em produção

### [2026-07-15] Deploy na Vercel antecipado para antes de 0.4/0.5
**Contexto:** O usuário pediu explicitamente publicar em produção antes de iniciar o Sprint 0.4, para validar a cadeia GitHub → Vercel cedo.
**Decisão:** Push de todos os commits locais para `origin/main` (repositório já estava em sincronia — nenhum commit pendente), e uso do domínio temporário `.vercel.app` gerado pela Vercel a partir do projeto que o usuário já havia conectado via dashboard.
**Motivo:** Pedido explícito do usuário; antecipar o deploy real reduz risco de surpresas de configuração (Root Directory, variáveis de ambiente) mais tarde.
**Impacto:** `AGSOS-PLAN-001.md` (frozen) continua listando Vercel como 0.5 (nome antigo)/0.6 (numeração operacional ajustada no 0.2). A tabela em `PROJECT_STATUS.md` marca 0.6 como concluído fora de ordem, mantendo 0.4 e 0.5 como próximos pendentes.

### [2026-07-15] Conexão com a Vercel via dashboard, não via CLI/token
**Contexto:** Não há token da Vercel disponível neste ambiente para automação via CLI; login interativo (navegador) não é possível para o agente.
**Decisão:** O usuário conectou o repositório à Vercel manualmente pelo dashboard (Import Git Repository), configurando Root Directory `apps/web`. Nenhum `vercel.json` foi criado no repositório.
**Motivo:** Único caminho viável sem credenciais da Vercel compartilhadas com o agente.
**Impacto:** Configuração de build/deploy vive inteiramente no dashboard da Vercel (fora do repositório) — se precisar reproduzir em outro projeto/ambiente, documentar os valores usados (Root Directory, Framework Preset, Node version) fora deste repo, já que não há `vercel.json` versionado.

## Incremento 0.4a — Fundação do Design System + shell do `/playground`

### [2026-07-15] Sprint 0.4 dividido em 0.4a/0.4b/0.4c
**Contexto:** A instrução original de "Sprint 0.4" pedia 21 componentes com matriz completa de estados (default/hover/focus/pressed/disabled/loading/success/warning/error), dark/light, acessibilidade, e um playground de 16 seções interativas — muito acima do limite de ~10 arquivos novos / 50 alterados por incremento (`CLAUDE.md`).
**Decisão:** Dividir em três subincrementos: 0.4a (fundação: Button, Input, Textarea, Card, Badge, Avatar + shell do playground), 0.4b (componentes avançados: overlays/feedback), 0.4c (playground completo + demais componentes e seções). Formalizado em `ADR-005-sprint-governance.md`.
**Motivo:** Escolha explícita do usuário, aprovando a proposta de divisão apresentada.
**Impacto:** Cada subincremento tem seu próprio ciclo de validação/documentação/commit, mantendo os limites de tamanho de sprint.

### [2026-07-15] Tokens `success`/`warning` adicionados a `globals.css`
**Contexto:** SPEC-005 §4 lista tokens de superfície e semânticos obrigatórios, mas não inclui `success`/`warning` — e este sprint exige que todo componente suporte esses estados sem cor hardcoded.
**Decisão:** Adicionar `--success`/`--success-foreground`/`--warning`/`--warning-foreground` (valores oklch, dark-first + override em `[data-theme="light"]`) e os respectivos `--color-success*`/`--color-warning*` no bloco `@theme`.
**Motivo:** SPEC-005 define tokens "obrigatórios", não uma lista fechada — extensão necessária para cumprir um requisito explícito deste sprint sem violar a regra de "nunca cor hardcoded".
**Impacto:** Nenhum impacto em tokens existentes; `Button` e `Badge` já usam `success`/`warning` como variantes.

### [2026-07-15] Reversão da persistência de tema via cookie
**Contexto:** No planejamento deste sprint, cookie-based persistence havia sido a opção recomendada e aprovada para resolver o conflito entre "validar persistência" e a proibição de `localStorage`/`sessionStorage`. Antes da implementação ser finalizada, o usuário reverteu essa escolha.
**Decisão:** Manter o `ThemeProvider` apenas em memória (React state) nesta etapa, sem gravar cookie. Nenhuma mudança de código chegou a ser commitada com a abordagem de cookie.
**Motivo:** Evitar uma solução de persistência intermediária/temporária; persistência real será implementada junto com Supabase Auth (Incremento 0.7), reduzindo complexidade arquitetural (uma única fonte de verdade — preferência do usuário no banco — em vez de cookie + banco depois).
**Impacto:** Nenhum. A decisão do Incremento 0.3 ("sem persistência até 0.7") permanece válida e não precisou ser revertida — a tentativa de mudança neste sprint não chegou a ser commitada.

### [2026-07-15] Bug de layout: `max-w-{sm,md,lg,xl}` colide com os tokens de espaçamento
**Contexto:** Validação visual com Playwright (screenshots de `/playground`) revelou que `Input`, `Textarea` e `Card` renderizavam muito mais estreitos que o esperado. Nem `pnpm build`, `pnpm lint` nem `pnpm typecheck` detectaram o problema — só a inspeção visual. Causa raiz: o Tailwind v4 usa uma escala de `spacing` compartilhada para resolver utilities nomeadas de tamanho (`max-w-*`, `w-*`, `h-*`, etc.) quando não há uma escala dedicada com o mesmo nome. Como definimos `--spacing-sm/md/lg` em `globals.css` (Incremento 0.3, para `p-*`/`gap-*`), o Tailwind passou a resolver `max-w-md` como `var(--spacing-md)` (1rem) em vez do valor padrão (~28rem) — confirmado no CSS compilado: `.max-w-md { max-width: var(--spacing-md); }`.
**Decisão:** Substituir `max-w-md` por `max-w-[28rem]` (valor arbitrário) nos dois containers afetados em `apps/web/app/playground/page.tsx`. Não renomear os tokens de espaçamento (usados corretamente em `p-*`/`gap-*`/`px-*`/`py-*` em todos os componentes).
**Motivo:** Correção cirúrgica no ponto de uso, sem alterar os tokens do design system (que continuam corretos para seu propósito original — padding/gap).
**Impacto:** **Risco sistêmico a observar nos próximos incrementos (0.4b/0.4c):** qualquer uso de `w-sm`, `w-md`, `w-lg`, `h-sm`, `h-md`, `h-lg`, `min-w-*`/`min-h-*` com esses mesmos nomes (`sm`/`md`/`lg`) vai colidir do mesmo jeito. Ao dimensionar containers/larguras fixas, preferir a escala numérica padrão do Tailwind (`max-w-96`, `w-64`, etc.) ou valores arbitrários (`max-w-[28rem]`), nunca os nomes `sm`/`md`/`lg`/`xl` para as famílias `w-*`/`h-*`/`max-w-*`/`min-w-*`/`min-h-*`.
