# VISION.md

Documento de produto e estratégia — não técnico, não arquitetural. Complementa `PROJECT_BIBLE.md` (referência operacional) e `ARCHITECTURE.md` (manual técnico), mas responde a perguntas que nenhum dos dois responde: por que este produto existe, para quem, e para onde vai.

Diferente de `docs/frozen/`, este documento **não é normativo** — é editável livremente pelo fundador do projeto a qualquer momento, sem exigir ADR. Serve para a IA (e qualquer novo colaborador) não perder a direção do produto conforme o repositório cresce.

---

## O que é o AI Game Studio OS?

Sistema Operacional para Estúdios de Jogos Mobile AI-First: permite que um empreendedor individual opere um estúdio capaz de lançar dezenas de jogos por ano, usando IA como força principal de desenvolvimento. Cobre o ciclo completo — ideia → desenvolvimento → publicação → operação — em um único produto.

**O que não é:** painel administrativo, dashboard genérico, CRM, ERP, ou um conjunto solto de telas. (Fonte: `AGSOS-SPEC-001`.)

## Qual problema resolve?

_A ser detalhado pelo fundador._ Ponto de partida derivado das SPECs: hoje, lançar e operar dezenas de jogos mobile por ano exigiria uma equipe grande (dev, design, publishing, marketing, analytics, finance) — o AGSOS existe para que uma pessoa só, apoiada por IA em cada etapa, consiga fazer esse trabalho sozinha.

## Quem é o usuário?

Hoje: um único operador — o fundador/empreendedor individual dono do estúdio. Não é um produto multi-tenant voltado a terceiros nesta fase.

_A definir:_ isso muda no futuro (SaaS para outros estúdios pequenos operarem o mesmo sistema) ou o produto real é sempre "o estúdio do fundador", e o valor de negócio vem dos jogos publicados, não de licenciar o software em si?

## Como será daqui a 3 anos?

_A ser preenchido pelo fundador._ Sugestões de pergunta-guia para essa seção:
- Quantos jogos publicados/ativos simultaneamente?
- O AGSOS continua uso interno, ou vira produto vendável a outros estúdios?
- Que parte do ciclo (ideia → publicação → operação) estará mais automatizada por IA vs. hoje?

## Quais módulos existirão?

Derivado dos domínios já definidos em `AGSOS-SPEC-002` (frozen — mudanças de escopo de domínio exigem revisão daquele documento, não deste):

| Domínio | Papel |
|---|---|
| Studio | Estúdio proprietário — identidade, marca, integrações, contas de desenvolvedor |
| Projects | Transforma uma Idea em um Game publicado |
| Games | Jogos publicados e suas versões |
| Artificial Intelligence | Orquestração de IA (prompts, execuções) usada por todos os outros domínios |
| Publishing | Publicação nas lojas (Apple, Google) |
| Marketing | Aquisição de usuários, ASO, campanhas |
| Analytics | Métricas de produto e negócio |
| Finance | Receita, custos, ledger |
| Knowledge | Base de conhecimento do estúdio |
| Administration / Infrastructure | Domínios transversais de suporte |

## Como será monetizado?

_A ser definido pelo fundador._ Não presumir um modelo (ex.: receita dos próprios jogos publicados vs. SaaS de licenciamento do AGSOS para terceiros) sem essa definição — impacta decisões de arquitetura futuras (multi-tenancy real vs. single-tenant, billing, etc.).

## O que nunca deve virar?

_A ser definido pelo fundador._ Espaço para registrar limites explícitos do produto — o que seria fácil de adicionar tecnicamente, mas que descaracterizaria o AGSOS se fosse feito (ex.: virar um "CRM genérico", perder o foco em mobile, deixar de ser operável por uma única pessoa, etc.). Preencher conforme esses limites forem ficando claros; não inventar aqui.

---

## Como manter este documento

- Atualizar quando a visão de produto mudar de verdade — não a cada sprint técnico (isso é `PROJECT_STATUS.md`/`IMPLEMENTATION_LOG.md`).
- Se uma decisão de sprint entrar em conflito com algo escrito aqui, é sinal para parar e perguntar — não para editar este documento silenciosamente.
- Seções marcadas "_a ser definido/detalhado_" são lacunas conhecidas, não erros — preencher quando o fundador tiver a resposta, sem pressa artificial.
