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

## Incremento 0.4b — Componentes avançados

### [2026-07-15] Dialog + Modal combinados em um arquivo; Toast + Toaster combinados em outro
**Contexto:** O escopo aprovado do 0.4b tem 10 componentes (Dialog, Modal, Toast, Tooltip, DropdownMenu, Alert, Spinner, Skeleton, Separator, Progress). Um arquivo por componente no padrão shadcn geraria 12 arquivos (Toast sozinho precisaria de toast.tsx + toaster.tsx + hook), passando do limite de 10 arquivos novos por incremento (`CLAUDE.md`).
**Decisão:** `dialog.tsx` exporta tanto a família `Dialog*` (Radix Dialog, dispensável) quanto `Modal*` (Radix AlertDialog, não dispensável — exige ação explícita); `toast.tsx` exporta os primitivos de Toast e o componente `Toaster` (renderer); `hooks/use-toast.ts` fica separado por já existir a convenção de hooks em `apps/web/hooks/`.
**Motivo:** Manter os 10 componentes pedidos sem exceder o limite de arquivos novos — Dialog/Modal são a mesma família semântica (overlay modal), assim como Toast/Toaster (primitivo + renderer do mesmo conceito).
**Impacto:** Nenhum a nível de API pública — cada componente é importado normalmente pelo nome (`Dialog`, `Modal`, `Toast...`, `Toaster`). Se o arquivo crescer demais no futuro, pode ser desmembrado sem quebrar consumidores (basta manter os mesmos exports, movidos para arquivos separados).

### [2026-07-15] Toast usa estado global via módulo (não Context React)
**Contexto:** `toast({ title, description })` precisa poder ser chamado de qualquer componente/Server Action/handler, não só de dentro de uma árvore React específica.
**Decisão:** `hooks/use-toast.ts` mantém um array de toasts em uma variável de módulo, com um `Set` de listeners; `toast()` e `dismissToast()` mutam esse estado e notificam os listeners; `useToast()` é o hook que assina esse estado para re-renderizar. O `Toaster` (dentro de `ToastProvider` do Radix, que só cuida de posicionamento/acessibilidade) é o único consumidor de `useToast()` que efetivamente renderiza os toasts.
**Motivo:** Padrão simples e testado (mesma técnica usada pelo shadcn/ui), sem dependência externa nova, e sem exigir um Provider próprio além do já necessário do Radix.
**Impacto:** Estado de toasts é global à aba do navegador (não por Server Component/request) — comportamento esperado para notificações client-side.

### [2026-07-15] Token `--backdrop` criado para overlays de Dialog/Modal
**Contexto:** Overlay inicialmente usava `bg-surface-inverse/60`, mas `surface-inverse` inverte de valor entre os temas (claro no dark mode, escuro no light mode) — resultado: o overlay ficava claro/lavado no dark mode em vez de escurecer o conteúdo por trás. Encontrado via revisão visual dos screenshots (Playground DoD §6).
**Decisão:** Novo token `--backdrop` (e `--color-backdrop`), com o **mesmo valor** (`oklch(0.08 0 0 / 0.6)`) em ambos os temas — não segue o padrão dos demais tokens de superfície, que invertem entre dark/light.
**Motivo:** Overlays de modal convencionalmente escurecem o conteúdo por trás para dar foco ao diálogo, independentemente do tema ativo — um comportamento distinto de "tokens de superfície" que representam a UI normal.
**Impacto:** Nenhum nos tokens existentes; `--backdrop` é de uso exclusivo de `DialogOverlay`/`AlertDialogPrimitive.Overlay`.

