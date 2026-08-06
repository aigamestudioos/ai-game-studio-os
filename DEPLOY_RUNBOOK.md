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

**Se for passar o token para um agente de IA rodando neste Codespace** (Claude Code ou similar): `export` no seu terminal **não funciona** — o agente roda num processo separado do seu terminal, e variáveis de ambiente não atravessam essa fronteira entre processos (só o filesystem é compartilhado). O caminho que funciona é escrever o token num arquivo fora do repositório, nunca commitado (ex.: `echo "SEU_TOKEN" > /tmp/supabase_token`, **sem espaço depois da primeira barra** — um espaço aí faz o `>` redirecionar para `/` em vez de `/tmp/...` e o comando falha silenciosamente), para o agente ler o arquivo e exportar a variável só dentro das próprias chamadas. **Nunca cole o token diretamente na conversa/chat com o agente** — se isso acontecer por engano, trate o token como comprometido, revogue-o em `supabase.com/dashboard/account/tokens` e gere um novo antes de continuar (aconteceu de verdade no Sprint 2.7.1 — ver `IMPLEMENTATION_LOG.md`).

## 5. Validar compatibilidade código↔banco antes de declarar o deploy pronto

```bash
export SUPABASE_ACCESS_TOKEN=<token>   # ou SUPABASE_DB_URL=<connection string>
./scripts/check-schema-sync.sh
```

O script compara `supabase/migrations/` (local) contra o que está de fato aplicado no projeto remoto (`supabase migration list --linked`) e falha (`exit 1`) se houver qualquer migration local sem aplicar remotamente — listando exatamente quais. Sem credencial, ele falha explicando o que falta, em vez de silenciosamente reportar sucesso. Só cobre schema (migrations aplicadas ou não) — não substitui testar o app de verdade contra produção (isso é o Golden Path, item separado do checklist).

## 6. O que aconteceu no Sprint 2.5 (referência)

`supabase/migrations/20260804000001_release_pipeline_extensions.sql` (Sprint 2.4) foi validada e aplicada só localmente. O Sprint 2.5 (UI que depende dessas colunas) foi codificado, testado localmente com sucesso, e deployado — e só na hora de rodar o Golden Path *de produção* o gap apareceu, como um erro `PGRST204` do PostgREST ("Could not find the 'branch' column..."). Ninguém tinha rodado `supabase db push`; não existia processo nem script que pegasse isso antes. Esse é exatamente o cenário que este runbook existe para prevenir.

**Atualização (Sprint 2.7.1):** as migrations pendentes do Sprint 2.4 e do Sprint 2.7 foram confirmadas aplicadas em produção — de forma independente, via PostgREST (colunas novas respondem sem erro) e `supabase db dump --linked` (texto das políticas de RLS bate com as migrations locais), não só confiando no ledger `supabase migration list`. `pnpm check:schema` está verde. Ver `IMPLEMENTATION_LOG.md` (Sprint 2.7.1) para as evidências completas.

## 7. `check-schema-sync.sh` teve um bug real — corrigido, mas serve de lição

Quando finalmente testado com uma credencial real pela primeira vez (Sprint 2.7.1), `check-schema-sync.sh` reportava **todas** as migrations como pendentes, mesmo com o schema em sincronia — um falso negativo, não um falso positivo (o tipo mais perigoso: o script "funcionava" no sentido de nunca aprovar silenciosamente algo errado, mas teria bloqueado todo `pnpm check:schema` para sempre). Causa: a CLI do Supabase emite uma linha JSON (`{"migrations":[...]}`), e o parsing original (`awk -F'|'`) assumia a tabela de texto de uma versão mais antiga da CLI. Corrigido para parsear o JSON de verdade (commit `1a06e77`).

**Lição:** um script de verificação nunca testado contra o caso real que ele deveria pegar é só uma suposição de que funciona. Da próxima vez que este script (ou qualquer verificação de schema) for escrito ou alterado, validar contra uma execução real com credencial antes de confiar nele como parte do gate — não só revisar o código.

**Nota:** este runbook formaliza o processo; ele não aplica, sozinho, a migration pendente do Sprint 2.4 — isso continua exigindo a credencial (seção 4), que não estava disponível nas sessões em que este documento foi escrito. Ver `IMPLEMENTATION_LOG.md` (Sprint 2.5.1) para o status atual dessa pendência específica.

## 8. Supabase Vault (Sprint 2.8)

`store_connections` (e qualquer domínio futuro que precise guardar um segredo de terceiro — tokens de outras integrações de `AGSOS-SPEC-008`) usa a extensão `supabase_vault` para o padrão de ponteiro já documentado (`credentials_ref` nunca é o segredo, é o UUID de um registro no Vault). Duas coisas específicas de Vault que não se aplicam a migrations "normais":

- **Testar contra a documentação não basta.** A suposição inicial de que existiria `vault.delete_secret()` (por analogia com `create_secret`/`update_secret`) estava errada na versão instalada (`0.3.1`) — só as duas primeiras existem como função; apagar um segredo é um `DELETE` direto em `vault.secrets` (a tabela real por trás da view `vault.decrypted_secrets`). Antes de assumir que uma função de uma extensão existe, checar com `\df vault.*` (ou o schema equivalente) contra o Postgres real primeiro.
- **`vault.secrets`/`vault.decrypted_secrets` nunca são acessíveis via PostgREST/API, para nenhum role** (nem `service_role`) — só via conexão direta ao Postgres (`psql`, ou uma função `SECURITY DEFINER` que roda dentro do banco). Isso é uma propriedade de segurança desejada, não uma limitação a contornar: é exatamente o que garante "nunca expor credenciais ao frontend" no nível do banco, não só por ausência de um endpoint.

