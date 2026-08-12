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

### Validação em produção

Commit `25513a2` deployado com sucesso. Reexecutado o mesmo script Playwright contra `https://ai-game-studio-os-web.vercel.app`: **13/13 passos**, incluindo confirmação de que o tema persiste entre sessões diferentes via `user_metadata` (não `localStorage`) e que a troca de senha nas Configurações realmente funciona (login com a nova senha confirmado). Zero erros de console. Screenshot de produção conferido visualmente, sem regressão.

### Próximo Sprint

Sprint 1.8d — Organização (Studios).

---

## Sprint 1.8d-1 — Studio Bootstrap

**Status:** Concluído (validado em produção/projeto real)
**Período:** 2026-07-17 a 2026-07-27

### Objetivo

Pedido original ("Sprint 1.8d — Organização: múltiplos estúdios, convites, papéis, RLS") dividido em 4 sub-sprints (1.8d-1 a 1.8d-4) antes de codar, por exceder os limites do `CLAUDE.md` — usuário aprovou. Este sub-sprint entrega só o **bootstrap**: criar Studio + profile (`public.users`) + Role Owner automaticamente no primeiro login, resolvendo o bloqueio identificado no Sprint 1.8c (perfil vivia em `user_metadata` porque `public.users` exigia um Studio que não existia).

### Bloqueio arquitetural identificado antes de codar

As políticas RLS de `studios`/`users` (Sprint 1.7) são auto-referenciais (`studio_id = (select studio_id from users where id = auth.uid())`) — impossível inserir a própria primeira linha sujeito a RLS, já que a subquery nunca resolve antes de a linha existir. Resolvido com uma função `SECURITY DEFINER` (`bootstrap_studio_for_current_user`), callable via RPC pelo client normal (`authenticated`), sem precisar da service role key na aplicação.

### Dois bugs reais pré-existentes encontrados ao testar contra Postgres de verdade (não descobertos no Sprint 1.7)

1. **Recursão infinita em RLS**: toda política "*_isolation" (27 no total, em 9 tabelas de negócio + studios/users/roles/etc.) usava a mesma subquery auto-referencial em `users` — isso causa "infinite recursion detected in policy for relation users" em QUALQUER query autenticada real. O Sprint 1.7 só validou `pg_class.relrowsecurity = true` (RLS habilitado), nunca testou uma política de verdade sob um usuário autenticado — por isso passou despercebido. Corrigido com uma função auxiliar `current_user_studio_id()` (`SECURITY DEFINER`), usada por todas as 27 políticas em vez da subquery direta.
2. **GRANTs de tabela ausentes**: nenhuma migration do Sprint 1.7 concedeu privilégios (`GRANT SELECT/INSERT/UPDATE/DELETE`) ao role `authenticated` — RLS é avaliado *depois* do grant de tabela no Postgres, então toda query autenticada falhava com "permission denied for table X", independente da política estar certa. Corrigido com `grant ... on all tables in schema public to authenticated` + `alter default privileges` (para tabelas futuras).

### Arquivos criados

- `supabase/migrations/20260717000001_bootstrap_studio.sql` — função `bootstrap_studio_for_current_user(p_studio_name)`.
- `supabase/migrations/20260717000002_fix_rls_recursion.sql` — `current_user_studio_id()` + recriação das 27 políticas.
- `supabase/migrations/20260717000003_grant_authenticated_privileges.sql` — grants para `authenticated`.
- `apps/web/hooks/use-ensure-studio.ts` — chama o bootstrap uma única vez por sessão.

### Arquivos alterados

- `packages/database/src/repositories/studios-repository.ts` — `bootstrapForCurrentUser()`.
- `packages/database/src/generated/database.types.ts` — tipos das duas novas funções RPC.
- `apps/web/hooks/use-auth.ts` — `ensureStudio()` (reaproveita o client singleton).
- `apps/web/components/layout/app-shell.tsx` — dispara `useEnsureStudio()`; não bloqueia a renderização se falhar (nenhum módulo de produto depende de Studio ainda — todos seguem mock) e mostra toast de aviso em caso de erro.

### Descoberta de infraestrutura: projeto remoto nunca tinha o schema do Sprint 1.7

Ao tentar aplicar as 3 migrations novas via SQL Editor, erro `relation "public.users" does not exist` revelou que **nenhuma das 9 migrations do Sprint 1.7 tinha sido aplicada ao projeto Supabase remoto** — desde a criação do projeto (Sprint 1.8a), ele só foi usado para Auth (recurso nativo do Supabase), nunca para o schema de negócio. Resolvido com o usuário rodando `supabase login` + `supabase link` + `supabase db push` no próprio terminal (12 migrations aplicadas de uma vez, rastreadas pelo CLI). Também descoberto no meio do processo que o projeto estava **pausado** (comum no free tier após inatividade) — usuário reativou via dashboard.

### Validações executadas

Migrations testadas localmente via Docker (`supabase db reset`) antes de pedir para aplicar no remoto — os dois bugs de RLS foram encontrados exatamente nesse processo, simulando `auth.uid()` via `set local request.jwt.claim.sub` em sessões `psql` diretas. Depois de aplicadas no projeto remoto real: script de validação com dois usuários reais (Admin API) confirmou — bootstrap funciona e é idempotente, Studios diferentes por usuário, RLS isola `studios`/`users` corretamente entre os dois, zero erros de "permission denied", Role Owner e `user_roles` criados corretamente (10/10 checks). Teste adicional via Playwright confirmou o fluxo end-to-end pela aplicação real (não só via Admin API): login → `AppShell` dispara o bootstrap silenciosamente → `public.users`/`studios` populados corretamente → nenhum toast de erro → nenhuma regressão em `/projects`, `/games`, `/knowledge`, `/publishing`, `/settings/account`. `pnpm build`/`lint`/`typecheck` verdes (12/12).

### Validação em produção

Commit `66cba3f` deployado com sucesso. Reexecutado o script Playwright de bootstrap contra `https://ai-game-studio-os-web.vercel.app`: **10/10 checks** — login funciona, `public.users`/`studios` populados automaticamente pelo `AppShell` (sem UI dedicada), Studio criado com `owner_user_id` correto, nenhum toast de erro, zero regressão em `/projects`, `/games`, `/knowledge`, `/publishing`, `/settings/account`. Zero erros de console.

### Pendências

- 1.8d-2 — Studio settings (nome/logo, ver membros).
- 1.8d-3 — Convites (enviar/aceitar).
- 1.8d-4 — Papéis/permissões (Admin/Member, enforcement testado com múltiplos usuários).
- Migrar `full_name`/`avatar_url`/`timezone`/`locale`/`theme` de `user_metadata` (Sprint 1.8c) para `public.users` agora que a tabela existe de verdade — pendência antiga, ainda não feita (pode virar parte do 1.8d-2).

### Próximo Sprint

Sprint 1.8d-2 — Studio settings.

---

## Sprint 1.8d-2 — Studio Settings

**Status:** Concluído (local, aguardando push)
**Período:** 2026-07-27

### Objetivo

Tela `/settings/studio`: editar nome/logo do Studio criado automaticamente no 1.8d-1, e ver a lista de membros (hoje sempre 1 — o próprio Owner, já que convites são o 1.8d-3).

### Arquivos criados

- `apps/web/app/settings/studio/page.tsx`.
- `apps/web/components/settings/studio-info-section.tsx` — nome + logo (URL, mesmo padrão do avatar em 1.8c).
- `apps/web/components/settings/studio-members-section.tsx` — lista de membros; badge "Owner" fixo (não consulta `roles`/`user_roles` ainda — só existe um papel possível até o 1.8d-4, seria over-engineering antecipar isso agora).
- `apps/web/hooks/use-current-studio.ts` — busca `public.users` (perfil) → `public.studios`, expõe `updateStudio()`.
- `packages/database/src/repositories/users-repository.ts` — `getById()`, `listByStudio()`.
- `apps/web/lib/supabase-client.ts` — singleton do browser client extraído de `use-auth.ts` (refatoração pequena, para `use-current-studio.ts` reusar a mesma instância sem duplicar `createBrowserClient()`).

### Arquivos alterados

- `packages/database/src/repositories/studios-repository.ts` — `update()`.
- `packages/database/src/index.ts` — exporta `createUsersRepository`.
- `apps/web/hooks/use-auth.ts` — importa o singleton de `lib/supabase-client.ts` em vez de declarar o seu próprio.
- `apps/web/components/layout/sidebar.tsx` — "Studio" → `/settings/studio`, "Settings" → `/settings/account` (os dois itens existiam na sidebar desde o Sprint 1.1 sem `href`, como placeholders desabilitados).

### Bug real encontrado e corrigido durante o teste (visual, não funcional)

Screenshot mobile mostrou o badge "Owner" cortado na lista de membros — a `div` com nome/email não tinha `min-w-0` (problema clássico de flexbox: conteúdo longo recusa encolher abaixo da largura intrínseca, empurrando o badge para fora visualmente, mesmo sem overflow de página). O teste automatizado de overflow (`scrollWidth > clientWidth`) não pegou isso porque não é overflow de página, é conteúdo visualmente cortado dentro do próprio card. Corrigido com `min-w-0` + `truncate` no texto e `shrink-0` no badge/avatar.

### Validações executadas

`pnpm build`/`lint`/`typecheck` verdes (12/12). Script Playwright ad-hoc (Admin API): **10/10 passos** — navegação via Sidebar, nome default do bootstrap preenchido, membros mostra o próprio usuário com badge Owner, salvar mostra toast e persiste de verdade em `public.studios` (confirmado via Admin API), validação de nome vazio, Sidebar "Settings" navega corretamente, sem overflow no mobile. Zero erros de console.

### Pendências

- 1.8d-3 — Convites (enviar/aceitar).
- 1.8d-4 — Papéis/permissões (Admin/Member, enforcement testado).
- Badge de papel em Membros precisa ser dinâmico (consultar `roles`/`user_roles`) quando o 1.8d-4 introduzir um segundo papel possível.
- Migrar perfil/preferências de `user_metadata` (1.8c) para `public.users` segue pendente.

### Validação em produção

Commit `4eb9cbe` deployado com sucesso. Reexecutado o script Playwright contra `https://ai-game-studio-os-web.vercel.app`: **10/10 checks**, zero erros de console.

### Próximo Sprint

Sprint 1.8d-3 — Convites.

---

## Sprint 1.8d-3 — Convites

**Status:** Concluído (validado em produção real)
**Período:** 2026-07-28

### Objetivo

Convidar pessoas por email para o Studio, com aceite via login (não uma tela de "aceitar convite" separada — entrar no Studio certo acontece automaticamente no bootstrap já existente do Sprint 1.8d-1).

### Design

Nenhuma entidade de Invite existia em `DATA_MODEL.md`/`AGSOS-SPEC-002`/frozen docs — desenhada do zero seguindo as convenções já estabelecidas. Duas decisões arquiteturais centrais (detalhadas em `DECISIONS.md`): (1) usar `auth.admin.inviteUserByEmail` (nativo do Supabase, admin-only) via uma Server Action em vez de reinventar envio de email; (2) o `bootstrap_studio_for_current_user` (1.8d-1) foi estendido para checar convite pendente por email *antes* de criar um Studio novo — se existir, o usuário entra no Studio convidante com o papel do convite (`Member`, criado automaticamente se ainda não existir) em vez de ganhar um Studio próprio.

### Arquivos criados

- `supabase/migrations/20260728000001_invites.sql` — tabela `invites` (RLS via `current_user_studio_id()`, índice único parcial `where status = 'pending'`) + `bootstrap_studio_for_current_user` atualizado.
- `apps/web/app/settings/studio/actions.ts` — Server Action `inviteMember()`: lê a sessão real (server-client, RLS) para o `studio_id`, cria o registro do convite, chama `admin.auth.admin.inviteUserByEmail`.
- `packages/database/src/repositories/invites-repository.ts` — `listPendingByStudio`, `create`, `revoke`.

### Arquivos alterados

- `apps/web/hooks/use-current-studio.ts` — `pendingInvites` + `revokeInvite`.
- `apps/web/components/settings/studio-members-section.tsx` — formulário de convite, lista de pendentes com cancelar, badge Owner/Member (compara com `studio.owner_user_id`, sem consultar roles/user_roles — não vale a pena antes de existir um terceiro papel real, 1.8d-4).
- `packages/database/src/generated/database.types.ts`, `src/index.ts` — tipo/tabela `invites`.

### Bugs reais encontrados e corrigidos durante o teste

1. **Detecção de erro por texto de mensagem, não por código estável**: a checagem original de "convite duplicado" usava `err.message.includes("idx_invites_pending_unique")` — `PostgrestError` de fato estende `Error`, mas o formato exato de `.message` não é garantido pelo PostgREST. Corrigido para checar `.code === "23505"` (SQLSTATE de `unique_violation`), conforme a própria documentação do `postgrest-js` recomenda.
2. **Revogar o convite em qualquer falha de `inviteUserByEmail`, incluindo rate-limit**: a lógica original tratava qualquer erro como motivo para revogar o convite recém-criado. Isso quebra o cenário de reenvio (convite cancelado e recriado para o mesmo email, que já tem um `auth.users` não confirmado — `inviteUserByEmail` retorna `email_exists` de novo). Também descoberto no processo: o projeto Supabase (usado intensamente durante toda esta sessão de testes) está sob **rate-limit real de envio de email** (`over_email_send_rate_limit`, 429) — a versão original do código mascarava esse erro como sucesso silencioso. Corrigido: branch por `error.code` — `over_email_send_rate_limit` vira mensagem amigável e revoga (nenhuma conta foi criada, o convite ficaria órfão); `email_exists` só revoga se existir um profile em `public.users` para o email (conflito real de conta em outro Studio) — senão, mantém o convite pendente sem erro (reenvio para alguém já convidado antes).

### Validações executadas

Migration testada localmente via Docker (`supabase db reset`) antes de aplicar no remoto — confirmado: convidado entra no Studio do convite (não cria um novo), idempotência preservada, `roles`/`user_roles` corretos, e o fluxo normal (sem convite) não regrediu. Aplicada no projeto remoto via `supabase db push` (usuário rodou `supabase login` de novo — token expirado desde a última vez). Script de validação via Admin API contra o projeto remoto real: **10/10 checks** — bootstrap, criação de convite, índice único bloqueando duplicata, `generateLink` simulando o clique no email, convidado entra no Studio certo (não um novo), papel Member correto, convite marcado `accepted`, RLS mostra os dois usuários como membros mútuos, idempotência. Teste adicional via UI real (Playwright, Server Action de verdade): **9/9 checks substantivos** — convite aparece na lista, `invites`/`auth.users` criados de verdade pela Server Action, convite duplicado tratado com mensagem amigável, cancelar remove da lista e marca `revoked` no banco, convidado loga e entra no MESMO Studio do owner com badge "Member". Zero erros de console.

### Validação em produção

Commit `7869883` deployado com sucesso. Supabase sinalizou alta taxa de bounce no projeto por volume de emails fictícios enviados durante os testes desta sessão (ver `DECISIONS.md`) — metodologia ajustada: validação de produção feita com `generateLink` (não dispara email real), confirmando login, `/settings/studio` (com o formulário de convite) carregando corretamente e sem regressão. Não repetido o teste de envio real (`inviteUserByEmail`) em produção, já validado 9/9 momentos antes contra o mesmo banco remoto. Zero erros de console.

### Pendências

- Página de "aceitar convite" dedicada (hoje é implícito no login/bootstrap) — considerar se vale a pena para mensagens mais claras ("Você foi convidado para o Studio X").
- Configurar um provedor SMTP customizado (recomendação do próprio Supabase) para reduzir risco de bounce/rate-limit em produção de verdade — hoje usa o email transacional padrão do Supabase, com limites baixos. Usuário pediu para ser lembrado disso quando fizer sentido (registrado em memória).

### Próximo Sprint

Sprint 1.8d-4 — Papéis/permissões.

---

## Sprint 1.8d-4 — Papéis e permissões reais

**Status:** Concluído (validado no projeto real)
**Período:** 2026-07-29

### Objetivo

Até aqui, "Owner"/"Member" eram só rótulos exibidos na UI — `permissions`/`role_permissions` existiam desde o Sprint 1.7, mas vazios, sem nenhum enforcement de verdade. Este sprint torna os papéis reais: catálogo de permissões, três papéis por Studio (Owner/Admin/Member) com grants corretos, seletor de papel no convite, e — o mais importante — **enforcement de verdade via RLS**, não só esconder botões na UI.

### Arquivos criados

- `supabase/migrations/20260729000001_roles_and_permissions.sql` — catálogo `permissions` (`studio.edit`, `studio.invite_members`, `studio.manage_members`), função `current_user_has_permission(key)` (`SECURITY DEFINER`, mesmo padrão de `current_user_studio_id()`), RLS de `invites`/`studios` reescrita para exigir a permissão certa (não só isolamento por Studio), e `bootstrap_studio_for_current_user` atualizado para criar os 3 papéis com os grants corretos na criação do Studio (Owner: todas; Admin: `invite_members`+`manage_members`; Member: nenhuma).

### Arquivos alterados

- `packages/database/src/repositories/users-repository.ts` — `listByStudioWithRoles()` (join `user_roles`→`roles`, papel real por membro).
- `packages/database/src/generated/database.types.ts` — tipo da função `current_user_has_permission`.
- `apps/web/app/settings/studio/actions.ts` — `inviteMember()` recebe o papel (`Admin`|`Member`, nunca `Owner`), valida contra uma lista fechada; erro `42501` (RLS negou por falta de permissão) vira mensagem amigável.
- `apps/web/hooks/use-current-studio.ts` — `updateStudio`/`revokeInvite` passam a retornar `{ error? }` em vez de lançar, com mensagem amigável para `42501`.
- `apps/web/components/settings/studio-info-section.tsx` — usa o novo formato de retorno de `updateStudio`.
- `apps/web/components/settings/studio-members-section.tsx` — seletor de papel (badges Member/Admin) no convite, badge de papel real por membro (não mais o atalho "compara com owner_user_id"), `onRevoke` tratado com toast de erro em vez de exception não capturada.

### Bug real encontrado durante a escrita da migration (antes de aplicar)

Erro de ordem de colunas em `insert into role_permissions (studio_id, role_id, permission_id) select v_owner_role_id, v_studio_id, id from permissions` — os dois primeiros valores estavam trocados. Pego durante a revisão antes mesmo de testar no Docker local — exatamente o tipo de erro que a disciplina de sempre testar migrations contra Postgres real (não só revisar visualmente) existe para capturar.

### Validações executadas

Migration testada localmente via Docker (`supabase db reset`, 14 migrations) antes de aplicar no remoto: confirmado que os 3 papéis são criados com a contagem de permissões certa (Owner 3, Admin 2, Member 0), e — o teste mais importante — que um **Member é genuinely bloqueado pela RLS** ao tentar inserir um convite ou editar o Studio (`ERROR: new row violates row-level security policy`), enquanto um Admin consegue convidar mas não editar, e o Owner consegue tudo. Aplicada no remoto via `supabase db push`. Script de validação via Admin API contra o projeto real: **12/12 checks** — criação de papéis com grants corretos, aceite de convite com o papel certo, `current_user_has_permission` por papel, e o enforcement real (Member bloqueado em ambas as ações, Admin bloqueado só na edição, Owner livre, nome do Studio realmente não mudou no banco quando deveria ser bloqueado). Teste adicional via UI real: **6/6 checks** — seletor de papel grava o `role_name` certo, badge de papel real aparece na lista de membros, e a UI mostra "Você não tem permissão para editar este Studio." quando um Admin tenta editar (confirmado visualmente por screenshot, e que o nome no banco realmente não mudou). Zero erros de console. `pnpm build`/`lint`/`typecheck` verdes.

### Nota operacional: gestão de volume de teste

Durante a depuração deste sprint, o Supabase voltou a rate-limitar envio de email (`over_email_send_rate_limit`) por causa de tentativas repetidas de depuração do PRÓPRIO script de teste (não do app). Em vez de insistir em novos envios reais, o restante da validação de UI foi feito seedando o convite diretamente via admin client (sem enviar email) — o caminho de envio real já tinha sido confirmado com sucesso no início do teste. Reforça a decisão já registrada em `DECISIONS.md`: preferir `generateLink`/inserts diretos a `inviteUserByEmail` real sempre que a lógica sob teste não depender do envio em si.

### Validação em produção

Commit `30c1baf` deployado com sucesso. Smoke test em produção sem disparar envio real de email (convite seedado via admin client): **6/6 checks** — login, `/settings/studio` com seletor de papel visível, badge de papel real, e o teste mais importante — um Member tentando editar o Studio em produção real foi bloqueado pela RLS de verdade (nome não mudou no banco). Zero erros de console.

### Pendências

- Nenhum controle de UI para trocar o papel de um membro já existente (só na hora do convite) — se necessário, é uma extensão pequena do mesmo padrão.
- Página de "aceitar convite" dedicada (mesma pendência do 1.8d-3).
- SMTP customizado (mesma pendência do 1.8d-3 — usuário pediu lembrete futuro).
- Com Studios/papéis/convites completos, o próximo grande passo é migrar os módulos de negócio (Projects/Games/Knowledge/Publishing) de mock para dados reais (Sprint 2.0+), agora que o modelo multi-tenant existe de verdade.

### Próximo Sprint

A definir com o usuário — Studios (1.8d) está completo; próximo passo natural é 2.0 (Projects real) ou reforços pontuais (SMTP, testes de RLS formalizados em `supabase/tests/`).

---

## Sprint 2.0 — Projects real

**Status:** Concluído (validado contra o banco real)
**Período:** 2026-07-29

### Objetivo

Substituir `apps/web/lib/projects-store.ts` (mock, `localStorage`) por dados reais via `packages/database`, usando o `studio_id` real do usuário (Studios/Sprint 1.8d) em vez de dados fictícios por navegador. Primeiro módulo de negócio a fazer essa transição — Games/Knowledge/Publishing seguem mock, migração planejada para sprints seguintes seguindo o mesmo padrão.

### Arquivos criados

- `packages/database/src/repositories/epics-repository.ts` — `listByProject()` (só leitura; criar/editar epics fica para uma tela de backlog dedicada, fora de escopo).
- `apps/web/hooks/use-projects.ts` — lista + cria projetos, precisa do `studio_id` (via `useCurrentStudio`).
- `apps/web/hooks/use-project.ts` — projeto único + epics, para a página de detalhes.
- `apps/web/lib/project-status.ts` — mapeia o enum `project_status` do banco (`DRAFT`/`PLANNING`/`ACTIVE`/`ON_HOLD`/`COMPLETED`/`ARCHIVED`) para rótulos em português.

### Arquivos alterados

- `apps/web/app/projects/page.tsx` / `app/projects/[id]/page.tsx` — reescritos para consumir dados reais em vez do mock; estados de loading/vazio/erro adicionados (o mock nunca precisou disso, já vinha populado de `localStorage`).
- `apps/web/components/dashboard/cards.tsx` — `ProjectStatus` relaxado de união literal fechada (3 valores) para `string`, com fallback de variant — Dashboard/Playground continuam passando os rótulos mock antigos sem quebrar, Projects real passa os 6 rótulos novos pelo mesmo componente.
- `packages/database/src/index.ts` — export de `createEpicsRepository`.

### Arquivos removidos

- `apps/web/lib/projects-store.ts` — mock eliminado.

### Decisões

- Progress e status continuam sendo os únicos campos de agregação exibidos — nenhuma UI de criar/editar epics (o mock também não tinha isso; ver `DATA_MODEL.md` sobre `progress` persistido, não recalculado).
- Dashboard ("Recent Projects") permanece com seu próprio mock (`components/dashboard/mock-data.ts`) — nunca esteve de fato conectado ao `projects-store`, fora de escopo conectar agora.
- Criação de projeto não exige nenhuma permissão especial (qualquer membro do Studio, incluindo Member) — nenhuma ação de `studio.*` cobre isso; se precisar restringir no futuro, é a mesma extensão de RLS já usada para Studio settings/convites (Sprint 1.8d-4).

### Validações executadas