### [2026-07-15] `suppressHydrationWarning` adicionado ao `<html>`
**Contexto:** O script anti-flash (Incremento 0.3) muda `data-theme` no DOM antes da hidratação do React, para evitar flash visual em quem prefere tema claro. Isso sempre gerou um warning de mismatch de hidratação no console do navegador — não detectado antes porque as validações anteriores só checavam o log do **servidor** (`next dev`), não o console do **navegador**. Só apareceu ao rodar Playwright com listener de console/pageerror, como o novo DoD exige.
**Decisão:** Adicionar `suppressHydrationWarning` ao elemento `<html>` em `layout.tsx`.
**Motivo:** É a técnica padrão (mesma usada por `next-themes`) para esse exato padrão de "script inline que muda um atributo do `<html>` antes da hidratação" — o warning é conhecido e esperado, não um bug real de conteúdo divergente.
**Impacto:** Nenhum efeito colateral: `suppressHydrationWarning` só silencia mismatches nos atributos do próprio elemento onde é aplicado, não em elementos filhos — não mascara bugs de hidratação reais no restante da árvore.

## Congelamento do 0.4c e reordenação do roadmap (0.5/0.6)

### [2026-07-15] Playground congelado; 0.4c não será executado
**Contexto:** Com 16 componentes prontos (fundação + avançados), o usuário avaliou que nenhuma tela real do produto está bloqueada por falta de componente. Continuar adicionando componentes ao Playground (0.4c: Checkbox, Switch, RadioGroup, Select, Tabs, Accordion + seções restantes) passaria a ter retorno decrescente.
**Decisão:** Não executar o 0.4c. Playground permanece exatamente como está ao fim do 0.4b — ferramenta interna permanente, não mais o objetivo principal. Prioridade muda de "quais componentes faltam" para "qual tela real dá para construir com o que já existe".
**Motivo:** Decisão estratégica explícita do usuário.
**Impacto:** Componentes de formulário (Checkbox, Switch, RadioGroup, Select) e Tabs ficam pendentes até que uma tela real precise deles — nesse momento, a exceção pontual (como a do Accordion no 0.5, abaixo) é o padrão a seguir, em vez de reabrir o 0.4c inteiro.

### [2026-07-15] Reordenação: Landing (0.5) antes de Dashboard (0.6)
**Contexto:** O usuário definiu inicialmente "Sprint 0.5 = Dashboard visual, Sprint 0.6 = Landing Premium". Antes que esse trabalho fosse commitado/documentado como sprint fechado, uma nova mensagem do usuário pediu a Landing como "Sprint 0.5", com o Dashboard implicitamente reordenado para 0.6 — um conflito direto com a instrução anterior. Segui a própria regra da nova instrução ("caso exista conflito, interrompa, não implemente, solicite esclarecimento") e parei antes de prosseguir.
**Decisão:** Usuário confirmou a nova ordem: Landing = 0.5, Dashboard = 0.6. O trabalho do Dashboard já implementado foi commitado localmente como checkpoint (`688931a`, sem push), a formalizar quando o 0.6 for executado de fato (validação/docs/push/deploy completos). `apps/web/app/page.tsx` (que eu tinha alterado para linkar ao Dashboard/Playground) foi revertido ao estado do 0.4b antes de começar a Landing, já que ela substitui a home por completo.
**Motivo:** Autoridade do usuário sobre sequenciamento é sempre a mais recente; nenhum trabalho foi perdido, só reordenado.
**Impacto:** `PROJECT_STATUS.md` reflete a nova ordem. Nenhum ADR novo necessário — é uma continuação do padrão já estabelecido no `ADR-005-sprint-governance.md` (divergências de sequenciamento vivem nos documentos operacionais, não em `docs/frozen/`).

## Incremento 0.5 — Landing Page premium

### [2026-07-15] Accordion construído como exceção pontual ao congelamento do Playground
**Contexto:** A seção FAQ pedida para a Landing exige um componente `Accordion`, que não existe (ficou no 0.4c, recém congelado). A própria instrução do usuário para este sprint previu esse cenário: "caso algum componente necessário não exista: interromper, explicar, propor, somente depois implementar."
**Decisão:** Construir apenas `Accordion` (Radix), sem reabrir o restante do 0.4c (Checkbox, Switch, RadioGroup, Select, Tabs continuam pendentes).
**Motivo:** Aprovação explícita do usuário diante da pergunta feita; é estritamente necessário para a Landing, diferente dos demais componentes do 0.4c.
**Impacto:** Nenhum — mantém o princípio de "construir componentes sob demanda de uma tela real", não antecipadamente.

