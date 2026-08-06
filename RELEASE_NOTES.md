# RELEASE_NOTES.md

Novidades do AI Game Studio OS, em linguagem simples — para quem acompanha o produto, não o código. Para o histórico técnico, ver [CHANGELOG.md](CHANGELOG.md).

---

## Sprint 2.10.1 — Veja a saúde das suas integrações

✨ Cada conexão em **Settings → Store Connections** agora mostra um painel **Integration Health**: está funcionando agora? Quando foi a última vez que funcionou? Com que frequência tem falhado nas últimas 24h e 7 dias? Quanto tempo cada chamada está levando?
✨ Status visual rápido: Saudável, Degradado, Com erro, Nunca validado ou Desconectado
✨ Histórico das últimas chamadas, com horário e resultado de cada uma
🔧 Tudo calculado a partir do que já acontece quando você clica em Validate — nada de configuração nova, nenhuma chamada extra às lojas

## Sprint 2.10 — Conecte sua conta Google Play

✨ A tela **Settings → Store Connections** agora também conecta sua conta **Google Play** — escolha o provider (Apple ou Google) e preencha o Package Name + a chave da Service Account
✨ Botão **Validate** testa a conexão contra o Google de verdade
🔧 A conexão de rede com o Google (autenticação, tratamento de erro) já está validada e testada; o resultado final com uma Service Account de um app real do Google Play Console ainda não foi confirmado, só falta essa credencial

## Sprint 2.9 — Conecte sua conta Apple

✨ Nova tela **Settings → Store Connections** — cadastre sua conta Apple App Store Connect (Issuer ID, Key ID, Team ID, Private Key)
✨ Botão **Validate** testa a conexão contra a Apple de verdade; quando aprovada, mostra seus Apps
✨ Botões **Disconnect**, **Editar** e **Remover** para gerenciar suas conexões
🔧 A conexão de rede com a Apple (endereço, segurança, autenticação, tratamento de erro) já está validada e testada; o resultado final com uma conta Apple Developer real — a lista de Apps de verdade — ainda não foi confirmado, só falta essa credencial

## Sprint 2.8 — Preparação para conectar Apple/Google (bastidores)

_Nenhuma mudança visível ainda — a base para conectar contas reais da Apple App Store Connect e do Google Play Console foi construída (guarda segura de credenciais, permissões de acesso). A tela para usar isso chega em um sprint futuro._

## Sprint 2.7 — Gerencie membros do seu time

✨ Em **Settings → Studio**, agora dá para **trocar o papel** de um membro já convidado (Admin ⇄ Member) direto na lista
✨ Agora também dá para **remover um membro** do Studio
🔧 Reforço de segurança nos bastidores: só quem tem permissão de gerenciar membros consegue fazer essas duas ações — garantido pelo próprio banco de dados, não só pela tela

## Sprint 2.6 — Dashboard com dados reais do seu Release Pipeline

✨ O Dashboard agora mostra suas **builds mais recentes**, **builds que falharam** e **releases pendentes** — dados reais, não mais só demonstração
🔧 Por trás dos panos, os eventos do Release Pipeline (Version/Build/Release/Submission) agora são fortemente tipados, reduzindo o risco de bugs futuros

## Sprint 2.5 — Publique jogos de ponta a ponta (com simulação de build)

✨ Dentro de um Game, crie uma **Version**, gere uma **Build** (o progresso é simulado por enquanto — ainda não há fábrica de builds real conectada) e crie um **Release**
✨ Acompanhe tudo numa **Timeline** com o histórico completo daquela versão
✨ Com um Release pronto, "New Submission" em Publishing já funciona de verdade
🔧 Se a build simulada ficar "travada" (por exemplo, se você recarregar a página no meio do processo), a tela agora avisa e oferece **Retry Build**
🔧 Aviso deixado bem claro: builds ainda são simuladas, não um pipeline de verdade — isso vem em um sprint futuro

## Sprint 2.4 — Preparação para builds e releases (bastidores)

_Nenhuma mudança visível — schema e conexões internas preparadas para o Sprint 2.5._

