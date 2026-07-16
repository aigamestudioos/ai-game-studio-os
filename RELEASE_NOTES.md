# RELEASE_NOTES.md

Novidades do AI Game Studio OS, em linguagem simples — para quem acompanha o produto, não o código. Para o histórico técnico, ver [CHANGELOG.md](CHANGELOG.md).

---

## Sprint 1.6 — Login

✨ Agora existe uma tela de **login** (`/login`) — obrigatória para acessar Dashboard, Projects, Games, Knowledge e Publishing
✨ Menu do usuário mostra seu nome e email de verdade, e o botão **Sair** agora funciona
🔧 Ainda é uma demonstração — qualquer email e senha entram, sem conta real ainda. Autenticação de verdade chega com a integração ao Supabase

## Sprint 1.5 — Publishing

✨ Novo módulo **Publishing**, em `/publishing` — acompanhe a publicação dos seus jogos nas lojas
✨ Botão **New Submission** abre um formulário com jogo, versão e loja (App Store, Google Play ou Steam)
✨ Cada submissão tem sua própria página com o histórico completo de status
🔧 Ainda sem login, banco de dados real ou integração com as lojas — as submissões criadas ficam salvas só neste navegador, prontas para virar dados reais quando o Supabase e os adapters externos forem integrados

## Sprint 1.4 — Knowledge

✨ Novo módulo **Knowledge**, em `/knowledge` — a base de conhecimento do estúdio
✨ Botão **New Document** abre um formulário com título, resumo e tipo (Documento, Template, Playbook, SOP, ADR ou SPEC)
✨ Cada documento tem sua própria página com o conteúdo completo
🔧 Ainda sem login ou banco de dados real — os documentos criados ficam salvos só neste navegador, prontos para virar dados reais quando o Supabase for integrado

## Sprint 1.3 — Games

✨ Novo módulo **Games**, em `/games` — gerencie o ciclo de vida dos seus jogos
✨ Botão **Create Game** abre um formulário com nome, descrição e seleção de plataformas (iOS, Android, Steam)
✨ Cada jogo tem sua própria página com plataformas e histórico de builds
🔧 Ainda sem login ou banco de dados real — os jogos criados ficam salvos só neste navegador, prontos para virar dados reais quando o Supabase for integrado

## Sprint 1.2 — Projects

✨ Primeiro fluxo de negócio de verdade: **Projects**, em `/projects`
✨ Botão **New Project** abre um formulário simples (nome e descrição) e cria o projeto na hora
✨ Cada projeto tem sua própria página de detalhes, com epics e progresso
🔧 Ainda sem login ou banco de dados real — os projetos criados ficam salvos só neste navegador, prontos para virar dados reais quando o Supabase for integrado

## Sprint 1.1 — Dashboard

✨ Primeira tela real do produto: o **Dashboard**, em `/dashboard`
✨ Menu lateral com todos os módulos do sistema (Projects, Games, Knowledge, Publishing, Marketing, Analytics, Finance e mais)
✨ Visão geral com estatísticas rápidas, ações rápidas, projetos recentes (com progresso), atividade recente e insights de IA
✨ Menu lateral recolhível, e em celular vira um menu que desliza pela lateral
🔧 Ainda sem login ou dados reais — tudo o que você vê é uma demonstração visual, pronta para receber funcionalidades de verdade nos próximos sprints

## Incremento 0.5 — Nova página inicial

✨ O AI Game Studio OS ganhou uma **página inicial completamente nova** — a primeira impressão real do produto
✨ Apresenta o que o sistema faz, como funciona, os módulos da plataforma, benefícios e o que vem a seguir (roadmap)
✨ Perguntas frequentes já respondidas na própria página
✨ Visual pensado para transmitir um produto premium, com boas animações e sem perder performance

## Incremento 0.4b — Janelas, avisos e notificações

✨ Agora é possível abrir **janelas de diálogo** (para editar algo) e **janelas de confirmação** (para ações que não podem ser desfeitas, como excluir)
✨ Novo sistema de **notificações rápidas** (toasts) para avisar sucesso, atenção ou erro
✨ **Dicas contextuais** ao passar o mouse sobre botões
✨ **Menus suspensos** com opções de ação
✨ Novos avisos visuais (alerts), indicadores de carregamento e barra de progresso
🐛 Corrigidos três pequenos problemas visuais encontrados durante a revisão (contraste da janela de fundo, alinhamento de avisos, um aviso técnico no console)

## Incremento 0.4a — Biblioteca de componentes e Playground

✨ Novo **Playground** (`/playground`) — ambiente permanente para ver os componentes visuais do sistema funcionando
✨ Primeira leva de componentes: **Button, Input, Textarea, Card, Badge, Avatar**
✨ Todos os componentes já suportam **modo claro e escuro**
🐛 Corrigido um bug visual em que campos de texto e cards apareciam achatados no Playground

## Incremento 0.6 — No ar

✨ O AI Game Studio OS está publicado em: https://ai-game-studio-os-web.vercel.app/
✨ Toda mudança enviada ao repositório agora aparece em produção automaticamente

## Incremento 0.3 — Visual e temas

✨ Sistema de cores e temas do projeto definido
✨ Alternância entre modo claro e escuro

## Incremento 0.2 — Primeira página

✨ Primeira página do sistema no ar (ainda sem estilo)

## Incremento 0.1 — Fundação

🔧 Estrutura inicial do projeto (sem novidades visíveis ainda)
