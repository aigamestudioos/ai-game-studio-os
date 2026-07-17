# IMPLEMENTATION_LOG.md

Diário técnico de implementação do AI Game Studio OS — um registro por sprint com o que foi feito, decidido e encontrado pelo caminho.

> Isto não é um changelog (ver [CHANGELOG.md](CHANGELOG.md)). O changelog lista o que mudou; este documento explica o porquê e o contexto de cada sprint, para que seja possível voltar a um módulo meses depois e entender o raciocínio sem depender só do histórico do git.

Cada entrada de sprint segue o formato:

```
## Sprint N — <nome>

**Status:** <Pending | Em andamento | Concluído>
**Período:** <datas>

### Objetivo
### Arquivos criados
### Decisões tomadas
### Problemas encontrados
### Pendências
### Próximo Sprint
```

---

## Sprint 0 — Foundation (Release 0.1)

**Status:** Em andamento (Incrementos 0.1 e 0.2 concluídos)
**Período:** 2026-07-15 —

### Objetivo

Conforme `docs/frozen/roadmap/AGSOS-PLAN-001.md`, o Sprint 0 cobre os incrementos 0.1 a 0.7:

| Incremento | Escopo | Critério de aceite | Status |
|---|---|---|---|
| **0.1** | **Monorepo + Turborepo + pnpm + TypeScript + docs** | **`pnpm build` verde em todos os packages** | **Concluído (local)** |
| **0.2** | **Next.js + App Router** | **`pnpm dev` → página em localhost:3000** | **Concluído (local)** |
| 0.3 | Tailwind CSS + shadcn/ui (Button, Card, Input, Dialog) | Página estilizada + todos os componentes funcionando | Pending |
| 0.4 | GitHub Actions (CI mínimo) | CI verde no primeiro PR | Pending |
| 0.5 | Vercel + primeiro deploy | URL de preview acessível | Pending |
| 0.6 | Supabase Auth + AuthProvider + login/logout + rota protegida | Login funcional em produção | Pending |
| 0.7 | Revisão geral, correções, testes, documentação | CI verde + todos os critérios | Pending |

---

#### Incremento 0.1 — Monorepo Bootstrap

**Arquivos criados**