### [2026-07-15] Sete arquivos de seção em vez de um por seção
**Contexto:** A Landing tem 7 seções (Hero, How It Works, Why Us, Platform, Benefits, Roadmap, FAQ) + Header + Footer + Reveal — um arquivo por seção geraria 10 arquivos só de landing, mais o Accordion, passando do limite de 10 arquivos novos por incremento.
**Decisão:** Consolidar em `features.tsx` (How It Works + Why Us), `platform.tsx` (Platform + Benefits) e `roadmap-faq.tsx` (Roadmap + FAQ); `header.tsx`, `hero.tsx`, `footer.tsx` e `reveal.tsx` continuam individuais por serem estruturalmente distintos. Total: 7 arquivos de landing + 1 Accordion = 8, mais `robots.ts`/`sitemap.ts` = 10 novos arquivos exatos.
**Motivo:** Mesmo padrão já usado no 0.4b (Dialog+Modal, Toast+Toaster) — agrupar por afinidade temática, não um arquivo por seção/componente a qualquer custo.
**Impacto:** Nenhum na API — cada seção continua sendo um componente exportado e importado individualmente em `page.tsx`.

### [2026-07-15] Bug de build: `Button asChild` quebrava o Radix Slot
**Contexto:** Ao usar `<Button asChild><Link>...</Link></Button>` pela primeira vez (Header e Hero da Landing), o build falhou: "Slot failed to slot onto its children. Expected a single React element child." O componente `Button` sempre renderizava `{loading ? <Loader2/> : null}` seguido de `{children}` — quando `asChild` vira `Comp = Slot`, isso são 2 filhos, mas o Radix `Slot` exige exatamente 1. Nunca detectado antes porque todo uso anterior de `asChild` estava em *Trigger* de outro componente (`DialogTrigger asChild`, `TooltipTrigger asChild`), envolvendo um `<Button>` inteiro como filho único — o `Button` em si nunca tinha recebido `asChild` diretamente.
**Decisão:** `Button` agora renderiza `children` puro quando `asChild={true}`, e só inclui o wrapper de loading (`<>{loading...}{children}</>`) quando renderiza como `<button>` nativo.
**Motivo:** É o comportamento correto esperado pelo Radix Slot; loading + asChild não é uma combinação sensata de qualquer forma (um link não tem estado de loading próprio).
**Impacto:** Nenhuma quebra de API — `Button asChild` sem `loading` (o único uso real) continua funcionando; simplesmente deixou de quebrar o build.

### [2026-07-15] Screenshots `fullPage` precisam de scroll programático antes da captura
**Contexto:** A Landing usa scroll-reveal (`IntersectionObserver`) para fade-in de seções. As primeiras screenshots `fullPage` mostraram tudo abaixo de "Como funciona" completamente invisível (`opacity-0`). Investigação confirmou que usuários reais veem o reveal normalmente ao rolar — o problema é que o Playwright `page.screenshot({ fullPage: true })` não dispara scroll real antes de compor a imagem, então o `IntersectionObserver` nunca ativa para conteúdo abaixo da viewport inicial.
**Decisão:** Ajustar o **script de screenshot** (não o app) para rolar a página em passos incrementais antes de cada captura `fullPage`, em qualquer página com scroll-reveal.
**Motivo:** Era um falso positivo de bug de produto — na verdade um artefato do método de teste. Corrigir no lugar certo (harness de screenshot) evita relatórios de "bug" incorretos em sprints futuros com o mesmo padrão de animação.
**Impacto:** Nenhum no código do produto. Prática de screenshot documentada aqui para sprints futuros que usem `Reveal`/scroll-reveal.

## Sprint 1 — Application Foundation

