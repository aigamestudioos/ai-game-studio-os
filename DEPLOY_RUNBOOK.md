# DEPLOY_RUNBOOK.md

Processo operacional de deploy — nasceu do Sprint 2.5.1 ("Production Readiness"), depois que o Sprint 2.5 revelou que a migration do Sprint 2.4 tinha sido validada localmente mas nunca chegara ao Supabase de produção, e o Golden Path de produção só descobriu isso na hora de criar uma Version de verdade. Este documento existe para que esse tipo de divergência pare de acontecer — ou, na pior das hipóteses, seja descoberta em segundos por um script, não por um usuário real batendo num erro 400.

Complementa, sem substituir: `CLAUDE.md` (limites de tamanho de sprint), `DEFINITION_OF_DONE.md` (o "gate" de schema abaixo é a seção 10 de lá).

---

## 1. Por que este documento existe

Este projeto **não tem pipeline de CI** (não existe `.github/workflows/`). Isso é uma escolha deliberada, reafirmada no Sprint 2.5.1: para um solo founder, manter um pipeline de CI/CD completo (build, testes, deploy automatizado, migrations automáticas) é mais complexidade operacional do que valor entregue neste estágio. O deploy do app (`apps/web`) já é automático via integração nativa Vercel↔GitHub — isso continua. O que faltava era um processo para a outra metade do deploy: **o schema do banco**, que não tem esse mesmo automatismo.

**Decisão:** migrations continuam sendo aplicadas **manualmente**, por quem está no terminal, usando o Supabase CLI — não por um step de CI. Em troca, esse passo manual ganha um script que verifica o estado antes (`scripts/check-schema-sync.sh`) e um checklist que torna impossível esquecer o passo (seção 3). Se o volume de sprints com mudança de schema crescer a ponto de o passo manual virar gargalo real (não hipotético), a evolução natural é automatizar esse único step (`supabase db push` num job de CI) — sem reconstruir o resto do pipeline.

## 2. Quando uma migration precisa ser aplicada em produção

Sempre que um sprint adicionar um arquivo novo em `supabase/migrations/`. Sem exceção — mesmo que a mudança pareça pequena (uma coluna nullable, um índice). O aplicativo em produção lê o schema real do Supabase, não os arquivos do repositório; um `git push` sozinho nunca altera o banco.

**Ordem correta dentro do sprint:**

1. Migration escrita e validada localmente (`supabase migration up` ou `supabase db reset`, contra o Postgres local em Docker) — como já era feito.
2. **Migration aplicada ao Supabase de produção** (`supabase db push`, ver seção 4) — **antes** de considerar a validação de produção do sprint como concluída. Pode acontecer antes ou depois do `git push` do código do app (o código novo em produção só quebra se tentar usar uma coluna que ainda não existe — testar a ordem que fizer mais sentido para o sprint, mas as duas etapas têm que acontecer no mesmo ciclo de release, não em sessões separadas).
3. `scripts/check-schema-sync.sh` rodado e verde.
4. Só então o Golden Path de produção pode ser executado de verdade.

## 3. Checklist obrigatório de deploy (sprints que mudam schema)

Copiar isto no relatório final de qualquer sprint que adicione uma migration:

```
## Deploy Checklist (schema)
[ ] Migration criada em supabase/migrations/ com nome timestamped
[ ] Migration validada localmente (supabase migration up / db reset, Postgres real)
[ ] Migration aplicada em produção (supabase db push)
[ ] scripts/check-schema-sync.sh rodado e verde
[ ] Golden Path executado contra produção (não só local)
[ ] Evidências de produção anexadas ao relatório (prints/checks, não só "rodei")
[ ] IMPLEMENTATION_LOG.md / METRICS.md atualizados com o resultado real
```

Se qualquer item não puder ser marcado, o sprint é **parcialmente concluído** — ver `DEFINITION_OF_DONE.md` §10. Não é uma punição burocrática: é o relatório final refletindo o estado real do software, em vez de "código pronto" ser confundido com "software funcionando em produção".

## 4. Como aplicar uma migration pendente em produção

Duas formas — escolher uma:

**A) Supabase CLI (`supabase db push`) — preferida**

```bash
# uma vez por máquina/sessão:
supabase login
# ou, sem login interativo:
export SUPABASE_ACCESS_TOKEN=<token gerado em supabase.com/dashboard/account/tokens>

# projeto já está linkado (supabase/.temp/project-ref já aponta para vkyswyuxitwakjqjteso);
# revisar o diff antes de confirmar:
supabase db push --dry-run
supabase db push
```

**B) SQL Editor do Supabase Dashboard — fallback, sem precisar de token**

Copiar o conteúdo do(s) arquivo(s) `supabase/migrations/*.sql` pendente(s), na ordem cronológica do nome do arquivo, e rodar diretamente no SQL Editor do projeto (`vkyswyuxitwakjqjteso`) no dashboard. Usar quando não há como gerar/compartilhar um `SUPABASE_ACCESS_TOKEN` na sessão atual.

Em ambos os casos: **nunca** commitar o token, a connection string ou qualquer credencial — nem em arquivos, nem em mensagens de commit, nem em logs colados no chat.

## 5. Validar compatibilidade código↔banco antes de declarar o deploy pronto

```bash
export SUPABASE_ACCESS_TOKEN=<token>   # ou SUPABASE_DB_URL=<connection string>
./scripts/check-schema-sync.sh
```

O script compara `supabase/migrations/` (local) contra o que está de fato aplicado no projeto remoto (`supabase migration list --linked`) e falha (`exit 1`) se houver qualquer migration local sem aplicar remotamente — listando exatamente quais. Sem credencial, ele falha explicando o que falta, em vez de silenciosamente reportar sucesso. Só cobre schema (migrations aplicadas ou não) — não substitui testar o app de verdade contra produção (isso é o Golden Path, item separado do checklist).

## 6. O que aconteceu no Sprint 2.5 (referência)

`supabase/migrations/20260804000001_release_pipeline_extensions.sql` (Sprint 2.4) foi validada e aplicada só localmente. O Sprint 2.5 (UI que depende dessas colunas) foi codificado, testado localmente com sucesso, e deployado — e só na hora de rodar o Golden Path *de produção* o gap apareceu, como um erro `PGRST204` do PostgREST ("Could not find the 'branch' column..."). Ninguém tinha rodado `supabase db push`; não existia processo nem script que pegasse isso antes. Esse é exatamente o cenário que este runbook existe para prevenir — com `check-schema-sync.sh`, esse mesmo gap teria sido detectado em segundos, antes de qualquer tentativa de golden path.

**Nota:** este runbook formaliza o processo; ele não aplica, sozinho, a migration pendente do Sprint 2.4 — isso continua exigindo a credencial (seção 4), que não estava disponível nas sessões em que este documento foi escrito. Ver `IMPLEMENTATION_LOG.md` (Sprint 2.5.1) para o status atual dessa pendência específica.
