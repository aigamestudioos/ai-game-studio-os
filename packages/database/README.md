# @agsos/database

Clientes Supabase + tipos gerados + repositories, conforme `ADR-003`. Ver [DATA_MODEL.md](../../DATA_MODEL.md) na raiz do repositório para a arquitetura de dados completa (ER, convenções, RLS, riscos).

**Status:** Sprint 1.8d-1. Projeto Supabase remoto (`dev`) conectado e com o schema completo aplicado (12 migrations via `supabase db push`). Auth, Studio bootstrap e User Workspace já usam o banco real; `apps/web/lib/*-store.ts` (Projects/Games/Knowledge/Publishing) ainda são mock — migração fica para os Sprints 2.0+.

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

Todas as 12 migrations e o seed completo foram validados dessa forma antes de aplicar no projeto remoto (`supabase db push`) — foi exatamente esse processo que encontrou os dois bugs reais de RLS corrigidos no Sprint 1.8d-1 (recursão infinita, GRANTs ausentes), documentados em `DECISIONS.md`.

## Pendências

- Regenerar `database.types.ts` via `supabase gen types typescript` (nunca editar manualmente depois disso) — hand-written por enquanto.
- Onboarding de Studio: hoje todo novo usuário ganha um Studio próprio automaticamente (`bootstrap_studio_for_current_user`, Sprint 1.8d-1); aceitar convite para um Studio existente fica para o Sprint 1.8d-3.
- `supabase/tests/` — testes de RLS obrigatórios por tabela (5 cenários cada, ver `DATA_MODEL.md` §6) — ainda vazio.
- Migrar perfil/preferências de `auth.users.user_metadata` (Sprint 1.8c) para `public.users` agora que a tabela existe de verdade.
- Substituir os 5 stores mock de `apps/web/lib/*-store.ts` pelos repositories daqui (Sprints 2.0+).
