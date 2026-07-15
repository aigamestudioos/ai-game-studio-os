# ADR-005 — Governança de Execução em Subincrementos

**Status:** APPROVED
**Data:** 2026-07-15
**Escopo:** Processo de execução do roadmap, não arquitetura de produto.

> Diferente de ADR-002/003/004, este ADR **não faz parte** do lote original importado para `docs/frozen/` — é autorado pelo próprio projeto, depois do bootstrap, para registrar uma decisão de governança sem editar um documento normativo já congelado (`docs/frozen/roadmap/AGSOS-PLAN-001.md`).

---

## Contexto

`docs/frozen/roadmap/AGSOS-PLAN-001.md` (frozen) define o Sprint 0 com incrementos fixos, entre eles:

```
0.3 | Tailwind CSS + shadcn/ui (Button, Card, Input, Dialog) | Página estilizada + todos os componentes funcionando
```

Na prática, a execução real divergiu dessa numeração por dois motivos:

1. **Tamanho de commit/sprint** (`CLAUDE.md`): Tailwind + tokens + dark mode + ThemeProvider por si só já é um incremento razoável; somar shadcn/ui (Button, Input, Card, Dialog, Toast — e depois expandido para 21 componentes + playground completo) no mesmo incremento geraria dezenas de arquivos novos, muito acima do limite de ~10 arquivos novos / 50 alterados.
2. **Governança e revisão**: dividir em unidades menores permite validar e documentar cada etapa isoladamente (tokens/tema primeiro, depois fundação de componentes, depois componentes avançados, depois playground completo), em vez de um único incremento monolítico.

A execução real ficou:

```
0.3  — Tailwind v4 + Design Tokens + Dark Mode + ThemeProvider
0.4a — Fundação do Design System (Button, Input, Textarea, Card, Badge, Avatar + shell do /playground)
0.4b — Componentes avançados (overlays, feedback, forms)
0.4c — Playground completo (todas as seções, Typography/Spacing/Icons/Colors/Animations/Dark Mode)
0.5  — CI (GitHub Actions)
0.6  — Vercel (executado fora de ordem, antes de 0.4b/0.4c, a pedido do usuário)
0.7  — Supabase Auth
```

## Decisão

Não editar `AGSOS-PLAN-001.md`. Ele permanece como registro histórico da intenção original do roadmap (frozen).

A sequência de execução real vive nos documentos operacionais, que já são atualizados a cada incremento:
- `PROJECT_STATUS.md` — estado atual, com a numeração de subincrementos.
- `IMPLEMENTATION_LOG.md` — o "porquê" de cada incremento.
- `DECISIONS.md` — decisões técnicas pontuais.
- Este ADR — registra a decisão de governança em si (por que dividir em subincrementos é aceitável e como isso deve continuar sendo feito).

## Motivo

Editar um documento frozen exigiria um processo de revisão que este projeto não tem definido (os frozen foram importados como baseline, não como algo vivo). Criar um ADR novo, fora de `docs/frozen/`, registra a decisão com o mesmo rigor de rastreabilidade, sem violar a regra "nunca alterar documentos FROZEN sem ADR aprovado" nem exigir esse processo formal para uma decisão que é de sequenciamento operacional, não de arquitetura de produto.

## Consequências

- `docs/frozen/roadmap/AGSOS-PLAN-001.md` continua sendo citado nos incrementos, mas como referência ao escopo original — não à numeração exata.
- Daqui para frente, sempre que o roadmap operacional divergir de `AGSOS-PLAN-001.md` de forma que valha a pena registrar como decisão de governança (não só uma decisão técnica pontual), o padrão é: **novo ADR na raiz do repositório** (`ADR-00N-*.md`), referenciado no índice de `DECISIONS.md`, em vez de editar o frozen ou deixar a divergência implícita.
- `DECISIONS.md` deve referenciar este ADR em seu índice.
