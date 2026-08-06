# DEFINITION_OF_DONE.md

Documento de processo — rege como todo sprint/incremento futuro é executado, validado e relatado. Não é arquitetura de produto (isso é `VISION.md`/`docs/frozen/`), é o contrato de qualidade do próprio processo de desenvolvimento.

Assim como `ADR-005-sprint-governance.md`, este documento é autorado pelo projeto (não faz parte do lote frozen) e pode ser revisado livremente conforme o processo evolui — diferente de `docs/frozen/`, que exige ADR para mudar.

Complementa, sem substituir: `AGENT.md` (fluxo por incremento), `CLAUDE.md` (limites de tamanho de sprint), `VISION.md` (direção de produto).

---

## 1. Definition of Done (obrigatória)

Nenhum sprint é considerado concluído sem responder, explicitamente, no relatório final:

- **O que o usuário consegue ver ou fazer agora que antes não conseguia?**
- **Quais rotas novas existem?** (lista explícita, ex.: `/playground`)
- **Quais componentes novos existem?** (lista explícita, ex.: Button, Input...)
- **Quais funcionalidades novas existem?** (se nenhuma, dizer isso explicitamente — sprints de infraestrutura pura são válidos, mas devem se declarar como tal, não deixar a pergunta sem resposta)

Um sprint que só toca documentação/infraestrutura sem nenhum artefato perceptível ainda pode ser válido (ex.: CI, tooling) — mas o relatório deve dizer isso claramente, nunca omitir a pergunta.

## 2. Sprint Review

Todo relatório final de sprint com escopo de produto/UI inclui, além do relatório técnico, uma seção fixa:

```
## Sprint Review
- O que ficou excelente
- O que pode melhorar
- Débito técnico criado
- Riscos
- Recomendações
- O que será reaproveitado nos próximos sprints
```

Sprints puramente técnicos (ex.: bump de dependência trivial) podem omitir esta seção se o usuário concordar caso a caso — por padrão, incluir.

## 3. Métricas de Produto

`METRICS.md` passa a registrar, além das métricas técnicas já existentes (Código/Qualidade/Infraestrutura/Deploy), uma seção **Produto** por sprint:

| Métrica | Como medir |
|---|---|
| Páginas | `find apps/web/app -name page.tsx \| wc -l` |
| Rotas | mesmo que páginas até existirem rotas dinâmicas/paralelas — divergem a partir daí |
| Componentes UI | `ls apps/web/components/ui \| wc -l` |
| Componentes avançados | subconjunto documentado manualmente (overlays/composição — ex.: Dialog, DropdownMenu) |
| Providers | `find apps/web/providers -maxdepth 1 -name "*.tsx" \| wc -l` |
| Hooks | `find apps/web/hooks -maxdepth 1 -name "*.ts" \| wc -l` |
| Features | `find apps/web/features -mindepth 1 -maxdepth 1 -type d \| wc -l` |
| Fluxos completos | manual — um fluxo conta quando cobre uma jornada de ponta a ponta, não só um componente isolado |
| Deploys | manual (contagem de pushes para `main` que geraram deploy validado em produção) |
| ADRs | `ls ADR-*.md docs/frozen/architecture/ADR-*.md \| wc -l` |
| SPECs | `ls docs/frozen/architecture/AGSOS-SPEC-*.md \| wc -l` |
| Tempo médio de build | já coletado por `scripts/metrics.sh` |
| Tempo médio de deploy | manual/TBD — sem token da Vercel não há como automatizar via API; medir manualmente quando relevante |

`scripts/metrics.sh` automatiza o que é possível (marcado acima); os campos manuais ficam explícitos como tal no output, não silenciosamente zerados.

## 4. RELEASE_NOTES.md

Dois changelogs, públicos diferentes:

- **`CHANGELOG.md`** — técnico, para quem lê código/PRs (formato Keep a Changelog, já em uso).
- **`RELEASE_NOTES.md`** — linguagem simples, para quem acompanha o produto sem contexto técnico. Um bullet por entrega perceptível, com emoji opcional (✨ para novidade, 🐛 para correção, 🎨 para visual), sem jargão de implementação.

Atualizar os dois a cada sprint que tenha algo perceptível a comunicar (sprints puramente técnicos podem não gerar entrada em `RELEASE_NOTES.md`).

## 5. Screenshots obrigatórios

Todo sprint que toca UI gera, em `docs/screenshots/sprint-X.Y/`:

- Home (Light)
- Home (Dark)
- Toda rota nova ou alterada (Light)
- Toda rota nova ou alterada (Dark)

Preferir captura de página inteira (`fullPage`) quando o conteúdo passar da viewport. Screenshots ficam versionados — fazem parte do histórico visual do projeto, não são descartáveis.

## 6. Verificação visual

Gerar os screenshots não é suficiente — depois de capturá-los, revisar cada um e responder explicitamente:

- Há componentes quebrados?
- Há overflow horizontal?
- Há alinhamentos incorretos?
- Há espaçamentos inconsistentes?
- Há problemas de contraste?
- Há problemas de responsividade?

Essa revisão é o que pegou o bug de `max-w-md` no Incremento 0.4a — build/lint/typecheck verdes não substituem essa checagem.

## 7. Limite de escopo

Já formalizado em `CLAUDE.md`, reafirmado aqui como parte do DoD:

- Ideal: até ~30 arquivos modificados por sprint.
- Máximo: 50 arquivos.
- Interromper e propor divisão se exceder: 50 arquivos alterados, OU 10 arquivos novos, OU 3 packages modificados.

## 8. Critério de encerramento

