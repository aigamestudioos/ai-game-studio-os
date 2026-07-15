# docs/frozen — Baseline Arquitetural

**Status:** FROZEN
**Versão:** 1.0.0
**Data:** 14/07/2026

> Documentos normativos do AI Game Studio OS. Nenhum arquivo aqui é editado durante a implementação.
> Alterações exigem nova Revision versionada ou novo ADR aprovado.
> Para consulta diária, use `ARCHITECTURE.md` na raiz do repositório.

---

## architecture/

| Arquivo | Documento | Status |
|---|---|---|
| `UL-001.md` | Ubiquitous Language (35 termos) | ✅ FROZEN |
| `AGSOS-SPEC-001.md` | Engineering Handbook | ✅ FROZEN |
| `AGSOS-SPEC-002.md` | Domain Blueprint | ✅ FROZEN |
| `AGSOS-SPEC-003.md` | Data Architecture (Partes A + B) | ✅ FROZEN |
| `AGSOS-SPEC-004.md` | Application Foundation | ✅ FROZEN |
| `AGSOS-SPEC-005.md` | Design System | ✅ FROZEN |
| `AGSOS-SPEC-006.md` | Core Features | ✅ FROZEN |
| `AGSOS-SPEC-007.md` | Business Features | ✅ FROZEN |
| `AGSOS-SPEC-008.md` | Integrations & External Services | ✅ FROZEN |
| `AGSOS-SPEC-009.md` | Quality, Testing & Delivery | ✅ FROZEN |
| `ADR-002.md` | Monorepo: pnpm + Turborepo | ✅ FROZEN |
| `ADR-003.md` | Supabase nativo, RLS, sem Prisma | ✅ FROZEN |
| `ADR-004.md` | TanStack Query + Zustand | ✅ FROZEN |

## roadmap/

| Arquivo | Documento | Status |
|---|---|---|
| `AGSOS-PLAN-001.md` | Master Implementation Roadmap | ✅ EXECUTION |

## references/

Reservado para glossários, referências externas e materiais de suporte futuros.

---

## Hierarquia de decisões

```
Visão do Produto
  ↓ AGSOS-SPEC-001 (Engineering Handbook)
  ↓ AGSOS-SPEC-002 a 009
  ↓ ADR-002, ADR-003, ADR-004
  ↓ Código
  ↓ Comentários
```

Em conflito entre dois documentos: prevalece sempre o superior.

---

## Decisões-chave consolidadas

| Decisão | Documento |
|---|---|
| Prisma removido — Supabase CLI nativo | ADR-003 |
| `features/` nunca na raiz — sempre `apps/web/features/` | ADR-002 |
| `@agsos/types` não existe | ADR-002 |
| RevenueLedger append-only | SPEC-002, SPEC-003 |
| Release pertence a Games; Publishing consome via evento | SPEC-002 |
| Environment pertence a Infrastructure; Studio referencia active_environment_id | SPEC-002 |
| Workspace sem tabela — conceito lógico | SPEC-003 |
| Migrations forward-only — nunca `down.sql` | SPEC-003, SPEC-009 |
| `studio_events` = única fonte de histórico | SPEC-003 |
| Tailwind v4 com `@theme{}` | SPEC-005 |
| Recharts sempre via `@agsos/ui/charts` | SPEC-005 |
| IA sempre via AI Orchestrator — nunca chamada direta | SPEC-004, SPEC-007 |
| ASO metadados = Games; estratégia/keywords = Marketing | SPEC-007 |
| RevenueCat via Domain Events — sem chamada direta dos módulos | SPEC-008 |
| Stripe = apenas cobrança B2B do AGSOS | SPEC-008 |
| Cobertura progressiva por fase | SPEC-009 |
| Git flow simplificado: feature/increment-X-Y → PR → main | SPEC-009, PLAN-001 |
