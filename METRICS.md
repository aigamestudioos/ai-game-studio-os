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
| Tempo do build | ~33s (`pnpm build`, cache frio, 12 workspaces) |
| Tempo do pnpm install | — (medir no próximo sprint) |

### Deploy

| Métrica | Valor |
|---|---|
| Vercel | — (ainda não configurado, Incremento 0.5) |
| Supabase | — (ainda não configurado, Incremento 0.6) |
| Ambientes | — (nenhum ambiente publicado; commit local apenas) |