`pnpm build`/`lint`/`typecheck` verdes (12/12). Teste Playwright contra o banco real (local dev + Supabase remoto real, sem mock): estado vazio real (zero projetos até criar o primeiro — diferença notável do mock, que sempre vinha com 3 projetos seed), criar projeto persiste de verdade em `public.projects` (`status: DRAFT`, `progress: 0`), toast de sucesso, card aparece sem reload, rótulo "Rascunho" exibido corretamente, projeto **continua visível depois de um reload de verdade** (prova de que não é mais `localStorage` por aba/navegador), navegação para detalhes mostra epics vazios sem crash, ID inexistente cai em not-found, e — o teste mais importante — **um segundo usuário, dono de um Studio diferente, não vê o projeto do primeiro** (RLS confirmada em produção real de dados de negócio, não só Auth/Studio). 10/10 checks confirmados (2 primeiro reportados como falha por ambiguidade do próprio script de teste — toast e card continham o mesmo texto — confirmados corretos por depuração direta).

### Validação em produção

Commit `71dc4e6` deployado com sucesso (deploy um pouco mais lento que o normal desta vez). Reexecutado o teste Playwright contra `https://ai-game-studio-os-web.vercel.app`: **8/10 checks diretos** (os mesmos 2 que falharam por ambiguidade do próprio script — toast e card com o mesmo texto — já confirmados corretos por depuração direta anteriormente nesta sessão). Nome de projeto do teste corrigido para ser único por execução (evita colisão com registros de execuções anteriores). Zero erros de console.

### Pendências

- Games/Knowledge/Publishing seguem mock — mesma migração pendente, mesmo padrão a seguir.
- Editar/arquivar projeto (repository já tem `archive()`, sem UI ainda).
- Gestão de epics/tasks (criar, marcar concluído pela UI).

### Próximo Sprint

A definir com o usuário — Games real (mesmo padrão do 2.0) é o próximo candidato natural, ou reforços pendentes (SMTP, testes de RLS).

---

## Sprint 2.1 — Games real

**Status:** Concluído (validado contra o banco real)
**Período:** 2026-07-29

### Objetivo

Mesmo padrão do Sprint 2.0 (Projects): substituir `apps/web/lib/games-store.ts` (mock) por dados reais via `packages/database`.

### Descoberta de schema que mudou o escopo da UI

`games.project_id` é `NOT NULL` — todo Game pertence a um Project no schema real (`AGSOS-SPEC-002`), diferença que o mock não tinha (Games eram standalone). Além disso, `Game.platforms` do mock não existe como coluna em `games` — é derivado de `builds.platform_id` (via `game_versions`), já documentado em `DATA_MODEL.md` §7 desde a auditoria original. Isso exigiu: (1) um seletor de Project obrigatório na tela "Create Game", com o botão desabilitado e uma mensagem orientando a criar um Project primeiro quando o Studio ainda não tem nenhum; (2) `platforms` no `GameCard`/detalhe passou a ser derivado dos `builds` do jogo (vazio para todo Game novo, já que não há UI de criação de build/version neste sprint — mesma decisão já tomada para epics no Sprint 2.0).

### Arquivos criados

- `packages/database/src/repositories/builds-repository.ts` — `listByGame()`, resolve os joins `builds → game_versions (version_number)` e `builds → platforms (name)` em consultas separadas (mais simples de validar que embutir joins aninhados do PostgREST).
- `apps/web/hooks/use-games.ts`, `apps/web/hooks/use-game.ts`.
- `apps/web/lib/game-status.ts`, `apps/web/lib/build-status.ts` — mapeiam os enums `game_status` (7 valores) e `build_status` (5 valores) para rótulos em português.

### Arquivos alterados

- `apps/web/app/games/page.tsx` / `app/games/[id]/page.tsx` — dados reais; seletor de Project obrigatório na criação.
- `apps/web/components/games/cards.tsx` — `GameCard` com status solto (`string`, mesmo padrão de `ProjectCard`) e `platforms` opcional (só `GameCard`/detalhe usam este componente, sem consumidores externos tipo Dashboard/Playground para se preocupar com compatibilidade).
- `packages/database/src/index.ts` — export de `createBuildsRepository`/`BuildWithDetails`.

### Arquivos removidos

- `apps/web/lib/games-store.ts` — mock eliminado.

### Validações executadas

`pnpm build`/`lint`/`typecheck` verdes (12/12). Teste Playwright contra o banco real (local): **12/12 checks** — botão "Create Game" corretamente desabilitado (com mensagem orientando) quando o Studio ainda não tem nenhum Project, habilita depois de criar um, seletor de Project mostra o Project real, jogo persiste com `project_id` vinculado corretamente, rótulo "Rascunho" exibido, jogo continua visível após reload real, detalhes carregam sem builds/plataformas (mensagens apropriadas, sem crash), ID inexistente cai em not-found. Zero erros de console.

### Validação em produção

Commit `d428be1` deployado com sucesso. Reexecutado o mesmo script Playwright contra `https://ai-game-studio-os-web.vercel.app`: **12/12 checks**, zero erros de console — incluindo o fluxo de dependência Project→Game funcionando corretamente em produção.

### Pendências

- Knowledge/Publishing seguem mock — mesma migração pendente.
- Nenhuma UI para criar `game_versions`/`builds` (fica para quando houver integração real de CI/build, fora de escopo).
- Editar/arquivar Game.

### Próximo Sprint

A definir com o usuário.

---

## Sprint 2.2 — Knowledge real

**Status:** Concluído (validado contra o banco real)
**Período:** 2026-07-29

### Objetivo

Mesmo padrão dos Sprints 2.0/2.1: substituir `apps/web/lib/knowledge-store.ts` (mock) por dados reais via `packages/database`. Sem dependência de Project (diferente de Games) — mais simples de conectar.

### Descoberta de schema

`summary`/`content` vivem em `knowledge_document_versions` (imutável, `AGSOS-SPEC-003` §9: "documentos publicados não são sobrescritos — uma alteração cria nova versão"), não no próprio `knowledge_documents` — diferença do mock, que tinha tudo achatado no documento. Criar um documento agora cria a versão 1 junto (conteúdo = resumo, mesmo comportamento do mock: `content: input.summary`). O enum `knowledge_document_type` real tem 9 valores (sem um genérico "Documento") — `TECHNICAL_DOCUMENT` virou o mais próximo/default do formulário; `knowledge_document_status` tem 6 valores (mock só tinha 2).

### Bug real corrigido antes de testar (achado na revisão do próprio código, não em produção)

`knowledge-documents-repository.ts`'s `createVersion()` já existia desde o Sprint 1.7, mas seu tipo de parâmetro (`Pick<..., "studio_id"|"document_id"|"version_number"|"content">`) **omitia `created_actor_type`/`created_actor_id`**, que são `NOT NULL` na tabela (sem default) — chamar `createVersion()` como a assinatura sugeria teria falhado com violação de NOT NULL. Corrigido o tipo do parâmetro para incluir os campos de auditoria obrigatórios antes de qualquer teste real.

### Arquivos criados

- `apps/web/hooks/use-knowledge-documents.ts`, `use-knowledge-document.ts`.
- `apps/web/lib/knowledge-status.ts`, `knowledge-type.ts` — mapeiam os enums para português.

### Arquivos alterados

- `packages/database/src/repositories/knowledge-documents-repository.ts` — `createVersion()` corrigido (ver acima); `listWithLatestSummary()`/`getLatestVersion()` novos (resolvem o resumo/conteúdo a partir da versão mais recente, mesmo padrão de consultas separadas de `builds-repository.listByGame()`).
- `apps/web/app/knowledge/page.tsx` / `app/knowledge/[id]/page.tsx` — dados reais.
- `apps/web/components/knowledge/cards.tsx` — status/tipo soltos (`string`).

### Arquivos removidos

- `apps/web/lib/knowledge-store.ts` — mock eliminado.

### Validações executadas

`pnpm build`/`lint`/`typecheck` verdes (12/12). Teste Playwright contra o banco real (local): **11/11 checks** — estado vazio real, criar documento cria a linha em `knowledge_documents` (type=ADR, status=DRAFT) **e** a versão 1 em `knowledge_document_versions` com o conteúdo correto (testado com acentuação em português — "acentuação", "ç", "ã" — para garantir que não há problema de encoding), resumo aparece no card da lista (derivado da versão), rótulos "Rascunho"/"ADR" corretos, documento continua visível após reload real, detalhes carregam com o conteúdo real da versão, ID inexistente cai em not-found. Zero erros de console.

### Validação em produção

Commit `6572a2e` deployado com sucesso (Vercel, status `success`). Reexecutado o teste Playwright contra produção (`https://ai-game-studio-os-web.vercel.app`): **11/11 checks**, zero erros de console. Comportamento idêntico ao local, incluindo a criação da versão 1 com acentuação em português.

### Pendências

- Publishing é o último módulo ainda em mock.
- Nenhuma UI para criar uma segunda versão de um documento existente (edição sempre cria versão nova, por design — só não há UI para isso ainda).
- Editar/arquivar documento.

### Próximo Sprint

A definir com o usuário — Publishing real fecha a migração mock→real de todos os módulos de negócio do MVP original.

---

## Sprint 2.3 — Publishing real (somente leitura)

**Status:** Concluído (validado contra o banco real)
**Período:** 2026-08-03

### Objetivo

Mesmo padrão dos Sprints 2.0/2.1/2.2: substituir `apps/web/lib/publishing-store.ts` (mock) por dados reais via `packages/database`. Publishing fecha a migração mock→real de todos os módulos de negócio do MVP original.

### Descoberta de schema que mudou o escopo do sprint

`submissions.release_id`/`build_id` são `NOT NULL` (AGSOS-SPEC-002 §8, §17) — toda Submission exige um Release e um Build já existentes. Diferente do Sprint 2.1 (Games), onde a UI de criação de Project já existia e só faltava o seletor, aqui **não existe nenhuma UI em lugar nenhum do app para criar `game_versions`/`builds`/`releases`** (Sprint 2.1 já havia deferido isso, "fora de escopo"). Migrar Publishing para o padrão de criação real exigiria, portanto, construir essa cadeia inteira primeiro — escopo maior que o dos sprints anteriores.

Antes de implementar, essa descoberta foi levada ao usuário (`CLAUDE.md` — parar e propor divisão antes de sprints que cresceriam além do padrão já estabelecido). Decisão: manter o sprint pequeno e no mesmo padrão dos anteriores — **somente leitura real**. A lista e o detalhe de Submissions passam a vir do banco; "New Submission" fica desabilitado com uma mensagem explicando a dependência, sem criar UI de Release/Build/Submission neste sprint (adiado para um sprint futuro dedicado a essa cadeia, se/quando for priorizado).

### Arquivos criados

- `apps/web/hooks/use-submissions.ts`, `use-submission.ts`.
- `apps/web/lib/submission-status.ts` — mapeia o enum `submission_status` (8 valores) para rótulos em português + variantes de `Badge`.

### Arquivos alterados

- `packages/database/src/repositories/submissions-repository.ts` — `listWithDetails()`/`getWithDetails()` resolvem `submissions → releases → games/game_versions` e `submissions.platform_id → platforms` em consultas separadas (mesmo padrão de `builds-repository.listByGame()`); `listReviews()` novo, lê `store_reviews` por submissão.
- `apps/web/app/publishing/page.tsx` / `app/publishing/[id]/page.tsx` — dados reais; botão "New Submission" desabilitado com mensagem; a tela de detalhe troca o histórico fabricado do mock por uma seção "Revisões" com os `store_reviews` reais (decisão/notas/data), já que o schema real não tem uma tabela de histórico de status equivalente ao mock.
- `apps/web/components/publishing/cards.tsx` — `SubmissionCard` usa o enum `submission_status` real (era `SubmissionStatus` do mock).
- `packages/database/src/index.ts` — export de `SubmissionWithDetails`.

### Arquivos removidos

- `apps/web/lib/publishing-store.ts` — mock eliminado.

### Validações executadas

`pnpm build`/`lint`/`typecheck` verdes (12/12). Teste Playwright ad hoc contra o banco real (local, Docker): login com o usuário seed (`founder@aigamestudio.os`), 3 cards reais renderizados (Nebula Drift/Sprint Runner/Hyper Dash, com status/plataforma/versão corretos a partir do seed existente em `supabase/seed/02_demo_studio.sql`), botão "New Submission" corretamente desabilitado com a mensagem explicativa, detalhe carrega a seção "Revisões" com os `store_reviews` reais, zero erros de console. Corrigido no caminho um problema pré-existente do seed local (`confirmation_token` nulo quebrava login via GoTrue com erro 500) — ajuste feito só nos dados locais de teste, não em migration/seed versionado.

### Validação em produção

Commit `b125021` (push em 2026-08-03) — `git push origin main` e status Vercel do commit confirmado `success` via `gh api .../commits/b125021/status` (`https://vercel.com/ai-game-studio-os/ai-game-studio-os-web/356Mr2tbrsHcTE16eDbKWRZnykrw`).

Diferente dos Sprints 2.1/2.2, a validação funcional completa (autenticada) **não foi executada** neste sprint: as credenciais seed usadas na validação local (`founder@aigamestudio.os` / `demo-password-local-only`) não funcionam contra o projeto Supabase de produção ("Email ou senha incorretos") — o usuário confirmou que não há uma credencial de teste de produção disponível no momento e optou por uma validação só estática, sem login, em vez de fornecer uma credencial.

Validação estática executada (Playwright, zero mutação de dados): `GET /login` → 200, zero erros de console; `GET /publishing` (sem sessão) → redireciona corretamente para `/login?redirect=%2Fpublishing`, zero erros de console; `GET /publishing/00000000-0000-0000-0000-000000000000` (sem sessão) → redireciona corretamente para `/login?redirect=%2Fpublishing%2F...`, zero erros de console. Confirma que o deploy está no ar e que o route-guard de autenticação cobre as novas rotas, mas não confirmava, sozinha, os comportamentos autenticados.

**Atualização — validação autenticada em produção (2026-08-03, mesmo dia, após o usuário criar uma conta de teste dedicada e confirmar o login manualmente):** antes de qualquer novo teste, foi verificado — só leitura, sem autenticar — que o build publicado em `https://ai-game-studio-os-web.vercel.app` tem `NEXT_PUBLIC_SUPABASE_URL=https://vkyswyuxitwakjqjteso.supabase.co` embutido no bundle (`_next/static/chunks/799-0d6ab77824245773.js`), idêntico ao `apps/web/.env.local` de produção deste repositório — confirmado que o frontend publicado aponta para o projeto Supabase correto antes de reautenticar.

**A validação em produção não está completa.** Com a credencial de teste (`teste@aigamestudioos.com`), validação Playwright contra produção, zero mutação de dados, resultado por item:

- Deploy de produção: **aprovado** (commit `b125021`, status Vercel `success`).
- Login e redirecionamento: **aprovado** (autentica e redireciona para `/dashboard`).
- Estado vazio de Publishing: **aprovado** (`/publishing` mostra corretamente "Nenhuma submissão ainda." para um Studio sem dados).
- Botão "New Submission" desabilitado e mensagem explicativa: **aprovado** (`disabled=true`; texto "Uma Submissão exige um Release já existente..." presente).
- Ausência de erros no console: **aprovado** (zero erros em toda a sessão).
- Isolamento entre Studios por RLS: **aprovado** — a conta de teste pertence a um Studio próprio, recém-criado e vazio (`/projects` também mostra "Nenhum projeto ainda") e não enxerga as 3 submissions reais do Studio de demonstração (`founder@aigamestudio.os` — Nebula Drift/Sprint Runner/Hyper Dash).
- Listagem com submissions reais: **não validada em produção**, por ausência de dados no Studio da conta de teste (não é falha nem aprovação — item não avaliável com os dados disponíveis).
- Detalhe de submission: **não validado em produção**, pelo mesmo motivo.
- `store_reviews` reais: **não validados em produção**, pelo mesmo motivo.

Esses três últimos fluxos (listagem, detalhe, `store_reviews`) foram validados anteriormente no ambiente local, com Supabase local (Docker) e Playwright — ver "Validações executadas" acima — mas essa validação local não substitui uma validação equivalente em produção; a lacuna permanece registrada como pendência.

### Pendências

- Nenhuma UI para criar `game_versions`/`builds`/`releases` — sem isso, a criação de Submission continua bloqueada. Fica para um sprint futuro dedicado a essa cadeia, se priorizado.
- Editar/arquivar Submission.
- Listagem com submissions reais, detalhe de submission e `store_reviews` reais seguem **não validados em produção** — só localmente. Requer uma conta de teste com acesso a um Studio que tenha submissions reais.
- **Pendência futura de QA:** criar um Studio de demonstração próprio para testes de produção, com dados sintéticos e isolados — sem reutilizar o Studio fundador (`founder@aigamestudio.os`) nem dados reais de nenhum Studio existente. Isso destrava a validação completa (listagem/detalhe/`store_reviews`) em produção sem misturar contas de teste com dados de demonstração/reais.

### Próximo Sprint

A definir com o usuário. Com Publishing real concluído (somente leitura), todos os 4 módulos de negócio do MVP original (Projects, Games, Knowledge, Publishing) já leem do banco real — o mock só permanece na forma da cadeia Release/Build, ainda sem nenhuma UI de criação em todo o app.

---

## Sprint 2.4 — Release Pipeline: schema + repositories (sem UI)

**Status:** Concluído (validado contra o banco real)
**Período:** 2026-08-04

### Objetivo

Primeiro incremento do "Release Pipeline" (Game → Version → Build → Release → Submission → Store Review → Published) pedido pelo usuário. O pedido original tinha escopo de um único sprint gigante (schema + repositories + services + use cases + eventos + UX completa de Versions/Builds/Releases + widgets de Dashboard + Quick Actions + suíte Playwright + 7 documentos atualizados) — muito acima dos limites deste repositório (`CLAUDE.md`: máx. ~50 arquivos/3 packages/10 arquivos novos por sprint). Antes de implementar, a divisão foi proposta e confirmada pelo usuário em 4 sprints:

- **2.4 (este):** schema + repositories da cadeia Version→Build→Release, sem UI.
- **2.5:** UX de criação (abas Versions/Builds/Releases em Game, build mockado, timeline via `studio_events`) — desbloqueia a criação de Submission em Publishing.
- **2.6:** Services/use cases formais, eventos tipados, Quick Actions, widgets de Dashboard.
- **2.7:** Suíte Playwright golden-path completa + consolidação de documentação (CHANGELOG/PROJECT_STATUS/DECISIONS/RELEASE_NOTES/PRODUCT_PROGRESS) + validação em produção do pipeline completo.

### Decisões de schema

`AGSOS-SPEC-003` §13 já define `version_status`/`build_status`/`release_status` como ENUMs oficiais congelados — nenhum deles foi alterado. Os atributos pedidos pelo usuário (changelog/branch/commit_hash em Version; build_number/tipo/tamanho/checksum em Build; canal/agendamento/rollout em Release) não existiam no documento normativo porque as colunas também não existiam — são extensões aditivas, registradas aqui como pendência de atualização formal de `AGSOS-SPEC-003` (não feita neste commit).

**Desvio deliberado do pedido original:** não foi adicionado `platform_id`/"target_store" em `releases`. O modelo já existente (`submissions.release_id` N:1 `releases`, com `submissions.platform_id` próprio) já permite que um Release gere Submissions para lojas diferentes — duplicar a plataforma no Release contradiria essa relação N:1 e violaria "nenhuma duplicação de dados". `release_channel` (Internal/Alpha/Beta/Production) foi adicionado normalmente, é um atributo do Release, não da loja.

### Arquivos criados

- `supabase/migrations/20260804000001_release_pipeline_extensions.sql` — 2 ENUMs novos (`build_type`, `release_channel`) + colunas aditivas em `game_versions`/`builds`/`releases` (nenhuma coluna/tabela existente removida ou renomeada; forward-only, `AGSOS-SPEC-003` §3).
- `packages/database/src/repositories/game-versions-repository.ts` — `listByGame()`/`getById()`/`create()`.
- `packages/database/src/repositories/releases-repository.ts` — `listByGame()`/`listByVersion()`/`getById()`/`create()`.

### Arquivos alterados

- `packages/database/src/repositories/builds-repository.ts` — `listByVersion()`/`getById()`/`create()` novos (mantém `listByGame()` já existente, usado pela tela de detalhe de Game desde o Sprint 2.1).
- `packages/database/src/generated/database.types.ts` — tipos `BuildType`/`ReleaseChannel` e colunas novas em `GameVersionsRow`/`BuildsRow`/`ReleasesRow` (arquivo hand-maintained até existir projeto Supabase remoto linkado — ver comentário no topo do arquivo).
- `packages/database/src/index.ts` — exports de `createGameVersionsRepository`/`createReleasesRepository`.

### Validações executadas

`pnpm build`/`lint`/`typecheck` verdes (12/12). Migration aplicada contra Postgres real (local, Docker) via `supabase migration up` — colunas/ENUMs/constraint (`chk_releases_rollout_percentage`) confirmados via `\d` no psql, RLS (`_isolation` policies) intacta nas 3 tabelas. Repositories exercitados fim a fim com um script ad hoc autenticado como usuário real (`authenticated` role, não `service_role` — o app nunca usa `service_role` no browser, `ADR-003`): criação de Version→Build→Release com os campos novos, leitura via `listByGame()`/`listByVersion()` confirmando os valores persistidos, e confirmação de que `rollout_percentage=150` é corretamente rejeitado pelo `CHECK` constraint. Dados de teste removidos ao final (nenhum resíduo no banco local).

### Pendências

- UI de criação de Version/Build/Release (Sprint 2.5).
- Services/use cases/eventos tipados (Sprint 2.6).
- Atualização formal de `AGSOS-SPEC-003` §13 com os ENUMs/colunas novos (débito de documentação, não bloqueia o código).

### Próximo Sprint

Sprint 2.5 — UX de criação da cadeia Version→Build→Release (abas em Game, build mockado, timeline via `studio_events`), desbloqueando a criação real de Submission em Publishing.

---

## Sprint 2.5 — Release Pipeline: UX de criação + hardening da simulação de Build

**Status:** Concluído (validado contra o banco real, local e produção)
**Período:** 2026-08-04

### Objetivo

Segundo dos 4 sprints do Release Pipeline (ver Sprint 2.4). Construir a UX de criação sobre o schema/repositories já existentes: Version e Build (com progresso simulado, sem CI/CD real ainda) e Release, com Timeline via `studio_events`, desbloqueando "New Submission" em Publishing (que desde o Sprint 2.3 ficava desabilitado por falta de Release).

### Arquivos criados

- `apps/web/hooks/use-game-versions.ts` (list+create Version), `use-game-version.ts` (Version+Builds+Releases+Timeline, simulação de Build, `retryBuild()`), `use-publishable-releases.ts` (Releases com Build disponível, para o formulário de Submission).
- `apps/web/app/games/[id]/versions/[versionId]/page.tsx` — detalhe da Version: Builds (criação + progresso), Releases (criação), Timeline.
- `apps/web/lib/version-status.ts`, `release-status.ts` — rótulos em português dos enums `version_status`/`release_status`/`release_channel`.
- `apps/web/lib/build-simulation.ts` — parâmetros centralizados da simulação de Build (`BUILD_SIMULATION_RUNNING_DELAY_MS`, `BUILD_SIMULATION_SUCCEEDED_DELAY_MS`, `BUILD_SIMULATION_STUCK_THRESHOLD_MS`) e `isBuildStuck()`.
- `packages/database/src/repositories/platforms-repository.ts` (`list()`, tabela global), `studio-events-repository.ts` (`create()`, `listByGameVersion()` via containment `metadata @> {game_version_id}`).

### Arquivos alterados

- `apps/web/app/games/[id]/page.tsx` — seção "Versions" com criação (nome, changelog, branch, commit).
- `apps/web/app/publishing/page.tsx` — "New Submission" desbloqueado: seleciona um Release real, depois uma Plataforma entre as Builds disponíveis para a Version daquele Release.
- `packages/database/src/repositories/builds-repository.ts` — `update()` (usado pela simulação de progresso).
- `packages/database/src/repositories/releases-repository.ts` — `list()` (usado por `usePublishableReleases`).
- `apps/web/lib/build-status.ts` — `buildTypeLabel()`.
- `packages/database/src/index.ts` — exports novos.

### Decisão de escopo: sem worker/CI-CD real, sem `platform_id` em `releases`

Ver `DECISIONS.md` (seção "Sprint 2.4/2.5 — Release Pipeline") para as duas decisões formais deste sprint. Resumo: progresso de Build simulado inteiramente no client via `setTimeout` (arquitetura de repository+evento por transição já preparada para uma integração real futura, só o disparo é mock); `releases` não ganhou `platform_id`/`target_store` porque `submissions.platform_id` já cobre isso sem duplicar dado, respeitando a relação N:1 Release→Submissions já modelada.

