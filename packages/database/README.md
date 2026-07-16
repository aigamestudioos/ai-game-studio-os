# @agsos/database

Clientes Supabase + tipos gerados + repositories, conforme `ADR-003`. Ver [DATA_MODEL.md](../../DATA_MODEL.md) na raiz do repositório para a arquitetura de dados completa (ER, convenções, RLS, riscos).

**Status:** Sprint 1.7 — Foundation for Supabase. Estrutura e schema local prontos; **sem projeto Supabase real conectado ainda** (sem credenciais — ver `DECISIONS.md`). `apps/web` continua usando os stores mock em `lib/*-store.ts` até o Sprint 1.8.

## Estrutura

```
src/
├── browser-client.ts   — Client Components (chave pública, sujeito a RLS)
├── server-client.ts    — Server Components/Actions (contexto de sessão, sujeito a RLS)
├── admin-client.ts     — Operações admin (service role, bypassa RLS, só servidor)
├── generated/
│   └── database.types.ts  — hand-written por enquanto (ver TODO no arquivo);
│                             substituir por `supabase gen types typescript`
│                             assim que o projeto for linkado
├── repositories/        — acesso a dados por Aggregate Root (studios, projects,
│                           games, knowledge-documents, submissions)
├── queries/              — Query Layer (populado no Sprint 1.8+, ver README interno)
└── mutations/             — Command Bus (populado no Sprint 1.8+, ver README interno)
```

## supabase/

```
supabase/
├── migrations/   — schema SQL, forward-only, uma migration por contexto de negócio
├── seed/         — dados de desenvolvimento, organizados por domínio
├── seed.sql      — entry point (concatena seed/*.sql — supabase CLI não
│                   suporta `\i` do psql na seed automática)
├── functions/    — Edge Functions (Deno) — vazio ainda
├── tests/        — testes de RLS — vazio ainda (ver pendência abaixo)
└── config.toml
```

## Como testar localmente

Requer Docker.

```bash
npx supabase db start   # sobe Postgres local + aplica migrations + seed
npx supabase status     # mostra DB_URL local
npx supabase stop       # encerra os containers
```

Todas as 9 migrations e o seed completo (1 Studio, 1 User, 3 Projects, 3 Games, 3 Knowledge Documents, 3 Submissions) foram validados dessa forma durante o Sprint 1.7, incluindo a proteção append-only de `studio_events`/`knowledge_document_versions` e RLS habilitado em todas as tabelas de negócio.

## Pendências (Sprint 1.8+)

- Conectar a um projeto Supabase real (credenciais do usuário) e rodar `supabase link` + `supabase db push`.
- Regenerar `database.types.ts` via `supabase gen types typescript` (nunca editar manualmente depois disso).
- Resolver o fluxo de onboarding (criar Studio novo vs. aceitar convite) — `handle_new_auth_user()` está com TODO explícito, não decide isso sozinho.
- `supabase/tests/` — testes de RLS obrigatórios por tabela (5 cenários cada, ver `DATA_MODEL.md` §6).
- Substituir os 5 stores mock de `apps/web/lib/*-store.ts` pelos repositories daqui.
