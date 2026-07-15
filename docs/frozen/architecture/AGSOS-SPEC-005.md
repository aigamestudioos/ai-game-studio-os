# AGSOS-SPEC-005 — Design System

**Versão:** 1.0.0 (inclui Revision 1)
**Status:** APPROVED FROZEN
**Classificação:** Documento Normativo

---

## 1. Princípios

Consistência, Simplicidade, Reutilização, Acessibilidade (WCAG 2.2 AA), Performance, Responsividade, Clareza visual.

---

## 2. Stack

- Tailwind CSS v4 (via `@import "tailwindcss"` + `@theme {}`)
- shadcn/ui (componentes copiados manualmente — CLI para instalações futuras)
- Radix UI (primitivos acessíveis)
- Lucide Icons (única biblioteca de ícones)
- Framer Motion (apenas: drawers, dialogs, transições de página, expansão de painéis, feedback visual)

**Proibido:** outras bibliotecas de componentes.

---

## 3. Identidade Visual

- **Tema:** dark-first; light mode opcional
- **Cores:** oklch (gamut amplo, interpolação perceptual uniforme)
- **Fonte:** Inter (via next/font — Sprint 2)
- **Grid:** Desktop 12 col / Tablet 8 col / Mobile 4 col
- **Espaçamento:** múltiplos de 4px

---

## 4. Tokens Obrigatórios

**Nunca usar valores fixos em componentes reutilizáveis.** Proibido: `bg-slate-900`, `text-white` diretos.

### Tokens de superfície (SPEC-005 REV-003)
```css
--color-surface-background
--color-surface-base
--color-surface-raised
--color-surface-overlay
--color-surface-inverse
--color-border-default
--color-border-subtle
--color-border-focus
--color-text-primary
--color-text-secondary
--color-text-tertiary
--color-text-disabled
```

### Tokens semânticos
```css
--color-background / --color-foreground
--color-primary / --color-primary-foreground
--color-secondary / --color-secondary-foreground
--color-muted / --color-muted-foreground
--color-border
--color-destructive / --color-destructive-foreground
--color-card / --color-card-foreground
--color-input / --color-ring
```

### Tokens de espaço e forma
```css
--radius-sm / --radius-md / --radius-lg / --radius-xl
spacing-sm / spacing-md / spacing-lg
shadow-sm / shadow-md / shadow-lg
```

---

## 5. Estrutura de packages/ui

```
packages/ui/
├── server/      → @agsos/ui/server  (Server Components)
├── client/      → @agsos/ui/client  (Client Components — "use client")
├── shared/      → @agsos/ui/shared  (Componentes neutros)
├── base/        → Button, Input, Select, Modal...
├── composed/    → DataTable, Kanban, MetricsCard...
├── charts/      → @agsos/ui/charts  (Recharts encapsulado)
├── layouts/     → TopBar, Sidebar, Workspace, Inspector
├── navigation/
├── providers/
├── tokens/
├── hooks/
├── icons/
└── utils/
```

**Boundary App Router:** Features nunca importam Client Components diretamente em Server Components. Usar `@agsos/ui/client` vs `@agsos/ui/server`.

**Recharts:** features nunca importam Recharts diretamente — sempre `@agsos/ui/charts`.

---

## 6. Componentes Base

Button, Input, Textarea, Checkbox, Switch, Radio, Select, Combobox, DatePicker, Tooltip, Popover, Badge, Avatar, Progress, Skeleton, Spinner, Alert, Toast, Dialog, Drawer, Tabs, Accordion, Breadcrumb, Pagination.

---

## 7. Componentes Compostos

DataTable (com paginação, ordenação, filtros, seleção múltipla, colunas configuráveis), Kanban, MetricsCard, DashboardGrid, Timeline, ActivityFeed, PromptEditor, AIChatPanel, CommandPalette, NotificationCenter, PropertyPanel, ExecutionPanel.

---

## 8. AI Components

AIChatPanel, PromptEditor, PromptPreview, ExecutionPanel, ExecutionTimeline, PromptHistory, PromptLibrary, ConversationSidebar — todos reutilizáveis.

---

## 9. Layout Padrão

```
TopBar → Sidebar → Workspace → Content → Inspector (opcional)
```

**Sidebar:** Dashboard, Studio, Projects, Games, AI, Publishing, Marketing, Analytics, Finance, Knowledge, Settings.

---

## 10. Internacionalização

Biblioteca: `next-intl` (`packages/i18n`).
**Proibido:** texto fixo dentro de componentes. Usar `t("dominio.chave")`.
Exceções: testes internos, logs.

---

## 11. Responsividade

- Desktop: ≥ 1280px
- Tablet: 768–1279px
- Mobile: < 768px

---

## 12. Acessibilidade

Meta: **WCAG 2.2 AA**. Desde a primeira implementação.
Requisitos: navegação por teclado, foco visível, contraste adequado, labels obrigatórios, ARIA quando necessário, leitores de tela.

---

## 13. Performance

Componentes reutilizáveis: evitar re-renderizações desnecessárias, lazy loading quando apropriado, suporte a memoização. Bundle shell inicial ≤ 450 KB gzip.

---

## 14. Ordem de Implementação (Sprint 2)

1. Tokens / @theme {}
2. Tema (dark/light)
3. Tipografia (Inter + escala)
4. Componentes Base
5. Layout
6. Navegação
7. Componentes Compostos
8. AI Components
9. Dashboards (charts)
10. Documentação de uso