### Bug real encontrado e corrigido durante a validação (não um bug de produto — achado no próprio processo de teste)

O primeiro Golden Path (Playwright) reportou a Build nunca chegando a `SUCCEEDED`. Investigado antes de qualquer mudança de código: a causa era o próprio script de teste, que chamava `page.reload()` dentro do loop de polling — um reload mata o `setTimeout` pendente no browser antes de ele completar a transição RUNNING→SUCCEEDED. Confirmado isoladamente (sem reload, a build completa em ~4.8s como esperado) e corrigido o script, não o produto.

Essa investigação, no entanto, revelou uma limitação real e não hipotética: **qualquer reload/fechar aba durante a simulação também trava a Build de verdade**, não só no teste. Por isso o hardening abaixo — pedido explicitamente pelo usuário como condição para aprovar o sprint, na mesma sessão em que o achado apareceu.

### Hardening: Build travada — detecção + Retry Build

Sem introduzir worker/cron/Edge Function/queue/CI-CD real (fora de escopo, por instrução explícita do usuário — o estágio continua mock):

- `isBuildStuck()` (`apps/web/lib/build-simulation.ts`) identifica uma Build como travada quando `status = RUNNING` e `updated_at` está há mais de `BUILD_SIMULATION_STUCK_THRESHOLD_MS` (20s — bem acima dos ~4.5s da simulação completa, para não gerar falso positivo por latência) sem progredir.
- UI (`versions/[versionId]/page.tsx`): badge "Build travada" (variant `destructive`) substitui o badge de status normal, com uma mensagem explicando que é uma limitação da simulação client-side (não uma falha real de build) e um botão **Retry Build**.
- `retryBuild()` (`use-game-version.ts`): registra `BuildFailed` (preserva o histórico de que a tentativa anterior travou, em vez de apagá-lo), volta o `status` da mesma linha para `PENDING` via `buildsRepo.update()`, registra `BuildRetried`, e reagenda a mesma simulação (`scheduleBuildSimulation()`, extraída de `createBuild()` para ser reaproveitada por ambos). Reaproveita a linha existente — o schema não tem um conceito de "tentativa" separado da Build (ver `DECISIONS.md`).
- Aviso permanente (não uma mensagem só no momento da falha) no topo da tela de Version: "As builds desta versão são simuladas no navegador — não há CI/CD real ainda. Fechar ou atualizar a página durante uma build pode interromper o progresso; pipelines reais serão adicionados futuramente."
- Sem `localStorage`/`sessionStorage`/mecanismo paralelo — todo o estado (inclusive a detecção de travamento) é derivado de colunas já persistidas no Postgres (`status`, `updated_at`).

### Débitos técnicos registrados (aprovados pelo usuário para o backlog, não bloqueiam este sprint)

1. `build_number` calculado por contagem no client (`createBuild()`) — duas criações simultâneas para a mesma Version/Platform podem colidir. Correção futura: cálculo transacional no banco.
2. `artifact_url` aponta para um domínio mock (`builds.aigamestudioos.local`) — a UI já rotula o checksum como "(simulado)"; reforçar se um link/botão de download real for adicionado no futuro.
3. `usePublishableReleases` resolve Release→Version→Game→Builds em consultas separadas por Release (padrão N+1) — aceitável no volume atual do MVP; revisar para consulta única/view/RPC quando o volume justificar.

Ver `DECISIONS.md` para o registro formal dos três.

### Validações executadas

`pnpm build`/`lint`/`typecheck` verdes (12/12), antes e depois do hardening. Golden Path completo via Playwright (local, banco real): **29/29 checks** — login, Game→Version→Build (PENDING→RUNNING→SUCCEEDED)→Release→Submission em Publishing (com Release/Build/Plataforma corretos no detalhe), Timeline com os 5 eventos (`VersionCreated`/`BuildCreated`/`BuildFinished`/`ReleaseCreated`/`SubmissionCreated`), reload, logout/login, tudo persistindo; responsividade e overflow horizontal verificados em mobile/tablet/desktop × light/dark (6 combinações, todas sem overflow). Zero erros de console.

Cenário de hardening validado à parte (16/16 checks): build entra em RUNNING, reload mata o timer, build permanece RUNNING sem ser marcada como travada antes do limite, após ~22s a UI identifica "Build travada" com a mensagem correta, Retry Build funciona (build volta a progredir e chega a SUCCEEDED normalmente desta vez, sem novo reload), Timeline mostra `BuildCreated`→`BuildFailed`→`BuildRetried`→`BuildFinished` na ordem correta. Zero erros de console.

Screenshots capturados nos 3 breakpoints × 2 temas para o estado de Build travada (Retry Build visível, sem overflow em nenhum).

### Bugs de ambiente encontrados e resolvidos no processo (não relacionados ao código do sprint)

- Local Supabase (`supabase start`) apresentou instabilidade intermitente (containers "unhealthy" na primeira tentativa) — resolvido reiniciando o stack.
- Um `next-server` órfão de uma sessão anterior (27min, ~1.5GB RSS) estava ocupando a porta 3000 e pressionando a memória da sandbox (125MB livres de 7.8GB), causando crashes do Chromium durante os testes — identificado via `ps`/`free`, confirmado órfão (PID/tempo de vida não relacionados à sessão atual) e encerrado por PID específico (nunca `pkill` genérico). Dev server desta sessão rodou na porta 3001 sem problema depois disso.

### Validação em produção

Commit `da76df5` — `git push origin main` e status Vercel confirmado `success` via `gh api .../commits/da76df5/status` (`https://vercel.com/ai-game-studio-os/ai-game-studio-os-web/4W1srwVxB5KaDQ5eRSasNtNM5c9p`).

**Golden Path em produção BLOQUEADO — migration do Sprint 2.4 nunca foi aplicada ao Supabase de produção.** Com a conta de teste dedicada (`teste@aigamestudioos.com`), login funcionou, e um Project + Game novos foram criados com sucesso (dentro do Studio isolado dessa conta, sem tocar dados de outros Studios) — mas a criação da primeira Version falhou com:

```
PGRST204: Could not find the 'branch' column of 'game_versions' in the schema cache
```

**Causa raiz confirmada (não é bug de código):** `supabase/migrations/20260804000001_release_pipeline_extensions.sql` (Sprint 2.4) foi validada e aplicada com sucesso contra o Postgres **local** (Docker, via `supabase migration up`), mas nunca foi propagada ao projeto Supabase remoto de produção (`vkyswyuxitwakjqjteso`) — não existe pipeline de CI neste repositório (`.github/workflows/` não existe) que faça isso automaticamente, e esta sessão não tinha `SUPABASE_ACCESS_TOKEN`/login do CLI nem a connection string do Postgres de produção para rodar `supabase db push` ou aplicar o SQL diretamente. O código do app está correto; o schema de produção está desatualizado em relação a `game_versions`/`builds`/`releases` (faltam as colunas do Sprint 2.4: `branch`/`changelog`/`commit_hash`, `build_number`/`build_type`/`artifact_size`/`checksum`/`generated_at`, `release_channel`/`scheduled_at`/`published_at`/`release_notes`/`rollout_percentage`).

Apresentado o bloqueio ao usuário antes de qualquer tentativa de contorno (nenhuma credencial foi adivinhada ou solicitada de forma insegura). Decisão do usuário: não aplicar a migration nesta sessão — documentar o bloqueio e encerrar a validação de produção deste sprint sem o Golden Path completo em prod. Consequência: apenas os itens de produção que **não** dependem das colunas novas foram confirmados (deploy, login, criação de Project/Game reais, schema-guard funcionando corretamente — ver abaixo); os itens que dependem da cadeia Version→Build→Release→Submission **não foram exercitados em produção**.

Validação local (Docker, mesmo commit) permanece a evidência válida de que o código funciona corretamente contra o schema correto — ver "Validações executadas" acima (29/29 + 16/16, zero erros de console).

### Pendências

- **Bloqueante para validação completa de produção:** aplicar `supabase/migrations/20260804000001_release_pipeline_extensions.sql` ao projeto Supabase de produção (`vkyswyuxitwakjqjteso`) — via `supabase db push` (precisa de `SUPABASE_ACCESS_TOKEN`) ou SQL Editor do Dashboard. Depois disso, reexecutar o Golden Path de produção (script ad hoc já escrito, não commitado — ver observação sobre scripts abaixo).
- Nenhum processo de CI aplica migrations a produção automaticamente — vale considerar formalizar esse passo (`supabase db push` num pipeline, ou um passo manual documentado no runbook de deploy) para este gap não se repetir a cada sprint com mudança de schema.
- Services/use cases/eventos tipados formais, Quick Actions, widgets de Dashboard (Sprint 2.6).
- Suíte Playwright versionada no repositório + consolidação final de documentação (Sprint 2.7) — os scripts usados neste sprint foram ad hoc (scratchpad), não commitados.
- Os 3 débitos técnicos listados acima (`build_number`, `artifact_url`, N+1 em `usePublishableReleases`).
- Atualização formal de `AGSOS-SPEC-003` §13 com os ENUMs/colunas novos do Release Pipeline (arrastada do Sprint 2.4).

### Próximo Sprint

Sprint 2.6 — Services/use cases formais, eventos tipados, Quick Actions, widgets de Dashboard (Latest Builds, Failed Builds, Publishing Queue etc.), conforme divisão já proposta e confirmada com o usuário.

---

## Sprint 2.5.1 — Production Readiness

**Status:** Concluído (processo/tooling); pendência de dados pré-existente permanece aberta (ver abaixo)
**Período:** 2026-08-04

### Objetivo

Sprint puramente operacional, sem nenhuma funcionalidade nova de produto — decisão explícita do usuário após o Sprint 2.5 revelar que uma migration validada localmente nunca chegou a produção, e que nada no processo detectava isso antes do Golden Path de produção esbarrar num erro real. Objetivo: eliminar esse risco de forma estrutural, não pontual, mantendo a solução no nível de complexidade adequado para um solo founder (sem CI/CD completo).

### Arquivos criados

- `DEPLOY_RUNBOOK.md` — processo operacional de deploy de schema: por que migrations continuam manuais (decisão explícita, não omissão), quando aplicar, checklist obrigatório, como aplicar (CLI com token, ou SQL Editor como fallback sem token), como validar sincronia antes de declarar o deploy pronto, e o registro do que aconteceu no Sprint 2.5 como caso de referência.
- `scripts/check-schema-sync.sh` — compara `supabase/migrations/` (local) contra `supabase migration list --linked` (remoto); falha com a lista exata de migrations pendentes se houver divergência, ou falha explicando o que falta se não houver `SUPABASE_ACCESS_TOKEN`/`SUPABASE_DB_URL` disponível. Nunca reporta sucesso silenciosamente sem credencial.

### Arquivos alterados

- `DEFINITION_OF_DONE.md` — nova seção 10, "Gate de Schema/Migrations": nenhum sprint que crie/altere uma migration pode ser declarado Concluído sem os 4 itens do checklist (migration aplicada em produção, `check-schema-sync.sh` verde, Golden Path contra produção, evidências + documentação atualizada). Faltando qualquer um, o sprint é relatado como Parcialmente Concluído, com o item nomeado — nunca escondido.
- `CLAUDE.md` — pointer para `DEPLOY_RUNBOOK.md`/`DEFINITION_OF_DONE.md` §10 na seção de processo.
- `package.json` — script `check:schema` (`pnpm check:schema`), atalho para `scripts/check-schema-sync.sh`.

### Decisão: manual + scriptado, não CI/CD completo

Registrada com o mesmo peso de uma entrada de `DECISIONS.md` (ver lá, se este arquivo for consultado antes): este repositório não tem `.github/workflows/` e este sprint **não criou um**. `supabase db push` continua sendo rodado manualmente pela pessoa fazendo o sprint, não por um pipeline. O ganho de confiabilidade vem de dois lugares que não exigem infraestrutura de CI: um script que verifica o estado (`check-schema-sync.sh`) e um checklist que torna o passo impossível de esquecer (`DEPLOY_RUNBOOK.md` §3 + o gate formal em `DEFINITION_OF_DONE.md` §10). Se o ritmo de sprints com mudança de schema crescer a ponto de o passo manual virar gargalo de verdade (sinal a observar, não hipótese), a evolução natural é automatizar só esse step — não reconstruir o pipeline inteiro.

### Validações executadas

`pnpm build`/`lint`/`typecheck` verdes (12/12) — nenhum código de `apps/web`/`packages/*` foi tocado, só documentação, um script novo e um script npm. `scripts/check-schema-sync.sh` testado no único caminho executável nesta sessão (sem credencial disponível): falha corretamente com mensagem clara e `exit 1`, tanto direto (`bash scripts/check-schema-sync.sh`) quanto via `pnpm check:schema`. O caminho com credencial válida (`SUPABASE_ACCESS_TOKEN`/`SUPABASE_DB_URL` presente, comparando `supabase migration list --linked` de verdade) **não pôde ser exercitado nesta sessão** — mesma limitação de credenciais do Sprint 2.5. Sem testes E2E (não há UI neste sprint).

### Pendência pré-existente que este sprint NÃO resolve sozinho

A migration `20260804000001_release_pipeline_extensions.sql` (Sprint 2.4) **continua não aplicada em produção** — este sprint entrega o processo e a ferramenta para detectar e aplicar isso de forma confiável a partir de agora, mas aplicar essa migration específica ainda depende de uma credencial (`SUPABASE_ACCESS_TOKEN` ou a connection string de produção) que não está disponível nesta sessão. Ou seja: o Golden Path de produção do Release Pipeline (Version/Build/Release/Submission) permanece bloqueado até essa migration ser aplicada — por decisão do usuário, isso fica registrado como pendência explícita, não escondido atrás de "Sprint 2.5.1 concluído".

### Pendências

- **Aplicar a migration do Sprint 2.4 em produção** (`DEPLOY_RUNBOOK.md` §4) e então reexecutar `check:schema` + o Golden Path de produção do Release Pipeline — item mais prioritário do backlog atual. Oferecido ao usuário no início do Sprint 2.6 (gerar `SUPABASE_ACCESS_TOKEN` ou aplicar via SQL Editor); usuário optou por adiar explicitamente ("depois eu faço isso") e seguir para o próximo sprint sem essa validação — decisão dele, registrada aqui para não ficar implícita. Continua bloqueando o Golden Path de produção do Release Pipeline até ser aplicada.
- Exercitar `check-schema-sync.sh` com credencial real pelo menos uma vez, para confirmar o parsing de `supabase migration list --linked` contra a saída real do CLI (só testado com mensagens de erro nesta sessão).
- Débitos técnicos do Sprint 2.5 (`build_number`, `artifact_url`, N+1) seguem no backlog, com prioridade menor que a migration pendente.

### Próximo Sprint

A definir com o usuário — provavelmente aplicar a migration pendente (destrava o Golden Path de produção do Release Pipeline) antes de retomar o Sprint 2.6.

---

## Sprint 2.6 — Eventos tipados + widgets reais de Dashboard

**Status:** Concluído (validado localmente); Golden Path de produção do Release Pipeline continua bloqueado pela pendência herdada do Sprint 2.4 (migration não aplicada em produção)
**Período:** 2026-08-05

### Objetivo

Retomada de funcionalidades de negócio depois do Sprint 2.5.1 (processo). Escopo decidido pelo próprio agente, sem novo ciclo de aprovação prévia (usuário pediu para seguir em frente): eventos tipados do Release Pipeline + os widgets de Dashboard mais diretamente ligados a ele (Latest Builds, Failed Builds, Pending Releases). **Decisão explícita de não criar** uma camada formal de Services/Use Cases separada dos hooks, nem novos Quick Actions — ver `DECISIONS.md`.

### Arquivos criados

- `apps/web/lib/domain-events.ts` — union discriminada `ReleasePipelineEvent` (7 eventos: `VersionCreated`/`BuildCreated`/`BuildFinished`/`BuildFailed`/`BuildRetried`/`ReleaseCreated`/`SubmissionCreated`) + helper `releasePipelineEvent(name, payload)` que impede `event_name`/`payload` divergirem por engano em qualquer call site.
- `apps/web/hooks/use-release-pipeline-widgets.ts` — busca Latest Builds (5 mais recentes do Studio), Failed Builds (status `FAILED`) e Pending Releases (status fora dos terminais) em paralelo.
- `apps/web/components/dashboard/pipeline-widgets.tsx` — `LatestBuildsWidget`/`FailedBuildsWidget`/`PendingReleasesWidget`.

### Arquivos alterados

- `packages/database/src/repositories/builds-repository.ts` — `listRecentByStudio(limit, statusFilter?)`, resolve `builds → game_versions → games` e `→ platforms` em consultas separadas (mesmo padrão já usado em `listByGame()`).
- `packages/database/src/repositories/releases-repository.ts` — `listPendingByStudio(limit)`, mesmo padrão, filtra por status fora de `RELEASE_TERMINAL_STATUSES` (`PUBLISHED`/`REJECTED`/`CANCELLED`/`ARCHIVED`).
- `packages/database/src/index.ts` — exports de `BuildWithGameDetails`/`ReleaseWithGameDetails`.
- `apps/web/hooks/use-game-version.ts`, `use-game-versions.ts`, `use-publishable-releases.ts` — os 7 call sites de `studioEventsRepository.create()` passam a usar `releasePipelineEvent()` em vez de `event_name`/`payload` soltos.
- `apps/web/app/dashboard/page.tsx` — nova seção "Release Pipeline" com os 3 widgets, dados reais (`useAuth`/`useCurrentStudio`/`useReleasePipelineWidgets`, mesmo padrão de toda página autenticada do app). Os demais widgets do Dashboard (Quick Stats, Recent Projects, Recent Activity, AI Insights, Roadmap Snapshot) continuam mock — fora de escopo, mesma decisão já registrada em `DECISIONS.md` desde o Sprint 2.0.

### Decisões de escopo

Ver `DECISIONS.md` ("Sprint 2.6") para o registro formal. Resumo: (1) sem camada de Service/UseCase separada — os hooks já cumprem esse papel (repository → evento → estado), formalizar em arquivos novos por ação seria abstração sem ganho real no estágio atual; (2) sem novos Quick Actions no Dashboard — criar Version/Build/Release exige um Game já selecionado, então um atalho genérico no Dashboard não teria para onde mandar o usuário de forma útil.

### Bug real corrigido (TypeScript, achado antes de qualquer teste)

`releasePipelineEvent()` — a primeira versão não compilava (`pnpm build` pegou, `web#build` falhou com erro de tipos condicionais distribuídos dentro do corpo da função, uma limitação conhecida do TypeScript). Corrigido com um type alias (`PayloadFor<Name>`) + `as never` no retorno interno, mantendo a assinatura pública 100% tipada (a segurança de tipo real está na assinatura, não na implementação). Documentado com comentário no próprio arquivo para não parecer um `any` disfarçado sem explicação.

### Validações executadas

`pnpm build`/`lint`/`typecheck` verdes (12/12). Validação local (Playwright, banco real, Docker) — 12/12 checks: Dashboard mostra a seção "Release Pipeline" com os 3 widgets, zero erros de console; regressão do golden path (Game→Version→Build→Release) continua funcionando; widgets refletem os dados reais criados na mesma sessão (Nebula Drift aparece em Latest Builds e Pending Releases logo depois de criados). Uma checagem inicial acusou um erro 401 isolado — investigado antes de mexer em qualquer código: não reproduziu em 4 tentativas limpas subsequentes (incluindo o mesmo fluxo exato), consistente com um flake intermitente de renovação de token da sessão Supabase, não uma regressão deste sprint — registrado como observação, não como bug corrigido.

### Pendências

- **Migration do Sprint 2.4 continua não aplicada em produção** — mesma pendência herdada, agora bloqueando também a validação de produção deste sprint (`Latest Builds`/`Pending Releases` dependem de `builds`/`releases` com as colunas novas). Sem `SUPABASE_ACCESS_TOKEN` disponível nesta sessão.
- Demais widgets do Dashboard (Quick Stats, Recent Projects, Recent Activity, AI Insights, Roadmap Snapshot) continuam mock.
- Débitos técnicos anteriores (`build_number`, `artifact_url`, N+1 em `usePublishableReleases`) seguem no backlog.
- Flake intermitente de 401 observado uma vez — não investigado a fundo (não reproduzível, prioridade baixa).

### Próximo Sprint

A definir com o usuário. Aplicar a migration pendente do Sprint 2.4 em produção continua sendo o item de maior prioridade do backlog — sem isso, nenhum sprint futuro do Release Pipeline consegue ser validado de ponta a ponta em produção.

---

## Sprint 2.7 — Gerenciar membros existentes (trocar papel / remover)

**Status:** Concluído (validado localmente); pendências de produção acumuladas (Sprint 2.4 + esta migration)
**Período:** 2026-08-05

### Objetivo

O usuário pediu "Studio & Members" como próximo sprint. Investigado antes de implementar: convites, papéis (Owner/Admin/Member) e permissões reais (RLS) **já existiam** desde os Sprints 1.8d-2/3/4 — não era um sprint greenfield. Informado ao usuário, que confirmou o escopo real ainda faltante: trocar o papel de um membro já existente e removê-lo do Studio (hoje só era possível definir o papel no momento do convite).

### Achado de segurança real (não hipotético) durante o planejamento

`users_isolation`/`user_roles_isolation` (Sprint 1.7, só corrigidas para recursão no Sprint 1.8d-1) eram políticas de RLS únicas checando apenas `studio_id = current_user_studio_id()`, **sem nenhum gate de permissão** — diferente de `invites`/`studios`, que já tinham `studio.invite_members`/`studio.manage_members`/`studio.edit` desde o Sprint 1.8d-4. Na prática, **qualquer membro de um Studio já podia fazer UPDATE/DELETE na linha de `users`/`user_roles` de qualquer outro membro** (incluindo o Owner) — só não havia nenhuma UI que exercitasse isso ainda (só `SELECT` era usado). Fechado nesta migration antes de expor a primeira UI que escreve nessas tabelas.

### Arquivos criados

- `supabase/migrations/20260805000001_member_management_permissions.sql` — `users`: `SELECT` aberto ao Studio, `UPDATE` exige `studio.manage_members` **e** nunca pode tocar a linha do Owner (`id <> studios.owner_user_id`). `user_roles`: `SELECT` aberto, `INSERT`/`DELETE` exigem `studio.manage_members` e nunca podem tocar uma role `Owner`.
- `packages/database/src/repositories/roles-repository.ts` — `listByStudio()`, `changeMemberRole()` (troca de papel modelada como `DELETE` da role atual + `INSERT` da nova em `user_roles`, não um `UPDATE` — mesmo padrão "sem UPDATE parcial" já usado no projeto).

### Arquivos alterados

- `packages/database/src/repositories/users-repository.ts` — `archive()` (soft-delete via `archived_at`, nunca deleta a conta em `auth.users`); `listByStudioWithRoles()` passou a filtrar membros arquivados.
- `packages/database/src/index.ts` — export de `createRolesRepository`.
- `apps/web/hooks/use-current-studio.ts` — `roles`, `changeMemberRole()`, `removeMember()`; ambos com guards de aplicação (nunca tocar o Owner, nunca remover a si mesmo) **além** da RLS — defesa em profundidade, mesmo padrão de `updateStudio()`/`revokeInvite()` (RLS é a barreira real; erros `42501` viram mensagem amigável).
- `apps/web/components/settings/studio-members-section.tsx` — badge de papel virou um `DropdownMenu` (troca de papel) para membros que não são o Owner; botão "Remover" (com `window.confirm`) para membros que não são o Owner nem o próprio usuário logado.
- `apps/web/app/settings/studio/page.tsx` — passa as novas props (`roles`, `currentUserId`, `studioOwnerId`, `onChangeRole`, `onRemove`).

### Validações executadas

`pnpm build`/`lint`/`typecheck` verdes (12/12). Migration aplicada e validada contra Postgres real (local, Docker) via `supabase migration up` — políticas confirmadas via `\d+ users`/`\d+ user_roles` no psql. Fluxo positivo (Playwright, Owner de um Studio de teste com Owner/Admin/Member reais no seed): 9/9 checks — Owner não tem controles na própria linha, trocar papel de Member→Admin funciona e persiste, remover o Admin original funciona e persiste, membro promovido a Admin consegue ver a lista corretamente após logout/login, zero erros de console. Fluxo negativo (membro sem `studio.manage_members` tentando trocar papel/remover outro membro): 5/5 checks — RLS bloqueia de verdade (não é só a UI escondendo o botão), erro amigável exibido em vez de crash, nenhuma mudança persistida; os dois `403` que aparecem no log de rede são a RLS funcionando como projetado (mesmo padrão já documentado para `invites`/`studios` desde o Sprint 1.8d-4 — "não é bug"), não um erro real.