### [2026-07-15] Numeração volta a "Sprint 1", alinhada ao roadmap frozen
**Contexto:** O usuário nomeou este trabalho "SPRINT 1 — APPLICATION FOUNDATION", que é literalmente o nome do Sprint 1 em `docs/frozen/roadmap/AGSOS-PLAN-001.md` ("Sprint 1 | Application Foundation (SPEC-004)"). Diferente das divergências anteriores (0.4c congelado, Landing↔Dashboard reordenados), aqui a numeração de alto nível volta a **coincidir** com o documento frozen — só o conteúdo real diverge (SPEC-004 descreve Event Bus/Commands/Queries de backend; o que foi construído é 100% UI/Application Shell).
**Decisão:** Adotar "Sprint 1" como nome operacional a partir de agora (com incrementos 1.1, 1.2...), documentando que o conteúdo é diferente do previsto em SPEC-004, sem alterar esse documento frozen.
**Motivo:** Seguir a intenção do usuário; a numeração de sprints de alto nível (0, 1, 2...) é estável o suficiente no roadmap frozen para valer a pena realinhar com ela, ao contrário da numeração fina de incrementos (0.x), que já tinha divergido bastante.
**Impacto:** `PROJECT_STATUS.md` agora usa "Sprint 0" (concluído) e "Sprint 1" (em andamento) como agrupadores, com incrementos dentro de cada um. Sprints frozen futuros (2 = Design System, 3 = Core Features...) podem ou não ser seguidos à risca dependendo do que for pedido — cada divergência real continua sendo registrada aqui.

### [2026-07-15] Reaproveitar StatCard/ProjectCard/Card em vez de MetricCard/DashboardCard paralelos
**Contexto:** A instrução do sprint listou como exemplo de componentes a criar: "DashboardCard, SectionHeader, QuickActionCard, MetricCard, SidebarItem, SidebarSection, ActivityItem, ProjectCard, TopBar, SearchBar, UserMenu" — mas `ProjectCard` e `TopBar` já existiam, confirmando que a lista é ilustrativa (o tipo de componente necessário), não uma exigência de que todos sejam literalmente novos.
**Decisão:** `MetricCard` foi implementado reaproveitando o `StatCard` já existente (mesmo propósito: ícone + label + valor); `DashboardCard` não foi criado — o `Card` genérico já cumpre esse papel em todas as seções do dashboard.
**Motivo:** Evitar componentes paralelos fazendo a mesma coisa (o próprio sprint da Landing já tinha estabelecido esse princípio explicitamente). Menos superfície para manter, mesma capacidade.
**Impacto:** Nenhum. Se no futuro `StatCard`/`MetricCard` precisarem divergir de verdade (ex.: variação com tendência/delta), aí sim vale desmembrar.

### [2026-07-15] Bug de responsividade: Sidebar não colapsava em mobile
**Contexto:** Screenshot em 390px de largura revelou a Sidebar renderizando na largura total (`w-56`), espremendo todo o conteúdo do dashboard numa coluna de ~166px — badges cortados, texto sobreposto. Não havia nenhum tratamento para ocultar/recolher a Sidebar abaixo de um breakpoint.
**Decisão:** Sidebar passa a ser `hidden md:flex` (oculta por padrão em mobile). Um botão hambúrguer no `TopBar` (visível só abaixo de `md`) abre um drawer off-canvas: a mesma `Sidebar`, renderizada como overlay fixo com backdrop (reaproveitando o token `--backdrop` do Dialog/Modal), sempre expandida (colapso não faz sentido dentro de um drawer).
**Motivo:** Padrão consolidado em produtos SaaS (Linear, Notion, Vercel) — sidebar fixa em desktop/tablet, escondida atrás de um menu em mobile. Reaproveitar o token de overlay já existente evita duplicar lógica de backdrop.
**Impacto:** `AppShell` agora gerencia um segundo estado (`mobileNavOpen`) além do `collapsed`. `TopBar` ganhou a prop opcional `onMenuClick`.

