# ADR-006 — Infraestrutura de execução do Provider Transfer Engine (Sprint 2.11d)

> Autorado pelo próprio projeto (padrão de `ADR-005-sprint-governance.md` — novos ADRs vivem na raiz, não em `docs/frozen/`), referenciado em `DECISIONS.md`.

## Contexto

Sprints 2.11b/2.11c enviam binários a providers externos (Google Play, Apple App Store) de forma **síncrona** dentro de uma Server Action: a request HTTP do usuário permanece aberta durante todo o download do Storage + upload ao provider. Isso tem dois problemas centrais, ambos confirmados por medição (não assumidos):

1. **Memória**: `downloadObject()` + `Buffer.from(await blob.arrayBuffer())` materializa o artifact inteiro em memória — medido no Sprint 2.11b, ~2.5-2.8x o tamanho do arquivo em RSS.
2. **Duração**: a transferência está limitada a `maxDuration` da função Vercel (120s hoje) — qualquer coisa que exceda isso falha, mesmo que o provider ainda estivesse processando com sucesso.

Este ADR decide QUAL infraestrutura executa o trabalho persistente que substitui esse modelo.

## Opções avaliadas

| Opção | Duração máx. por invocação | Memória | Streaming | Decoupled do ciclo de vida da request do usuário? | Reaproveita código Node existente? |
|---|---|---|---|---|---|
| A. Vercel Functions + Vercel Cron | Cron dispara no máximo 1x/dia no plano Hobby deste projeto (não documentado neste repo como Pro) — cada invocação ainda é uma função Vercel comum, sujeita a `maxDuration` | Mesma função Vercel (1024MB provável, não confirmado) | Sim, se o worker não materializar o arquivo inteiro | **Não por si só** — cron dispara a função, mas a função ainda é subprocesso Vercel; se depender de UMA execução completar a transferência inteira, o problema de duração não é resolvido, só adiado | Sim, 100% |
| B. Supabase Edge Functions (Deno) + pg_cron/pg_net | 150s (Free) / 400s (Pro), confirmado contra a documentação oficial atual da Supabase | 256MB (documentado) | Sim (fetch nativo do Deno suporta streaming) | Sim — pg_cron roda dentro do Postgres do Supabase, completamente fora do runtime Vercel | Não direto — `packages/integrations`/`packages/storage` são Node, precisariam ser portados/validados em Deno (imports `npm:`, `node:crypto` — sem teste real disponível neste ambiente) |
| C. Worker externo dedicado (ex.: máquina/serviço separado) | Ilimitado | Ilimitado | Sim | Sim | Sim |
| D. Mecanismo nativo já existente no projeto | Nenhum — não há worker/cron implementado hoje (confirmado: zero `.github/workflows`, zero cron configurado, `integration_jobs` nunca chegou a ser criada) | — | — | — | — |
| E. `integration_jobs` (fila persistida) + dispatcher via pg_cron/pg_net chamando uma Route Handler Vercel, com trabalho fatiado em ticks curtos | Cada tick é uma função Vercel comum (bounded por `maxDuration`), mas o **agendamento** (o "quem dispara a próxima tentativa") vive inteiramente dentro do Postgres via `pg_cron`, nunca dependente de uma função Vercel sobrevivendo | Bounded por chunk, não pelo artifact (ver streaming) | Sim — cada tick processa um número limitado de chunks/`uploadOperations` e sai | Sim — o agendamento sobrevive independente de qualquer função Vercel; nenhuma Promise/setTimeout/`after()` depende de um processo sobrevivendo | Sim, 100% |

## Decisão

**Opção E**: `pg_cron` (extensão disponível no projeto, confirmado via `list_extensions` — hoje não habilitada) dispara, a cada 15-30s, uma chamada via `pg_net` (também disponível, não habilitada) a uma Route Handler dedicada (`/api/jobs/tick`) que:

1. Reivindica atomicamente (`FOR UPDATE SKIP LOCKED`) até N jobs `QUEUED`/`RETRY_WAIT` prontos.
2. Para cada job, processa um número limitado de unidades de trabalho (chunks de download+upload, ou uma `uploadOperation` da Apple) — nunca o artifact inteiro de uma vez.
3. Persiste checkpoint e sai antes de `maxDuration`.
4. Se o job não terminou, permanece `RUNNING`→volta para reivindicação no próximo tick (com lease expirável — Gate 4); se terminou, marca estado terminal.

**Por que não B (Edge Functions/Deno)**: reaproveitar `packages/integrations` (adapters Google/Apple, JWT ES256, OAuth) e `packages/storage` tal como já existem — testados, auditados contra a documentação oficial nos Sprints 2.9-2.11c — é mais seguro do que portar esse código para Deno sem conseguir testá-lo de verdade neste ambiente (sem CLI de deploy de Edge Function validado nesta sessão). B fica como candidato real para um sprint futuro, se a limitação de duração por tick da opção E se revelar insuficiente na prática.

**Por que não A isolado**: Cron por si só (opção A) não resolve nada — só reagendaria o MESMO problema de duração sem um mecanismo de claim/checkpoint. A opção E usa o mesmo runtime Vercel (A), mas o que a torna diferente e válida é o desenho do trabalho em **ticks curtos e idempotentes**, nunca uma função tentando fazer a transferência inteira de uma vez.

**Por que não C**: introduzir infraestrutura fora do stack atual (Vercel+Supabase) é desproporcional para o estágio do projeto — mesmo racional já registrado em `DEPLOY_RUNBOOK.md` §1 sobre não adotar CI/CD completo para um solo founder.

## Consequências

- O agendamento (`pg_cron`) é decoupled de verdade do ciclo de vida de qualquer request web — cumpre a "regra fundamental" do sprint.
- Cada tick individual continua sendo uma função Vercel comum, então o design de checkpoint/streaming (Gates 3-5) precisa garantir que NENHUMA unidade de trabalho single-tick dependa de mais tempo do que `maxDuration` permite — isso é uma restrição de design, não uma falha da escolha.
- `pg_net`/`pg_cron` precisam ser habilitados via migration (`create extension`), e a Route Handler `/api/jobs/tick` precisa de autenticação própria (nunca aberta publicamente sem segredo compartilhado) — detalhado no corpo do sprint.
- Débito registrado: se o volume de transferências crescer a ponto de um tick de 15-30s ser gargalo real (não hipotético), a evolução natural é migrar o worker para B (Edge Functions) ou C — sem precisar redesenhar o schema de `integration_jobs`/`provider_uploads`, que já são agnósticos de onde o worker roda.