## Sprint 2.3 — Publishing de verdade (só consulta, por enquanto)

✨ Suas **submissões de publicação agora são dados reais**
🔧 Criar uma nova submissão ainda não está disponível — depende de builds/releases, que chegam no próximo sprint

## Sprint 2.2 — Knowledge de verdade

✨ Seus **documentos da base de conhecimento agora são salvos de verdade**
✨ Mais opções de tipo de documento (Guia, Política, Lição Aprendida, e outras)

## Sprint 2.1 — Games de verdade

✨ Seus **jogos agora são salvos de verdade** — não são mais uma demonstração local
🔧 Todo jogo precisa estar vinculado a um Project — crie um Project antes do seu primeiro Game

## Sprint 2.0 — Projects de verdade

✨ Seus **projetos agora são salvos de verdade** — não são mais uma demonstração local do seu navegador
✨ Cada projeto criado fica disponível para todos com acesso ao seu Studio, e continua lá se você fechar e abrir o navegador de novo

## Sprint 1.8d-4 — Papéis de verdade no seu time

✨ Ao convidar alguém, escolha se a pessoa entra como **Admin** (pode convidar e gerenciar membros) ou **Member** (acesso básico)
✨ A lista de membros agora mostra o papel real de cada pessoa
🔧 Segurança reforçada: as permissões de cada papel agora são checadas pelo próprio banco de dados, não só escondidas na tela

## Sprint 1.8d-3 — Convide sua equipe

✨ Agora é possível **convidar pessoas por email** para o seu Studio, em Configurações do Studio
✨ Quem é convidado recebe um email e, ao entrar, já cai direto no Studio para o qual foi convidado
✨ Acompanhe convites pendentes e cancele se precisar

## Sprint 1.8d-2 — Configurações do Studio

✨ Nova tela **Studio** (acesse pelo menu lateral) — edite o nome e o logo do seu estúdio
✨ Veja quem tem acesso ao seu Studio na seção **Membros**
🔧 Convidar outras pessoas para o Studio ainda não está disponível (em breve)

## Sprint 1.8d-1 — Preparação para múltiplos estúdios (bastidores)

🔧 Nenhuma mudança visível — a partir de agora, cada conta tem automaticamente um Studio próprio nos bastidores, preparando o caminho para convites e times no seu estúdio

## Sprint 1.8c — Configurações da conta

✨ Nova tela **Configurações da conta** (acesse pelo menu do seu avatar) — edite nome, avatar, fuso horário e idioma
✨ Sua **preferência de tema** (claro/escuro) agora é salva de verdade — não muda mais toda vez que você entra em um novo dispositivo
✨ Troque sua senha a qualquer momento, sem precisar de email, direto nas configurações
✨ Botão para **sair de todos os dispositivos** de uma vez
🔧 Exclusão de conta ainda não está disponível (em breve)

## Sprint 1.8b — Esqueci minha senha

✨ Nova tela **"Esqueceu sua senha?"** (`/forgot-password`) — informe seu email e receba um link para redefinir a senha
✨ Nova tela de **redefinição de senha** (`/reset-password`) — com indicador visual de força da senha
🔧 Mensagens claras se o link expirou, se as senhas não coincidem, ou se a senha é fraca demais

## Sprint 1.8a — Login de verdade

✨ O login agora é **real** — validado por um servidor (Supabase), não mais uma demonstração que aceitava qualquer senha
✨ Sua sessão persiste entre recarregar a página, fechar e abrir o navegador, e entre abas — sem precisar entrar de novo enquanto ela for válida
✨ Mensagens de erro amigáveis quando o login falha (email/senha incorretos, etc.)
🔧 Recuperação de senha ("Esqueceu a senha?") ainda não está disponível — chega no próximo sprint
🔧 O Playground agora também exige login, como qualquer outra área do produto

## Sprint 1.7 — Preparação para dados reais (bastidores)

🔧 Nenhuma mudança visível — este sprint preparou toda a estrutura de banco de dados (tabelas, permissões, esquema de acesso) que vai substituir os dados de demonstração atuais pelos dados reais do seu estúdio, nos próximos sprints

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