### [2026-07-15] Bug no método de screenshot: `fullPage` não captura scroll interno do `<main>`
**Contexto:** A Application Shell mantém header/sidebar fixos e rola apenas o `<main>` interno (`overflow-y-auto`) — o documento (`<body>`) nunca cresce. Como o `page.screenshot({ fullPage: true })` do Playwright se baseia na altura do documento, as primeiras capturas do Dashboard cortavam tudo abaixo de ~900px (Recent Activity, AI Insights e Roadmap ficavam de fora).
**Decisão:** Para páginas com scroll interno (não no documento), medir `scrollHeight` do `<main>` via `page.evaluate` e redimensionar o viewport (`page.setViewportSize`) antes de capturar, em vez de usar `fullPage: true`.
**Motivo:** É a segunda vez que uma técnica de captura de screenshot dá um falso resultado incompleto por causa de uma arquitetura de scroll não convencional (a primeira foi o scroll-reveal da Landing, que precisava de scroll programático). Ambos os casos mostram que a técnica de screenshot precisa se adaptar ao padrão de scroll de cada página, não assumir que `fullPage` sempre funciona.
**Impacto:** Nenhum no código do produto — só no harness de teste. Prática documentada aqui para qualquer página futura que use um layout de shell fixo com conteúdo scrollável internamente (todos os módulos que usarem `AppShell`).

### [2026-07-15] Supabase Auth adiado para depois dos módulos de negócio
**Contexto:** O roadmap trazia Auth logo em seguida ao Dashboard (Sprint 1.2). O usuário observou que autenticar usuários para chegar a um sistema sem nenhuma funcionalidade real (Projects, Games, Knowledge, Publishing ainda não existem) não agrega valor — e que validar UX com dados mockados primeiro reduz retrabalho quando o backend for integrado depois.
**Decisão:** Nova ordem: 1.2 Projects → 1.3 Games → 1.4 Knowledge → 1.5 Publishing → 1.6 Supabase Auth → 1.7 conectar todos os módulos ao Supabase (substituir mocks por dados reais).
**Motivo:** Evitar a armadilha comum de meses construindo infraestrutura (login, permissões, banco, APIs) sem nenhuma funcionalidade útil entregue. Autenticação faz mais sentido quando já existe algo de valor para proteger; a troca de mock por dado real é mecânica (`const data = mockData` → `const data = await supabase...`) se as telas já estiverem prontas.
**Impacto:** `PROJECT_STATUS.md` atualizado com a nova sequência. Nenhum código afetado — é só reordenação de prioridade, mesmo padrão de divergência operacional já registrado em `ADR-005-sprint-governance.md`.

### [2026-07-15] Sprint 1.2 — mock de Projects persistido em localStorage (não apenas `useState`)
**Contexto:** O fluxo pedido é Dashboard → Projects → New Project → Project Details, 100% mock (sem backend). Um `useState` local em `/projects` perderia o projeto criado ao navegar para `/projects/[id]` (páginas diferentes, sem estado compartilhado), quebrando a própria demonstração do fluxo.
**Decisão:** `apps/web/lib/projects-store.ts` guarda os projetos (seed + criados pelo usuário) em `localStorage`, com um pub/sub simples em memória para notificar componentes montados na mesma sessão. Escopo deliberadamente mínimo — sem Zustand/Context, só o necessário para o mock funcionar de ponta a ponta.
**Motivo:** Perguntado ao usuário; localStorage foi a opção escolhida em vez de manter tudo em memória (que deixaria a navegação para o projeto recém-criado sempre em "não encontrado").
**Impacto:** `lib/projects-store.ts` é código descartável — inteiramente substituído no Incremento 1.7 (integração real com Supabase). Nenhum outro módulo deve replicar esse padrão além de Projects sem decisão equivalente.