## 9. GRANT padrão em funções novas é PUBLIC — sempre revogar explicitamente (Sprint 2.9)

Achado ao revisar o Sprint 2.8 antes de estendê-lo: diferente de tabelas (sem `GRANT`, ninguém acessa), toda função nova no Postgres recebe `EXECUTE` para `PUBLIC` por padrão. `set_store_connection_secret()` (Sprint 2.8) nunca tinha um `revoke ... from public` — não era explorável na prática (a checagem de permissão interna já bloqueava `anon`/qualquer role sem a permissão certa), mas era uma camada de defesa a menos do que deveria existir. Regra a partir de agora: toda função `SECURITY DEFINER` nova leva, sempre, `revoke execute ... from public;` explícito antes do `grant` para o role que de fato deveria poder chamá-la — nunca confiar no padrão do Postgres aqui.

**Atualização (Sprint 2.9.1) — essa regra sozinha não bastou, ver §11.**

## 10. Validando integrações externas sem credenciais reais (Sprint 2.9)

Quando uma integração real (Apple, Google, etc.) não tem credencial de teste disponível: nunca simular sucesso. O padrão usado no Sprint 2.9 — testar com credenciais **sintaticamente válidas mas fabricadas** (uma chave EC P-256 gerada localmente, um Issuer ID/Team ID inventados) contra a API real do provedor — é o mais próximo de um teste real que dá para fazer sem a credencial verdadeira: confirma conectividade de rede, formato do JWT/request, e que o provedor de fato rejeita (nunca aceita por engano) uma credencial falsa. O caminho de sucesso continua não verificado até uma credencial real existir — documentar isso explicitamente como pendência, nunca como "concluído".

## 11. `revoke ... from public` NÃO basta neste projeto Supabase — GRANTs a `anon`/`authenticated` são automáticos e separados (achado crítico, Sprint 2.9.1)

Achado validando produção de verdade pela primeira vez (não em código/local, onde o comportamento é diferente — ver abaixo): `get_store_connection_secret()`, `set_store_connection_secret()` e `clear_store_connection_secret()` foram criadas com `revoke execute ... from public` (regra do §9 acima), mas em produção **todas as três continuavam com `EXECUTE` concedido diretamente às roles nomeadas `anon`/`authenticated`/`service_role`** — inclusive `get_store_connection_secret()`, que deveria ser alcançável só por `service_role`. Confirmado com uma chamada REST anônima de verdade (sem login, só a `anon key` pública) contra produção, que executou a função sem erro de permissão, antes de qualquer correção ser escrita.

**Causa raiz:** este projeto Supabase concede `EXECUTE` em toda função nova do schema `public` diretamente às roles `anon`/`authenticated`/`service_role` (privilégios padrão configurados no nível do projeto, não do pseudo-role `PUBLIC`). `REVOKE ... FROM PUBLIC` só remove o grant implícito ao pseudo-role `PUBLIC` — nunca toca grants explícitos já concedidos a roles nomeadas. **O ambiente local (Docker, self-hosted) não reproduz esse comportamento** — validado localmente que `get_store_connection_secret()` já ficava corretamente restrita a `service_role` sem nenhum ajuste extra, o que fez a lacuna passar despercebida em toda a validação local do Sprint 2.9.

**Regra a partir de agora:** depois de criar qualquer função `SECURITY DEFINER` nova, `revoke execute ... from public` não é suficiente — sempre `revoke execute ... from anon, authenticated` explicitamente (mesmo que a intenção final seja conceder a `authenticated` de novo em seguida) e **validar contra produção de verdade** com uma chamada REST anônima real antes de considerar o gate de segurança fechado. Testar só localmente não é suficiente para este tipo de verificação — o comportamento de grants padrão diverge entre o Postgres local e o projeto Supabase hospedado.

**Correção aplicada:** `20260807000002_store_connection_secret_grants_fix.sql`, aplicada em produção no mesmo ciclo em que foi descoberta (sem esperar um próximo sprint) — confirmado depois com uma nova chamada REST anônima retornando `401 permission denied` nas três funções.

## 12. Sprint sem migration nova ainda precisa do Gate de Schema/Segurança verificado (Sprint 2.10)

O Sprint 2.10 (Google Play) não criou nenhuma migration — `store_connections`/`set_store_connection_secret()`/`get_store_connection_secret()`/`clear_store_connection_secret()` já eram agnósticas de provider desde o Sprint 2.8/2.9, e a platform "Google Play" já estava seedada desde o schema original de Publishing. Mesmo assim, o comportamento de `GRANT` corrigido no §11 foi revalidado localmente para a Google Play especificamente (não só assumido por analogia com a Apple): `set_store_connection_secret()` autenticado funciona, `get_store_connection_secret()` bloqueado para `authenticated` (`403`) e `anon` (`401`), liberado para `service_role` (`200`) — mesmo resultado da Apple, confirmando que a correção do Sprint 2.9.1 é genuinamente agnóstica de provider, não uma correção específica de um caminho de código só. Registrado como prática: mesmo um sprint "sem SQL novo" que reusa uma função `SECURITY DEFINER` existente para um caso de uso novo deveria reconfirmar o comportamento de GRANT contra esse caso de uso específico, não só assumir que "já foi validado antes" cobre o caso novo.
