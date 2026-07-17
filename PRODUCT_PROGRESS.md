# PRODUCT_PROGRESS.md

Uma linha por sprint: o Product Delta — o que o usuário consegue ver ou fazer hoje que não conseguia antes. Não é changelog técnico (isso é [CHANGELOG.md](CHANGELOG.md)) nem métricas (isso é [METRICS.md](METRICS.md)). É só a evolução perceptível do produto, de forma que dê para ler esta tabela de cima a baixo daqui a um ano e enxergar a trajetória.

| Sprint | Valor entregue |
|---|---|
| 0.1 | Nenhum — fundação do monorepo, sem nada visível na aplicação ainda |
| 0.2 | Primeira página do sistema no ar (sem estilo) |
| 0.3 | A aplicação tem tema visual, com alternância entre claro e escuro |
| 0.4a | Existe uma página `/playground` com os primeiros 6 componentes interativos (Button, Input, Textarea, Card, Badge, Avatar) |
| 0.4b | Agora é possível abrir janelas de diálogo/confirmação, receber notificações (toasts), ver dicas ao passar o mouse e usar menus suspensos — 10 novos componentes interativos no `/playground` |
| 0.4c | _(congelado por decisão estratégica — Playground não será mais expandido; energia vai para telas reais do produto)_ |
| 0.5 | A home antiga virou uma **Landing Page completa**: primeira impressão real do produto, com visão geral, como funciona, módulos, benefícios, roadmap e FAQ |
| 1.1 | Existe um **Dashboard** de verdade em `/dashboard` — menu com todos os módulos, estatísticas, ações rápidas, projetos recentes, atividade e insights de IA (ainda sem login/dados reais) |
| 1.2 | Agora é possível **criar um projeto de verdade**: `/projects` → New Project → preencher → ver o projeto criado com progresso e epics em `/projects/[id]` |
| 1.3 | Mesmo fluxo para **jogos**: `/games` → Create Game → escolher plataformas → acompanhar builds no Game Workspace |
| 1.4 | Mesmo fluxo para a **base de conhecimento**: `/knowledge` → New Document → escolher tipo → ler o documento completo |
| 1.5 | Mesmo fluxo para **publicação**: `/publishing` → New Submission → escolher loja → acompanhar o histórico de status da submissão |
| 1.6 | Agora existe **login** (`/login`) — obrigatório para acessar qualquer área do produto; o menu do usuário mostra sua sessão real e "Sair" funciona (ainda uma demonstração, sem conta real) |
| 1.7 | _Nenhum — sprint de infraestrutura (banco de dados preparado nos bastidores, sem mudança visível na aplicação)_ |
| 1.8a | O **login agora é de verdade** — sua conta e senha são validadas por um servidor real (Supabase), não mais uma demonstração. Sua sessão continua válida entre recarregar a página, fechar/abrir o navegador e abrir em outra aba, sem precisar entrar de novo |
| 1.8b | Agora é possível **recuperar a senha** — "Esqueceu sua senha?" no login envia um email com link de redefinição, com indicador de força da nova senha |
| 1.8c | Nova tela de **Configurações da conta** — edite nome, avatar, fuso horário e idioma; sua preferência de **tema** agora é salva de verdade (não reseta em outro dispositivo); troque a senha ou saia de todos os dispositivos sem sair do app |
