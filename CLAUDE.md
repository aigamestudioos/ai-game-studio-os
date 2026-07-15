# CLAUDE.md

Diretrizes de processo para trabalhar neste repositório.

## Tamanho de sprint / commits

- Ideal: até ~30 arquivos alterados por sprint.
- Máximo: 50 arquivos por sprint.
- Se uma mudança exigir alterar mais de 50 arquivos, isso é sinal de que o sprint está grande demais — parar e propor dividir em sprints menores antes de prosseguir, em vez de simplesmente executar a mudança inteira de uma vez.

## Complexidade

Interromper e propor dividir o sprint ANTES de implementar se qualquer um destes limites for excedido:

- alterar mais de 50 arquivos; OU
- criar mais de 10 arquivos novos; OU
- modificar mais de 3 packages.

Isso evita que um único sprint atravesse muitos módulos ao mesmo tempo.

## Métricas

- Ao final de cada sprint, rodar `./scripts/metrics.sh` e atualizar [METRICS.md](METRICS.md) com uma nova entrada (não sobrescrever entradas de sprints anteriores).
- Ver [IMPLEMENTATION_LOG.md](IMPLEMENTATION_LOG.md) para o registro narrativo de cada sprint (o "porquê"); METRICS.md é só o snapshot numérico.