Todo relatório final termina com o resumo estruturado abaixo (adaptar os itens ✔ conforme o que se aplica ao sprint — marcar como N/A o que não se aplica, nunca omitir a linha):

```
## Definition of Done
✔ Build
✔ Lint
✔ Typecheck
✔ Testes
✔ Deploy
✔ Screenshots
✔ Revisão visual
✔ Documentação
✔ Métricas
✔ Commit
✔ Push

## Valor entregue ao usuário
(o que existe agora que não existia antes — rotas, componentes, funcionalidades)

## Product Delta
O que o usuário consegue fazer hoje que não conseguia ontem?
```

## 9. Product Delta (obrigatório, não pode ficar vazio)

Regra permanente: todo relatório final responde, em uma frase concreta e perceptível, "o que o usuário consegue fazer hoje que não conseguia ontem?". Atualizar também [PRODUCT_PROGRESS.md](PRODUCT_PROGRESS.md) com essa mesma frase.

Respostas inválidas (melhoria interna, não delta de produto):
- ❌ "Atualizamos métricas."
- ❌ "Melhoramos a arquitetura."
- ❌ "Refatoramos componentes."

Respostas válidas (algo que o usuário vê ou faz na aplicação):
- ✅ "Agora existe uma página Playground com componentes interativos."
- ✅ "Agora é possível autenticar com Google."
- ✅ "Agora o Dashboard mostra os projetos."

Sprints puramente de processo/infraestrutura (sem nada perceptível na aplicação — ex.: este próprio incremento de governança) declaram isso explicitamente em vez de forçar uma resposta artificial: "Nenhum Product Delta — sprint de processo/infraestrutura."

## 10. Gate de Schema/Migrations (obrigatório desde o Sprint 2.5.1)

**Origem:** Sprint 2.5 — a migration do Sprint 2.4 foi validada localmente, o app foi codificado e deployado sobre ela, e só na hora de rodar o Golden Path de produção descobriu-se que a migration nunca tinha sido aplicada ao Supabase remoto (`PGRST204: could not find the 'branch' column`). Nenhuma etapa do processo até então obrigava verificar isso antes de declarar o sprint concluído.

**Regra permanente:** nenhum sprint que crie ou altere um arquivo em `supabase/migrations/` pode ser declarado **Concluído** sem, todos os quatro, confirmados no relatório final (ver checklist completo em `DEPLOY_RUNBOOK.md` §3):

1. Migration aplicada em produção (`supabase db push`, ou SQL Editor — `DEPLOY_RUNBOOK.md` §4).
2. `scripts/check-schema-sync.sh` executado e verde.
3. Golden Path (ou o fluxo relevante) executado **contra produção**, não só localmente.
4. Evidências de produção anexadas ao relatório e documentação (`IMPLEMENTATION_LOG.md`/`METRICS.md`) atualizada refletindo o resultado real.

**Se qualquer um desses quatro falhar:** o sprint é relatado como **Parcialmente Concluído**, com o item faltante nomeado explicitamente — nunca como "Concluído" com uma ressalva escondida no meio do texto. Isso não é uma penalidade: é o relatório final continuar sendo uma fonte confiável do estado real do software, mesmo quando o bloqueio é operacional (falta de credencial, infraestrutura de terceiros fora do ar) e não um erro de código.

## 11. Checklist de Segurança SQL — toda função `SECURITY DEFINER` nova (obrigatório desde o Sprint 2.9.1)

**Origem:** Sprint 2.9.1 — `get_store_connection_secret()`/`set_store_connection_secret()`/`clear_store_connection_secret()` (Sprint 2.8/2.9) tinham `EXECUTE` concedido a `anon` em produção, mesmo com `revoke ... from public` nas três. Causa: este projeto Supabase concede `EXECUTE` em função nova diretamente às roles nomeadas (`anon`/`authenticated`/`service_role`), não ao pseudo-role `PUBLIC` — `revoke ... from public` nunca tocou esses grants. O Postgres local não reproduz esse comportamento, então 9/9 testes locais não pegaram o gap. Só uma chamada REST anônima real contra produção revelou o problema.

**Regra permanente:** nenhum sprint que crie uma função `SECURITY DEFINER` nova (ou altere o `GRANT` de uma existente) pode ser declarado **Concluído** sem, todos os seis, confirmados no relatório final:

1. `EXECUTE` concedido só às roles que de fato precisam chamar a função — nunca por padrão do Postgres/do projeto.
2. `REVOKE EXECUTE ... FROM anon, authenticated` (ou o subconjunto que não deveria ter acesso) explícito na mesma migration — nunca só `FROM PUBLIC` (não é suficiente neste projeto).
3. Teste autenticado com a role que **deveria** ter acesso — confirma que o caminho legítimo funciona.
4. Teste anônimo real (`anon key`, sem login, via REST/RPC) contra o ambiente em que a função existe — confirma que quem não deveria ter acesso é bloqueado. **Local não substitui isso** — os comportamentos de `GRANT` padrão divergem entre o Postgres self-hosted e o projeto Supabase hospedado.
5. `service_role` validado explicitamente quando a função for uma daquelas cujo acesso deveria ser exclusivo dele (ex.: leitura de segredo do Vault) — confirmar que `authenticated` é rejeitado, não só que `service_role` funciona.
6. Evidência registrada no relatório final (resposta HTTP/mensagem de erro de cada teste, não só "testado").

**Se qualquer um desses seis falhar:** mesmo tratamento do Gate de Schema (§10) — sprint relatado como **Parcialmente Concluído**, item faltante nomeado.
