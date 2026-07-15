# METRICS.md

Snapshot técnico do projeto, atualizado ao final de cada sprint. Gerado com `./scripts/metrics.sh` (ajustar manualmente os campos que o script não coleta, como "Tempo médio de build").

Ver também: [IMPLEMENTATION_LOG.md](IMPLEMENTATION_LOG.md) para o "porquê" de cada sprint.

---

## Sprint 0 — Foundation (Release 0.1)

**Data:** 2026-07-15

### Código

| Métrica | Valor |
|---|---|
| Sprints concluídos | 1 |
| Apps | 0 |
| Packages | 11 |
| Arquivos (git-tracked) | 69 |
| Linhas de código (ts/tsx/js/jsx/sql) | 11 |
| Commits totais | 5 |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |

### Qualidade

| Métrica | Valor |
|---|---|
| Testes unitários | 0 |
| Testes E2E | 0 |
| Cobertura (%) | 0% |

### Produto

| Métrica | Valor |
|---|---|
| Módulos implementados | 0 |
| Integrações implementadas | 0 |
| Telas implementadas | 0 |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Tempo do CI | — (CI ainda não configurado) |
| Tempo do build | — (medir a partir do próximo sprint) |
| Tempo do pnpm install | — (medir a partir do próximo sprint) |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | — (ainda não configurado) |
| Supabase | — (ainda não configurado) |
| Ambientes | — (nenhum ambiente publicado) |

---

## Sprint 0 — Foundation (Incremento 0.2)

**Data:** 2026-07-15

### Código

| Métrica | Valor |
|---|---|
| Sprints concluídos | 2 |
| Apps | 1 (`apps/web`) |
| Packages | 11 |
| Arquivos (git-tracked) | 81 |
| Linhas de código (ts/tsx/js/jsx/sql) | 59 |
| Commits totais | 6 (após este incremento) |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |

### Qualidade

| Métrica | Valor |
|---|---|
| Testes unitários | 0 |
| Testes E2E | 0 |
| Cobertura (%) | 0% |

### Produto

| Métrica | Valor |
|---|---|
| Módulos implementados | 0 |
| Integrações implementadas | 0 |
| Telas implementadas | 1 (home `/`) |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Tempo do CI | — (CI ainda não configurado, Incremento 0.4) |
| Tempo do build (monorepo completo) | ~33s (`pnpm build`, cache frio, 12 workspaces) |
| Tempo do pnpm install | — (medir no próximo sprint) |
| Tempo do build (apps/web isolado) | ~28s (`pnpm --filter web build`) |
| Tempo de start do dev server (apps/web) | ~3s (`next dev` até "Ready in") |
| Tempo do typecheck (apps/web isolado) | ~2s (`pnpm --filter web typecheck`) |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | — (ainda não configurado, Incremento 0.5) |
| Supabase | — (ainda não configurado, Incremento 0.6) |
| Ambientes | — (nenhum ambiente publicado; commit local apenas) |

---

## Sprint 0 — Foundation (Incremento 0.3)

**Data:** 2026-07-15

### Código

| Métrica | Valor |
|---|---|
| Sprints concluídos | 3 |
| Apps | 1 (`apps/web`) |
| Packages | 11 |
| Arquivos (git-tracked) | 88 |
| Linhas de código (ts/tsx/js/jsx/sql/css) | 235 |
| Commits totais | 9 (após este incremento) |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |

### Qualidade

| Métrica | Valor |
|---|---|
| Testes unitários | 0 |
| Testes E2E | 0 |
| Cobertura (%) | 0% |

### Produto

| Métrica | Valor |
|---|---|
| Módulos implementados | 0 |
| Integrações implementadas | 0 |
| Telas implementadas | 1 (home `/`, agora com tokens + dark mode) |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Tempo do CI | — (CI ainda não configurado, Incremento 0.5) |
| Tempo do build (monorepo completo) | ~40s (`pnpm build`, cache frio, 12 workspaces) |
| Tempo do pnpm install | — (medir no próximo sprint) |
| Tempo do build (apps/web isolado) | ~28s (`pnpm --filter web build`) |
| Tempo de start do dev server (apps/web) | ~3s (`next dev` até "Ready in") |
| Tempo do typecheck (apps/web isolado) | ~3s (`pnpm --filter web typecheck`) |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | ✅ https://ai-game-studio-os-web.vercel.app/ (antecipado, Incremento 0.6) |
| Supabase | — (ainda não configurado, Incremento 0.7) |
| Ambientes | Production (`main`, deploy automático via Git) |

---

## Sprint 0 — Foundation (Incremento 0.6, antecipado)

**Data:** 2026-07-15

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | ✅ https://ai-game-studio-os-web.vercel.app/ — HTTP 200, validado |
| Supabase | — (ainda não configurado, Incremento 0.7) |
| Ambientes | Production (`main`, deploy automático a cada push) |
| GitHub → Vercel | Conectado via dashboard (Root Directory `apps/web`) |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Tempo do CI | — (CI ainda não configurado, Incremento 0.5) |
| Push para origin/main | 9 commits (repositório já estava sincronizado nesta etapa) |

---

## Sprint 0 — Foundation (Incremento 0.4a)

**Data:** 2026-07-15

### Código

| Métrica | Valor |
|---|---|
| Sprints concluídos | 5 (0.1, 0.2, 0.3, 0.4a, 0.6) |
| Apps | 1 (`apps/web`) |
| Packages | 11 |
| Arquivos (git-tracked) | 96 |
| Linhas de código (ts/tsx/js/jsx/sql/css) | 672 |
| Commits totais | 11 (após este incremento) |
| Build | ✅ |
| Typecheck | ✅ |
| Lint | ✅ |

### Qualidade

| Métrica | Valor |
|---|---|
| Testes unitários | 0 |
| Testes E2E | 0 |
| Cobertura (%) | 0% |

### Produto

| Métrica | Valor |
|---|---|
| Módulos implementados | 0 |
| Componentes de design system | 6 (Button, Input, Textarea, Card, Badge, Avatar) |
| Telas implementadas | 2 (home `/`, `/playground`) |

### Infraestrutura

| Métrica | Valor |
|---|---|
| Tempo do build (monorepo completo) | ~1s (cache quente; ~40s em cache frio) |
| Tempo do build (apps/web isolado) | ~30s (`pnpm --filter web build`) |
| Tempo de start do dev server (apps/web) | ~3s |
| Tempo do typecheck (apps/web isolado) | ~3s |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | ✅ https://ai-game-studio-os-web.vercel.app/ (será atualizado após push deste incremento) |
| Supabase | — (ainda não configurado, Incremento 0.7) |
| Ambientes | Production (`main`, deploy automático a cada push) |