### [2026-07-15] Sprint 1.3 — Games replica o padrão de store mock do Sprint 1.2
**Contexto:** Games precisa do mesmo tipo de fluxo que Projects (Dashboard → Games → Create Game → Game Workspace), com o mesmo problema de estado entre páginas.
**Decisão:** `apps/web/lib/games-store.ts` replica a estrutura de `projects-store.ts` (seed + `localStorage` + pub/sub em memória), com campos próprios de Games (`platforms`, `builds`) em vez de `epics`/`progress`. `GameCard` é um componente novo e paralelo a `ProjectCard` (não reaproveitado) porque os campos exibidos divergem o suficiente (plataformas como badges, sem barra de progresso) para não justificar props opcionais condicionais em um componente só.
**Motivo:** Consistência com a decisão já aprovada em 1.2 — não repetir a pergunta ao usuário para o mesmo tipo de escolha em um módulo irmão. Caso surja um terceiro módulo (Knowledge, Publishing) com a mesma necessidade, replicar de novo em vez de abstrair prematuramente um "store genérico" — ainda não há sinal de que os três vão precisar exatamente da mesma forma.
**Impacto:** `lib/games-store.ts` e `components/games/cards.tsx` são código descartável — substituídos no Incremento 1.7.

### [2026-07-15] Sprint 1.4 — Knowledge replica o mesmo padrão de store mock; seleção de tipo via badges (sem componente Select)
**Contexto:** Knowledge precisa do mesmo fluxo (Dashboard → Knowledge → New Document → Document Details) e, no diálogo de criação, de um campo de seleção única para o tipo do documento (Documento/Template/Playbook/SOP/ADR/SPEC). O design system ainda não tem um componente `Select`.
**Decisão:** `apps/web/lib/knowledge-store.ts` replica a estrutura de `projects-store.ts`/`games-store.ts` (seed + `localStorage` + pub/sub). Para o campo "Tipo", reaproveitado o mesmo padrão de badges alternáveis já usado para "Plataformas" em Games (1.3) — só que de seleção única (um clique troca o tipo ativo) em vez de múltipla.
**Motivo:** Terceira ocorrência do mesmo tipo de necessidade (store mock com persistência) — confirma que o padrão é estável o suficiente para módulos de negócio 100% mock, sem precisar virar abstração compartilhada agora (nenhum dos três precisou de nada além do básico). Criar um componente `Select` de verdade agora seria antecipar um requisito que nenhuma tela pediu ainda (nenhum caso teve mais que ~6 opções, e badges alternáveis já resolvem visualmente).
**Impacto:** `lib/knowledge-store.ts` e `components/knowledge/cards.tsx` são código descartável — substituídos no Incremento 1.7. Se um quarto módulo (Publishing) precisar de um dropdown de verdade (muitas opções, texto livre, busca), aí sim vale considerar um componente `Select` no design system.

### [2026-07-15] Sprint 1.5 — Publishing simplificado para não depender de Games (mock)
**Contexto:** SPEC-007 descreve o fluxo real como `ReleaseReadyForSubmission → Publishing → CreateSubmission → Store Review → SubmissionPublished`, com Publishing consumindo um evento de domínio de Games (nunca acessando o módulo diretamente) e "Publishing nunca acessa o módulo Games diretamente" como regra explícita. Como este incremento é 100% mock (sem Event Bus, sem Domain Events reais), não há um `ReleaseReadyForSubmission` de verdade para consumir.
**Decisão:** O diálogo "New Submission" pede o nome do jogo como texto livre (não como referência a um `Game` de `games-store.ts`), em vez de simular uma integração entre módulos que só existirá quando o Event Bus for implementado (fora do escopo do Sprint 1, que é só Application Foundation visual).
**Motivo:** Simular um acoplamento entre stores mock (Publishing lendo `games-store.ts`) criaria uma dependência de dados que não reflete a arquitetura real (que é por eventos, não por leitura direta) e que seria descartada do mesmo jeito no Incremento 1.7. Texto livre é mais simples e não implica uma integração que não existe.
**Impacto:** `lib/publishing-store.ts` é código descartável — substituído no Incremento 1.7, quando `CreateSubmission` passará a ser disparado de verdade a partir de um evento `ReleaseReadyForSubmission` do módulo Games, via Event Bus (SPEC-004).