Raiz: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.editorconfig`, `.gitignore`, `eslint.config.mjs`, `prettier.config.mjs`.

Diretórios vazios (com `.gitkeep`): `apps/`, `supabase/`, `scripts/`.

11 packages em `packages/`, cada um com `package.json` + `tsconfig.json` + `src/index.ts` (stub, sem implementação): `ui`, `database`, `auth`, `events`, `config`, `validation`, `observability`, `integrations`, `storage`, `testing`, `i18n` (todos `@agsos/*`).

**Decisões tomadas**

Ver `DECISIONS.md` § "Incremento 0.1 — Monorepo Bootstrap": pnpm 10.32.1 fixado, TypeScript strict com `moduleResolution: Bundler`, ESLint 9 flat config sem Husky/lint-staged nesta etapa.

**Problemas encontrados**

Nenhum. `pnpm install`, `pnpm typecheck`, `pnpm build` e `pnpm lint` passaram sem erros na primeira execução, em todos os 11 packages.

**Pendências**

- Nenhuma pendência técnica do Incremento 0.1 em si.
- Commit feito apenas localmente (`chore(repo): bootstrap monorepo foundation`) — sem push, conforme instrução.
- `apps/web` (Next.js) ainda não existe — entra no Incremento 0.2.

### Próximo Sprint / Incremento (0.1)

Incremento 0.2 — Next.js + App Router, conforme `docs/frozen/roadmap/AGSOS-PLAN-001.md`.

---

#### Incremento 0.2 — Next.js + App Router

**Arquivos criados**

`apps/web/`: `package.json`, `tsconfig.json` (estende `tsconfig.base.json`), `next.config.mjs`, `next-env.d.ts`, `app/layout.tsx`, `app/page.tsx`, `app/loading.tsx`, `app/error.tsx`, `app/not-found.tsx`.

**Arquivos alterados**

`turbo.json` (outputs do task `build` passam a incluir `.next/**`, excluindo `.next/cache/**`).

**Decisões tomadas**

Ver `DECISIONS.md` § "Incremento 0.2 — Next.js + App Router": scaffold manual (sem `create-next-app`) com Next 15.5.20 + React 19.2.7; `verbatimModuleSyntax: false` restrito a `apps/web`; ajuste de `outputs` no `turbo.json`.

**Problemas encontrados**

Nenhum bloqueante. `next build` reportou o aviso padrão "The Next.js plugin was not detected in your ESLint configuration" — esperado, já que o escopo do incremento não pediu configuração de lint específica do Next (eslint-config-next); lint roda normalmente com o `eslint.config.mjs` existente e passou sem erros.

**Pendências**

- Plugin de ESLint específico do Next (`@next/eslint-plugin-next`) não configurado — avaliar no Incremento 0.3 ou 0.7 se necessário.
- Nenhum push/deploy feito, conforme escopo explícito pedido (commit local apenas).
- Tailwind, shadcn/ui e Supabase deliberadamente fora do escopo — entram nos Incrementos 0.3 e 0.6.

### Próximo Sprint / Incremento (0.2)

Incremento 0.3 — Tailwind v4 + Design Tokens + Dark Mode + ThemeProvider (sequência ajustada; ver `DECISIONS.md` § "Ajustes de processo pós-0.2").

---

#### Incremento 0.3 — Tailwind v4 + Design Tokens + Dark Mode + ThemeProvider

**Arquivos criados**

`apps/web/postcss.config.mjs`, `apps/web/app/globals.css`, `apps/web/providers/theme-provider.tsx`, `apps/web/hooks/use-theme.ts`.

**Arquivos alterados**

`apps/web/package.json` (deps `tailwindcss` + `@tailwindcss/postcss` 4.3.2, script `lint` passa a cobrir `providers`/`hooks`), `apps/web/app/layout.tsx` (importa `globals.css`, script inline anti-flash, envolve `children` em `ThemeProvider`), `apps/web/app/page.tsx` (Client Component demonstrando tokens + toggle de tema).

**Decisões tomadas**

Ver `DECISIONS.md` § "Incremento 0.3 — Tailwind v4 + Design Tokens + Dark Mode + ThemeProvider": tokens e ThemeProvider ficam em `apps/web` (packages/ui continua stub, reservado para o Sprint 2 da SPEC-005); sem persistência de tema nesta etapa (localStorage/sessionStorage proibidos, Supabase Auth ainda não existe); anti-flash via script inline lendo `prefers-color-scheme`, sem storage.

**Problemas encontrados**

Nenhum bloqueante. Verificado manualmente via `next dev`: CSS gerado contém `--color-background: var(--surface-background)` e a classe `.bg-background` compilada corretamente.

**Pendências**

- Persistência real da escolha de tema (banco/preferência de usuário) fica para o Incremento 0.7 (Supabase Auth).
- shadcn/ui deliberadamente fora do escopo — entra no Incremento 0.4.
- `packages/ui` continua stub — tokens/providers compartilhados só quando a biblioteca de componentes for construída (Sprint 2 da SPEC-005).

### Próximo Sprint / Incremento (0.3)

Incremento 0.4 — shadcn/ui (Button, Input, Card, Dialog, Toast), conforme sequência ajustada em `PROJECT_STATUS.md`. Antes disso, o usuário pediu antecipar o deploy (0.6).

---

#### Incremento 0.6 (antecipado) — Deploy em produção (Vercel)

**Arquivos criados/alterados**

Nenhum arquivo de código — apenas `git push origin main` (o repositório já estava sincronizado com o histórico local até o Incremento 0.3; nenhum commit novo neste passo).

**Decisões tomadas**

Ver `DECISIONS.md` § "Incremento 0.6 (antecipado) — Deploy em produção": deploy antecipado a pedido explícito do usuário, antes de 0.4/0.5; conexão com a Vercel feita pelo usuário via dashboard (import do repositório Git, Root Directory `apps/web`), não via CLI (sem token da Vercel disponível para automação).

**Problemas encontrados**

Nenhum. Deploy já estava no ar quando verificado.

**Validação**

`curl https://ai-game-studio-os-web.vercel.app/` → HTTP 200; título "AI Game Studio OS" e `<h1>` corretos; CSS servido contém os tokens Tailwind (`--color-background: var(--surface-background)`) e a classe `.bg-background` compilada — confirma que o build de produção da Vercel reflete o Incremento 0.3 (Tailwind + tokens + dark mode).

**Pendências**

- GitHub Actions (CI mínimo, Incremento 0.5) ainda não existe — o deploy depende só da integração nativa Git da Vercel, sem gate de CI antes de promover para produção.
- Nenhum `vercel.json` foi adicionado — configuração de build inteiramente via dashboard da Vercel (Root Directory `apps/web`).

### Próximo Sprint / Incremento (0.6 antecipado)

Incremento 0.4 (dividido em 0.4a/0.4b/0.4c — ver `ADR-005-sprint-governance.md`) — começando por 0.4a: Fundação do Design System.

---

#### Incremento 0.4a — Fundação do Design System + shell do `/playground`

**Arquivos criados**

`apps/web/lib/utils.ts` (`cn`), `apps/web/components/ui/{button,input,textarea,card,badge,avatar}.tsx`, `apps/web/app/playground/page.tsx`.

**Arquivos alterados**

`apps/web/package.json` (deps: `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `@radix-ui/react-slot`, `@radix-ui/react-avatar`; script `lint` passa a cobrir `lib`/`components`), `apps/web/app/globals.css` (tokens `success`/`warning` adicionados).

**Decisões tomadas**

Ver `DECISIONS.md` § "Incremento 0.4a": tokens `success`/`warning` adicionados (SPEC-005 §4 não os lista, mas o sprint exige estados Success/Warning sem cor hardcoded); componentes em `apps/web/components/ui/` (não `packages/ui`), consistente com a decisão do 0.3 e com SPEC-005 §2 ("componentes copiados manualmente"); **sem persistência de tema** — decisão explícita do usuário nesta rodada (reverte uma proposta anterior de persistência via cookie): tema fica só em memória durante a sessão, persistência real entra junto com Supabase Auth no 0.7, evitando solução intermediária.

**Problemas encontrados**

Aviso "The Next.js plugin was not detected in your ESLint configuration" persiste (mesmo do 0.2/0.3, não bloqueante).

**Bug de layout encontrado via validação visual (Playwright) e corrigido no mesmo incremento**: `Input`, `Textarea` e `Card` renderizavam muito mais estreitos que o esperado em `/playground`. `pnpm build`/`lint`/`typecheck` não detectaram — só apareceu nos screenshots. Causa raiz: `max-w-md` colide com o token `--spacing-md` (Tailwind v4 usa a escala de `spacing` como fallback para utilities nomeadas de tamanho). Corrigido trocando por `max-w-[28rem]`. Ver `DECISIONS.md` § "Bug de layout: `max-w-{sm,md,lg,xl}` colide com os tokens de espaçamento" para o detalhe e o risco a observar em 0.4b/0.4c.

**Validações executadas**

`pnpm install`, `pnpm build` (12 workspaces), `pnpm typecheck`, `pnpm lint` — todos ✅. Verificado via `next dev` e screenshots reais (Playwright, headless Chromium): `/` e `/playground` em light e dark, antes e depois da correção — `docs/screenshots/sprint-0.4a/` (`home-dark.png`, `home-light.png`, `playground-before-fix.png`, `playground-after-fix-local.png`). Log do servidor sem erros/warnings; `AvatarFallback` renderiza corretamente.

**Pendências**

- Componentes avançados (Dialog, Toast, Tooltip, etc.) — Incremento 0.4b.
- Seções restantes do playground (Forms, Feedback, Navigation, Typography, Spacing, Icons, Colors, Animations, Loading, Dark Mode) — Incremento 0.4c.
- Persistência de tema — Incremento 0.7 (junto com Supabase Auth).
- `@next/eslint-plugin-next` continua não configurado.
- Ao construir 0.4b/0.4c, evitar `w-sm/md/lg`, `h-sm/md/lg`, `max-w-sm/md/lg`, `min-w-*`/`min-h-*` com esses nomes — usar escala numérica padrão ou valores arbitrários (ver decisão acima).

### Próximo Sprint / Incremento

Incremento 0.4b — Componentes avançados (overlays e feedback), primeiro a seguir `DEFINITION_OF_DONE.md` integralmente.

---

#### Governança — Definition of Done oficial do projeto

**Contexto**

Depois do bug de `max-w-md` (encontrado só por revisão visual, não por build/lint/typecheck) e da avaliação do usuário sobre o Sprint 0.4a, ficou claro que valia formalizar o processo antes de seguir para o 0.4b: uma "Definition of Done" explícita, Sprint Review no relatório, métricas de produto (não só técnicas), changelog para público não técnico, e revisão visual como etapa obrigatória — não só geração de screenshots.

**Arquivos criados**

`DEFINITION_OF_DONE.md`, `RELEASE_NOTES.md`.

**Arquivos alterados**

`AGENT.md` (Fase 4/5 e relatório final agora exigem screenshots + revisão visual, RELEASE_NOTES.md, métricas de produto, Sprint Review e checklist de encerramento), `scripts/metrics.sh` (coleta automática de páginas, rotas, componentes UI, providers, hooks, features, ADRs, SPECs), `METRICS.md` (template de 5 seções documentado + nova entrada de fechamento do 0.4a), `CHANGELOG.md`.

**Decisões tomadas**

`DEFINITION_OF_DONE.md` é autorado pelo projeto (mesmo padrão do `ADR-005-sprint-governance.md`) — não frozen, editável livremente conforme o processo evolui. Complementa (não substitui) `AGENT.md`/`CLAUDE.md`/`VISION.md`.

**Pendências**

- A partir do 0.4b, todo relatório final deve incluir Sprint Review + checklist de encerramento do DoD.
- "Componentes avançados", "Fluxos completos" e "Deploys" em `METRICS.md` continuam com contagem manual — não há convenção de nomenclatura ainda para automatizar "avançado vs. básico", nem token da Vercel para medir deploys via API.
- Adiciona regra permanente: todo relatório final responde também "Product Delta" (o que o usuário consegue fazer hoje que não conseguia ontem, nunca vazio) e atualiza `PRODUCT_PROGRESS.md` — ver `DEFINITION_OF_DONE.md` §9.

### Próximo Sprint / Incremento

Incremento 0.4b — Componentes avançados, primeiro a seguir `DEFINITION_OF_DONE.md` integralmente.

---

#### Incremento 0.4b — Componentes avançados (overlays e feedback)

**Arquivos criados**

`apps/web/components/ui/{dialog,toast,tooltip,dropdown-menu,alert,spinner,skeleton,separator,progress}.tsx`, `apps/web/hooks/use-toast.ts` — 10 componentes em 10 arquivos (Dialog e Modal combinados em `dialog.tsx`; Toast e Toaster combinados em `toast.tsx`), respeitando o limite de 10 arquivos novos por incremento.

**Arquivos alterados**

`apps/web/package.json` (7 dependências `@radix-ui/*` novas), `apps/web/app/layout.tsx` (`TooltipProvider` + `Toaster` globais, `suppressHydrationWarning` no `<html>`), `apps/web/app/globals.css` (token `--backdrop`), `apps/web/app/playground/page.tsx` (6 novas seções).

**Decisões tomadas**

Dialog (dispensável) e Modal/AlertDialog (exige ação explícita) combinados em um único arquivo por serem a mesma família semântica (overlays modais), mantendo o limite de arquivos. Toast usa estado global simples (`hooks/use-toast.ts`, módulo com listeners) em vez de Context, para poder ser chamado de qualquer lugar (`toast({...})`) sem precisar estar dentro de um Provider React específico além do `ToastProvider` do Radix (que só cuida do posicionamento/acessibilidade, não do estado). Token `--backdrop` criado com o mesmo valor nos dois temas — overlay de modal deve sempre escurecer, independentemente do tema ativo (diferente dos demais tokens, que invertem entre dark/light).

**Bugs encontrados via revisão visual (Playwright) e corrigidos no mesmo incremento**

1. **Hidratação**: `<html>` sem `suppressHydrationWarning` — o script anti-flash (existente desde o 0.3) muda `data-theme` no DOM antes de React hidratar, e isso gerava warning de mismatch no console em toda carga com `prefers-color-scheme: light`. Só apareceu ao inspecionar o console do navegador via Playwright — nunca tinha sido checado antes (só o log do servidor, que não mostra isso). Corrigido adicionando `suppressHydrationWarning` ao `<html>`.
2. **Alert**: título e descrição renderizavam lado a lado (`flex` sem `flex-col`) em vez de empilhados. Corrigido no `alertVariants`.
3. **Overlay de Dialog/Modal**: usava `bg-surface-inverse/60`, que em dark mode produzia uma névoa clara em vez de escurecer o fundo (porque `surface-inverse` inverte com o tema). Corrigido com o novo token `--backdrop` (constante nos dois temas).

**Validações executadas**

`pnpm install`, `pnpm build` (12 workspaces), `pnpm typecheck`, `pnpm lint` — todos ✅. Screenshots via Playwright (headless Chromium): `/` e `/playground` completos em light e dark (`docs/screenshots/sprint-0.4b/`), mais capturas de cada componente interativo aberto (Dialog, Modal, Toast, Tooltip, Dropdown Menu) para confirmar que funcionam de verdade, não só que renderizam estaticamente. Nenhum erro de console/página em nenhuma das capturas, após as correções.

**Pendências**

- Seções restantes do playground (Checkbox, Switch, RadioGroup, Select, Tabs, Accordion + Typography/Spacing/Icons/Colors/Animations/Dark Mode) — Incremento 0.4c.
- Persistência de tema — Incremento 0.7.
- Suíte de testes E2E com Playwright (reaproveitando a mesma infraestrutura de screenshots) — sugestão do usuário, ainda não implementada; candidata ao 0.4c ou 0.5.

### Próximo Sprint / Incremento (0.4b)

Decisão estratégica do usuário: **não executar o 0.4c**. Com 16 componentes prontos, a pergunta deixa de ser "qual componente falta" e passa a ser "qual tela real dá para construir com o que já existe". Playground congelado como está — ferramenta interna permanente, não mais o objetivo principal. `PRODUCT_PROGRESS.md` e a seção "Product Delta" (obrigatória em todo relatório) formalizados nesse meio-tempo.

Ordem seguinte definida pelo usuário, depois ajustada uma vez no meio da sessão: inicialmente "0.5 Dashboard / 0.6 Landing", depois invertida para **"0.5 Landing / 0.6 Dashboard"** — ver `DECISIONS.md`.

---

#### Checkpoint — Dashboard visual (WIP, vira Incremento 0.6)

**Arquivos criados**

`apps/web/components/layout/{sidebar,topbar}.tsx`, `apps/web/components/dashboard/cards.tsx` (ProjectCard, StatCard), `apps/web/app/dashboard/page.tsx`.

**Decisões tomadas**

Sidebar segue a lista oficial de `AGSOS-SPEC-005` §9 (Dashboard, Studio, Projects, Games, AI, Publishing, Marketing, Analytics, Finance, Knowledge, Settings), mais completa que o mock original do usuário — só "Dashboard" tem link real, os demais renderizam desabilitados (sem rota ainda) para não criar links mortos. 100% mock/visual, sem Supabase, sem persistência.

**Bug encontrado e corrigido**

`Button` com `asChild` (usado pela primeira vez nos links da home) quebrava o build: Radix `Slot` exige exatamente 1 filho, mas o componente passava `{loading ? <Loader2/> : null}` + `{children}` = 2 filhos sempre. Corrigido para só renderizar `children` puro quando `asChild`.

**Status**

Commitado localmente (`688931a`), sem push — o usuário reordenou o roadmap no meio da sessão antes da validação completa/documentação formal deste incremento. Screenshots preliminares em `docs/screenshots/sprint-0.6/`. Retomar quando o Incremento 0.6 for formalmente executado (validação completa, docs, push, deploy).

---

#### Incremento 0.5 — Landing Page premium

**Contexto**

Nova instrução do usuário, em paralelo/logo após a anterior: construir a Landing oficial (substituindo a home), como Sprint 0.5 — invertendo a ordem que tinha acabado de ser definida (Dashboard 0.5 → Landing 0.6 virou Landing 0.5 → Dashboard 0.6). Identifiquei o conflito e parei para esclarecer antes de prosseguir (ver `DECISIONS.md`), incluindo o fato de que a seção FAQ pedida exige `Accordion`, que não existe (ficou no 0.4c, recém congelado). Usuário aprovou: Landing agora como 0.5, Dashboard vira 0.6; Accordion construído como exceção pontual ao congelamento do Playground, por ser estritamente necessário.

**Arquivos criados**

`apps/web/components/ui/accordion.tsx` (único componente novo do design system), `apps/web/components/landing/{header,hero,features,platform,roadmap-faq,footer,reveal}.tsx`, `apps/web/app/robots.ts`, `apps/web/app/sitemap.ts`.

**Arquivos alterados**

`apps/web/app/page.tsx` (reescrito por completo), `apps/web/app/layout.tsx` (metadata SEO completo), `apps/web/app/globals.css` (animações `accordion-down/up`, `fade-in`, `prefers-reduced-motion`), `apps/web/package.json` (dep `@radix-ui/react-accordion`).

**Decisões tomadas**

Ver `DECISIONS.md` § "Incremento 0.5": reordenação Landing↔Dashboard; Accordion como exceção pontual ao congelamento do 0.4c; consolidação dos 7 arquivos de seção (em vez de 1 por seção) para respeitar o limite de 10 arquivos novos.

**Bugs encontrados via validação e corrigidos**

1. **Build quebrado**: `Button asChild` passava 2 filhos ao Radix `Slot` (que exige exatamente 1) — nunca exercitado antes porque todo uso anterior de `asChild` estava no *Trigger* (Dialog/Tooltip/Dropdown), não diretamente no `Button`. Corrigido condicionando o render interno do `Button` ao valor de `asChild`.
2. **Artefato de processo, não bug de produto**: screenshots `fullPage` do Playwright tiradas logo após `networkidle` mostravam as seções abaixo de "Como funciona" completamente invisíveis (`opacity-0` nunca virava 1). Causa: o scroll-reveal via `IntersectionObserver` não dispara em uma captura `fullPage` porque o Playwright não rola a página de verdade antes de compor a imagem. Confirmado que usuários reais veem o reveal normalmente (testado com scroll programático). Corrigido o **script de screenshot** (não o app) para rolar a página em passos antes de capturar — nova prática a manter em sprints futuros com scroll-reveal.

**Validações executadas**

`pnpm install`, `pnpm build` (8 rotas), `pnpm typecheck`, `pnpm lint` — todos ✅. Playwright: home em dark/light (desktop) + 3 breakpoints (desktop/tablet/mobile), zero overflow horizontal em todos, zero erros de console/página em todos. `/dashboard` e `/playground` também re-verificados sem erros após a mudança no `Button`.

**Pendências**

- Push e deploy deste incremento (próximo passo).
- Favicon/ícone real (`app/icon.tsx` ou asset) — adiado por falta de identidade visual de marca definida; SEO usa metadata textual completo, mas sem imagem OG customizada ainda.
- Pequeno detalhe cosmético: no breakpoint tablet, o conector "→" antes de "Resultado" (seção Como Funciona) fica sozinho ao quebrar linha — não é um bug funcional, cosmético menor, candidato a ajuste fino futuro.
- CI (GitHub Actions) continua sem posição fixa no roadmap atual — avaliar quando fizer sentido antes do 0.7/0.8.

### Próximo Sprint / Incremento

Incremento 0.6 — formalizar o Dashboard visual (já commitado localmente como checkpoint), com validação completa, documentação e deploy.

---

## Sprint 1 — Application Foundation

**Status:** Em andamento (Incremento 1.1 concluído)
**Período:** 2026-07-15 —

### Objetivo

O usuário nomeou este sprint "Sprint 1 — Application Foundation", alinhando de volta com a numeração de sprints de alto nível do roadmap frozen (`AGSOS-PLAN-001.md`: Sprint 0 Fundação, Sprint 1 Application Foundation, Sprint 2 Design System...). O conteúdo real diverge do que `SPEC-004` originalmente descreve para "Application Foundation" (Event Bus, Commands, Queries — backend), mas a numeração volta a coincidir com o documento frozen depois de vários incrementos "0.x" — ver `DECISIONS.md`.

#### Incremento 1.1 — Dashboard Premium (Application Shell)

**Arquivos criados**

`apps/web/components/layout/{app-shell,search-bar,user-menu}.tsx`, `apps/web/components/dashboard/{mock-data,widgets}.tsx`.

**Arquivos alterados**

`apps/web/components/layout/{sidebar,topbar}.tsx` (expandidos), `apps/web/components/dashboard/cards.tsx` (progresso no `ProjectCard`), `apps/web/app/dashboard/page.tsx` (reescrito), `apps/web/components/landing/roadmap-faq.tsx` (Dashboard marcado como concluído no roadmap da Landing).

**Decisões tomadas**

Ver `DECISIONS.md` § "Sprint 1.1": reaproveitamento de `StatCard`/`ProjectCard`/`Card` em vez de "MetricCard"/"DashboardCard" paralelos; `TopBar`/`Sidebar` mantiveram os mesmos nomes (compatibilidade com o uso no Playground); Playground não foi alterado (nenhum componente novo do design system, só de layout/dashboard).

**Bugs encontrados via validação e corrigidos**

1. **Responsividade (mobile)**: Sidebar não colapsava/ocultava em telas estreitas — todo o conteúdo ficava espremido numa coluna de ~166px, com badges e texto sobrepostos. Encontrado no screenshot mobile (390px). Corrigido com drawer off-canvas: Sidebar fica `hidden md:flex` por padrão, e abaixo de `md` um botão hambúrguer no `TopBar` abre um overlay com backdrop (`bg-backdrop`, mesmo token do Dialog/Modal).
2. **Método de screenshot**: a Application Shell mantém header/sidebar fixos e rola só o `<main>` interno (correto para um SaaS — Linear/Notion funcionam assim), então o `fullPage: true` do Playwright (que se baseia no scroll do documento) capturava só os primeiros 900px, cortando Recent Activity/AI Insights/Roadmap. Corrigido medindo `scrollHeight` do `<main>` e redimensionando o viewport antes de cada captura, em vez de depender de `fullPage`.

**Validações executadas**

`pnpm install`, `pnpm build` (8 rotas), `pnpm typecheck`, `pnpm lint` — todos ✅ (rodados de novo após ambas as correções). Playwright: Dashboard em dark/light (desktop) + 3 breakpoints (desktop/tablet/mobile) — zero overflow horizontal, zero erros de console/página em todos. Drawer mobile testado abrindo de verdade (clique no hambúrguer). Regressão verificada em `/` (Landing) e `/playground` — sem quebras.

**Pendências**

- Sprint 1.2 (Supabase Auth) e 1.3 (Projects) — próximos.
- CI (GitHub Actions) continua sem posição fixa no roadmap.
- Favicon/OG image reais — mesma pendência do Sprint 0.5, ainda sem identidade de marca definida.

### Próximo Sprint

Sprint 1.2 — Projects (primeiro fluxo de negócio, 100% mock). Ver nota de reordenação em `DECISIONS.md`: Supabase Auth foi adiado para 1.6, depois de Projects/Games/Knowledge/Publishing.

#### Incremento 1.2 — Projects (primeiro fluxo de negócio)

**Arquivos criados**

`apps/web/lib/projects-store.ts`, `apps/web/app/projects/page.tsx`, `apps/web/app/projects/[id]/page.tsx`, `docs/screenshots/sprint-1.2/*`.

**Arquivos alterados**

`apps/web/components/layout/sidebar.tsx` (item "Projects" ganhou `href`), `apps/web/app/dashboard/page.tsx` ("New Project" e Recent Projects agora navegam para `/projects`).

**Decisões tomadas**

Ver `DECISIONS.md` § "Sprint 1.2": o mock de projetos usa `localStorage` (não só `useState`) para que o projeto criado no diálogo "New Project" realmente exista ao navegar para `/projects/[id]` — decisão levada ao usuário porque um `useState` isolado por página quebraria a própria demonstração do fluxo pedido (Dashboard → Projects → New Project → Project Details). Reaproveitado `ProjectCard`, `Dialog`, `Input`, `Textarea`, `Badge`, `Card`, `Progress` já existentes — nenhum componente novo do design system.

**Validações executadas**

`pnpm install` (não necessário, sem novas dependências), `pnpm lint`, `pnpm typecheck`, `pnpm build` (5 páginas, incluindo a rota dinâmica `/projects/[id]`) — todos ✅. Playwright: `/projects` e `/projects/[id]` em dark/light (desktop) + 3 breakpoints (desktop/tablet/mobile), zero overflow horizontal, zero erros de console/página. Golden path testado de ponta a ponta via automação: abrir `/projects` → "New Project" → preencher nome/descrição → criar → toast "Projeto criado" → clicar no card recém-criado → chegar em `/projects/[id]` com os dados corretos (confirmado tanto via script quanto via inspeção visual dos screenshots).

**Bugs encontrados via validação**

Nenhum bug de produto. Um falso positivo do harness de screenshot foi identificado e descartado: ao forçar `colorScheme` por `BrowserContext` no Playwright, o Chromium ocasionalmente emite um aviso de hidratação sobre `caret-color` no `<input type="search">` do `SearchBar` (componente pré-existente do Sprint 1.1, inalterado aqui) — reproduzido de forma inconsistente mesmo sem qualquer mudança de código, e ausente em navegação client-side normal (`Link`/`router.push`) fora do loop de múltiplos `BrowserContext`. Tratado como artefato do ambiente de teste, não como bug de produto.

**Pendências**

- Push e deploy deste incremento (próximo passo) — `/projects` ainda não está em produção.
- Sprint 1.3 (Games) é o próximo módulo de negócio, seguindo o mesmo padrão (Application Shell + store client-side mock).
- CI (GitHub Actions) e favicon/OG seguem como pendências antigas, sem posição fixa no roadmap atual.

### Próximo Sprint

Sprint 1.3 — Games (Game Workspace), 100% mockado.

#### Incremento 1.3 — Games (Game Workspace)

**Arquivos criados**

`apps/web/lib/games-store.ts`, `apps/web/components/games/cards.tsx`, `apps/web/app/games/page.tsx`, `apps/web/app/games/[id]/page.tsx`, `docs/screenshots/sprint-1.3/*`.

**Arquivos alterados**

`apps/web/components/layout/sidebar.tsx` (item "Games" ganhou `href`), `apps/web/app/dashboard/page.tsx` (Quick Action "Create Game" agora navega para `/games`).

**Decisões tomadas**

Ver `DECISIONS.md` § "Sprint 1.3": replicado o padrão de store mock com `localStorage` já aprovado em 1.2 (Projects), sem repetir a pergunta ao usuário para o mesmo tipo de escolha em um módulo irmão. `GameCard` foi criado como componente novo e paralelo a `ProjectCard` (não reaproveitado) — os campos divergem o suficiente (plataformas como badges, sem barra de progresso) para não justificar props condicionais num componente só.

**Validações executadas**

`pnpm lint`, `pnpm typecheck`, `pnpm build` (7 páginas, incluindo as duas rotas dinâmicas `/projects/[id]` e `/games/[id]`) — todos ✅. Playwright: `/games` e `/games/[id]` em dark/light (desktop) + 3 breakpoints, zero overflow horizontal, zero erros de página. Golden path testado de ponta a ponta: abrir `/games` → "Create Game" → preencher nome/descrição → selecionar plataformas (iOS, Steam) → criar → toast "Jogo criado" → clicar no card recém-criado → chegar em `/games/[id]` com plataformas e status corretos.

**Bugs encontrados via validação**

Nenhum.

**Pendências**

- Push e deploy deste incremento (próximo passo) — `/games` ainda não está em produção.
- Sprint 1.4 (Knowledge) é o próximo módulo de negócio, seguindo o mesmo padrão.
- CI (GitHub Actions) e favicon/OG seguem como pendências antigas, sem posição fixa no roadmap atual.

### Próximo Sprint

Sprint 1.4 — Knowledge, 100% mockado.

#### Incremento 1.4 — Knowledge

**Arquivos criados**

`apps/web/lib/knowledge-store.ts`, `apps/web/components/knowledge/cards.tsx`, `apps/web/app/knowledge/page.tsx`, `apps/web/app/knowledge/[id]/page.tsx`, `docs/screenshots/sprint-1.4/*`.

**Arquivos alterados**

`apps/web/components/layout/sidebar.tsx` (item "Knowledge" ganhou `href`), `apps/web/app/dashboard/page.tsx` (Quick Action "Knowledge" agora navega para `/knowledge`).

**Decisões tomadas**

Ver `DECISIONS.md` § "Sprint 1.4": terceira réplica do padrão de store mock com `localStorage` (Projects → Games → Knowledge), confirmando que o padrão é estável para módulos de negócio 100% mock sem precisar virar abstração compartilhada agora. Para o campo "Tipo" do documento (seleção única entre 6 opções), reaproveitado o mesmo padrão de badges alternáveis usado para "Plataformas" em Games — o design system ainda não tem um componente `Select`, e não havia necessidade real de criar um agora.

**Validações executadas**

`pnpm lint`, `pnpm typecheck`, `pnpm build` (9 páginas, incluindo as três rotas dinâmicas `/projects/[id]`, `/games/[id]`, `/knowledge/[id]`) — todos ✅. Playwright: `/knowledge` e `/knowledge/[id]` em dark/light (desktop) + 3 breakpoints, zero overflow horizontal, zero erros de página. Golden path testado de ponta a ponta, incluindo título com acentuação: abrir `/knowledge` → "New Document" → preencher título ("Guia de Publicação")/resumo → selecionar tipo (SOP) → criar → toast "Documento criado" → clicar no card recém-criado → chegar em `/knowledge/[id]` com os dados corretos (id gerado corretamente a partir do slug do título acentuado).

**Bugs encontrados via validação**

Nenhum.

**Pendências**

- Push e deploy deste incremento (próximo passo) — `/knowledge` ainda não está em produção.
- Sprint 1.5 (Publishing) é o próximo módulo de negócio, seguindo o mesmo padrão.
- CI (GitHub Actions) e favicon/OG seguem como pendências antigas, sem posição fixa no roadmap atual.

### Próximo Sprint

Sprint 1.5 — Publishing, 100% mockado.

#### Incremento 1.5 — Publishing

**Arquivos criados**

`apps/web/lib/publishing-store.ts`, `apps/web/components/publishing/cards.tsx`, `apps/web/app/publishing/page.tsx`, `apps/web/app/publishing/[id]/page.tsx`, `docs/screenshots/sprint-1.5/*`.

**Arquivos alterados**

`apps/web/components/layout/sidebar.tsx` (item "Publishing" ganhou `href`), `apps/web/app/dashboard/page.tsx` (Quick Action "Publish" agora navega para `/publishing`).

**Decisões tomadas**

Ver `DECISIONS.md` § "Sprint 1.5": quarta réplica do padrão de store mock (Projects → Games → Knowledge → Publishing). Diferente dos anteriores, o diálogo "New Submission" pede o nome do jogo como texto livre em vez de referenciar `games-store.ts` — SPEC-007 define que Publishing consome Games só via Domain Event (`ReleaseReadyForSubmission`), nunca por acesso direto; simular esse acoplamento entre stores mock introduziria uma integração que não reflete a arquitetura real e seria descartada do mesmo jeito no Incremento 1.7.

**Validações executadas**

`pnpm lint`, `pnpm typecheck`, `pnpm build` (11 páginas, incluindo as quatro rotas dinâmicas dos módulos de negócio) — todos ✅. Playwright: `/publishing` e `/publishing/[id]` em dark/light (desktop) + 3 breakpoints, zero overflow horizontal, zero erros de página. Golden path testado de ponta a ponta: abrir `/publishing` → "New Submission" → preencher jogo/versão → selecionar loja (Google Play) → criar → toast "Submissão criada" → clicar no card recém-criado → chegar em `/publishing/[id]` com histórico correto.

**Bugs encontrados via validação**

Nenhum.

**Pendências**

- Push e deploy deste incremento (próximo passo) — `/publishing` ainda não está em produção.
- Sprint 1.6 (Supabase Auth) é o próximo, agora que os quatro módulos de negócio (Projects, Games, Knowledge, Publishing) estão concluídos — ver reordenação em `DECISIONS.md`.
- CI (GitHub Actions) e favicon/OG seguem como pendências antigas, sem posição fixa no roadmap atual.

### Próximo Sprint

Sprint 1.6 — Supabase Auth (login/logout, controle de acesso).

---

#### Sprint 1.6 — Auth (mock)

**Contexto**

Ao iniciar, não havia projeto Supabase criado/conectado (sem credenciais — mesma limitação da Vercel no Incremento 0.6). Perguntado ao usuário: criar projeto agora (exige login dele, que eu não posso fazer sozinho) ou simular. Escolheu simular, com email + senha.

**Arquivos criados**

`apps/web/lib/auth-store.ts`, `apps/web/hooks/use-auth.ts`, `apps/web/app/login/page.tsx`.

**Arquivos alterados**

`apps/web/components/layout/app-shell.tsx` (verificação de sessão + redirecionamento), `apps/web/components/layout/user-menu.tsx` (sessão real, logout funcional), `apps/web/components/landing/header.tsx` (botão Login).

**Decisões tomadas**

Ver `DECISIONS.md` § "Sprint 1.6": mesmo padrão de store mock (localStorage + pub/sub) já aprovado em 1.2; `AppShell` como único ponto de verificação de sessão (as 9 páginas de produto ficaram protegidas de uma vez, sem alteração por módulo).

**Bugs encontrados via validação e corrigidos**

Erro de tipo no build: `subscribe()` retornava `() => boolean` (de `Set.delete`) em vez de `() => void`, o que `useEffect` não aceita como cleanup. Corrigido envolvendo o `delete` em chaves (`{ listeners.delete(listener); }`) — mesmo padrão já usado nos outros stores, que eu não tinha seguido à risca no primeiro rascunho.

**Validações executadas**

`pnpm build` (12 rotas), `pnpm typecheck`, `pnpm lint` — todos ✅ (após a correção acima). Playwright: fluxo completo testado — acessar `/dashboard` sem sessão → redireciona para `/login` → login → volta para `/dashboard` → menu mostra email correto → logout → volta para `/login` → tentar `/dashboard` de novo → redireciona de novo. `/login` capturado em 2 temas × 3 breakpoints, zero overflow, zero erros de console. Regressão verificada em `/projects`, `/games`, `/knowledge`, `/publishing`, `/playground` e `/` autenticado — sem quebras.

**Pendências**

- Push e deploy deste incremento.
- Sprint 1.7 — projeto Supabase real precisa ser criado (mesma decisão pendente: usuário cria e compartilha credenciais, ou usa o Supabase CLI com login próprio) antes de substituir os cinco stores mock (`auth`, `projects`, `games`, `knowledge`, `publishing`) por dados reais.
- CI (GitHub Actions) e favicon/OG seguem como pendências antigas.

### Próximo Sprint

Sprint 1.7 — conectar Auth e os quatro módulos de negócio ao Supabase real.

---

#### Sprint 1.7 — Foundation for Supabase (sem conectar)

**Contexto**

Usuário rejeitou pular direto para integração real: "integrar um backend antes de definir bem o modelo de dados pode gerar retrabalho." Pediu uma auditoria completa do domínio primeiro (entregue como `DATA_MODEL.md`, sprint anterior), e só então esta implementação — schema, clientes, seeds, RLS — sem conectar a nenhum projeto real e sem tocar em nenhuma tela.

**Arquivos criados**

`packages/database/src/{browser,server,admin}-client.ts`, `packages/database/src/generated/database.types.ts`, `packages/database/src/repositories/{studios,projects,games,knowledge-documents,submissions}-repository.ts`, `packages/database/src/{queries,mutations}/README.md` (reservados para Sprint 1.8+), `packages/database/README.md`, `supabase/migrations/*.sql` (9 arquivos), `supabase/seed/*.sql` (6 arquivos) + `supabase/seed.sql`, `supabase/config.toml` (via `supabase init`).

**Arquivos alterados**

`packages/database/package.json` (deps `@supabase/ssr`, `@supabase/supabase-js`, `@types/node`), `packages/database/tsconfig.json` (lib `DOM` adicionada, para o guard `typeof window` do admin-client).

**Decisões tomadas**

Ver `DECISIONS.md` § "Sprint 1.7": as três decisões que `DATA_MODEL.md` tinha deixado em aberto (progress persistido, estimate em story points, histórico de Submission via `store_reviews`) foram resolvidas; `permissions` definida como tabela global (sem `studio_id`); `users.id` = `auth.users.id` com FK explícita; trigger `handle_new_auth_user` criado como no-op proposital (onboarding de Studio é decisão de produto, não de schema, fica para 1.8).

**Bugs encontrados via validação e corrigidos**

1. **Seed quebrado**: `\i` (meta-comando psql) não funciona no mecanismo de seed do Supabase CLI, que aplica via protocolo Postgres direto — `seed.sql` precisou ser concatenado a partir de `seed/*.sql`, não referenciá-los.
2. **Seed com coluna NOT NULL faltando**: `store_reviews` sem `updated_actor_type` no INSERT — só apareceu ao rodar contra Postgres real, nunca teria sido pego só lendo o SQL.
3. **Tipos TypeScript incompatíveis com supabase-js**: `database.types.ts` hand-written inicial não tinha `Relationships`/`Views`/`Functions`/`Enums`/`CompositeTypes` no formato exato que `supabase-js` exige (`GenericSchema`) — sem eles, `.insert()`/`.update()` nos repositories inferiam `never` em vez do tipo esperado. Corrigido com um helper `Table<Row, Insert, Update>` incluindo `Relationships: []` e os campos de schema faltantes.
4. **`users.id` sem FK para `auth.users`**: gap real na primeira versão da migration — corrigido antes mesmo de rodar (`references auth.users(id) on delete cascade`), mas registrado aqui porque era um erro real que passaria despercebido sem o hábito de revisar contra o padrão-ouro do Supabase.

**Validações executadas**

`pnpm build`/`typecheck`/`lint` — verdes no monorepo inteiro (12 workspaces) depois das correções acima. **Migrations e seed testados de verdade**: `supabase db start` (Docker, Postgres real) aplicou as 9 migrations e o seed sem erros; contagem de linhas de cada tabela conferida via `psql` (`studios: 1, users: 1, projects: 3, epics: 10, games: 3, game_versions: 6, builds: 6, releases: 3, submissions: 3, store_reviews: 6, knowledge_documents: 3, knowledge_document_versions: 3`); proteção append-only testada (`INSERT` em `studio_events` seguido de `UPDATE` — 0 linhas afetadas, confirmado via `SELECT`); RLS confirmado habilitado (`pg_class.relrowsecurity = true`) em `studios`, `projects`, `games`, `submissions`, `knowledge_documents`. Stack Docker parada ao final (`supabase stop`).

**Pendências**

- Sprint 1.8 — projeto Supabase real ainda precisa ser criado (credenciais do usuário, ou CLI com login próprio); conectar Auth primeiro.
- `supabase/tests/` (testes de RLS, 5 cenários por tabela) — vazio ainda, listado como pendência explícita em `packages/database/README.md`.
- Trigger de recálculo de `projects.progress` — coluna existe, trigger fica para quando Commands existirem de verdade.
- CI (GitHub Actions) e favicon/OG seguem como pendências antigas.

### Próximo Sprint

Sprint 1.8 — conectar Auth ao Supabase real (requer projeto Supabase criado).

---

## Ambiente de integração Supabase (pré-Sprint 1.8)

**Status:** Concluído (local, não commitado até aprovação do usuário)
**Período:** 2026-07-16

### Objetivo

Usuário criou o projeto Supabase `dev` (`vkyswyuxitwakjqjteso`) e pediu para configurar o ambiente de `apps/web` seguindo boas práticas: `.env.example` documentado, `.env.local` com as credenciais reais, proteção via `.gitignore`, módulo tipado de acesso a variáveis de ambiente, e validação de que a aplicação lê tudo sem erros — antes de conectar qualquer código de fato (isso continua sendo o Sprint 1.8).

### Arquivos criados

- `apps/web/.env.example` — todas as variáveis (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_VERCEL_URL`), comentadas, sem valores.
- `apps/web/.env.local` — URL e publishable key reais do projeto `dev`; `SUPABASE_SECRET_KEY` deixada vazia com aviso explícito no próprio arquivo (⚠️) para o usuário colar a chave manualmente — nunca solicitada nem recebida via chat.
- `apps/web/lib/env.ts` — módulo `env` centralizado; cada variável obrigatória é validada na leitura (`required()`), lançando erro descritivo em vez de deixar `undefined` se propagar silenciosamente. `supabaseSecretKey` é um getter (leitura sob demanda), não uma propriedade eager, para não quebrar em contextos que só precisam das variáveis públicas enquanto a secret key ainda não existe.

### Arquivos alterados

- `packages/database/src/{browser,server,admin}-client.ts` — nomes de variável migrados de `NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` (nomenclatura antiga do Supabase) para `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`/`SUPABASE_SECRET_KEY` (nomenclatura atual), para bater com as credenciais reais do projeto — sem isso, `packages/database` e `apps/web/.env.local` estariam lendo nomes de variável diferentes e a conexão do Sprint 1.8 falharia silenciosamente.

### Decisões tomadas

Ver `DECISIONS.md`: `SUPABASE_SECRET_KEY` nunca é solicitada nem recebida via texto/chat — o `.env.local` foi criado com o campo vazio e um aviso visual, para o usuário colar diretamente no arquivo local.

### Validações executadas

`tsc --noEmit` em `apps/web` — sem erros. `pnpm build` (monorepo completo, 12 workspaces) — verde, incluindo `@agsos/database` (que agora usa os novos nomes de variável) e `web`. Parse manual do `.env.local` confirmado (todos os 5 valores presentes, `SUPABASE_SECRET_KEY` vazio como esperado). Nenhum código em `apps/web` importa `lib/env.ts` ainda — a conexão real de fato é o Sprint 1.8; esta etapa só garante que a leitura de ambiente funciona antes de qualquer código depender dela.

### Pendências

- ~~Usuário precisa colar a `SUPABASE_SECRET_KEY` real em `apps/web/.env.local`~~ — feito pelo usuário diretamente no arquivo local (já cadastrada também na Vercel).
- Sprint 1.8 — conectar `AppShell`/`auth-store.ts` ao Supabase real usando `packages/database` + este `env.ts`.

### Próximo Sprint

Sprint 1.8 — conectar Auth ao Supabase real.

---

## Padronização: `SUPABASE_SECRET_KEY` (pré-Sprint 1.8)

**Status:** Concluído (commit local, sem push)
**Período:** 2026-07-16

### Objetivo

Formalizar `SUPABASE_SECRET_KEY` como nomenclatura oficial e definitiva do projeto (substituindo a legada `SUPABASE_SERVICE_ROLE_KEY`), auditar o repositório inteiro por referências remanescentes, e registrar a decisão arquitetural — sem alterar nenhuma funcionalidade nem implementar Auth ainda.

### Auditoria realizada

`grep -rn "SUPABASE_SERVICE_ROLE_KEY\|SUPABASE_ANON_KEY"` em todo o repositório (excluindo `node_modules`): zero ocorrências em código-fonte (`packages/`, `apps/`, `supabase/`). As únicas ocorrências restantes são entradas datadas em `CHANGELOG.md`/`IMPLEMENTATION_LOG.md`/`DECISIONS.md` que descrevem, no passado, a migração já realizada — mantidas como registro histórico, não como configuração viva.

### Arquivos alterados

- `DECISIONS.md` — nova entrada formalizando a padronização como decisão definitiva.
- `CHANGELOG.md`, `IMPLEMENTATION_LOG.md`, `PROJECT_STATUS.md` — registrada a padronização e a confirmação de que o usuário já colou a Secret Key real em `.env.local` e cadastrou na Vercel.

### Validações executadas

`pnpm build` / `pnpm lint` / `pnpm typecheck` — verdes no monorepo inteiro.

### Pendências

Nenhuma nova. Sprint 1.8 (Auth real) segue como próximo passo.

### Próximo Sprint

Sprint 1.8 — conectar Auth ao Supabase real.

---

## Sprint 1.8a — Núcleo de Auth real (login/logout/sessão/middleware)

**Status:** Concluído (local)
**Período:** 2026-07-16

### Objetivo

Pedido original do usuário pedia um sprint completo de Auth (login, logout, sessão, middleware, forgot/reset password, páginas 401/403, seção no Playground, Playwright completo em 6 páginas × 3 breakpoints × 2 temas, 7 documentos). Antes de escrever código, isso foi identificado como excedendo os limites do `CLAUDE.md` (máx. ~10 arquivos novos/50 total antes de parar e propor divisão) e dividido, com aprovação do usuário, em 4 sub-sprints: **1.8a Núcleo** (este) → 1.8b Recuperação de senha → 1.8c Estados de erro/UX (401/403/Playground) → 1.8d QA completo + regressão + documentação final.

Este sub-sprint elimina o Auth mock (`localStorage`, Sprint 1.6) e o substitui por Supabase Auth real: login por email/senha, logout, restore de sessão, refresh automático de token, `onAuthStateChange`, e proteção de rotas via middleware.

### Leitura prévia (AGENT.md/DEFINITION_OF_DONE.md)

`ADR-003` (frozen) confirma os três clientes de `packages/database` como única camada de acesso a dados/auth — sem conflito com o pedido do usuário de usar exclusivamente `packages/database` + `apps/web/lib/env.ts`. `ARCHITECTURE.md` (não-frozen) descreve um `@agsos/auth` (`packages/auth`, já existe como stub vazio) e uma stack de Providers (`AuthProvider`, etc.) como visão de longo prazo — decisão explícita de **não** criar/popular esse pacote agora, seguindo a mesma abordagem incremental do Sprint 1.6 (hook simples em `apps/web`, sem pacote dedicado ainda) e o escopo que o próprio usuário definiu para este pedido.

### Arquivos criados

- `apps/web/middleware.ts` — proteção de rotas (allowlist `/`, `/login`, `/forgot-password`, `/reset-password`; resto protegido), usa `supabase.auth.getUser()` (valida token no servidor) via `createServerClient` de `packages/database`.

### Arquivos alterados

- `apps/web/hooks/use-auth.ts` — reescrito por completo: Supabase Auth real, singleton de client no módulo (evita múltiplas instâncias de `GoTrueClient`), `mapAuthError()` para mensagens amigáveis.
- `apps/web/app/login/page.tsx` — login real, loading/erro, suporte a `?redirect=`.
- `apps/web/components/layout/app-shell.tsx` — gate de sessão real (mantido como único ponto de proteção client-side).
- `apps/web/components/layout/user-menu.tsx` — nome/email/avatar reais da sessão.
- `apps/web/package.json` — dependência `@agsos/database` (workspace) adicionada.
- `packages/database/src/index.ts` — re-exporta `Session`/`User`/`AuthError`.

### Arquivos removidos

- `apps/web/lib/auth-store.ts` — mock eliminado.

### Decisões tomadas

- Não criar `packages/auth` neste sub-sprint (ver "Leitura prévia" acima).
- Client Supabase singleton no módulo do hook (não em `packages/database`) para não instanciar múltiplos `GoTrueClient` no browser.
- Middleware usa `getUser()`, não `getSession()` — valida o token contra o servidor do Supabase em vez de confiar no cookie sem verificação.
- `AppShell` mantém seu próprio gate client-side (rede de segurança para sessão expirando com a aba já aberta) além do middleware (boundary de segurança real) — os dois não são redundantes, cobrem momentos diferentes.

### Validações executadas

`pnpm install`/`build`/`lint`/`typecheck` — verdes no monorepo inteiro (12/12). Golden path completo testado via Playwright (script ad-hoc, sem suíte permanente ainda): guard de rota protegida sem sessão → login com usuário de teste real (`test@aigamestudioos.com`, criado manualmente pelo usuário no Supabase `dev`) → dashboard → projects/games/knowledge/publishing → reload (sessão persiste) → nova aba (sessão compartilhada) → logout → redirecionado a `/login` → tentativa de acessar rota protegida de novo (bloqueada) → novo login (sessão restaurada) → visitar `/login` autenticado (redireciona a `/dashboard`) — 14/14 checks passaram. Testado também credenciais inválidas (mensagem amigosa, sem crash). Screenshots em 3 breakpoints × 2 temas — 0 overflow em todas as combinações.

### Bugs encontrados e corrigidos (no próprio processo de teste, não no app)

- Script de teste inicial invertia luz/escuro: o tema padrão da aplicação é **claro** (script de anti-FOUC em `layout.tsx` seta `data-theme="light"` antes da hidratação), não escuro como o estado inicial do `ThemeProvider` sugeria à primeira vista — corrigido no script, não é um bug do app.

### Observações / mudança de comportamento intencional

`/playground` passou a exigir login — antes (Sprint 1.6) não usava `AppShell` e por isso não era protegido nem pelo mock. O middleware protege por allowlist (só `/`, `/login`, `/forgot-password`, `/reset-password` são públicas), então `/playground` — e qualquer rota nova futura — fica protegida por padrão, exatamente como o usuário especificou ("todo o restante protegido").

### Pendências

- Sprint 1.8b — `/forgot-password`, `/reset-password` (o link "Esqueceu a senha?" em `/login` já existe, mas a página de destino ainda não).
- Sprint 1.8c — páginas 401/403, estados de loading mais elaborados (skeletons), seção de Auth no Playground.
- Sprint 1.8d — Playwright como suíte de verdade (não script ad-hoc), regressão completa, documentação final consolidada, validação em produção (Vercel).
- `packages/auth` (`@agsos/auth`) segue vazio — decisão explícita de não populá-lo ainda.

### Próximo Sprint

Sprint 1.8b — Recuperação de senha (forgot/reset password).

---

## Sprint 1.8a — correção de deploy (pós-commit)

**Status:** Concluído (produção)
**Período:** 2026-07-16

### Objetivo

O commit `a4e96a5` (Sprint 1.8a) quebrou o deploy da Vercel: `Module not found: Can't resolve '@agsos/database'` durante `pnpm --filter web build`. Investigação completa antes de qualquer alteração, causa raiz identificada e corrigida.

### Investigação

Confirmado, nesta ordem: `packages/database/package.json` tem `"name": "@agsos/database"` correto; `apps/web/package.json` tem `"@agsos/database": "workspace:*"` correto; `pnpm-workspace.yaml` inclui `packages/*`; `turbo.json` tem `"build": { "dependsOn": ["^build"] }` correto; `hooks/use-auth.ts` importa `createBrowserClient`/`AuthError`/`Session` de `@agsos/database` — todos exportados de fato por `packages/database/src/index.ts`. Nenhum desses pontos estava errado.

Causa raiz real: `DECISIONS.md` (Incremento 0.6) documenta que o **Root Directory do projeto na Vercel é `apps/web`**, com Build Command padrão `next build` — não `turbo run build` da raiz do monorepo. Até este sprint, `apps/web` nunca importava nenhum pacote do workspace (nem `@agsos/ui` — `components/ui/` são cópias locais), então o `dist/` compilado de `packages/database` nunca precisou existir para o build da Vercel funcionar. Este foi o primeiro commit em que `apps/web` passou a depender de um pacote do workspace — e o build isolado da Vercel (`next build` dentro de `apps/web`, sem rodar o pipeline do turbo) não compila `packages/database` antes, então `dist/index.js` (apontado por `"main"` no `package.json`) não existia no ambiente de build da Vercel.

### Correção (causa raiz, sem solução paliativa)

`apps/web/package.json` ganhou um script `"prebuild": "pnpm --filter @agsos/database build"` — `pnpm run build` executa `prebuild` automaticamente antes de `build` (comportamento padrão de lifecycle scripts do pnpm/npm), garantindo que `packages/database` seja compilado mesmo quando a Vercel só invoca o `build` de `apps/web` isoladamente. Nenhum código foi copiado para `apps/web` — a arquitetura de pacotes/dependências permanece exatamente como estava (`ADR-003`).

Verificado localmente simulando o cenário da Vercel: `rm -rf packages/database/dist` seguido de `pnpm --filter web build` a partir do zero — sucesso, confirmando que o `prebuild` resolve a causa raiz e não é uma suposição.

Corrigido também, no mesmo commit: `apps/web/middleware.ts` passou a importar de `@agsos/database/server-client` (novo subpath export em `packages/database/package.json`) em vez do barrel `@agsos/database`, evitando que `admin-client.ts` (que usa `@supabase/supabase-js` puro, não `@supabase/ssr`) seja arrastado para o bundle do Edge Runtime do Middleware — endurecimento preventivo, não a causa da falha original.

### Validações executadas

`pnpm install` / `pnpm build` / `pnpm lint` / `pnpm typecheck` — verdes no monorepo inteiro (12/12) antes do commit. Commit `9d6f681` — deploy da Vercel confirmado com sucesso (`gh api .../commits/9d6f681/status` → `state: success`).

### Validação em produção

Middleware confirmado ativo: `curl -I /dashboard` sem sessão → `307` para `/login?redirect=%2Fdashboard`; mesmo teste em `/playground` → `307`. Golden path completo (script Playwright ad-hoc) rodado contra `https://ai-game-studio-os-web.vercel.app`: 14/14 checks passaram (guard de rota, login com usuário real, navegação entre módulos, sessão persistente em reload/nova aba, logout, bloqueio pós-logout, novo login, redirecionamento de `/login` autenticado, erro de credencial inválida). 0 overflow em 6 combinações breakpoint × tema. Screenshot de produção do Dashboard autenticado confirmado visualmente, sem regressão.

Os únicos erros de console observados foram 404s de `/favicon.ico` (pendência antiga, não relacionada a este sprint — projeto nunca teve favicon) e o 400 esperado do teste de credencial inválida (resposta HTTP normal do Supabase para login rejeitado, não um bug).

### Pendências

Nenhuma nova. Sprint 1.8a está de fato concluído, incluindo produção.

### Próximo Sprint

Sprint 1.8b — Recuperação de senha (forgot/reset password).

---

## Teste de aceitação — Sprint 1.8a (antes de avançar para 1.8b)

**Status:** Concluído (produção)
**Período:** 2026-07-16

### Objetivo

Recomendação do usuário: antes de construir mais funcionalidade sobre a Auth (forgot/reset password), validar de ponta a ponta o que já existe, com um cenário mais completo do que o golden path original — usuário novo (não o de teste fixo), confirmação de email real, revogação de sessão e troca de senha via painel/Admin API.

### Escopo e autorização

Passos como criar usuário, revogar sessão e trocar senha exigem a Admin API (secret key) contra o projeto Supabase real — o classificador de permissões bloqueou a primeira tentativa por serem escritas privilegiadas em dados de produção sem autorização explícita anterior. Usuário autorizou explicitamente antes da execução.

### Script

Script ad-hoc (`acceptance-test.mjs`, fora do repositório, no scratchpad) usa `@supabase/supabase-js` Admin API diretamente (não `packages/database` — é ferramental de teste, não código da aplicação) + Playwright para os fluxos de browser. Roda contra a URL de produção.

### Passos executados e resultado (13/13 ✅, contra produção)

1. Criar usuário novo (`admin.generateLink({ type: "signup", ... })`) — cria o usuário e retorna o link de confirmação real.
2. Visitar o link de confirmação com Playwright (equivalente a clicar no email) — confirmado `email_confirmed_at` setado via Admin API depois.
3. Login com o usuário novo (não o `test@aigamestudioos.com` fixo) — sucesso.
4. Logout — redireciona a `/login`.
5. Refresh do navegador (reload) — sessão mantida.
6-7. Fechar e reabrir o navegador — sessão salva via `storageState` (cookies reais) e restaurada em um novo contexto, exatamente como fechar/abrir um navegador de verdade — sessão continua válida.
8. Expiração/revogação de sessão — extraído o access token real da sessão a partir do cookie `sb-<ref>-auth-token` e revogado via `admin.signOut(token, "global")`; na navegação seguinte, o middleware bloqueou o acesso e redirecionou para `/login?redirect=%2Fdashboard` — confirma que uma sessão revogada server-side é rejeitada na primeira validação (`getUser()`), não apenas no client.
9. Troca de senha via Admin API (equivalente ao painel do Supabase) — sucesso.
10. Login com a senha ANTIGA — corretamente rejeitado.
11. Login com a senha NOVA — sucesso.
12. Cleanup — usuário de teste removido ao final, sem deixar dado descartável no projeto `dev`.

Zero erros de console (fora dos 404 de favicon já conhecidos).

### Correções feitas no próprio script (não no app)

Primeira tentativa do passo 8 usou `admin.signOut(userId, "global")` — API incorreta (`signOut` espera o JWT da sessão, não o ID do usuário), gerando erro "token contains an invalid number of segments". Corrigido extraindo o `access_token` real do cookie de sessão salvo via `storageState` antes de chamar a API corretamente. Confirma que o bug era do script de teste, não da aplicação.

### Conclusão

Auth real (Sprint 1.8a) validada de ponta a ponta em produção com um cenário mais adversarial que o golden path original (usuário novo, confirmação real, revogação de sessão, troca de senha). Liberado para avançar ao Sprint 1.8b.

### Próximo Sprint

Sprint 1.8b — Recuperação de senha (forgot/reset password).

---

## Sprint 1.8b — Password Recovery

**Status:** Concluído (local, aguardando push)
**Período:** 2026-07-17

### Objetivo

Escopo ampliado pelo usuário além de "Forgot Password" simples: ciclo completo de recuperação de conta — telas `/forgot-password` e `/reset-password`, validação de força de senha, mensagens amigáveis, estados de loading, toasts, redirecionamento, testes Playwright, revisão visual e validação em produção.

### Arquivos criados

- `apps/web/app/forgot-password/page.tsx` — formulário de email; sempre mostra a mesma mensagem de sucesso (anti-enumeração de usuários — não revela se o email existe).
- `apps/web/app/reset-password/page.tsx` — trata os dois formatos possíveis de link de recuperação do Supabase (ver "Descoberta" abaixo); formulário de nova senha com medidor de força (`Progress` do design system), validação de confirmação, estados de loading/erro, toast de sucesso.
- `apps/web/lib/password-strength.ts` — `evaluatePasswordStrength()`, função pura (score 0-4, mínimo: 8 caracteres + letra + número).

### Arquivos alterados

- `apps/web/hooks/use-auth.ts` — `requestPasswordReset()`, `exchangeRecoveryCode()`, `establishSessionFromHash()`, `updatePassword()`; `mapAuthError()` ganhou casos para link expirado/senha igual à anterior.

### Descoberta durante o teste (não um bug do app — achado de infraestrutura)

Ao testar com um link de recuperação real gerado via Admin API, o redirect caiu no domínio raiz (`aigamestudioos.com/`) em vez de `/reset-password`, com os tokens no fragmento da URL. Investigação: o `redirect_to` estava corretamente presente na requisição (confirmado inspecionando a própria URL de verificação do Supabase), mas o servidor do Supabase substitui silenciosamente por sua Site URL padrão quando o `redirect_to` solicitado não está na allowlist do projeto (Authentication → URL Configuration → Redirect URLs) — sem essa configuração, **o fluxo de recuperação de senha real teria ficado quebrado em produção, silenciosamente**. Usuário adicionou as 3 URLs necessárias (produção, domínio customizado, localhost) no dashboard. Depois disso, confirmado que o link de recovery gerado via Admin API vem no formato antigo (`#access_token=...&type=recovery`, implicit grant) em vez de `?code=` (PKCE) — o client de `@supabase/ssr` não detecta esse formato automaticamente (ao contrário do supabase-js "puro"). `reset-password/page.tsx` foi implementado para tratar **os dois formatos**: `?code=` via `exchangeCodeForSession()` (esperado do fluxo real via `resetPasswordForEmail` disparado por um client PKCE) e `#access_token=` via `setSession()` manual (formato que o Admin API retorna, e que pode ou não coincidir com o que o email real entrega — sem acesso a uma caixa de entrada real, não dá para confirmar 100% qual formato o usuário final vai receber, então os dois são suportados por robustez).

### Validações executadas

`pnpm build`/`lint`/`typecheck` — verdes no monorepo inteiro (12/12). Script Playwright ad-hoc (`reset-password-test.mjs`, usa Admin API para gerar usuário/links de teste, autorizado explicitamente pelo usuário) rodado contra `localhost` — **13/13 passos**: mensagem de sucesso em `/forgot-password`, mesma mensagem para email inexistente (anti-enumeração), link de recovery chega em `/reset-password`, formulário aparece, indicador de força mostra "Muito fraca" para senha fraca, validação de senhas não coincidentes, redefinição com sucesso redireciona a `/login`, login com a senha nova funciona, código inválido mostra estado de erro elegante, sem overflow no mobile. Usuário de teste removido ao final.

### Validação em produção

Commit `c343524` deployado com sucesso. Reexecutado o mesmo script Playwright contra `https://ai-game-studio-os-web.vercel.app`: **12/13 passos diretos + 1 comportamento correto sob rate limit** — o passo "mensagem de sucesso em /forgot-password" recebeu um `429` da API do Supabase (esperado, depois de dezenas de chamadas de teste consecutivas durante a sessão) e a UI reagiu exatamente como projetado: `mapAuthError` traduziu para "Muitas tentativas. Aguarde um momento e tente novamente.", sem erro bruto, sem crash, botão reabilitado — confirmado por screenshot. Confirmado também por screenshot o toast "Senha redefinida / Faça login com sua nova senha" disparando em produção com o redirect para `/login`. Nenhum bug de app encontrado nesta rodada.

### Pendências

- Revisão visual completa nos demais breakpoints/temas (feita parcialmente — mobile confirmado, falta tablet/dark explícito nas duas telas novas).
- Template de email personalizado no Supabase (Authentication → Email Templates) — dashboard-only, fora do meu alcance; usuário pode pedir o HTML/copy quando quiser configurar.

### Próximo Sprint

Sprint 1.8c — Perfil do usuário.

---

## Sprint 1.8c — User Workspace

**Status:** Concluído (local, aguardando push)
**Período:** 2026-07-17

### Objetivo

Usuário ampliou o escopo original ("Perfil do usuário") para um módulo mais completo — "User Workspace": perfil (avatar, nome, timezone, idioma), preferências (tema persistido), segurança (trocar senha, encerrar sessões), zona de risco (exclusão de conta, placeholder), tudo em `/settings/account`. Objetivo explícito do usuário: evitar ter que criar um módulo de configurações separado depois.

### Conflito arquitetural identificado antes de codar (Fase 1/2)

`public.users.studio_id` é `NOT NULL` (referencia `studios`), e Studios não existe ainda (Sprint 1.8d/1.9). `public.users` está vazia — nenhum usuário real tem linha lá, e o trigger `handle_new_auth_user()` é no-op de propósito (decisão do Sprint 1.7). Logo, `public.users`/`user_dashboard_preferences` não podiam ser usados para perfil/preferências sem antecipar uma fatia de Studios. Perguntado ao usuário: usar `auth.users.user_metadata` (não depende de Studios) ou antecipar um Studio mínimo agora. Usuário escolheu `user_metadata`. Ver `DECISIONS.md`.

### Arquivos criados

- `apps/web/app/settings/account/page.tsx` — página única com as 4 seções, dentro de `AppShell` (protegida).
- `apps/web/components/settings/profile-section.tsx` — nome, avatar (URL, não upload — Storage ainda não integrado), timezone (badges, lista curada) e idioma (badges, pt-BR/en-US — só armazena a preferência, `packages/i18n` ainda não existe).
- `apps/web/components/settings/preferences-section.tsx` — toggle de tema, usa `useTheme()` já existente.
- `apps/web/components/settings/security-section.tsx` — trocar senha (reaproveita `evaluatePasswordStrength`), "Sair de todos os dispositivos".
- `apps/web/components/settings/danger-zone-section.tsx` — exclusão de conta como placeholder real (modal de confirmação funcional, mas a ação final mostra toast "ainda não disponível" em vez de excluir — exclusão real exige Admin API/server-side e uma decisão de produto sobre o que fazer com o Studio associado, fora do escopo deste sprint).

### Arquivos alterados

- `apps/web/hooks/use-auth.ts` — `updateProfile(fields)` (grava em `user_metadata` via `updateUser({data})`), `signOutEverywhere()` (`signOut({scope:"global"})`).
- `apps/web/providers/theme-provider.tsx` — lê `session.user.user_metadata.theme` uma vez por sessão e aplica; `setTheme()` agora persiste via `updateProfile()` quando há sessão (silenciosamente tolera falha de persistência — o tema local já foi aplicado).
- `apps/web/components/layout/user-menu.tsx` — "Perfil" e "Configurações" (dois itens, nenhum funcional) viraram um único "Configurações da conta", navegando para `/settings/account`.

### Decisão técnica: "Sessões ativas" vira um botão, não uma lista

O SDK do Supabase não expõe ao usuário final uma lista real de sessões (dispositivo/IP/data) sem a Admin API (server-only). Implementado como "Sair de todos os dispositivos" (`signOut({scope:"global"})`) em vez de simular uma lista com dados que não existem de verdade.

### Validações executadas

`pnpm build`/`lint`/`typecheck` — verdes no monorepo inteiro (12/12). Script Playwright ad-hoc (Admin API, mesma autorização já concedida nesta sprint) — **13/13 passos** após duas rodadas de depuração de falsos-positivos do próprio script (não bugs do app — ver abaixo).

### Falsos-positivos encontrados e descartados durante o teste (não bugs do app)

1. `.isVisible({ timeout })` do Playwright **não espera** — a opção `timeout` é ignorada nesse método (diferente de `.waitFor()`), causando checagens prematuras que retornavam falso negativo. Corrigido usando `.waitFor()`.
2. Uma rodada de teste pegou "strict mode violation: resolved to 2 elements" para o texto de um toast — causa real: Fast Refresh do Next.js recompilando em paralelo por eu estar editando arquivos durante o teste. Não reproduziu com o servidor "quente" (parado de recompilar).
3. Segunda ocorrência do mesmo erro de "2 elements", causa DIFERENTE e legítima de se investigar: o Radix Toast renderiza o toast visível E uma região `aria-live="assertive"` para leitores de tela ("Notification Perfil atualizado"), e `getByText` (substring, não exato) casava com as duas — confirma que a acessibilidade do toast está correta; o teste só precisava de `.first()`.

### Pendências

- Upload de avatar real (Supabase Storage) — fora de escopo, aguardando integração de Storage.
- `packages/i18n` — preferência de idioma armazenada, mas ainda não aplicada (interface continua só em português).
- Exclusão de conta real — placeholder funcional, implementação real fica para quando houver decisão de produto sobre Studios associados.
- Migrar `full_name`/`avatar_url`/`timezone`/`locale`/`theme` de `user_metadata` para `public.users` quando Studios existir (Sprint 1.8d/1.9) — migração pequena e isolada, não retrabalho de UI.

### Próximo Sprint

Sprint 1.9 — Studios (multi-tenant).