### Pendências

- **Migration deste sprint também não aplicada em produção** — mesma limitação de credencial (sem `SUPABASE_ACCESS_TOKEN`/connection string nesta sessão). Acumula com a pendência do Sprint 2.4: agora são 2 migrations pendentes de deploy em produção.
- Nenhuma UI para o próprio usuário "sair" do Studio (self-removal é bloqueado deliberadamente, é um fluxo diferente).
- Nenhuma UI para gerenciar o catálogo de `permissions`/`role_permissions` em si (só atribuir Admin/Member a um membro, não redefinir o que cada papel pode fazer).

### Próximo Sprint

A definir com o usuário. Duas migrations pendentes de produção (Sprint 2.4 e esta) — aplicar as duas de uma vez, quando houver credencial disponível, é mais eficiente que aplicar uma de cada vez.

---

## Sprint 2.7.1 — Fechamento da validação de produção (Sprint 2.4–2.7)

**Status:** Concluído
**Período:** 2026-08-05

### Objetivo

Fechar a validação de produção que os Sprints 2.4/2.5/2.6/2.7 deixaram pendente por falta de credencial. Sem isso, nenhum dos quatro podia ser declarado completamente validado (`DEFINITION_OF_DONE.md` §10).

### Como a credencial chegou (registrado por transparência)

O usuário tentou passar o `SUPABASE_ACCESS_TOKEN` via `export` no terminal — não funciona, porque o shell do agente é um processo separado do terminal do usuário; variáveis de ambiente não atravessam essa fronteira, só o filesystem é compartilhado. Combinado com um erro de digitação (`echo token > / tmp/...` com espaço depois da primeira barra, que faz o `>` redirecionar para `/` em vez de `/tmp/...`), o token acabou colado diretamente na conversa. **Tratado como comprometido imediatamente**: não foi usado, o usuário foi orientado a revogá-lo e gerar um novo. O caminho correto — escrever o token num arquivo fora do repositório (`/tmp/supabase_token`, nunca versionado) e o agente ler o arquivo — funcionou depois de corrigido o typo. O arquivo foi apagado (`shred -u`) assim que as migrations foram confirmadas aplicadas.

### Achado real: as duas migrations já estavam aplicadas em produção

Antes de rodar `db push`, `supabase migration list --linked` já mostrava as duas migrations pendentes (`20260804000001`, `20260805000001`) com `remote` preenchido — ou seja, **já tinham sido aplicadas em algum momento antes desta sessão**, por um caminho não seguido/documentado neste log (não foi este agente, em nenhuma sessão anterior registrada aqui). Isso não foi aceito sem checagem: confirmado de forma independente, sem depender só do ledger de migrations —

- **Sprint 2.4** (`game_versions`/`builds`/`releases`): consulta direta via PostgREST às colunas novas (`branch`, `build_type`, `release_channel` etc.) — resposta `[]` (array vazio, não erro `PGRST204`) confirma que as colunas existem de verdade no schema de produção.
- **Sprint 2.7** (RLS de `users`/`user_roles`): `supabase db dump --linked` do schema `public`, inspecionando o `CREATE POLICY` de `users_update`/`user_roles_insert`/`user_roles_delete` — texto idêntico ao da migration local.

### Bug real encontrado e corrigido no próprio processo de verificação

`scripts/check-schema-sync.sh` (criado no Sprint 2.5.1, nunca antes exercitado com uma credencial real) reportava **todas** as migrations como pendentes, mesmo com o schema em sincronia — um falso negativo. Causa: a CLI do Supabase agora emite uma linha JSON (`{"migrations":[...]}`), não a tabela de texto que o `awk -F'|'` do script assumia. Corrigido para parsear o JSON de verdade com `node` (commit `1a06e77`, separado do commit de validação, seguindo a prática de commits atômicos). Sem essa correção, `pnpm check:schema` teria bloqueado sprints futuros com um alarme falso indefinidamente.

### Validação funcional completa em produção (Sprint 2.7 — gerenciamento de membros)

Executada com uma conta de teste dedicada (`teste@aigamestudioos.com`, Studio isolado, sem tocar o Studio fundador nem dados de outros Studios) + 2 contas descartáveis criadas via Admin API especificamente para este teste (sem fluxo de convite por email — `admin.auth.admin.createUser()`), **removidas por completo ao final**. Os fluxos negativos foram testados com chamadas REST diretas (não cliques na UI), exatamente para provar que quem bloqueia é o banco, não a tela:

**17/17 checks, todos contra o Supabase de produção real:**
- ✅ Member (sem `studio.manage_members`) tenta trocar o papel de outro membro → `DELETE` retorna 0 linhas (RLS filtrou, não é erro silencioso de aplicação).
- ✅ Member tenta remover outro membro → `UPDATE` bloqueado com erro explícito de RLS.
- ✅ Member tenta alterar o papel do Owner → bloqueado (0 linhas).
- ✅ Member tenta remover o Owner → bloqueado (erro explícito de RLS).
- ✅ Owner troca o papel de um membro (Member → Admin → Member) → funciona nos dois sentidos, persistido de verdade (confirmado com uma segunda consulta via `service_role`, não só a resposta do próprio `UPDATE`).
- ✅ Owner remove um membro → funciona, `archived_at` persistido.
- ✅ **Owner tenta alterar o próprio papel** → bloqueado (0 linhas) — a proteção do Owner vale até contra o próprio Owner, não é só "outros não podem mexer no Owner".
- ✅ **Owner tenta remover a si mesmo** → bloqueado com erro explícito de RLS.
- ✅ Ao final, o Owner original continua ativo e com o papel Owner no banco — nenhum dado real foi alterado por este teste.

Isso responde item a item à revisão técnica pedida: `UPDATE` com `USING`+`WITH CHECK` (confirmado no dump), `user_roles` tem política de `DELETE` própria (não há política de `UPDATE` nenhuma nessa tabela — troca de papel só é possível via `DELETE`+`INSERT`, o que é mais seguro que permitir `UPDATE` parcial), proteção contra alterar o papel do Owner (testado e confirmado, inclusive pelo próprio Owner), proteção contra um Admin se auto-promover a Owner (mesma exclusão de `role_id` cobre isso — `INSERT` de uma linha com a role "Owner" é bloqueado para qualquer chamador autenticado, não só para quem tenta alterar outra pessoa), proteção contra remover o Owner (testado), proteção contra trocar `studio_id` durante o update (o `WITH CHECK` já exige `studio_id = current_user_studio_id()` no valor final da linha, o que bloqueia qualquer tentativa de reatribuir a linha a outro Studio).

### `pnpm check:schema`

✅ Verde, com o script corrigido — `Schema de produção em sincronia com supabase/migrations/`.

### Golden Path de produção do Release Pipeline (Sprint 2.4/2.5/2.6)

Não reexecutado nesta sessão (o usuário priorizou fechar a validação de RLS/membros, que era o pedido explícito). O schema já está confirmado em produção (colunas via PostgREST) — o Golden Path funcional completo (Version→Build→Release→Submission→Timeline→widgets do Dashboard) usando a conta de teste dedicada fica como o próximo passo natural, não bloqueado por nenhuma credencial desta vez.

### Classificação final

- **Sprint 2.4** (schema Release Pipeline): ✅ schema confirmado em produção via PostgREST. Golden Path funcional em produção ainda não reexecutado (ver acima) — chamar de "parcialmente validado em produção" até isso ser feito.
- **Sprint 2.5** (UX de criação + hardening): ✅ schema do qual depende confirmado em produção. Golden Path funcional em produção não reexecutado nesta sessão — mesma pendência do 2.4.
- **Sprint 2.6** (eventos tipados + widgets): ✅ schema confirmado. Widgets do Dashboard em produção não reexecutados nesta sessão.
- **Sprint 2.7** (gerenciar membros): ✅ **completamente validado em produção** — schema, RLS, fluxos positivos e negativos, todos com evidência real contra o banco de produção.

### Pendências

- Reexecutar o Golden Path funcional (não só o schema) do Release Pipeline em produção (Sprints 2.4/2.5/2.6) — próximo passo natural, sem bloqueio de credencial.
- Revogar/confirmar a revogação do token que foi colado na conversa por engano (ação do usuário, fora do que o agente consegue verificar).
- Débitos técnicos já registrados em sprints anteriores (`build_number`, `artifact_url`, N+1 em `usePublishableReleases`, catálogo de `permissions` sem UI) seguem no backlog.

### Próximo Sprint

A definir com o usuário — Sprint 2.6 original (Services/use cases/eventos formais além do que já foi feito) ou o Golden Path de produção pendente listado acima.

---

## Sprint 2.8 — Store Connections: schema + RLS + Vault (sem UI)

**Status:** Concluído (validado localmente); produção pendente de credencial
**Período:** 2026-08-06

### Objetivo

Primeiro dos 3 incrementos em que "Store Connections" (conectar contas reais da Apple/Google) foi dividido, após uma Fase 1 de auditoria obrigatória revelar que o escopo pedido (Vault + 2 adapters de API externa reais + RLS + UI + eventos, tudo num sprint) excedia os limites deste repositório — e que duas peças do pedido contradiziam decisões de arquitetura já congeladas. Ver "Conflitos de arquitetura" abaixo. Divisão confirmada com o usuário: **2.8** (este) = RLS com gate + mecanismo de segredo (Vault) + repository, sem UI. **2.9** = adapters Apple/Google reais em `packages/integrations/` (Adapter Pattern, `AGSOS-SPEC-008`). **2.10** = UI (`Settings → Store Connections`) + eventos emitidos de verdade + Playwright + produção completa.

### Fase 1 — Auditoria (resumo; auditoria completa feita via agente de pesquisa antes de qualquer código)

**O que já existia:** `store_connections`/`certificates`/`provision_profiles` desde `20260716000006_publishing.sql`, nunca usadas por nenhum repository/UI. `store_connections.credentials_ref text` já vinha com o comentário original *"referência a Supabase Secrets; nunca a credencial em si"* — mesmo texto em `DATA_MODEL.md` e citando `AGSOS-SPEC-004 §13`. `platforms` (App Store/Google Play/Steam, já seedada) já é o relacionamento pretendido — `store_connections.platform_id` já existe, não um enum `provider` novo. `AGSOS-SPEC-008` (frozen) já especifica Adapter Pattern obrigatório para toda integração externa, com pasta dedicada `packages/integrations/{apple,google-play,...}/` — o pacote já existe no monorepo (buildável), só vazio (`export {}`).

**O que estava parcialmente pronto:** schema existia mas sem RLS com gate de permissão (só o `*_isolation` genérico antigo — mesmo padrão que o Sprint 2.7 já tinha encontrado furado em `users`/`user_roles`); `packages/integrations` scaffolded mas sem nenhum adapter.

**O que realmente faltava:** RLS com gate, o mecanismo real por trás de `credentials_ref` (documentado mas nunca implementado — sem Vault, sem `supabase/functions/`), repository, adapters, UI, eventos.

### Conflitos de arquitetura encontrados e resolvidos ANTES de escrever código (parado e explicado ao usuário, conforme instruído)

1. **`encrypted_credentials` (pedido) vs `credentials_ref` (já decidido e congelado).** Adicionar uma coluna nova de credencial "criptografada" teria contradito o padrão de ponteiro já documentado em `DATA_MODEL.md`/`AGSOS-SPEC-004 §13` e já materializado no nome da coluna existente. Resolvido: mantido `credentials_ref`, implementado o mecanismo que faltava com **Supabase Vault** (extensão `supabase_vault`, nativa do Postgres do Supabase — é literalmente "Supabase Secrets").
2. **Chamar as APIs da Apple/Google direto numa Server Action vs Adapter Pattern (`AGSOS-SPEC-008`, frozen).** Adiado para o Sprint 2.9 — os adapters (`IntegrationAdapter.connect()/validate()`, `ApplePublishingAdapter`) vivem em `packages/integrations/`, não em código de `apps/web`.

### Arquivos criados

- `supabase/migrations/20260806000001_store_connections_vault.sql` — colunas novas em `store_connections` (`display_name`, `last_validation_at`, `last_error`, `metadata`); `create extension supabase_vault`; função `set_store_connection_secret()` (SECURITY DEFINER — valida posse do Studio + `studio.manage_store_connections` inteiramente dentro da função antes de tocar `vault.*`, nunca expõe o segredo de volta); trigger `store_connections_delete_secret` (limpa o Vault num DELETE de verdade); permissão `studio.manage_store_connections` no catálogo + RLS dividida (`_select`/`_insert`/`_update`/`_delete`, mesmo padrão de `studio.manage_members`); `bootstrap_studio_for_current_user()` recriado só para incluir a permissão nova na lista fixa do Admin (senão todo Studio criado a partir de agora teria Admin sem essa permissão, apesar do backfill cobrir os Studios já existentes).
- `packages/database/src/repositories/store-connections-repository.ts` — `listByStudio()`, `getById()`, `create()` (sem credencial ainda), `update()` (campos não-sensíveis), `setSecret()` (chama a RPC, nunca grava `credentials_ref` via `update()` direto), `markValidationResult()`, `delete()`.

### Arquivos alterados

- `packages/database/src/generated/database.types.ts` — `StoreConnectionsRow` com as colunas novas; `Functions.set_store_connection_secret` registrada (necessário para `.rpc()` tipar — achado ao rodar `pnpm build`, não hipotético).
- `packages/database/src/index.ts` — export do repository novo.
- `apps/web/lib/domain-events.ts` — payloads tipados dos 4 eventos pedidos (`StoreConnectionCreated`/`Updated`/`Validated`/`Deleted`) + helper `storeConnectionEvent()`, união separada de `ReleasePipelineEvent` (domínio diferente). **Nenhum call site emite estes eventos ainda** — não existe UI/hook que crie/edite/valide/remova uma Store Connection nesta sprint; os tipos ficam prontos para os Sprints 2.9/2.10 usarem.

### Bugs reais encontrados e corrigidos (achados testando contra Postgres real, não hipotéticos)

1. **`vault.delete_secret(uuid)` não existe** nesta versão da extensão (`supabase_vault 0.3.1`) — só `vault.create_secret()`/`vault.update_secret()` são expostas como função. A suposição inicial (baseada só na documentação) estava incorreta. Corrigido: a trigger de limpeza apaga direto de `vault.secrets` (a tabela real por trás da view `vault.decrypted_secrets`), não chama uma função inexistente. Corrigido antes de qualquer commit (a migration nunca tinha sido compartilhada).
2. **`Database["public"]["Functions"]` precisa registrar toda RPC nova** — sem isso, `client.rpc("set_store_connection_secret", ...)` falha o `pnpm build` do `packages/database` com erro de tipo (a lista de nomes válidos vem só das funções já registradas). Não é um bug do código em si, é um lembrete de processo: toda migration que adiciona uma função `RPC`-callable precisa de uma entrada correspondente em `database.types.ts`.

### Débitos técnicos / decisões em aberto (registradas, não escondidas)

- **Remoção de Store Connection é DELETE real (limpa o Vault via trigger), não soft-delete** — diferente do resto do projeto (`archived_at`). Decisão provisória: como não há UI nesta sprint, "remover" foi definido do jeito mais simples que já cobre a limpeza do segredo. Revisar no Sprint 2.10 (UI) se soft-delete reversível (arquivar sem apagar o segredo, permitir reconectar) faz mais sentido para a experiência do usuário — nesse caso a trigger de limpeza precisaria ser condicionada a um DELETE de verdade, não a um archive.
- `AGSOS-SPEC-008 §9` também define uma tabela `integration_jobs` (fila de retry/rate-limiting) — não criada nesta sprint; só necessária quando os adapters do Sprint 2.9 de fato chamarem APIs externas com retry.
- Eventos tipados (`StoreConnectionEvent`) definidos mas não emitidos por nenhum código ainda — ver acima.

### Validações executadas

`pnpm build`/`lint`/`typecheck` verdes (12/12). Migration aplicada contra Postgres real (local, Docker, `supabase db reset` — reconstrução completa do zero, não incremental) — confirmado via `\d store_connections` (colunas/policies/trigger) e `\dx`/`\df vault.*` (extensão e funções disponíveis de verdade, não só assumidas pela documentação).

Fluxo completo validado com 2 contas reais (Owner/Member) num Studio de teste criado especificamente para isso (deletado ao final, sem resíduo): **18/18 checks** — Owner cria Store Connection; Member não consegue (RLS bloqueia INSERT); Member consegue listar (SELECT aberto ao Studio); Owner grava o segredo via `setSecret()`/RPC; `credentials_ref` fica preenchido mas nunca contém o segredo em texto puro; o segredo real só é legível via `psql` direto no schema `vault` (nunca via PostgREST/API, nenhum role tem acesso a esse schema pela API) — confirmando que "nunca expor credenciais ao frontend" é garantido pelo banco, não só pela ausência de um endpoint; Member tenta sobrescrever o segredo via RPC → bloqueado (a função verifica a permissão internamente); segredo original permanece intacto; Owner atualiza `display_name`; Member não consegue (RLS bloqueia UPDATE); Owner marca uma validação simulada (`status=CONNECTED`); Member não consegue remover (RLS bloqueia DELETE); Owner remove → linha e segredo no Vault ambos removidos (trigger confirmada funcionando).

### Validação em produção

**Não executada nesta sessão** — sem `SUPABASE_ACCESS_TOKEN`/`SUPABASE_DB_URL` disponíveis (o token usado no Sprint 2.7.1 foi apagado ao final daquela sessão, como deveria). Migration ainda não commitada/pushada neste ponto do relatório — ver seção de fechamento após o commit para o que foi de fato enviado a produção nesta sessão.

### Golden Path / Playwright

Não aplicável — este sprint não tem UI (por decisão explícita da divisão). A validação funcional equivalente é o script de 18 checks contra Postgres real descrito acima.

### Pendências

- Aplicar esta migration em produção (mesmo processo do `DEPLOY_RUNBOOK.md` — precisa de credencial).
- Sprint 2.9 — adapters Apple (Issuer ID/Key ID/Private Key/.p8/Team ID) e Google Play (Service Account JSON) em `packages/integrations/`, seguindo `AGSOS-SPEC-008`.
- Sprint 2.10 — UI `Settings → Store Connections`, eventos emitidos de verdade, Playwright, validação de produção completa (schema + funcional).
- Revisar a decisão de DELETE-real-vs-soft-delete quando a UI existir (acima).

### Próximo Sprint

Sprint 2.9 — adapters Apple/Google reais (`packages/integrations/`), conforme divisão confirmada com o usuário.

---

## Sprint 2.9 — Apple App Store Connect (infraestrutura da integração completa)

**Status:** Concluído (validado localmente, produção pendente de credencial); Google Play e publicação de verdade explicitamente fora de escopo, por instrução do usuário
**Período:** 2026-08-06

### Fase 1 — Auditoria (obrigatória, feita antes de qualquer código)

**O que já existia:** todo o backend do Sprint 2.8 (`store_connections` com RLS + gate de permissão, Vault, `set_store_connection_secret()`, repository); `packages/integrations` scaffolded (buildável) mas vazio; `AGSOS-SPEC-008 §3` já especifica o contrato `IntegrationAdapter`/`ApplePublishingAdapter` exato pedido.

**O que estava parcialmente pronto:** nada consumia o Vault ainda (só escrita, sem leitura server-side) — `get_store_connection_secret()` não existia. Nenhum adapter real. Nenhuma UI.

**O que realmente faltava:** adapter Apple completo (JWT ES256, cliente HTTP, `health()`/`listApps()`/`getApp()`), RPC de leitura do segredo restrita a `service_role`, Server Action orquestrando UI→Adapter→API, UI completa (`Settings → Store Connections`), eventos emitidos de verdade (só tipados desde o 2.8), permissão `clear_store_connection_secret()` para "Disconnect".

**Arquivos a alterar (confirmado antes de codificar):** `packages/integrations/src/apple/*` (novo), `packages/database` (migration + repository + types), `apps/web` (Server Action, hook, página, componentes, link em `/settings/studio`). 3 packages tocados (`database`, `integrations`, `web`) — dentro do limite do `CLAUDE.md`.

**Estimativa:** ~21 arquivos, 10 novos — no limite superior recomendado, mas ainda dentro do teto (`CLAUDE.md`: máx. 10 novos, máx. 3 packages). Não precisou de nova divisão.

### Restrição adicionada pelo usuário antes de implementar (ajuste importante ao plano)

Sem credenciais reais de Apple Developer disponíveis nesta sessão (Issuer ID/Key ID/.p8/Team ID de uma conta de verdade) — instrução explícita: entregar toda a infraestrutura e UI, mas **nunca simular sucesso**. A validação com credenciais reais fica documentada como pendência explícita, não escondida atrás de um "funciona" não verificado. Ver "Validação com credenciais reais" abaixo.

### Arquitetura implementada (AGSOS-SPEC-008 §3)

UI → Server Action (`validateStoreConnection`) → `ApplePublishingAdapter` → App Store Connect API → Resposta. A UI (`apps/web/app/settings/store-connections/page.tsx`) nunca importa `@agsos/integrations` nem chama a Apple diretamente — só o hook, que só chama a Server Action para o passo de validação (criar/editar/disconnect/remover continuam client-side, via RLS, como no Sprint 2.8).

### Arquivos criados

- `packages/integrations/src/apple/{types,jwt,client,errors,adapter}.ts` — adapter completo: `connect()`/`disconnect()`/`health()`/`listApps()`/`getApp()`. JWT ES256 construído com `node:crypto` nativo (sem dependência nova — `createSign("sha256")` + `dsaEncoding: "ieee-p1363"` para o formato raw r||s que JWS exige). Erros sempre sanitizados por status HTTP (`sanitizeAppleError`), nunca ecoam a resposta bruta da Apple.
- `supabase/migrations/20260807000001_store_connection_secret_read.sql` — `get_store_connection_secret()` (leitura do Vault, `GRANT` só para `service_role` — nunca `authenticated`, diferente de todas as outras RPCs deste projeto até agora); `clear_store_connection_secret()` ("Disconnect": limpa Vault + `credentials_ref`, mantém a linha, diferente do DELETE real do Sprint 2.8); fecha um gap de `revoke ... from public` que `set_store_connection_secret()` (Sprint 2.8) nunca tinha.
- `apps/web/app/settings/store-connections/{page,actions}.tsx` — UI completa (lista, criar, validar, editar, disconnect, remover) + Server Action.
- `apps/web/hooks/use-store-connections.ts`, `apps/web/lib/store-connection-status.ts`.

### Arquivos alterados

- `packages/database/src/repositories/store-connections-repository.ts` — `getSecret()` (só para uso via Server Action/admin-client), `clearSecret()`, `markValidationResult()` ganhou `discoveredApps` (persistido em `metadata.apps`, coluna já existente desde o Sprint 2.8 — nenhuma tabela nova para isso).
- `packages/database/src/generated/database.types.ts` — 2 `Functions` novas registradas.
- `apps/web/lib/domain-events.ts` — `StoreConnectionHealthCheckedPayload`/`StoreAppsDiscoveredPayload`, união `StoreConnectionEvent` completa; os 6 eventos agora têm pelo menos um call site real (Server Action + hook).
- `apps/web/app/settings/studio/page.tsx` — card com link para `/settings/store-connections` (sidebar principal não alterada — `SPEC-005 §9` congela sua ordem; mesmo padrão já usado para `/settings/account`, alcançável só pelo menu do usuário).
- `packages/integrations/package.json`/`tsconfig.json` — `@types/node` (necessário para `node:crypto`/`fetch`/`Buffer` tipados; achado ao rodar `pnpm build`, não hipotético) e `types: ["node"]`.
- `apps/web/package.json` — dependência `@agsos/integrations` + `prebuild` estendido.

### Bugs reais encontrados e corrigidos (achados testando, não hipotéticos)