### [2026-07-15] Sprint 1.6 — Auth simulada (mock), sem projeto Supabase ainda
**Contexto:** ADR-003 define Supabase Auth como a estratégia oficial, mas não existe nenhum projeto Supabase criado/conectado (sem credenciais — mesma limitação já registrada para a Vercel no Incremento 0.6, que exigiu ação do usuário via dashboard). Perguntado ao usuário como proceder: criar projeto agora (exigiria login dele em supabase.com, que eu não posso fazer sozinho) ou simular a autenticação como os módulos de negócio já fazem. Usuário escolheu simular, com login por email + senha.
**Decisão:** `apps/web/lib/auth-store.ts` replica o padrão de seed + `localStorage` + pub/sub já usado por `projects-store.ts`/`games-store.ts`/`knowledge-store.ts`/`publishing-store.ts`. `login(email, password)` aceita qualquer combinação não vazia (a senha nem é lida) — assinatura já compatível com a futura chamada real `supabase.auth.signInWithPassword({ email, password })`. `AppShell` passa a verificar a sessão e redirecionar para `/login` quando ausente; como as 9 páginas de produto já usam `AppShell`, todas ficaram protegidas de uma vez.
**Motivo:** Consistente com a decisão já aprovada em 1.2 (mock com `localStorage` como exceção documentada à proibição de `ARCHITECTURE.md`) e com a escolha explícita do usuário nesta rodada.
**Impacto:** `lib/auth-store.ts`, `hooks/use-auth.ts` e `app/login/page.tsx` são código descartável — substituídos no Incremento 1.7 por Supabase Auth real (`packages/auth`, `packages/database`, os três clientes de `ADR-003`). A troca do "gate" em `AppShell` deve continuar sendo o único ponto de verificação de sessão — nenhuma página de produto deve implementar sua própria checagem de auth.

## Sprint 1.7 — Foundation for Supabase (sem conectar)

Contexto geral: usuário pediu para não pular direto para a integração real, e sim preparar toda a infraestrutura primeiro (`packages/database`, schema SQL, migrations, seeds, RLS planejada), sem tocar nas telas nem remover nenhum mock — ver `DATA_MODEL.md` para a auditoria completa do modelo de dados que precedeu esta implementação.

### [2026-07-15] `Project.progress` persistido (não calculado em query)
**Contexto:** `DATA_MODEL.md` §4.3/§8 deixou como decisão em aberto: persistir `progress` como coluna ou calculá-lo a partir de epics/tasks concluídas a cada leitura.
**Decisão:** Persistido como coluna (`projects.progress smallint`), recalculado por trigger quando epics/tasks mudarem de status — o trigger em si fica para o Sprint 1.8+ (quando Commands existirem de verdade); por ora a coluna só existe e é preenchida manualmente/pelo seed.
**Motivo:** Listagens de `/projects` são o caminho mais frequente (Dashboard + página própria) — calcular a agregação em toda leitura penalizaria exatamente a página mais visitada. Persistir com recálculo assíncrono (trigger) é o padrão mais comum para esse tipo de métrica derivada.
**Impacto:** Precisa de um trigger `AFTER UPDATE ON epics/tasks` no Sprint 1.8 para manter `progress` sincronizado — registrado como pendência em `packages/database/README.md`. Até lá, `progress` só é atualizado manualmente (seed) ou via Command explícito.

### [2026-07-15] `Task.estimate` em story points, não horas
**Contexto:** `DATA_MODEL.md` §8 deixou a unidade de `estimate` como decisão em aberto.
**Decisão:** Story points (inteiro pequeno, sem unidade de tempo explícita).
**Motivo:** Evita a falsa precisão de estimativas em horas nesta fase do produto (nenhuma tela ainda usa esse campo para nada além de exibição) — story points são mais tolerantes a incerteza e mais comuns em ferramentas de gestão de projeto de software.
**Impacto:** Se o produto precisar de estimativas em tempo real no futuro (ex.: para cálculo de custo/Finance), isso é uma decisão nova, não uma migração trivial de unidade.

