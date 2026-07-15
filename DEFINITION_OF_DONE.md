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
```