1. **`packages/integrations` sem `@types/node`** — `pnpm build` falhava (`Cannot find name 'Buffer'/'fetch'/'AbortController'`). Corrigido adicionando a devDependency + `types: ["node"]`, mesmo padrão já usado em `packages/database`.
2. **`founder@aigamestudio.os` (a conta usada em quase toda validação local deste projeto) não tinha NENHUMA permission** — achado ao tentar criar a primeira Store Connection localmente, bloqueado pela RLS com "Você não tem permissão". Causa raiz: o Studio seedado (`supabase/seed.sql`/`supabase/seed/02_demo_studio.sql`) foi criado antes do sistema de roles/permissions existir (Sprint 1.7) e **nunca recebeu um backfill de `role_permissions`** — diferente de todo Studio criado via `bootstrap_studio_for_current_user()` (assinaturas reais, inclusive em produção), que já concede ao Owner todas as permissions. Isso nunca foi pego antes porque os Sprints 1.8d-4/2.7 testaram permissão com um Studio à parte, não com `founder`. **Não afeta produção** (nenhum Studio real foi criado por este caminho — todos vêm do bootstrap real). Corrigido nos dois arquivos de seed (o "fonte" `seed/02_demo_studio.sql` e o "gerado" `seed.sql`, que é o que a CLI realmente lê — ver achado 3).
3. **`supabase/seed.sql` é gerado a partir de `supabase/seed/*.sql`, mas não existe nenhum script que regenere automaticamente** — editei só o "source" (`seed/02_demo_studio.sql`) primeiro, e o `db reset` seguinte não pegou a mudança, porque `supabase/config.toml` aponta `sql_paths = ["./seed.sql"]`, não para a pasta `seed/`. Corrigido replicando a mudança manualmente nos dois arquivos (mesmo processo manual que o cabeçalho do `seed.sql` já indicava ser necessário, só não documentado como um passo explícito em lugar nenhum). Registrado como débito de processo abaixo.

### Débitos técnicos / decisões em aberto

- **Sem script que regenere `seed.sql` a partir de `seed/*.sql`** — toda edição a um dos arquivos-fonte precisa ser replicada manualmente no gerado, ou a mudança não tem efeito (achado real, item 3 acima). Vale um script `scripts/regenerate-seed.sh` futuro.
- `AGSOS-SPEC-008 §9` (`integration_jobs`, fila de retry/rate-limit) segue não implementado — só necessário quando houver retry real de verdade (esta sprint faz uma chamada síncrona por `Validate Connection`, sem fila).
- Débitos já registrados em sprints anteriores (`build_number`, `artifact_url`, N+1 em `usePublishableReleases`, DELETE-real-vs-soft-delete de Store Connections) seguem no backlog.

### Validações executadas (local, banco real)

`pnpm build`/`lint`/`typecheck` verdes (12/12). Migration aplicada e validada via `supabase db reset` completo — `GRANT`s confirmados via `pg_shdepend` (`get_store_connection_secret` só para `service_role`, nenhuma das 3 funções com `PUBLIC` residual).

**Golden Path via Playwright (UI real, banco real): 15/15 checks** — login, navegação até `/settings/store-connections` (via link, não sidebar), criar conexão Apple com credenciais sintaticamente válidas mas falsas, clicar "Validate" (chamada de rede real à `api.appstoreconnect.apple.com`, não mock), a validação **falha de verdade** (não simula sucesso) com a Apple real respondendo `401` para o JWT bem-formado porém não autêntico — confirmado que a mensagem exibida é a sanitizada (`"Credenciais inválidas ou expiradas..."`), nunca a resposta bruta da Apple; nenhum stack trace, Private Key, JWT ou `credentials_ref` aparece em nenhum momento na tela nem nos logs do servidor; status `ERROR` persiste após reload e após logout/login; Disconnect limpa o Vault e volta o status para Desconectado; Remover apaga a linha. Zero erros de console durante toda a sessão.

**Fluxo negativo de permissão/RLS (script direto, banco real): 9/9 checks** — Member sem `studio.manage_store_connections` bloqueado tanto de `get_store_connection_secret` (rejeitado por falta de `GRANT`, nem chega a avaliar a função) quanto de `clear_store_connection_secret` (rejeitado pela checagem de permissão dentro da função); confirmado que **nem o Owner autenticado consegue chamar `get_store_connection_secret`** — só `service_role` tem o `GRANT`, prova de que "nunca retornar secrets pelas APIs" é garantido estruturalmente, não por uma checagem que poderia ter um bug; segredo permanece intacto após a tentativa do Member; Owner consegue de verdade limpar via Disconnect.

### Validação com credenciais reais da Apple

**Não realizada — sem conta Apple Developer com App Store Connect API habilitada disponível.** Por instrução explícita do usuário, isso não bloqueou o sprint nem foi contornado: toda a infraestrutura (Vault, RLS, adapter, JWT, UI) está pronta e testada com o máximo de realismo possível sem uma credencial verdadeira (a chamada de rede é real, contra a Apple real, só a credencial em si é fabricada). O caminho de sucesso (`listApps()` retornando Apps de verdade, contador de Apps > 0, `status = CONNECTED`) permanece **não verificado** até uma credencial real ser fornecida. Isso não é uma simulação de sucesso — é uma lacuna documentada.

### Validação em produção

Não executada nesta sessão — sem `SUPABASE_ACCESS_TOKEN`/`SUPABASE_DB_URL` disponíveis (mesma situação recorrente; token não foi provisionado nesta sessão). Duas migrations agora pendentes de aplicar em produção desde o Sprint 2.8 (`20260806000001`) + esta (`20260807000001`).

### Segurança — checklist explícito pedido

- Private Key/JWT/secrets: nunca impressos em log, nunca retornados por nenhuma API, nunca aparecem na UI — confirmado nos 15+9 checks acima.
- `credentials_ref`: nunca retornado como o segredo em si (é só um UUID do Vault); `get_store_connection_secret()` é o único caminho de leitura do valor real, e só `service_role` pode chamá-lo.
- Nenhum evento (`studio_events`) carrega qualquer campo sensível — os payloads tipados (`domain-events.ts`) nunca incluem `secret`/`privateKey`/`credentials_ref`/JWT, só metadados não sensíveis (`ok: boolean`, `count: number`, `status`, `error` sanitizado).

### Próximo Sprint

Aguardando aprovação explícita do usuário antes de iniciar qualquer novo sprint (Sprint 2.10 NÃO iniciado automaticamente, por instrução). Quando aprovado: possíveis focos são Google Play (mesma arquitetura de adapter), validação com credenciais Apple reais quando disponíveis, ou aplicar as 2 migrations pendentes em produção.

---

## Sprint 2.9.1 — Fechamento de produção + correção de segurança crítica

**Status:** Concluído
**Período:** 2026-08-07

### Objetivo

Fechar a validação de produção do Sprint 2.9 (aplicar as 2 migrations pendentes, `check:schema`, confirmar deploy) — nada de desenvolvimento novo, por decisão do usuário. Também corrigido: reclassificação de linguagem ("integração real" → "infraestrutura da integração completa") pedida em revisão externa, registrada em `DECISIONS.md` como vocabulário padrão para sprints futuros de integração.

### Achado crítico de segurança (não em código local — só apareceu validando produção de verdade)

Ao aplicar as migrations do Sprint 2.8/2.9 em produção e inspecionar os `GRANT`s reais (via `supabase db dump --linked`, não confiando só no ledger), `get_store_connection_secret()`/`set_store_connection_secret()`/`clear_store_connection_secret()` estavam com `EXECUTE` concedido a `anon` (e `get_store_connection_secret()` também a `authenticated`) — quando o design pretendia `get_store_connection_secret()` restrita só a `service_role`. **Confirmado com uma chamada REST anônima real contra produção antes de qualquer correção** (não foi uma suposição a partir do dump): a chamada executou sem erro de permissão.

**Causa raiz:** o projeto Supabase de produção concede `EXECUTE` em toda função nova diretamente às roles nomeadas `anon`/`authenticated`/`service_role` (privilégio padrão do projeto) — `revoke execute ... from public` (a regra estabelecida no Sprint 2.9 para `set_store_connection_secret()`) só remove o grant implícito do pseudo-role `PUBLIC`, nunca toca grants explícitos já concedidos a roles nomeadas. **O Postgres local (Docker) não reproduz esse comportamento** — confirmado que a mesma função, testada localmente 9/9 vezes no Sprint 2.9, já ficava corretamente restrita a `service_role` sem ajuste nenhum. É por isso que toda a validação local (extensa, incluindo o teste explícito "Owner autenticado não consegue chamar `get_store_connection_secret`") nunca pegou isso — o ambiente local e o hospedado divergem nesse comportamento específico de grants padrão.

**Correção:** `supabase/migrations/20260807000002_store_connection_secret_grants_fix.sql` — `revoke ... from anon, authenticated` explícito (não só `public`) nas três funções, aplicada em produção no mesmo ciclo em que foi descoberta, sem esperar um sprint novo. Confirmado depois com uma nova chamada REST anônima: as três funções agora retornam `401 permission denied` para `anon`.

Documentado com detalhe em `DEPLOY_RUNBOOK.md` §11 — regra nova para todo `SECURITY DEFINER` futuro: `revoke ... from anon, authenticated` explícito, e validar com uma chamada REST anônima real contra produção antes de considerar o gate de segurança fechado (testar só localmente não é suficiente para este tipo de verificação).

### Ações executadas

1. `git push origin main` do commit `a30a6c7` (Sprint 2.9) — já estava pronto, só não tinha sido enviado.
2. Deploy Vercel confirmado `success`.
3. Reclassificação de linguagem ("infraestrutura da integração completa") em `IMPLEMENTATION_LOG.md`/`METRICS.md`/`CHANGELOG.md`/`DECISIONS.md`/`PRODUCT_PROGRESS.md`/`RELEASE_NOTES.md`, com o vocabulário padrão ("transporte validado" vs. "funcional pendente") registrado em `DECISIONS.md` para sprints futuros.
4. Token de acesso obtido com segurança (arquivo fora do repositório, nunca colado na conversa — mesmo processo do Sprint 2.7.1).
5. `supabase migration list --linked` confirmou exatamente as 2 migrations esperadas como pendentes (`20260806000001`, `20260807000001`) — nenhuma surpresa desta vez.
6. `supabase db push --dry-run` revisado antes de aplicar de verdade.
7. `supabase db push` — as 2 migrations aplicadas.
8. Verificação independente via PostgREST (colunas novas) e `supabase db dump --linked` (texto das políticas/funções) — foi essa verificação que revelou o achado crítico acima.
9. Migration de correção (`20260807000002`) escrita, validada localmente, aplicada em produção imediatamente.
10. `pnpm check:schema` verde (3 migrations agora sincronizadas).
11. Token apagado (`shred -u`) ao final.

### Validação com credenciais Apple reais

Não realizada — sem conta Apple Developer de teste disponível nesta sessão também. Continua pendência explícita.

### Pendências

- Validação funcional real (`listApps()` com credenciais Apple verdadeiras) segue pendente.
- Vale uma auditoria dos `GRANT`s de TODAS as funções `SECURITY DEFINER` já existentes em produção (não só as do Sprint 2.8/2.9) para confirmar que nenhuma outra tem o mesmo problema de `anon`/`authenticated` indevido — não feita nesta sessão, por escopo (o usuário pediu só o fechamento do Sprint 2.9, não uma auditoria geral), mas registrada como recomendação de alta prioridade.

### Próximo Sprint

Sprint 2.10 — Google Play Adapter (mesma arquitetura do Apple), conforme decisão do usuário. Antes de declarar QUALQUER função `SECURITY DEFINER` nova seguramente restrita, validar com uma chamada REST anônima real contra produção — não só contra o ambiente local.

## Sprint 2.10 — Google Play Integration Foundation

**Escopo do usuário:** `GooglePlayPublishingAdapter` seguindo exatamente o contrato do Apple Adapter; armazenamento no Vault reusando o fluxo já validado; Validate Connection real contra a API do Google; persistir estado da conexão; eventos tipados; testar fluxos positivos e negativos; atualizar documentação. Fora de escopo (explícito): upload de AAB, criação de releases, publicação, edição da Play Store, screenshots, assets, reviews, analytics.

**Condição arquitetural adicional do usuário:** não copiar o Apple Adapter — extrair tudo que é comum (auth, tratamento de erro, retries, logging, contrato de adapter) em componentes compartilhados em `packages/integrations`, para que Steam/Microsoft/Nintendo/etc. no futuro reusem um framework real, não adapters quase-duplicados.

### Framework compartilhado (`packages/integrations/src/core/`)

- `types.ts` — `IntegrationAdapter` (connect/disconnect/health), `HealthResult`, `ListResult<T>`, `ItemResult<T>`.
- `http.ts` — `fetchJson()`, wrapper único de fetch+timeout (antes cada provider reimplementava seu próprio `AbortController`).
- `errors.ts` — `sanitizeHttpError()` (mapeamento genérico por status HTTP: 401/403/404/429/5xx) e `sanitizeUnexpectedError()`, nunca ecoando corpo bruto de resposta nem stack trace que possa conter um segredo.

Apple (Sprint 2.9) foi retrofitado sobre esse framework no mesmo sprint — `apple/{types,client,errors}.ts` passaram a usar os tipos/`fetchJson`/sanitização compartilhados, sem mudança de comportamento (só renomeação interna `apps`→`items`/`app`→`item` para bater com `ListResult`/`ItemResult`).

### Diferença real de protocolo: Apple vs. Google (não é um "quase igual")

A Apple assina um JWT novo (ES256) a cada chamada — API stateless por request. O Google usa Service Account OAuth2: assina um JWT de asserção (RS256, RFC 7523) uma vez, troca por um access token de curta duração em `oauth2.googleapis.com/token`, e usa esse access token (não o JWT) nas chamadas seguintes à Android Publisher API. `packages/integrations/src/google-play/oauth.ts` implementa esse fluxo com `node:crypto` puro, sem adicionar dependência nova (mesmo padrão do JWT da Apple no Sprint 2.9).

### Limitação real da Android Publisher API (não uma limitação de implementação)

Diferente da Apple (`GET /v1/apps` lista todos os apps do time), a Android Publisher API v3 **não tem nenhum endpoint "listar meus apps"** — todo recurso vive sob `applications/{packageName}/...`, exige saber o package name de antemão. Ajuste de design (aprovado pelo usuário via pergunta explícita antes de implementar): campo "Package Name" obrigatório no formulário de credencial Google; "Validate Connection" prova acesso criando um draft edit (`POST .../edits`) e apagando-o imediatamente (`DELETE .../edits/{id}`) — não uma `listApps()` fictícia. `fetchGoogleApps()` retorna, quando a validação passa, um único item com `id`/`name`/`packageName` iguais ao package name configurado (a API também não expõe o nome de exibição do app por nenhum endpoint simples) — documentado no código como limitação real da API, não um placeholder a corrigir depois.

### UI e Server Action

`apps/web/app/settings/store-connections/page.tsx` ganhou um seletor de provider (Apple App Store / Google Play) no diálogo de criação, com campos de credencial próprios de cada um (Apple: Issuer ID/Key ID/Team ID/.p8; Google: Package Name + JSON da Service Account), e o mesmo no diálogo de edição, decidido por qual plataforma (`platforms.name`, via `platform_id` da conexão) o card pertence.

`apps/web/app/settings/store-connections/actions.ts` — `validateStoreConnection()` agora resolve o provider pela `platforms` table (join por `platform_id`) e monta o adapter certo (`buildAdapter()`); nenhuma mudança na estrutura de autorização (RLS via `serverClient` primeiro, `admin-client` só para ler o segredo) herdada do Sprint 2.9.

Nenhuma migration nova foi necessária — `store_connections`/`set_store_connection_secret()`/`get_store_connection_secret()`/`clear_store_connection_secret()` (Sprint 2.8/2.9) já eram agnósticas de provider (guardam/devolvem uma string JSON opaca), e a platform "Google Play" já estava seedada desde o schema original de Publishing (`supabase/seed/01_global.sql`). Por não haver função `SECURITY DEFINER` nova, o Checklist de Segurança SQL (`DEFINITION_OF_DONE.md` §11) não se aplica a este sprint — confirmado, não pulado.

### Testes executados

**Positivo/negativo em rede real (sem Docker), Google Play adapter:**
1. JSON de Service Account malformado → `health()` retorna erro sanitizado, sem nenhuma chamada de rede (`"JSON da Service Account inválido ou incompleto"`).
2. Service Account sintaticamente válida (chave RSA 2048 gerada localmente) mas nunca registrada no Google, `packageName` fabricado → chamada real a `oauth2.googleapis.com/token` (confirmado: não é um mock), Google rejeita, adapter retorna erro sanitizado sem nenhum fragmento da chave privada ou do JWT no corpo da mensagem. Mesmo padrão usado para validar o Apple Adapter no Sprint 2.9 (credencial sintaticamente válida, mas fabricada, contra o provedor real).

**Positivo/negativo no Supabase local (Docker), fluxo de Vault (reuso do Sprint 2.8/2.9.1):**
1. Login real como `founder@aigamestudio.os` (senha local `demo-password-local-only`, seed) → `POST /rest/v1/store_connections` com `platform_id` = "Google Play" (`10000000-0000-0000-0000-000000000002`, já seedado) → criação bem-sucedida.
2. `set_store_connection_secret()` autenticado com um JSON de credencial Google → sucesso.
3. `get_store_connection_secret()` como `authenticated` → `403 permission denied` (bloqueado, como esperado desde a correção do Sprint 2.9.1).
4. `get_store_connection_secret()` como `anon` (sem login) → `401 permission denied` (bloqueado).
5. `get_store_connection_secret()` como `service_role` → `200`, segredo correto devolvido.

Resultado: o mesmo comportamento de GRANT validado para a Apple no Sprint 2.9.1 se aplica sem nenhuma mudança para a Google Play, porque as três funções são genuinamente agnósticas de provider — nenhum SQL novo, nenhuma regressão.

**Build/lint/typecheck:** `pnpm turbo run build lint typecheck` — 36/36 tasks (12 packages × 3), incluindo o build completo do Next.js (18 rotas, incluindo `/settings/store-connections`).

### Pendência explícita

Validação funcional real (`Validate Connection` bem-sucedido contra uma app de verdade no Google Play Console) não foi possível nesta sessão — sem Service Account real associada a um app no Play Console disponível. Mesmo vocabulário do Sprint 2.9 (`DECISIONS.md`): **integração de transporte validada** (conectividade, protocolo OAuth2, autenticação, tratamento de erro — provado contra o Google real) vs. **integração funcional pendente** (um `Validate Connection` que de fato retorna sucesso, com uma Service Account real).

### Próximo Sprint

Sprint 2.11 — UI consolidada de Store Connections (conforme sequência definida pelo usuário após o Sprint 2.9.1), ou validação funcional real do Google Play assim que uma Service Account de teste existir.

## Sprint 2.10.1 — Integration Health / Observability

**Escopo do usuário:** com Apple e Google Adapters prontos, o gargalo deixou de ser infraestrutura e passou a ser observabilidade — visibilidade do comportamento das integrações antes de conectar contas reais. Escopo fixado pelo usuário com definições formais de produto (nunca decididas pelo Claude): janelas oficiais 24h/7d (sem janela configurável), 6 métricas oficiais (Success/Failure/Retry Rate, Call Count, Latência, Last Check), 5 status oficiais (`NOT_VALIDATED`/`HEALTHY`/`DEGRADED`/`ERROR`/`DISCONNECTED`) com regras de transição exatas, um evento operacional novo (`StoreConnectionCallCompleted`) com payload e regras de segurança explícitas. Fora de escopo (explícito): retry automático, cron, queue, worker, alertas externos, e-mail, Slack, observabilidade genérica, OpenTelemetry, nova integração.

### Auditoria inicial (item 1 do escopo)

`studio_events` já existia (Sprint 1.7, append-only, RLS por Studio) e já era usado para os eventos de domínio de Store Connection (`StoreConnectionValidated`/`HealthChecked`/`StoreAppsDiscovered`, Sprint 2.8/2.9) — mas nenhum desses eventos carregava duração, código de erro estável, ou uma marcação explícita de retry, então nenhuma métrica pedida (latência, success/failure/retry rate, call count) era computável a partir do que já existia. Decisão: um evento operacional novo, não reaproveitar/estender os de domínio (ver `DECISIONS.md` — distinção formal entre os dois tipos).

### Evento operacional novo: `StoreConnectionCallCompleted`

```
{
  provider: "APPLE" | "GOOGLE_PLAY";
  operation: "HEALTH" | "LIST_APPS" | "CONNECT" | "DISCONNECT";
  success: boolean;
  durationMs: number;
  isRetry: boolean;
  errorCode?: string;
}
```

Emitido em `apps/web/app/settings/store-connections/actions.ts` (`recordCallCompleted()`), envolvendo — nunca duplicando — as chamadas já existentes a `adapter.health()`/`adapter.listApps()` dentro de `validateStoreConnection()`: mede `Date.now()` antes/depois da mesma chamada, não faz uma segunda chamada externa só para medir. `isRetry` é sempre `false` nesta versão — não existe ainda nenhum botão de retry explícito para Validate Connection (diferente do Retry Build do Release Pipeline, Sprint 2.5) — documentado como limitação conhecida, nunca inferido por heurística de timestamp (instrução explícita do usuário: "Não inferir retry por timestamps").

`errorCode` vem de um classificador novo e estável, `classifyHttpStatus()` (`packages/integrations/src/core/errors.ts`) — buckets fixos (`UNAUTHORIZED`/`FORBIDDEN`/`NOT_FOUND`/`RATE_LIMITED`/`SERVER_ERROR`/`UNEXPECTED_ERROR`/`UNKNOWN`), nunca o texto da mensagem sanitizada (que pode mudar) nem o status HTTP cru (não é estável entre providers — a Apple pode responder `200` com um código de erro no corpo). `HealthResult`/`ListResult`/`ItemResult` (`core/types.ts`) ganharam um campo `code?: string` opcional só para isso — nunca faz parte do que é exibido ao usuário (`error` continua sendo só a mensagem sanitizada).

### Agregação read-side (`apps/web/lib/integration-health.ts`)

Funções puras, sem nenhuma dependência de banco — testadas com fixtures, não integração:
- `computeIntegrationHealthStatus()` — implementa as 5 regras oficiais exatamente como especificadas pelo usuário (`DISCONNECTED` > `NOT_VALIDATED` > `ERROR` > `DEGRADED`/`HEALTHY`, nessa ordem de prioridade).
- `aggregateCallWindow()` — Success/Failure/Retry Rate, Call Count, latência média e p95 (por índice sobre o array ordenado — sem biblioteca, correto para o volume esperado de chamadas de Validate Connection, não telemetria de alto volume). Taxas são `null` (não `0`) quando a janela não tem nenhuma chamada — "sem dado" é uma resposta diferente de "sempre falhou".
- `lastCheckOf()` — provider, sucesso, horário, duração, `errorCode` sanitizado da chamada mais recente.
- `buildConnectionHealthSummary()` — combina os três acima por Store Connection.

`apps/web/app/settings/store-connections/health-actions.ts` (`getIntegrationHealthSummary()`) busca os dados reais (conexões + platforms + `studio_events` dos últimos 7 dias, via `serverClient` — a mesma sessão de cookie de sempre) e chama as funções puras — só leitura, nenhuma chamada externa, nenhuma escrita. Isolação por Studio vem inteiramente da RLS já existente (`studio_events_isolation`), não é refeita manualmente.

### UI

Painel "Integration Health" dentro de cada card de Store Connection em `/settings/store-connections` (não um widget novo no Dashboard) — decisão de local: os dados são inerentemente por-conexão (Apple vs. Google têm métricas separadas), e a tela já tem o contexto de cada conexão renderizado; um widget de Dashboard resumindo tudo pode vir depois se/quando fizer sentido agregação cross-Studio, fora de escopo aqui. Badge de status (vocabulário `IntegrationHealthStatus`, cores/labels em `apps/web/lib/store-connection-status.ts`, deliberadamente separado do badge de `IntegrationStatus` já existente — nunca confundir os dois), grid de métricas 24h/7d, última duração/chamada, lista das 5 chamadas mais recentes. `handleValidate()` chama `refreshHealth()` no `finally`, então o painel reflete a chamada que acabou de acontecer sem esperar nenhum poll.

### Testes executados