### [2026-07-15] Histórico de `Submission` via `store_reviews`, não view sobre `studio_events`
**Contexto:** `DATA_MODEL.md` §7 apresentou duas opções: tabela própria (`store_reviews`, já prevista em `DATA_MODEL.md` §4.5) ou view sobre `studio_events`.
**Decisão:** `store_reviews` como tabela própria (uma linha por decisão de revisão), não uma view.
**Motivo:** `store_reviews` já existia como entidade própria do domínio Publishing (`AGSOS-SPEC-002` §8: "Entidades: Submission, StoreReview, Certificate, ProvisionProfile, StoreConnection") — usá-la para o histórico é mais direto do que inventar uma view sobre o Event Store para um caso que já tem tabela dedicada no domínio. `studio_events` continua sendo a fonte de auditoria completa (todas as mudanças, não só decisões de revisão), em paralelo.
**Impacto:** Nenhum — simplesmente usa a tabela que a SPEC já previa, em vez de criar uma alternativa.

### [2026-07-15] `permissions` como tabela global (sem `studio_id`); `roles` por Studio
**Contexto:** `DATA_MODEL.md` §4.2 marcou esse split como "ponto em aberto".
**Decisão:** `permissions` é catálogo fixo do sistema (sem `studio_id`, mesma categoria de `platforms`/`countries`); `roles` tem `studio_id` (cada Studio nomeia suas próprias Roles, vinculando Permissions via `role_permissions`).
**Motivo:** As capacidades do sistema (`"projects.create"`, `"publishing.approve"`, etc.) são definidas pelo código da aplicação, não pelo usuário final — não faz sentido duplicá-las por Studio. Já os nomes/composição de Roles (quem tem quais Permissions) são uma escolha de cada Studio.
**Impacto:** `permissions` populada via seed/migration versionada pela aplicação (como as demais tabelas globais), nunca criada pelo usuário final via UI.

### [2026-07-15] `users.id` = `auth.users.id` (FK explícita, sem `gen_random_uuid()` próprio)
**Contexto:** Padrão-ouro do Supabase para tabela de "profile": a tabela pública de usuário usa o mesmo UUID do `auth.users`, nunca gera um novo.
**Decisão:** `users.id uuid primary key references auth.users(id) on delete cascade`. `handle_new_auth_user()` trigger criado como *no-op proposital* (não popula `public.users` sozinho ainda) — decisão de onboarding (criar Studio novo vs. aceitar convite a um Studio existente) fica explicitamente pendente para o Sprint 1.8, marcada com TODO no corpo da função, para não inserir um `studio_id` fictício/incorreto silenciosamente.
**Motivo:** Errar essa FK exigiria migração destrutiva depois. Já a lógica de onboarding é decisão de fluxo de produto, não de schema — não deveria ser resolvida "de brinde" dentro de uma migration.
**Impacto:** O trigger existe (ponto de extensão pronto) mas está documentado como incompleto — qualquer um que reabrir esse arquivo já sabe que falta essa decisão, em vez de assumir que está pronto.

### [2026-07-15] Migrations e seeds validados localmente via Docker (Supabase CLI), sem projeto remoto
**Contexto:** Sem credenciais de um projeto Supabase real, mas o Supabase CLI local (`supabase db start`) sobe um Postgres real em Docker, permitindo validar schema/seed de verdade em vez de só revisar o SQL visualmente.
**Decisão:** Todas as 9 migrations e o seed completo foram aplicados e verificados localmente: contagem de linhas de cada tabela conferida, proteção append-only testada (`UPDATE` em `studio_events` não altera a linha), e RLS confirmado como habilitado (`pg_class.relrowsecurity`) nas tabelas de negócio.
**Motivo:** Mesmo sem poder conectar a produção, era possível (e mais seguro) testar contra Postgres real em vez de assumir que o SQL escrito à mão estava correto — e encontrou um bug real (`store_reviews` sem `updated_actor_type` no INSERT do seed, corrigido).
**Impacto:** Stack Docker local foi parada ao final (`supabase stop`) — não fica rodando entre sessões. Quem retomar o Sprint 1.8 pode repetir esse mesmo processo de validação local antes de `supabase link` para um projeto real.
