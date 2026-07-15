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