**Fixtures (função pura, sem banco)** — `node --experimental-strip-types` rodando `integration-health.ts` diretamente contra 12 cenários (os 10 pedidos pelo usuário + 2 extras de latência/retry), 21 assertions, todas verdes: sucesso simulado via fixture (Apple), erro real sanitizado (Apple e Google, com `errorCode` propagado), cálculo 24h (ignora fora da janela), cálculo 7d (ignora fora da janela), conexão sem histórico (`NOT_VALIDATED`, `successRate` `null`), última chamada falhou (`ERROR` mesmo com sucesso anterior), última chamada passou após falha anterior (`DEGRADED`), ausência de eventos, isolamento entre Studios (ver abaixo — não é um teste de função pura, é de banco), `DISCONNECTED` tem prioridade sobre o histórico.

**Supabase local (Docker, `-x realtime,storage-api,imgproxy,studio,edge-runtime,logflare,vector` — os serviços pesados não excluídos causaram falha repetida de health-check neste ambiente por pressão de memória; excluí-los não afeta nada testado aqui, que usa só Postgres/PostgREST/GoTrue):**
1. Inserção autenticada de `StoreConnectionCallCompleted` (sucesso, Apple) → `201`.
2. Inserção autenticada (falha, Google, `errorCode: UNAUTHORIZED`) → `201`.
3. Inserção autenticada com `studio_id` de outro Studio (adulterado) → `403 permission denied` (RLS bloqueia insert também, não só select).
4. **Isolamento entre Studios:** criado um segundo Studio + usuário via Admin API; logado como esse segundo usuário, `GET /studio_events?event_name=eq.StoreConnectionCallCompleted` retornou `[]` — enquanto o founder, autenticado, via exatamente as 2 linhas dele. RLS (`studio_events_isolation`, já existente desde o Sprint 1.7) cobre o evento novo sem nenhuma alteração de schema.

**Playwright (contra Supabase local, nunca produção — `.env.local` trocado temporariamente e restaurado ao final da sessão de teste, confirmado com `diff`):**
- Clique real em "Validate" (conexão Google Play com credencial fabricada, Sprint 2.10) → chamada de rede real ao Google, rejeitada, painel de Integration Health atualizado ao vivo (`Call Count` 1→2, novo item no histórico recente, badge mudou para "Com erro") sem esperar reload.
- Tema claro e escuro (desktop) — contraste e badges legíveis nos dois.
- Mobile (390×844) e tablet (768×1024) — grid de métricas colapsa para 2 colunas sem overflow horizontal.
- Zero erros de console reproduzíveis (um erro `401` isolado apareceu numa única execução e não se repetiu numa segunda rodada idêntica com captura de todas as respostas HTTP — não rastreável a nenhuma chamada deste sprint, já que toda chamada externa acontece no processo Node do servidor, nunca exposta como fetch do browser).

**Build/lint/typecheck:** `pnpm turbo run build lint typecheck` — 36/36 tasks, incluindo o build completo do Next.js.

### Segurança

Nenhuma credencial, JWT, Service Account JSON, resposta bruta ou stack trace passa pelo evento novo ou pelo painel — confirmado por construção (o payload só tem `provider`/`operation`/`success`/`durationMs`/`isRetry`/`errorCode`, nenhum campo de texto livre vindo direto de uma exceção ou resposta de API) e por revisão manual de cada ponto onde `error`/`code` são atribuídos em `apple/client.ts` e `google-play/{client,oauth}.ts`. Nenhuma função `SECURITY DEFINER` nova — Checklist de Segurança SQL (`DEFINITION_OF_DONE.md` §11) não se aplica, confirmado, não pulado.

### Sem migration nova

Todo o sprint roda sobre `studio_events` (já existente desde o Sprint 1.7) — sem tabela de métricas dedicada, sem alteração de schema. `listByEventNameSince()` (`studio-events-repository.ts`) é só um novo método de leitura sobre a tabela existente.

### Débitos técnicos registrados

- `isRetry` é sempre `false` nesta versão — Retry Rate hoje sempre mostra `0%`, corretamente refletindo a realidade (nenhum retry explícito existe ainda), não um bug. Quando/se um botão de retry para Validate Connection for adicionado, ele precisa marcar `isRetry: true` explicitamente na chamada instrumentada.
- p95 de latência calculado por índice sobre o array já ordenado (sem biblioteca de percentil) — correto para o volume esperado (chamadas de Validate Connection, não telemetria de alto volume); reavaliar só se isso deixar de ser verdade.
- Painel de Integration Health vive em `/settings/store-connections`, não no Dashboard — decisão de escopo deste sprint (dados são por-conexão); um resumo agregado no Dashboard é trabalho futuro, não decidido aqui.

### Próximo Sprint

Retomar a sequência definida pelo usuário antes deste sprint: 2.11 — Upload real (AAB/IPA), depois 2.12 (Releases automáticos), 2.13 (Publicação), 2.14 (Reviews Sync), 2.15 (Crash & Analytics) — ou validação funcional real do Google Play assim que uma Service Account de teste existir, o que vier primeiro.

## Fase 0 do Sprint 2.11 — Fechamento formal do Sprint 2.10.1 (smoke-check de produção)

Antes de iniciar a auditoria do Sprint 2.11 (Binary Upload Foundation), o usuário exigiu um smoke-check autenticado do painel Integration Health em produção, usando exclusivamente a conta de teste `teste@aigamestudioos.com`.

### Achado crítico (bloqueou o smoke-check, corrigido antes de prosseguir)

O botão "Add Connection" apareceu desabilitado em produção. Investigação revelou `platforms` genuinamente vazia (`GET /rest/v1/platforms` → `[]`) — as linhas só existiam em `seed.sql`, que o Supabase CLI nunca aplica a um projeto hospedado. Nenhuma conta jamais conseguiu criar uma Store Connection real em produção, desde o Sprint 2.8. Detalhe completo, causa raiz e correção (migration `20260809000001_platforms_seed_backfill.sql`, aplicada em produção com o Gate de Schema §10 completo — dry-run revisado, `check:schema` verde, verificação REST independente) em `DECISIONS.md`.

### Smoke-check (Playwright, produção, conta de teste — evidência registrada)

Com `platforms` corrigida, o fluxo completo foi exercitado de ponta a ponta em produção:

1. **Login real** com `teste@aigamestudioos.com` — sucesso.
2. **Conexão sem histórico:** confirmado antes da correção (`platforms` vazia forçou esse estado) e depois via tela vazia "Nenhuma conexão ainda".
3. **Criadas 2 Store Connections reais** (Apple e Google), com credenciais sintaticamente válidas mas fabricadas (mesmo padrão dos Sprints 2.9/2.10 — nunca uma credencial real de terceiro usada em teste).
4. **Validate clicado em ambas** — chamadas de rede reais à Apple (`api.appstoreconnect.apple.com`) e ao Google (`oauth2.googleapis.com`), ambas corretamente rejeitadas.
5. **Status Apple e Google:** ambos badges "Com erro" (`ERROR`), corretos para a primeira chamada ter falhado.
6. **Erro sanitizado:** Apple → "Credenciais inválidas ou expiradas — confira Issuer ID, Key ID e a Private Key (.p8)."; Google → "Não foi possível validar a conexão." — nenhum, em nenhum dos dois casos, ecoando a chave/credencial fabricada.
7. **Métricas 24h e 7d:** ambos os blocos presentes e coerentes (`Failure 24h`/`Failure 7d` = 100%, `Call Count` = 1, latência real capturada em ms).
8. **Vazamento de segredo:** varredura do HTML/texto renderizado (padrões de chave PEM, `service_account`, JWT) — nenhum encontrado.
9. **Console:** zero erros em light/dark/mobile/tablet.
10. **Responsividade:** desktop, mobile (390×844) e tablet (768×1024) — grid de métricas colapsa sem overflow. Dark theme confirmado localmente no próprio Sprint 2.10.1 (o teste de produção não pegou dark de verdade — a preferência de tema salva da conta, não o `prefers-color-scheme` do browser, controla o tema pós-login; não re-testado em produção para não gerar mais escrita só por causa de um recheque cosmético já coberto localmente).
11. **Limpeza:** as 2 conexões de teste removidas ao final — conta restaurada ao estado original (confirmado por screenshot: "Nenhuma conexão ainda").

### Decisão

✅ Sprint 2.10.1 formalmente encerrado, com produção validada de ponta a ponta (não só localmente, como nas sessões anteriores) — o achado crítico de `platforms` foi corrigido antes de prosseguir, conforme instrução do usuário ("Se encontrar regressão, corrija antes de continuar"). Prosseguindo para a Fase 1 (auditoria) do Sprint 2.11 — Binary Upload Foundation.

## Sprint 2.11a — Artifact Storage Foundation

**Escopo:** primeiro dos quatro sub-sprints em que o Sprint 2.11 (Binary Upload Foundation) foi dividido antes de qualquer código (Fase 1, auditado contra Git/docs/schema real — ver troca com o usuário). Este sub-sprint cobre só a fundação de armazenamento: entidade `build_artifacts`, bucket privado `builds`, upload direto do browser (resumível/TUS), validação estrutural (nunca de assinatura) e UI mínima. Explicitamente fora de escopo (adiado para 2.11b/c/d): upload real à Apple/Google, `integration_jobs`/worker/queue, Edge Function de processamento, status de provider, publicação.

### Schema

- Migration `20260810000001_build_artifacts.sql`: tabela `build_artifacts` (Build 1→N BuildArtifacts, padrão de colunas de auditoria completo — incluindo `archived_actor_type/archived_actor_id`, não citados na lista original do usuário mas incluídos por consistência com toda outra tabela de negócio); enums `artifact_upload_status`, `artifact_validation_status`, `checksum_algorithm`; bucket privado `storage.buckets` `builds` (500MiB, `public=false`); função `SECURITY DEFINER` `create_pending_build_artifact()` (gera `storage_path` server-side, nunca aceito do browser); permission nova `builds.manage_artifacts` (primeiro namespace fora de `studio.*`, decisão explícita do usuário); policy de RLS em `storage.objects` (`build_artifacts_object_insert`) restringindo o upload TUS ao Studio do usuário + permissão.
- Checklist de Segurança SQL (`DEFINITION_OF_DONE.md` §11) aplicado à função nova: `revoke execute ... from public, anon` explícito antes do `grant ... to authenticated` — confirmado via `pg_proc.proacl` local (`{postgres=X/postgres,authenticated=X/postgres}`, sem `anon`).

### Decisão de arquitetura: TUS em vez de signed-URL para upload resumível

O plano inicial previa emitir um token assinado por objeto (`createSignedUploadUrl`) também para o caminho resumível. Corrigido durante a implementação: Supabase Storage não emite token assinado por objeto para uploads resumíveis (só para upload simples, não-resumível) — a única forma real de autorizar um upload TUS direto do browser é uma policy de RLS real em `storage.objects`, avaliada contra a sessão do próprio usuário (`anon key` + JWT), nunca a `service_role`. Por isso a policy `build_artifacts_object_insert` restringe o INSERT ao primeiro segmento do path (`storage.foldername(name)[1]`) = `current_user_studio_id()` + `current_user_has_permission('builds.manage_artifacts')`. Download e remoção continuam exclusivamente via `service_role` (nenhuma policy de SELECT/DELETE existe para `authenticated`).

### `packages/storage` — de stub a implementação real

Primeira implementação de verdade (`export {}` até este sprint): `sanitizeFilename`/`buildArtifactStoragePath` (espelha a lógica da RPC, para o client poder prever o path), `createSignedUploadUrl`/`createSignedDownloadUrl`/`objectExists`/`getObjectMetadata`/`removeObject`/`downloadObject` (Supabase Storage), `buildResumableUploadConfig` (monta a configuração TUS — endpoint/headers/metadata — para o `tus-js-client` no browser). Deliberadamente sem nenhum tipo de `@agsos/database` importado (AGSOS-SPEC-008 §6/AGSOS-SPEC-004: abstração agnóstica de provider, Supabase hoje, S3/R2 no futuro).

### Validação estrutural (nunca "assinatura validada")

`apps/web/lib/artifact-validation.ts` implementa parsing de Central Directory de ZIP (sem lib externa — formato pequeno o bastante, ZIP64 fora de escopo dado o limite de 500MiB) e checa estrutura mínima: AAB precisa de `BundleConfig.pb` + `base/manifest/AndroidManifest.xml`; IPA precisa de `Payload/*.app/`. Testado manualmente (sem suíte de testes automatizada no repositório — nenhuma existe hoje para nenhum package/app, gap pré-existente, fora do escopo deste sprint introduzir Vitest/Playwright) com fixtures sintéticas geradas ad-hoc: AAB válido → `valid`; IPA válido → `valid`; ZIP corrompido → `ZIP_STRUCTURE_INVALID`; AAB sem o manifest do módulo `base` → `AAB_STRUCTURE_INVALID`; tamanho acima de 500MB → `SIZE_LIMIT_EXCEEDED`; extensão fora de `.aab`/`.ipa` → `EXTENSION_NOT_ALLOWED`. 7/7 casos corretos.

### Segurança — validado contra Postgres/Storage real local (não só revisão de código)

Ambiente local com `storage-api` habilitado (`supabase start -x realtime,imgproxy,studio,edge-runtime,logflare,vector` — só esses excluídos, diferente do Sprint 2.10.1 que também excluía `storage-api`), dois Studios reais (`Studio A`/`Studio B`) + um Member sem a permissão nova, criados via signup real (não Admin API mockada):

1. `anon` chamando `create_pending_build_artifact` via RPC → `403`/`42501 permission denied for function` (função nunca alcançável por `anon`, confirmado via `pg_proc.proacl`, não só por comportamento observado).
2. `anon` fazendo `SELECT` em `build_artifacts` → `401`.
3. Owner do Studio A criando artifact no próprio build → `200`, `storage_path` gerado server-side com o formato correto (`{studio_id}/{build_id}/{artifact_id}/{filename}`).
4. Studio B tentando criar artifact num build do Studio A (RPC) → `403`, mensagem `"build não pertence ao Studio do usuário atual"`.
5. Studio B lendo (`SELECT`) o artifact do Studio A → `[]` (RLS bloqueia leitura cross-Studio).
6. Member do Studio A (sem `builds.manage_artifacts`) tentando criar artifact → `403`, `"sem permissão builds.manage_artifacts"`; o mesmo Member consegue `SELECT` (política aberta ao Studio, como Store Connections/Invites).
7. Owner do Studio A fazendo upload direto (via `POST /storage/v1/object/builds/...`, simulando o passo final do TUS) no próprio path → `200`.
8. Studio B tentando `POST` no path do Studio A (`storage.objects`) → `400`/`"new row violates row-level security policy"`.
9. `anon` tentando `POST` em qualquer path do bucket `builds` → `400`/RLS.
10. `authenticated` (sem nenhuma policy de SELECT em `storage.objects`) tentando baixar o objeto direto → `404`/`"Object not found"` (download direto sempre bloqueado, só signed URL funciona).
11. `service_role` gerando signed URL e baixando o conteúdo → `200`.
12. `service_role` removendo o objeto → `200`, `"Successfully deleted"`.

Todos os 12 casos de segurança do escopo do sprint confirmados via chamada real (REST/RPC/Storage API), não assumidos por revisão de código.

### Build/lint/typecheck

`pnpm --filter @agsos/storage build`, `pnpm --filter @agsos/database build`, `pnpm --filter web typecheck/lint/build` — todos verdes. `./scripts/metrics.sh`: typecheck ✅, lint ✅, build ✅ (73s monorepo completo).

### UI

`BuildArtifactPanel` (novo, em cada Build da tela de Version) — seleção de arquivo, checksum SHA-256 calculado no browser (`crypto.subtle`), upload TUS com barra de progresso e cancelamento, confirmação pós-upload, badges de `upload_status`/`validation_status` com os textos exigidos ("Enviando para o AGSOS", "Armazenado no AGSOS", "Validando artefato", "Artefato válido (estrutural)", "Artefato inválido"), erro sanitizado (nunca o código bruto sem tradução), download via signed URL, remoção (archive + best-effort remove do objeto físico). Nenhum texto menciona Apple/Google/publicação, conforme decisão do sprint.

### Fechamento do Gate de Produção (`DEFINITION_OF_DONE.md` §10) — sessão separada, credencial fornecida via arquivo

A sessão que implementou o código (acima) terminou com o sprint **parcialmente concluído**, sem `SUPABASE_ACCESS_TOKEN` disponível. Numa sessão seguinte, o usuário forneceu o token e a `SUPABASE_SECRET_KEY` via arquivo local (nunca colados na conversa, seguindo `DEPLOY_RUNBOOK.md` §4) e pediu o fechamento explícito do gate — distinguindo deliberadamente **evidência de backend/Storage** de **evidência de UI real (E2E)**, para que uma nunca fosse relatada como a outra.

**Migration aplicada em produção:** `supabase db push` (dry-run revisado antes) aplicou `20260810000001_build_artifacts.sql`. `npx supabase migration list` e `./scripts/check-schema-sync.sh` confirmaram, em duas rodadas separadas (antes e depois de todo o resto do trabalho desta sessão), que as 21 migrations locais batem exatamente com as aplicadas em produção — zero drift.

**Verificação independente do schema (não só o ledger de migrations):** `supabase db dump --linked --schema public,storage` confirmado contendo a tabela `build_artifacts` com todas as colunas esperadas, os 3 enums novos, o bucket `builds` (`public=false`, `file_size_limit=524288000`), as 4 policies de RLS em `build_artifacts`, a policy `build_artifacts_object_insert` em `storage.objects`, e os grants da função `create_pending_build_artifact` (`REVOKE ALL FROM PUBLIC` + `GRANT ... TO authenticated, service_role` — sem `anon`).

**Matriz de segurança contra produção real (REST/RPC/Storage API, com 2 Studios QA descartáveis + 1 Member sem a permission, criados via Admin API com `email_confirm: true` para não gerar tráfego de email real):**

| # | Caso | Resultado |
|---|---|---|
| 1 | `anon` chama RPC `create_pending_build_artifact` | `401`/`42501 permission denied for function` |
| 2 | `anon` faz `SELECT build_artifacts` | `200`, `[]` |
| 3 | Member sem `builds.manage_artifacts` chama a RPC | `403`, mensagem da própria função |
| 4 | Owner do próprio Studio chama a RPC | `200`, `storage_path` gerado server-side |
| 5 | Studio B chama a RPC no build do Studio A | `403`, "build não pertence ao Studio do usuário atual" |
| 6 | Studio B faz `SELECT` no artifact do Studio A | `200`, `[]` |
| 7 | Studio A faz `SELECT` no próprio artifact (controle) | `200`, 1 linha |
| 8 | Studio B faz upload em `storage.objects` no path do Studio A | `400`, RLS ("new row violates row-level security policy") |
| 9 | `anon` faz upload em `storage.objects` | `400`, RLS |
| 10 | Owner faz upload real no próprio path | `200` |
| 11 | `authenticated` tenta baixar direto (sem signed URL) | `400`/`404 Object not found` |
| 12 | `service_role` gera signed URL e baixa | `200` |
| 13 | Acesso público não autenticado ao bucket | bloqueado ("Bucket not found" — sem rota pública, bucket privado) |
| 14 | `authenticated` tenta `DELETE` direto no objeto (sem policy) | `403`/`400` |

14/14 confirmados via chamada real, não por inspeção de código.

**Golden Path backend (REST/RPC/Storage, sem UI):** upload de conteúdo inválido → download real dos bytes de produção → `validateArtifactStructure` → `ZIP_STRUCTURE_INVALID` corretamente detectado; upload de um AAB sintético válido → download real → validação → `VALID`; persistência confirmada após "reload" (novo `SELECT`) e após "logout/login" (novo login, novo token); cancelamento, retry e arquivamento/remoção exercitados diretamente sobre as linhas.

**Golden Path E2E/UI real (Playwright, Chromium, contra a aplicação Next.js deployada em produção — não substitui nem é substituído pelo backend acima):** ao tentar este teste, descoberto que **o código do app nunca tinha sido commitado/pushado** — só a migration do banco tinha ido para produção; o Vercel ainda servia a versão anterior, sem `BuildArtifactPanel`. Corrigido com `git push` (autorizado explicitamente pelo usuário para viabilizar o teste): commit `8b3680c`. Confirmado via `gh api .../commits/8b3680c/status` (`Vercel`, `state: success`, "Deployment has completed") — não só um HTTP 200 na URL, que não distinguiria deploy novo de cache.

Com o código real em produção, Playwright (instalado em diretório de scratch, reaproveitando o Chromium já em cache do Codespace — não precisou reinstalar) executou, contra uma Version/Build QA reais: login → painel `Artefatos (AAB/IPA)` visível → seleção de AAB sintético válido → SHA-256 calculado no browser → **upload TUS real via `tus-js-client`** (não simulado, não substituído por POST simples) → progresso visível → cancelamento → retry → `STORED` → validação estrutural → `VALID` → reload → persistência → logout/login → persistência → signed download (nome do arquivo confirmado, URL sem padrão de secret) → upload de arquivo inválido → `Artefato inválido` → remoção → 0 erros de console → 0 padrão de secret (`service_role`/`sb_secret_`) em console/URLs/downloads → 0 overflow horizontal em light/dark × desktop/mobile (4 combinações).

**Bug real encontrado pelo E2E (não pelo backend, que não exercitava esse caminho) e corrigido no mesmo ciclo:** `handleCancel()` chamava `markArtifactUploadFailed()` sem distinguir cancelamento de erro real — os dois caíam em `upload_status = FAILED`, escondendo que o usuário cancelou (a UI mostrava "Upload falhou" em vez de "Upload cancelado"). Corrigido adicionando um parâmetro `wasCanceled` que grava `CANCELED` quando o cancelamento é explícito do usuário. Commit `925ba09`, deployado (`gh api .../commits/925ba09/status` confirmado `success`), e o badge correto ("Upload cancelado") confirmado via novo teste Playwright antes de re-rodar o Golden Path completo do zero — 22/22 itens, sem regressão.

**Cleanup dos dados de teste em produção:** todo dado de negócio (`build_artifacts`, `builds`, `game_versions`, `games`, `projects`, `invites`, `roles`, `role_permissions`, `user_roles`, objetos do bucket `builds`) foi removido via REST (`service_role`) ao final de cada rodada. Um achado à parte, não específico deste sprint: `public.studios.owner_user_id` e `public.users.studio_id` formam uma FK circular `NOT NULL` nos dois lados — o último par Studio+User de um lote nunca pode ser removido via PostgREST sozinho (nenhuma ordem de `DELETE` satisfaz as duas constraints simultaneamente). Resolvido com um script SQL administrativo (rodado pelo usuário no SQL Editor, não pelo agente — sem acesso a `psql` de produção nesta sessão): guardrails que provam, antes de apagar qualquer coisa, que os 3 pares residuais (2 da suíte de segurança, 1 do E2E) têm nome/email inequivocamente QA, que nenhum dado de negócio ainda pendura neles, e que **todo `studio_events` desses Studios tem `actor_id` dentro do conjunto exato de usuários QA e `event_name` dentro da lista fechada de eventos que este sprint poderia ter emitido** (achado numa segunda tentativa — a primeira versão do script quebrou em `studio_events_studio_id_fkey`, que a v1 não previa) — a transação torna as duas FKs `DEFERRABLE` só durante sua própria execução, resolve os deletes, e reverte antes do commit, sem deixar nenhuma alteração de schema permanente. Os 3 `auth.users` correspondentes foram removidos depois, via Admin API (`service_role`, nunca exposta fora do arquivo local). Verificação final independente, via REST, confirmou **zero** resíduo em `auth.users`, `public.users`, `studios`, `build_artifacts`, `studio_events`, `roles`, `invites`, `projects`, `games`, `builds`, `game_versions`, `user_roles`, `role_permissions`, e zero objetos sob os 3 prefixos de Studio no bucket `builds`.

**Deploy Checklist (schema) — ver `DEPLOY_RUNBOOK.md`:**
```
[x] Migration criada em supabase/migrations/ com nome timestamped
[x] Migration validada localmente (supabase db reset, Postgres real, 2x)
[x] Migration aplicada em produção (supabase db push)
[x] scripts/check-schema-sync.sh rodado e verde (2x, início e fim)
[x] Golden Path executado contra produção — backend E UI real
[x] Evidências de produção anexadas ao relatório (tabela acima, IDs, HTTP codes reais)
[x] IMPLEMENTATION_LOG.md / METRICS.md atualizados com o resultado real
```

**Checklist de Segurança SQL (`DEFINITION_OF_DONE.md` §11) — função `create_pending_build_artifact`:**
```
[x] EXECUTE concedido só a authenticated (e service_role, sempre implícito)
[x] REVOKE EXECUTE explícito de anon (e de public)
[x] Teste autenticado com role que deveria ter acesso — sucesso confirmado
[x] Teste anônimo real (sem login) — 401/42501 confirmado
[x] service_role validado onde exclusivo — n/a aqui (função é de authenticated, não de service_role exclusivo)
[x] Evidência registrada (tabela de 14 casos acima, HTTP/código reais)
```

### Sprint 2.11a — CONCLUÍDO

Todos os gates obrigatórios passaram: schema sync, segurança em produção, Storage em produção, Golden Path backend, Golden Path E2E/UI real (com 1 bug encontrado e corrigido no processo), build/lint/typecheck, e cleanup de dados de teste — sem nenhum resíduo conhecido. Ver `METRICS.md` (entrada correspondente) para o snapshot numérico completo.

### Próximo sub-sprint

2.11b — Google AAB real (`edits.bundles.upload`), aguardando autorização explícita do usuário para começar.

## Sprint 2.11b — Google Play AAB Upload (TRANSPORTE VALIDADO / FUNCIONAL PENDENTE)

**Escopo:** primeiro fluxo real de envio de um `BuildArtifact` AAB já `STORED`+`VALID` (Sprint 2.11a) para um Google Play Edit rascunho via `edits.bundles.upload`. Termina no upload bem-sucedido + persistência — nunca commita/publica o Edit, nunca implementa `integration_jobs`/worker/queue (reservado ao Sprint 2.11d), nunca implementa upload resumível de verdade (decisão registrada em `DECISIONS.md`).

### Auditoria e decisões (Fase 0)
Confirmado contra a documentação oficial atual da Google (não por memória): `edits.bundles.upload` suporta upload simples (`uploadType=media`) e resumível (`uploadType=resumable`, chunks múltiplos de 256KB); Google recomenda timeout de 2 minutos. Decidido usar upload simples — resumível de verdade exigiria rastrear estado de sessão entre requests, fora de escopo sem worker. Quatro decisões registradas em `DECISIONS.md`: (1) transferência síncrona Storage→Google numa única Server Action, `maxDuration=120` alinhado ao timeout de "Upload" já congelado em AGSOS-SPEC-008 §10; (2) Edit sempre descartado após o upload (Play Console só permite 1 Edit ativo por app); (3) nova entidade `provider_uploads` (não reaproveita `submissions`, que é sobre revisão de loja); (4) nova permission `publishing.upload_build` (namespace novo).

### Bug de infraestrutura encontrado e corrigido durante a implementação
`export const maxDuration` num arquivo `"use server"` quebra o build — Next.js só permite funções async nesse tipo de arquivo; route segment config só é lido de Server Components. Corrigido criando `layout.tsx` escopado só à rota de Version.

### Production-readiness review (antes do push, a pedido do usuário)
1. **`maxDuration=120` aceito em produção:** confirmado contra a documentação oficial da Vercel — com Fluid Compute (padrão hoje), o limite é 300s por padrão em Hobby/Pro/Enterprise, extensível a 800s. `120` está bem dentro de qualquer plano.
2. **Runtime Node.js, não Edge:** confirmado — nenhuma rota do app exporta `runtime = "edge"`; o código usa `node:crypto`/`Buffer`/admin client, incompatíveis com Edge.
3. **Cópias de memória:** medido com fixtures sintéticas locais (10/50/100/200MB) — `downloadObject()`+`Buffer.from(await blob.arrayBuffer())` custa **~2.5-2.8x o tamanho do arquivo em RSS** (200MB → +550MB de RSS), porque o cliente Storage materializa o objeto como Blob antes de expor `arrayBuffer()` (cópia, não zero-copy). Achado real, não assumido.
4. **Limite temporário adotado:** sem override de memória documentado para a função Vercel deste projeto, **150MB** — guard implementado em `provider-upload-actions.ts`, rejeita antes de tentar o download/OAuth, erro sanitizado `ARTIFACT_TOO_LARGE`. Commit `905bd6f`.

### Deploy e migration
Push dos commits `ab1448e`/`905bd6f`. Deploy Vercel confirmado (`gh api .../status`, `state: success`). Migration `20260811000001_provider_uploads.sql` aplicada em produção (`supabase db push`), `check-schema-sync.sh` verde. Verificação independente via `supabase db dump`: tabela, enum, RPC, permission, RLS (4 policies), grants da função (`REVOKE ALL FROM PUBLIC`, `GRANT` só a `authenticated`+`service_role`, sem `anon`) — tudo confirmado.

### CRÍTICO — regressão de produção descoberta e corrigida durante a validação
Ao tentar `bootstrap_studio_for_current_user()` para contas QA novas, **toda conta nova falhava** com `23503` em `fk_studios_owner_user_id`. Causa raiz: o script de cleanup do GATE 9 do Sprint 2.11a tinha alterado essa constraint para `NOT DEFERRABLE` ao "reverter" ao fim da própria transação — mas o estado original real (nunca documentado antes) sempre foi `DEFERRABLE INITIALLY DEFERRED`, exigido pela ordem de inserts do bootstrap (studios antes de users, mesma transação). **Isso bloqueou todo onboarding de conta nova em produção desde aquele cleanup até esta correção.** Detalhe completo, causa raiz e decisão de política de cleanup revisada em `DECISIONS.md` [2026-08-10] e `DEPLOY_RUNBOOK.md` §17/§18.

**Correção:** `20260811000002_fix_studios_users_deferrable_fk.sql` — restaura `DEFERRABLE INITIALLY DEFERRED` nas duas constraints circulares. Testada localmente (bootstrap volta a funcionar) e aplicada em produção com autorização explícita do usuário fora do escopo original do 2.11b (bloqueante, não podia esperar). Revalidado com uma conta nova real em produção após a correção: `bootstrap_studio_for_current_user()` → `200`, Studio criado.

### Matriz de segurança em produção (REST/RPC real)
| # | Caso | Resultado |
|---|---|---|
| 1 | `anon` chama RPC `create_pending_provider_upload` | `401`/`42501 permission denied for function` |
| 2 | `anon` faz `SELECT provider_uploads` | `200`, `[]` |
| 3 | Member sem `publishing.upload_build` chama a RPC | `403`, mensagem da própria função |
| 4 | Studio B usa `build_artifact`/Store Connection do Studio A | `403`, "build_artifact não pertence ao Studio do usuário atual" |
| 5 | Studio B lê `provider_uploads` do Studio A | `200`, `[]` |
| 6 | Owner do Studio A cria `provider_upload` (Artifact `STORED`+`VALID`) | `200` |

6/6 confirmados via chamada real. Gate `STORED`+`VALID` da RPC também confirmado rejeitando artifact `PENDING`/`validation_status != VALID` antes de existir o `provider_upload` de sucesso.

### Golden Path de produção (backend real + UI real via Playwright)
Artifact AAB real (`STORED`+`VALID`) via REST+Storage; Store Connection Google real (credencial Service Account **sintética**, nunca real, gerada localmente); login real via UI em `https://ai-game-studio-os-web.vercel.app`; clique real em "Enviar ao Google Play" → **OAuth real contra `oauth2.googleapis.com`, rejeitado** (JWT assertion sintética, `errorCode: UNKNOWN`, `durationMs` real ~700ms) → erro sanitizado "Falha no envio" na UI (nunca a mensagem bruta do Google) → persistência confirmada após reload → persistência confirmada após logout/login → Retry manual clicado → `attempt` incrementado de 1 para 2 (confirmado via `studio_events`: `ProviderUploadStarted(1)`→`Failed(1)`→`Retried`→`Started(2)`→`Failed(2)`) → limite de 150MB testado com artifact sintético de 200MB → `ARTIFACT_TOO_LARGE`, `started_at: null` (bloqueado antes de qualquer tentativa de rede) → zero erros de console em ambas as rodadas Playwright → zero padrão de secret (`service_role`/`sb_secret_`/`private_key`/PEM) em console, URLs de rede, ou payloads de `studio_events`.

### Cleanup de dados QA — política revisada (não "zero resíduo")
Todo dado operacional mutável removido e confirmado vazio: `provider_uploads`, `build_artifacts`, `builds`, `game_versions`, `games`, `projects`, `store_connections`(+Vault), `invites`, `roles`, `role_permissions`, `user_roles`, objetos do bucket `builds`. **Studios QA, `public.users` owners e os 8 `studio_events` `ProviderUpload*` permanecem intencionalmente** — hard-delete de Studio é incompatível com o Event Store append-only + FK circular entre transações separadas (ver `DECISIONS.md`). Os 2 `auth.users` owners QA foram **banidos** via Admin API (`ban_duration` ≈100 anos) em vez de apagados — login confirmado rejeitado (`400 user_banned`) após o ban.

### Débitos técnicos
- Limite de 150MB é temporário (Sprint 2.11d resolve com streaming real).
- OAuth sem cache de token (pré-existente, não deste sprint).
- **Novo:** falta política oficial de lifecycle/deletion de Studio (soft-delete, tombstone, retenção de Event Store) — registrado em `DECISIONS.md`, necessário antes de qualquer sprint futuro que precise remover um Studio de verdade.

### Build/lint/typecheck
`pnpm build`/`pnpm lint`/`pnpm typecheck` — todos verdes, incluindo após o guard de 150MB.

### Classificação final
**TRANSPORTE VALIDADO / FUNCIONAL PENDENTE** — nenhum AAB real chegou a um app real no Google Play Console ainda (sem credencial real disponível). Sprint 2.11b **CONCLUÍDO** dentro desse limite explícito.

### Próximo sub-sprint

2.11c — Apple IPA / Build Uploads API, aguardando autorização explícita do usuário para começar.

> **Nota (2026-08-13):** entrada de diário do Sprint 2.11c nunca foi escrita neste arquivo apesar do sprint ter sido concluído e commitado (`543c466`) — débito de documentação pré-existente, descoberto durante o Sprint 2.11d-1, fora do escopo deste sub-sprint para reconstruir retroativamente. `DECISIONS.md` tem os registros de decisão de 2.11c; só falta o narrativo aqui.

## Sprint 2.11d-1 — Provider Transfer Engine: GATEs 0–5 + primitivas de streaming/resumable/checkpoint (parcial, split do 2.11d original)

**Status:** Concluído (dentro do escopo reduzido)
**Período:** 2026-08-13

### Objetivo
O usuário autorizou o Sprint 2.11d completo — engine de transferência assíncrona via `integration_jobs`, streaming real do Storage, upload resumível real do Google, checkpoint real da Apple, worker `/api/jobs/tick`, `pg_cron`/`pg_net`, reescrita das Server Actions e da UI para enqueue-and-return, benchmarks de memória e os 20 testes obrigatórios do sprint. Ao concluir os GATEs 0–5 e as primitivas de streaming/resumable/checkpoint, o escopo restante (worker + scheduling + Server Actions + UI) acrescentaria `apps/web` como 4º package tocado no mesmo sprint — excedendo o limite de 3 packages do `CLAUDE.md`. Perguntado explicitamente, o usuário escolheu dividir agora. Esta entrada documenta apenas o que foi de fato concluído sob o nome **2.11d-1**; o restante fica proposto como **2.11d-2** (ver "Próximo sub-sprint").

### GATE 0 — NULL-safety nas RPCs SECURITY DEFINER
Bug encontrado na validação de produção do 2.11c: `v_studio_id <> current_user_studio_id()` não é NULL-safe — para um `auth.user` sem linha em `public.users`, `current_user_studio_id()` retorna `NULL`, e a comparação `<>` com `NULL` avalia para `NULL`, que o `IF` do PL/pgSQL trata como falso (pula o bloco de rejeição). Não explorável hoje porque `current_user_has_permission()` usa `exists(...)` (NULL-safe, sempre nega nesse caso) — mas é uma fragilidade de defesa em profundidade. Corrigido com `IS DISTINCT FROM` em `20260813000001_null_safe_studio_checks.sql`, nas 4 funções que tinham o padrão: `set_store_connection_secret`, `clear_store_connection_secret`, `create_pending_build_artifact`, `create_pending_provider_upload`. Testado localmente para os 4 casos pedidos (auth.user sem `public.users`; usuário de outro Studio; usuário correto sem permission; usuário correto com permission).

### GATE 1 — ADR de infraestrutura do worker
`ADR-006-provider-transfer-worker.md`: avaliadas as 5 opções pedidas (Vercel Functions+Cron; Supabase Edge Functions+pg_cron/pg_net; worker externo; mecanismo nativo inexistente; `integration_jobs`+pg_cron/pg_net+dispatcher). **Decisão: Option E** — `pg_cron` dispara `pg_net` a cada 15-30s contra `/api/jobs/tick` (Route Handler Vercel bounded), que reivindica jobs atomicamente, processa um número limitado de chunks/operações, faz checkpoint e sai antes do `maxDuration`. Rejeitadas: Edge Functions puro (exigiria portar `packages/integrations`/`packages/storage`, código Node, para Deno — não testável neste sandbox); Vercel Functions+Cron isolado (não resolve o problema de duração por si só); worker externo (desproporcional ao estágio do projeto, mesmo racional do "sem CI/CD para founder solo" já registrado em `DEPLOY_RUNBOOK.md`).

### GATE 2/3 — `integration_jobs` + state machines
Decidido reaproveitar `integration_jobs` como mecanismo operacional de execução (não confundir com `provider_uploads`, que é o fato de domínio). `20260813000002_integration_jobs.sql`: enum `job_status` (`QUEUED`/`CLAIMED`/`RUNNING`/`RETRY_WAIT`/`SUCCEEDED`/`FAILED`/`DEAD`), enum `job_error_class` (`RETRYABLE`/`NON_RETRYABLE`/`AUTH`/`RATE_LIMIT`/`PROVIDER_REJECTED`/`INTERNAL`), tabela `integration_jobs` (attempt/max_attempts/claimed_by/lease_expires_at/checkpoint jsonb/correlation_id), RLS só com policy de `SELECT` (escrita é só via RPC SECURITY DEFINER/`service_role`). `provider_upload_status` ganhou `QUEUED`/`PROCESSING`. `provider_uploads` ganhou `bytes_transferred`/`total_bytes`/`next_retry_at`/`google_resumable_session_ref`.

### GATE 4 — Claim atômico + lease/recovery
`20260813000003_job_claim_and_enqueue.sql`: `claim_integration_jobs(worker_id, limit, lease_seconds)` usa `FOR UPDATE SKIP LOCKED` — verificado empiricamente com duas chamadas curl genuinamente paralelas contra o mesmo job disponível: exatamente uma reivindicou, a outra recebeu conjunto vazio (sem double-claim). `requeue_stale_jobs()` recupera jobs `CLAIMED`/`RUNNING` com `lease_expires_at` vencido: volta para `QUEUED` (attempt+1) se ainda houver tentativas, ou marca `DEAD` se `attempt >= max_attempts` — testado empiricamente para os dois casos. Bug encontrado e corrigido: `CASE WHEN ... THEN 'DEAD' ELSE 'QUEUED' END` sem cast explícito falhava com `42804` (coluna `job_status`, expressão `text`) — corrigido com `::job_status` nos dois ramos.

### GATE 5 — Idempotência de enqueue (retry manual concorrente)
`enqueue_provider_upload_job()` rejeita um novo enqueue se já existir job em `QUEUED`/`CLAIMED`/`RUNNING`/`RETRY_WAIT` para o mesmo `provider_upload_id` — verificado empiricamente (segunda tentativa de enqueue corretamente bloqueada com mensagem clara). Os outros 6 casos de idempotência pedidos pelo sprint (worker morre em cada ponto do ciclo de vida da transferência; timeout do provider que pode ter processado; retry manual durante retry automático) dependem do worker real (`/api/jobs/tick`) para serem testados de ponta a ponta — não cobertos ainda, ficam para 2.11d-2.

### Streaming/range read do Storage — requisito de aceitação central
Confirmado empiricamente (não só por documentação, dado histórico de issues do GitHub reportando suporte inconsistente) que a API local do Supabase Storage honra `Range` de verdade — `206 Partial Content` + `Content-Range` corretos. `packages/storage/src/objects.ts`: `downloadObjectRange()` (fetch com header `Range`, nunca materializa o objeto inteiro) e `getObjectSizeViaRange()` (via `Range: bytes=0-0` + parse do `content-range` de resposta). `downloadObject()` original mantido só para o caso de uso de validação do 2.11a, marcado como débito de memória conhecido, superado por `downloadObjectRange()` no fluxo de transferência.
**Benchmark de memória:** medido em processos Node isolados por tamanho (`node --expose-gc`) para evitar contaminação de baseline entre iterações (achado de metodologia: rodar os 4 tamanhos no mesmo processo inflava a RSS baseline por causa da própria geração da fixture sintética, não do loop de download sendo medido). Resultado do loop de leitura por Range: delta de RSS ~48-64MB, **aproximadamente constante entre 10MB e 200MB de artifact** — critério de aceitação do sprint ("delta não deve crescer linearmente com o tamanho") atingido para a primitiva de leitura. Ainda não é o benchmark do fluxo completo (leitura+envio+worker real), que fica para 2.11d-2.

### Google resumable upload real (adapter)
`packages/integrations/src/google-play/client.ts`: `createGoogleResumableSession()` (POST com `uploadType=resumable`, headers `X-Upload-Content-Type`/`X-Upload-Content-Length`, captura `Location` da resposta = session URI), `uploadGoogleResumableChunk()` (PUT com `Content-Range: bytes start-end/total`, trata `308 Resume Incomplete` via header `Range` vs. `200-299` com `versionCode`), `queryGoogleResumableProgress()` (PUT vazio com `Content-Range: bytes */total`). Nenhuma das três funções envia `Authorization` para a session URI — ela é a própria credencial.

### Segurança — session URI do Google no Vault
A session URI é uma bearer capability (instrução explícita do sprint: nunca plaintext em `provider_uploads`). `20260813000004_resumable_session_vault.sql`: `set_provider_upload_resumable_session()`/`get_provider_upload_resumable_session()`/`clear_provider_upload_resumable_session()`, mesmo padrão Vault já usado para `store_connections.credentials_ref` (`vault.create_secret`/`vault.update_secret`/`vault.decrypted_secrets`). As três funções são **`service_role` exclusivamente** (revogadas de `public`/`anon`/`authenticated`) — diferente do padrão de Store Connection (onde o setter é do usuário via UI), aqui a session URI é gerada e consumida inteiramente do lado do worker, nunca do browser. Testado empiricamente: set → get retorna a URI exata; overwrite idempotente (segundo `set` na mesma linha atualiza o mesmo secret, não cria um novo); clear apaga o secret do Vault (confirmado via `vault.secrets`, 0 linhas) e zera a referência.

### Apple checkpoint por uploadOperation (primitiva)
`packages/integrations/src/apple/client.ts`: `uploadAppleBuildUploadFileOperations()` ganhou `opts.startIndex` (retomar a partir de uma operação específica, não do zero) e `opts.onOperationComplete(index)` (chamado imediatamente após cada operação confirmada pela Apple — quem chama persiste o índice em `integration_jobs.checkpoint` antes de seguir). Isso substitui a política de "reiniciar sempre do zero" registrada no Sprint 2.11c como decisão de prudência daquele sprint, não limitação da API (ver `DECISIONS.md` [2026-08-12]). A integração real com `integration_jobs.checkpoint` (o worker de fato persistindo o índice entre invocações) fica para 2.11d-2 — esta entrada só entrega a primitiva no client/adapter.

### Build/lint/typecheck
`pnpm build`/`pnpm lint`/`pnpm typecheck` — todos verdes no monorepo completo após todas as mudanças desta entrada.

### O que NÃO foi feito (fica para 2.11d-2, não é débito silencioso)
Worker `/api/jobs/tick`; habilitar/agendar `pg_cron`+`pg_net`; reescrita de `sendArtifactToGooglePlay`/`retryProviderUpload`/`sendArtifactToAppStore`/`retryAppleProviderUpload` para enqueue-and-return; UI de polling (`GooglePlaySendSection`/`AppleSendSection`/hook de estado); benchmark do fluxo completo (não só da leitura); os 20 testes mandatórios do sprint original (só claim atômico, dois workers concorrentes, worker crash/stale lease, retry manual durante RUNNING e auth.user sem `public.users` têm evidência concreta até aqui — os outros 14 dependem do worker real).

### Classificação final
**PARCIAL, por decisão deliberada de divisão de sprint — não por falha.** GATEs 0-5 e as três primitivas centrais (streaming, Google resumable, Apple checkpoint) estão implementados, testados localmente onde testáveis sem worker, e com build/lint/typecheck verdes. O objetivo central do sprint original ("o request web não fica esperando a transferência binária") **ainda não está entregue de ponta a ponta** — só a infraestrutura de que ele depende está pronta. Nenhuma migration foi aplicada em produção (autorização de produção não solicitada nem dada para este sub-sprint).

### Próximo sub-sprint

2.11d-2 — worker `/api/jobs/tick`, `pg_cron`/`pg_net`, Server Actions enqueue-and-return, UI de polling, benchmark do fluxo completo, os 20 testes mandatórios, aguardando autorização explícita do usuário para começar.

## Sprint 2.11d-2a — Dispatcher + Scheduler (GATEs 6-10, 17 parcial, 22, 23)

**Status:** Concluído (dentro do escopo reduzido — dispatcher/scheduler, sem integração real de provider ainda)
**Período:** 2026-08-14

### Objetivo
2.11d-2 (autorizado após aceite do 2.11d-1) especificava GATEs 6-31 — dispatcher, autenticação, scheduler, bounded execution, lease heartbeat, Server Actions, Google worker+recovery, Apple worker+recovery, retry, UI, polling, benchmark completo, 22 gates de teste. Antes de escrever código, o mesmo gate de complexidade do `CLAUDE.md` que dividiu o 2.11d original foi acionado de novo — o escopo completo tocaria `apps/web`+`packages/integrations`+`packages/storage`+`supabase` (4 packages) e é claramente mais de um sprint. Perguntado, o usuário escolheu dividir com o dispatcher+scheduler primeiro (2.11d-2a), depois um provider por vez (2.11d-2b Server Actions/UI, 2.11d-2c Google, 2.11d-2d Apple, 2.11d-2e bateria de testes final). Esta entrada cobre só **2.11d-2a**.

### GATE 6/9 — Dispatcher `/api/jobs/tick`
Route Handler (`apps/web/app/api/jobs/tick/route.ts`, `runtime="nodejs"`, `maxDuration=60`) — não é fila, é execução bounded de um `runDispatcherTick()` (`apps/web/lib/jobs/dispatcher.ts`): `requeue_stale_jobs()` → `claim_integration_jobs()` (máx. 5 jobs, lease 120s) → loop com `deadline` explícito (45s de orçamento, 5s de margem) → para se o deadline for atingido, deixando jobs não processados com lease ativo para o próximo tick recuperar via `requeue_stale_jobs()`. Nenhum fire-and-forget, nenhuma Promise não aguardada, nenhum `setTimeout` como mecanismo — cada job é liberado/completado antes de seguir para o próximo, nunca "em voo" ao final da invocation.

### GATE 7 — Autenticação do dispatcher
`apps/web/lib/jobs/dispatcher-auth.ts`: `isValidDispatcherSecret()` via `crypto.timingSafeEqual`, com padding para não vazar diferença de tamanho entre segredo esperado/recebido. `JOBS_DISPATCHER_SECRET` lido via `lib/env.ts` (nunca `NEXT_PUBLIC_*`). Route Handler audita, nesta ordem: Content-Type (`415` se não for `application/json`), tamanho do body (`413` se >1KB), secret (`401` se ausente/incorreto) — só então executa o dispatcher. Testado empiricamente via curl real contra o dev server local: sem secret → `401`; secret inválido → `401`; Content-Type errado → `415`; método GET → `405` (comportamento padrão do Next.js para Route Handler sem export `GET`); body de 2KB → `413`; secret correto → `200` com resumo da execução.

**Bug encontrado e corrigido durante o teste empírico:** o `middleware.ts` (proteção de rotas por sessão, allowlist `PUBLIC_ROUTES`) interceptava TODA chamada a `/api/jobs/tick` antes de chegar ao Route Handler — mesmo com o `x-dispatcher-secret` correto, a ausência de cookie de sessão causava `307` para `/login`. Corrigido excluindo `api/jobs/tick` do `matcher` do middleware (não adicionado a `PUBLIC_ROUTES` — não é uma rota sem autenticação, é uma rota com um mecanismo de autenticação diferente, verificado dentro do próprio Route Handler). Sem este teste empírico contra um servidor real, este bug teria passado despercebido até a integração com `pg_net` em produção.

### GATE 8 — Scheduler (`pg_cron`→`pg_net`)
Confirmado contra documentação oficial do Supabase antes de implementar: `pg_cron`/`pg_net` disponíveis como extensões, `cron.schedule()` com granularidade mínima de minuto na versão empacotada localmente (sintaxe estendida de sub-minuto mencionada pelo usuário existe em versões mais recentes do `pg_cron`, não confirmada disponível neste ambiente — adotado 1 minuto, documentado como parâmetro, não copiado sem verificar). `net.http_post` é assíncrono (enfileira, não bloqueia o cron job — resposta em `net._http_response`).

Config do dispatcher (`tick_url`+segredo) NUNCA em `cron.job.command` (visível a qualquer role com select em `cron.job`) — tabela `job_dispatcher_config` (RLS sem policy, revoke explícito de `anon`/`authenticated`) guarda a URL; o segredo vai para o Vault via `set_job_dispatcher_config()` (mesmo padrão do `google_resumable_session_ref` do 2.11d-1). `invoke_jobs_dispatcher()` lê ambos e chama `net.http_post` com o header `x-dispatcher-secret` — nunca grant a `authenticated`/`anon`, só `service_role` (e o próprio cron job, que roda como `postgres`, dono da função). No-op silencioso se a config não estiver preenchida (GATE 27 — nunca poluir `cron.job_run_details` em ambiente ainda não configurado).

**Testado empiricamente (local):** `cron.job` mostra o job `jobs-dispatcher-tick` registrado com o schedule correto após a migration; `invoke_jobs_dispatcher()` é no-op confirmado antes de configurar; depois de `set_job_dispatcher_config()` com uma URL local (`http://host.docker.internal:3000/api/jobs/tick`) e um segredo de teste, `net._http_response` mostrou uma tentativa de conexão real (`Couldn't connect to server` — esperado, nada escutava na porta ainda) — confirma que `pg_net` de fato dispara a chamada HTTP, mecanismo ponta a ponta validado. Teste com o dev server real rodando (fora do escopo desta verificação específica, mas confirmado via os testes diretos por curl abaixo) fecha o ciclo.

### GATE 10 — Lease heartbeat
`renew_integration_job_lease()` (RPC, `20260814000001_dispatcher_job_lifecycle_rpcs.sql`) exposto ao processor via `ctx.renewLease()` (`apps/web/lib/jobs/types.ts`). Testado indiretamente através do processor de teste (chama `renewLease()` em toda invocação, sem erro em nenhuma das ~15 chamadas feitas durante os testes abaixo) — prova que a validação `claimed_by = p_worker_id` do lado do SQL aceita corretamente a renovação de um lease legítimo. O lado "worker morto perde o lease" é o mesmo `requeue_stale_jobs()` do 2.11d-1, revalidado abaixo com jobs plantados diretamente com lease expirado.

### RPCs de lifecycle novas (`20260814000001_dispatcher_job_lifecycle_rpcs.sql`)
`start_integration_job_running` (CLAIMED→RUNNING), `renew_integration_job_lease`, `checkpoint_and_release_integration_job` (persiste checkpoint + libera claim, SEM incrementar `attempt` — é continuação da mesma tentativa, não retry), `complete_integration_job` (transição terminal/retry genérica — só `RETRY_WAIT` incrementa `attempt`). Todas `service_role`-only, todas validam `claimed_by = p_worker_id` antes de qualquer transição — essa é a defesa central contra double-completion (se o lease expirou e outro worker já reivindicou, `claimed_by` mudou, e a chamada do worker zumbi falha em vez de sobrescrever o progresso do worker novo).

### Contrato de processor + registry
`apps/web/lib/jobs/types.ts` define `IntegrationJobProcessor` (`continue`/`succeeded`/`failed`, com `ctx.deadline`/`ctx.renewLease`) — definido ANTES de qualquer processor real (Google/Apple, 2.11d-2c/2.11d-2d) existir, para que o dispatcher fosse testável de ponta a ponta sem depender de rede real. `apps/web/lib/jobs/registry.ts` mapeia `integration_name`→processor; só `test`→`testEchoProcessor` registrado nesta entrega (`apps/web/lib/jobs/processors/test-echo.ts`, sem chamada de rede, simula N passos via checkpoint `{step, targetSteps}`, com `forceErrorClass` para testar classificação de erro).

### GATE 17 (parcial) — Retry automático
`apps/web/lib/jobs/retry-policy.ts`: `decideRetry()` — `NON_RETRYABLE`/`PROVIDER_REJECTED` vão direto para `FAILED` terminal independente de tentativas restantes; `RETRYABLE`/`RATE_LIMIT`/`AUTH`/`INTERNAL` respeitam `max_attempts` (backoff exponencial 30s/60s/120s.../capado em 30min, respeitando `retryAfterSeconds` quando maior que o backoff calculado) e vão para `DEAD` quando exaurido. Testado empiricamente com 3 jobs reais processados pelo dispatcher: `RETRYABLE` (attempt 1/3) → `RETRY_WAIT`, attempt incrementado para 2, `scheduled_at` no futuro; `NON_RETRYABLE` (attempt 1/3) → `FAILED` terminal, attempt inalterado; `RATE_LIMIT` já em attempt 3/3 → `DEAD`, attempt inalterado. Falta testar `Retry-After` real de um provider (fica para 2.11d-2c/2.11d-2d, quando existir chamada de rede real).

### GATE 22 (parcial) — Crash/stale lease recovery
Plantados diretamente dois jobs `RUNNING` com `claimed_by` de um worker fictício e `lease_expires_at` no passado: um com `attempt=1/5` (deveria ser recuperado) e outro com `attempt=5/5` (deveria morrer). Um tick real do dispatcher confirmou os dois caminhos: o primeiro voltou para `QUEUED` (attempt incrementado para 2 por `requeue_stale_jobs`), foi reivindicado pelo mesmo tick e terminou `SUCCEEDED`; o segundo foi marcado `DEAD` (`last_error_code=WORKER_LEASE_EXPIRED`), nunca mais reivindicado. Os outros casos do GATE 22 (crash antes do claim, crash após primeiro checkpoint, crash no meio da transferência — que exigem uma transferência real de provider) ficam para 2.11d-2c/2.11d-2d.

### GATE 23 (parcial) — Concorrência
8 jobs de teste enfileirados, 3 chamadas `curl` genuinamente paralelas (`&`+`wait`) contra o dispatcher local. Resultado: 3+5+0 jobs processados entre os 3 workers, **0 sobreposição** — confirmado via `select status, count(*) from integration_jobs group by status`: todos os 8 (+1 fixture pré-existente) terminaram `SUCCEEDED` exatamente uma vez. `FOR UPDATE SKIP LOCKED` (já implementado no 2.11d-1) distribuiu o trabalho corretamente sob concorrência real do dispatcher, não só do `claim_integration_jobs()` isolado. Teste com muitos workers (5+) e com job já com lease ativo "não pode ser roubado" ficam para quando houver mais orçamento de teste — o mecanismo (`claimed_by`/lease check em toda RPC de lifecycle) já impede isso estruturalmente, mas não foi testado sob concorrência real nesta entrega.

### GATE 12/18 (revalidação parcial) — Manual retry bloqueado durante job ativo
A guarda (`enqueue_provider_upload_job`, count de jobs em `QUEUED`/`CLAIMED`/`RUNNING`/`RETRY_WAIT`) é inalterada desde o 2.11d-1, onde foi validada via chamadas HTTP reais paralelas contra o PostgREST. Nesta entrega, confirmado mecanicamente que um job `RUNNING` de verdade (criado pelo dispatcher real, não só um valor plantado) é contado pelo mesmo `WHERE status in (...)` da guarda — uma tentativa de revalidar via `psql` com `SET request.jwt.claims` simulado falhou por não reproduzir o GUC real que o PostgREST define (artefato do harness de teste, não um gap real; registrado com transparência em vez de reportado como sucesso).

### Tipos sincronizados (débito do 2.11d-1 corrigido)
`packages/database/src/generated/database.types.ts` (hand-written, ver `DECISIONS.md` ADR-003) estava desincronizado com as migrations do 2.11d-1: `ProviderUploadStatus` não tinha `QUEUED`/`PROCESSING`, `ProviderUploadsRow` não tinha `bytes_transferred`/`total_bytes`/`next_retry_at`/`google_resumable_session_ref`, e não existia `IntegrationJobsRow`/`JobStatus`/`JobErrorClass`. Corrigido nesta entrega — revelado por um erro real de `tsc` (`apps/web/lib/provider-upload-status.ts`'s `switch` sobre `ProviderUploadStatus` sem os casos novos, "função sem return final") durante o typecheck do monorepo, não descoberto por auditoria proativa. Adicionados os labels de UI para `QUEUED`/`PROCESSING` no mesmo arquivo.

### Build/lint/typecheck/migration
`pnpm build`/`pnpm lint`/`pnpm typecheck` — verdes no monorepo completo. `npx supabase db reset` (banco local do zero, todas as migrations em ordem, incluindo as duas novas deste sub-sprint) — confirmado funcionando.

### O que NÃO foi feito (fica para 2.11d-2b/2.11d-2c/2.11d-2d/2.11d-2e)
Server Actions enqueue-and-return; UI de polling; integração real do worker com Google (resumable) e Apple (checkpoint); reconciliação de resposta perdida (Google timeout / Apple commit-sem-resposta) — identificada pelo usuário como prioridade alta para quando o worker de provider existir, não como edge case; retry manual per-operation; benchmark de memória do fluxo completo (só a leitura por Range foi medida no 2.11d-1); observabilidade formal (GATE 26); scheduler failure detection (GATE 27, mecanismo de no-op já existe, mas sem alerta/detecção); segurança regressiva completa (GATE 28); os testes restantes que dependem de provider real.

### Classificação final
**PARCIAL, por divisão deliberada — não por falha.** Dispatcher e scheduler funcionam de ponta a ponta e comprovadamente: autenticação, bounded execution, checkpoint/continuação, heartbeat de lease, recuperação de lease morto, retry automático por classe de erro, e concorrência real sem double-processing. O objetivo central do 2.11d ("o request web não fica esperando a transferência") ainda depende das Server Actions (2.11d-2b) e dos workers de provider (2.11d-2c/2.11d-2d) para ser demonstrado de ponta a ponta com uma transferência real.

### Próximo sub-sprint

2.11d-2b — Server Actions (Google/Apple) reescritas para enqueue-and-return, duplicate enqueue reforçado na UI, UI assíncrona com polling, aguardando autorização explícita do usuário para começar.

## Sprint 2.11d-2b — Server Actions enqueue-and-return + UI assíncrona (GATEs 11, 12 parcial, 19, 20, 21)

**Status:** Concluído (dentro do escopo reduzido — Server Actions/UI, sem worker de provider real ainda)
**Período:** 2026-08-14 (continuação autônoma, autorizada pela diretriz de autonomia do usuário sobre o 2.11d-2 já em andamento)

### GATE 11 — Server Actions reescritas
`provider-upload-actions.ts` (Google) e `apple-provider-upload-actions.ts` (Apple): removido todo código de rede/transferência (`downloadObject`, adapters, polling síncrono de `getBuildUpload`, `deleteEdit`/`deleteBuildUpload` best-effort) — isso tudo migra para os processors reais do worker (2.11d-2c/2.11d-2d). O que sobra em cada Server Action: validar (artifact existe, packageName/bundleIdentifier configurado, Store Connection existe), criar o `provider_upload` (`create_pending_provider_upload`, inalterado desde 2.11b/c), aplicar o guard de 150MB (GATE 25 — antes do enqueue, não dentro do worker), chamar `enqueue_provider_upload_job` (`integration_name = "google_play"`/`"apple_app_store"`), emitir `ProviderUploadQueued`, e retornar. Nenhuma chamada a Google/Apple acontece mais dentro do ciclo de vida do request web — confirmado por leitura do código (nenhum import de `@agsos/integrations`/`downloadObject` resta nos dois arquivos) e por build/typecheck verdes.

`retryProviderUpload`/`retryAppleProviderUpload` seguem o mesmo padrão: chamam `enqueue_provider_upload_job` para o `provider_upload_id` existente (a RPC cria um job NOVO, com `attempt=1` na tabela `integration_jobs` — distinto do contador legado `provider_uploads.attempt`, que a Server Action ainda incrementa manualmente para preservar a semântica de "tentativa Nº X" já exibida na UI desde o 2.11b) e emitem `ProviderUploadRetried`.

### Evento novo: `ProviderUploadQueued`
Adicionado a `lib/domain-events.ts` — narra o fato de domínio real do momento do enqueue ("o usuário pediu, o AGSOS aceitou"), distinto de `ProviderUploadStarted` (que passa a significar "o worker de fato começou a trabalhar" — só será emitido pelos processors reais do 2.11d-2c/2.11d-2d). Nunca confundir com telemetria interna do dispatcher (`JobStarted`/`JobClaimed` do GATE 26, que não existem como Domain Event — só como estado observável em `integration_jobs`).

### GATE 12 (parcial) — Duplicate enqueue
A guarda real (`enqueue_provider_upload_job`, bloqueio no banco) é inalterada e já foi validada com chamadas HTTP reais paralelas no 2.11d-1. Nesta entrega, reforçado o lado complementar da UI (nunca o controle primário — instrução explícita do GATE 12): botões de Enviar/Retry agora fazem early-return se já há uma chamada em voo (`sending`/`retryingId`), e o botão de Retry fica `disabled` para QUALQUER upload da lista enquanto outro retry está em andamento (antes só desabilitava visualmente o botão clicado, os outros ficavam clicáveis). **Não testado nesta entrega via sessão de browser real com dois cliques simultâneos** — validar isso exigiria Playwright/sessão autenticada real, fora do orçamento desta entrega; registrado com transparência como gap, não como cobertura completa.

### GATE 19/20/21 — UI assíncrona, polling, progresso real
`hooks/use-provider-uploads.ts` reescrito: antes era um fetch único (`reload()` chamado uma vez no mount); agora faz polling (`setInterval`, 4s) **só enquanto existir upload em estado não-terminal** (`PENDING`/`QUEUED`/`UPLOADING`/`PROCESSING`) — para automaticamente quando todos os uploads da lista chegam a `SUCCEEDED`/`FAILED`, e limpa o interval no unmount (`useEffect` cleanup). Nenhuma infraestrutura realtime nova (WebSocket/Supabase Realtime) — só o hook de listagem já existente, reaproveitado. `google-play-send-section.tsx`/`apple-send-section.tsx`: toasts de sucesso do envio/retry não fingem mais um resultado ("Enviado ao Google Play, versionCode X") — agora dizem "na fila" e apontam para o badge de estado abaixo, que é onde o estado real (vindo do polling) aparece. Nenhum percentual fabricado foi adicionado — a UI já não mostrava percentual antes, e continua sem mostrar (não há `bytes_transferred`/`total_bytes` confiável ainda, já que nenhum worker real os preenche nesta entrega).

`provider-upload-status.ts` ganhou labels para `QUEUED`/`PROCESSING` (gap descoberto durante o 2.11d-2a, ver aquela entrada — reafirmado aqui porque é diretamente visível nesta UI agora).

### Build/lint/typecheck
`pnpm build`/`pnpm lint`/`pnpm typecheck` — verdes no monorepo completo.

### O que NÃO foi feito (fica para 2.11d-2c/2.11d-2d/2.11d-2e)
Nenhum processor real de provider (`google_play`/`apple_app_store`) registrado no dispatcher ainda — um job enfileirado por esta Server Action fica legitimamente `QUEUED` para sempre até o worker existir; isso é o comportamento esperado entre sub-sprints, não um bug. Reload/logout-login recuperando estado real (deveria funcionar — o estado vem 100% do banco via `useProviderUploads`, nada em memória de componente — mas não testado nesta entrega via sessão de browser real). GATE 12 sob concorrência real de browser (só a guarda de banco foi validada, não o caminho completo da Server Action com dois cliques simultâneos).

### Classificação final
**PARCIAL, por divisão deliberada — não por falha.** As Server Actions e a UI já refletem o modelo assíncrono corretamente (nenhum request web espera transferência, estado vem só do banco, polling correto) — mas sem processor real de provider, não há transferência de verdade para observar de ponta a ponta. O objetivo central do 2.11d segue dependendo de 2.11d-2c/2.11d-2d.

### Próximo sub-sprint

2.11d-2c — Google worker: registrar processor real `google_play` no dispatcher (integrando o resumable upload do 2.11d-1 + streaming do Storage), checkpoint/recovery, reconciliação de resposta perdida — aguardando autorização explícita do usuário para começar.

## Sprint 2.11d-2c — Google worker real (GATEs 13, 14 parcial)

**Status:** Concluído (dentro do escopo testável sem credencial real — mesma classificação TRANSPORTE VALIDADO/FUNCIONAL PENDENTE dos Sprints 2.11b/2.11c)
**Período:** 2026-08-14/15 (continuação autônoma, autorizada explicitamente pelo usuário para todo o escopo local do 2.11d-2, incluindo 2.11d-2c/2.11d-2d/2.11d-2e, sem necessidade de nova autorização por Gate)

### GATE 13 — Processor `google_play` real
`apps/web/lib/jobs/processors/google-play.ts`, registrado em `registry.ts`. Fluxo: carrega `provider_upload`→`build_artifact`→`build`→`game_version`→`game` (packageName) →`store_connection` (credencial via Vault) usando `createAdminClient()` — nunca a sessão de um usuário, já que o worker roda fora de qualquer request autenticado. Cria (ou reaproveita, via checkpoint) o Edit; obtém o tamanho real do artifact via `getObjectSizeViaRange` (2.11d-1); cria (ou reaproveita, via Vault) a sessão resumível; **antes de cada chunk, consulta o progresso real via `queryResumableProgress`** (nunca confia cegamente no checkpoint local — é a implementação do GATE 14); lê exatamente 1 chunk de 8MB (múltiplo de 256KB, exigência da API) via `downloadObjectRange`; envia; persiste checkpoint (`editId`/`totalBytes`/`bytesUploaded`) e libera o job (`continue`) para a próxima invocação processar o próximo chunk — nunca um loop dentro da mesma invocation. Ao completar, descarta o Edit (best-effort, mesma decisão congelada desde 2.11b) e persiste `SUCCEEDED`+`version_code`.

`ProviderUploadStarted` passa a ser emitido pelo PRÓPRIO worker (não mais pela Server Action, que agora só emite `ProviderUploadQueued` — ver 2.11d-2b) — `actor_type: "SYSTEM"`, nunca inventando um ator humano para uma ação que o worker executou de forma assíncrona.

### GATE 14 (parcial) — Recovery/reconciliação
Implementado no código (não todos os ramos testáveis sem credencial real):
- **Crash antes do primeiro chunk:** checkpoint vazio → próxima invocação recria tudo do zero. Testado.
- **Crash depois do Edit criado:** checkpoint preserva `editId` → próxima invocação REAPROVEITA (nunca cria um Edit novo) — testado empiricamente (ver abaixo).
- **Timeout com resposta desconhecida / reconciliação:** `queryResumableProgress` chamado sempre antes de decidir o próximo chunk — se a Apple/Google já recebeu mais bytes do que o checkpoint local sabia, o valor do provider prevalece (nunca o checkpoint local). Implementado, não exercitável sem uma sessão resumível real estabelecida (exige credencial real).
- **Sessão expirada:** consulta falha de forma reconhecível → `clear_provider_upload_resumable_session` (Vault) + reset do progresso (mantém `editId`, único dado que sobrevive mais tempo que a sessão, decisão registrada em DECISIONS.md) → próxima invocação recria a sessão do zero. Implementado, não exercitável sem uma sessão real que possa de fato expirar.

### Bug real encontrado e corrigido: `service_role` sem GRANT de tabela
Ao testar o worker de ponta a ponta pela primeira vez, `createAdminClient()` falhou com `permission denied for table provider_uploads` — **bug pré-existente, não introduzido neste sprint**: nenhuma migration desde o início do projeto concedeu privilégio de tabela (GRANT) a `service_role` — só RLS foi configurado. Isso nunca foi percebido porque todo código anterior usando `service_role` passava por RPCs SECURITY DEFINER (que rodam como o dono da função, não como o role chamador) — o worker é o primeiro código a fazer `.from(...).select()` direto como `service_role`. Mesma classe exata de bug já corrigida para `authenticated` no Sprint 1.7 (`20260717000003_grant_authenticated_privileges.sql`). Corrigido em `20260815000001_grant_service_role_privileges.sql` (mesmo padrão: `GRANT ... ON ALL TABLES ... TO service_role` + `ALTER DEFAULT PRIVILEGES`). Conceder isso não reduz segurança — `service_role` já tem acesso irrestrito por design (bypassa RLS inteiramente); o GRANT só torna esse acesso já assumido utilizável via tabela direta, não só via RPC.

### Teste empírico de ponta a ponta (mesma metodologia do Sprint 2.11b: credencial Service Account sintética, mas com chave RSA real, contra o `oauth2.googleapis.com` real)
Fixture completa criada localmente (Studio/Project/Game/Build/BuildArtifact real no Storage, 2MB, Range confirmado 206; Store Connection com credencial sintética via Vault). Dispatcher real (`/api/jobs/tick`) processou o job:
1. **1ª tentativa** (antes da correção de GRANT): `processor_error`/`PROCESSOR_UNHANDLED_EXCEPTION` — revelou o bug do GRANT acima.
2. **2ª tentativa** (depois da correção, formato de credencial ainda errado — erro de fixture, não do worker): `UNEXPECTED_ERROR` — "JSON da Service Account inválido" (a `GoogleCredentials` real exige `{serviceAccountJson: <string JSON>, packageName}`, não os campos soltos que a fixture tinha).
3. **3ª tentativa** (fixture corrigida): `retry_wait`/`UNKNOWN` — o worker montou o JWT com a chave RSA real, chamou `oauth2.googleapis.com/token` de verdade, recebeu uma rejeição real (`400 invalid_grant`, esperado — Service Account nunca registrada no Google), classificou corretamente como retryable, agendou o retry com backoff, e persistiu `provider_uploads.status = 'UPLOADING'` + emitiu `ProviderUploadStarted` (`actor_type: SYSTEM`, sem nenhum dado sensível no payload).
4. **Teste de reaproveitamento de checkpoint:** plantado `checkpoint = {editId: "fake-edit-123", totalBytes: ...}` diretamente → nova invocação preservou exatamente esses valores (não recriou o Edit) — confirma a lógica de reuso do GATE 14.
5. **Auditoria de segredo:** `studio_events`, `integration_jobs.checkpoint`, e o log do dev server — 0 ocorrências de `PRIVATE KEY`/`client_email`/qualquer fragmento da credencial sintética, em qualquer um dos 3.

**Limite explícito, honestamente registrado:** sem uma credencial Google real, os ramos que dependem de uma resposta de SUCESSO do Google (upload de chunk de verdade, `queryResumableProgress` sobre uma sessão real, reconciliação de bytes já recebidos, expiração de sessão real) não foram exercitados de ponta a ponta — só por leitura de código + os testes das primitivas isoladas já feitos no 2.11d-1. Mesma classificação de honestidade já usada em 2.11b/2.11c.

### Fixture de teste removida
Toda a fixture (Studio reaproveitado, Project/Game/Build/BuildArtifact/ProviderUpload/IntegrationJob/StoreConnection/Vault secret/objeto no bucket `builds`) foi removida ao final do teste — banco local voltou ao estado anterior (só o seed padrão).

### Build/lint/typecheck/migration
`pnpm build`/`pnpm lint`/`pnpm typecheck` — verdes no monorepo completo. `npx supabase db reset` — confirmado funcionando com a migration nova.

### Classificação final
**TRANSPORTE VALIDADO / FUNCIONAL PENDENTE** (mesma classificação de 2.11b/2.11c, pelo mesmo motivo: sem credencial Google real disponível, nenhum bundle real chegou a um Google Play Console real ainda) — mas agora dentro da arquitetura assíncrona completa (worker real, não Server Action síncrona). Dentro desse limite explícito, o Sprint 2.11d-2c está **CONCLUÍDO**.

### Próximo sub-sprint

2.11d-2d — Apple worker: processor real `apple_app_store`, integrando `startIndex`/`onOperationComplete` (2.11d-1) ao checkpoint persistente, mesma disciplina de reconciliação — continuação autônoma autorizada.
