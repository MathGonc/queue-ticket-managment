# Notes:

## **Tricks:**

- Para executar "vue" sem as restrições do windows: _set-executionpolicy RemoteSignedvue_
- Abrir google chrome com console: _"runtimeArgs": ["--auto-open-devtools-for-tabs"]_
- Caso de erro com Nodemon: _npm install -g nodemon_
- &nbsp; "Non-breaking space"
- Console log: (Insert: ctrl + alt + L) | (Delete all: alt + shift + d)

## **To do:**

### To do: (DPU)

- [ ] Mover os backups do banco para fora da pasta do projeto (hoje em `infra\standalone\backups`): definir `BACKUP_DIR` em `infra\standalone\.env`

### Pendências técnicas (futuro)

- [ ] Testar o modo Docker com containers de verdade (`infra/docker`); hoje só a configuração foi validada
- [ ] Avisos moderados de segurança restantes só em dependências de desenvolvimento (nodemon, @vue/test-utils)
- [ ] Branch `main`: decidir se volta a ser a versão de portfólio (hoje é cópia da `DPU`; o padrão no GitHub é a `DPU`)

### Visual (decidir depois)

- [ ] Biblioteca de componentes para tabelas mais ricas (PrimeVue) ou redesenho (shadcn-vue / Nuxt UI + Tailwind); hoje: Bootstrap 5 limpo

### To do: (Portfolio)

- [ ] Mudar os tipos de atendimento na triagem para algo mais generico

### Maybe:

- [ ] Fix: barra de rolagem continua após ocultar as duas abas da sidebar (remover o elemento ao terminar a animação)
- [ ] Adaptação do HTML para o celular
- [ ] Monitor: modo Vertical
- [ ] Seleção de idioma: _Português_ e _Inglês_

## **Done:**

- [x] Versões principais atualizadas: Express 5, Mongoose 9, pino 10, express-rate-limit 8, dotenv 18, Vite 8, Vue Router 5, Pinia 4, VueUse 15, datepicker 14, ESLint 10
- [x] Testes de ponta a ponta do backend (`npm test` em `backend/`)
- [x] Configurações em abas (Monitor, Registro, Usuários, Logs) com segmented control; aba fica no endereço (`?aba=`)
- [x] Registro: painel (TV) conectou/desconectou, sinais recusados, erros 500, resultado do backup, PDF do histórico, troca de guichê
- [x] Indicadores por dia (espera média/máxima) e exportação do registro em CSV
- [x] Aba Logs: último backup e visualizador dos logs técnicos
- [x] Limpeza do Bootstrap 5: Lucide no lugar do vue-feather, vue-sonner no lugar do vue-toastification, classes do Bootstrap 4, ids duplicados, estilos inline, CSS morto
- [x] Sidebars recolhem nas telas largas (Histórico, Configurações) também ao abrir pelo endereço/F5, e voltam ao sair
- [x] Backup automático diário do banco, com restauração (`infra\standalone\install-backup.cmd`)
- [x] Logs do backend em arquivo (`backend\logs`, um por dia, 30 dias)
- [x] Registro de atividades (entrou, saiu, emitiu, chamou, rechamou, excluiu, configs, usuários) em Configurações
- [x] Página de erro (endereço inexistente)
- [x] F5 não mostrava opções que dependem de cargo
- [x] Modo de produção otimizado: build do Vite + scripts standalone (`infra\standalone`) e início automático no logon
- [x] Componentes em Composition API (`<script setup>`)
- [x] Migração Vue CLI → Vue 3.5 + Vite 6, com login obrigatório nas rotas da API
- [x] Logo e nome da empresa importados em Configurações > Empresa (logo em `data/`, fora do git; substitui o `VITE_SHOW_LOGO`)
- [x] Tema escuro (segue o Windows; botão sol/lua na barra direita; painel da TV sempre claro)
- [x] Barra lateral desliza inteira ao recolher (texto não espreme)
- [x] Editar usuário em janela (modal)
- [x] Revisão visual (14 itens): fonte Rawline (gov.br) local, escala 28/20/16/14, azul gov.br, cartões sólidos, formulários alinhados à esquerda, logo compacto nas telas de trabalho, painel da TV com nome e guichê em destaque e aviso antes da primeira chamada, cartões da fila com data curta e excluir com confirmação, contador de atendidas, rodapé com ano atual

- [x] Fila de espera e atendimento com prioridades diferentes

---

- [x] **Monitor:** Atualização em tempo real da pagina para todos os clientes
- [x] **Monitor:** Som ao atualizar a pagina
- [x] **Admin:** Limite de guichês entre 00 e 99
- [x] **Admin:** Botão para chamar nova senha (bloquear botao por 10 segundos apos clicar)
- [x] **Config:** Criar pagina
- [x] **Config:** Botão para trocar a senha atual
- [x] **Triagem:** Criar pagina
- [x] Recebimento de atualizações global independente da pagina
- [x] Função de chamar senha agora procurando nas arrays
- [x] Inserir **Topbar** (logo centralizada)
- [x] **Monitor:** Leitura de senha em voz alta
- [x] Inserir **CSS**
- [x] Notification Toast
- [x] Fundo cinza claro
- [x] Estrutura de container, row e col
- [x] Animação fade nas paginas e na nova senha do monitor
- [x] Verificação de usuario mobile
- [x] **Config:** toggle para ativar/desativar _som de notificação_ e _leitura da senha por voz_
- [x] **Config:** Botão de resetar senhas
- [x] **Monitor:** Piscar numero ao trocar a senha (sumindo e voltando)
- [x] **Admin:** Botao para chamar senha atual novamente
- [x] **Triagem:** Selecionar o tipo de atendimento (INICIAL, AGENDAMENTO, RETORNO, INFORMAÇÕES e JUNTADA DE DOCUMENTOS)
- [x] Sidebar
- [x] Inserir **Bottombar** (desenvolvimento no canto inferior direito)
- [x] **MongoDB**
- [x] MongoDB: Sistema de registro(via config)
- [x] MongoDB: Sistema de login e autenticação
- [x] MongoDB: Pasta "db" com funções do banco de dados separada
- [x] Mensagem de "sem permissão" ao tentar acessar uma pagina que não tem permissão
- [x] Adicionar submit e required em outros formularios igual no login
- [x] Limpar campo e notificações na criação de usuario
- [x] Pagina de login
- [x] Restrições para diferentes roles acessarem diferentes paginas
- [x] Nome do usuario logado no canto superior direito (deixar no mesmo arquivo da sidebar)
- [x] MongoDB: Tabela de tickets
- [x] MongoDB: Armazenamento de configurações globais (monitor mode e som)
- [x] MongoDB: Obter configurações de monitor ao entrar em monitor.vue
- [x] Organizar solicitações para o servidor nas middlewares e controllers
- [x] dbInsertTicket
- [x] nextToQueue, currentTicketCalled & lastTicketCalled
- [x] MongoDB: currentTicket mostrar o ultimo ticket registrado e chamado (ticketInQueue == 2) filtrando por horario
- [x] dbLoadTicketsInQueue
- [x] Listar as senhas carregadas
- [x] dbUpdateTicket(status)
- [x] dbDeleteTicket(ticketid)
- [x] modo scroll quando a sidebar ultrapassar o limite da pagina
- [x] Ao ler que está na pagina /monitor, ocultar nome de usuario
- [x] Campo "atendido por" e "triagem por" nos tickets
- [x] Atributo "submit" na triagem para adicionar com a tecla enter
- [x] Função de repetir a chamada do ultimo ticket, salvar em localstorage
- [x] Ao chamar a senha, não apagar ela e sim só mudar o status para atendida
- [x] Lista de tickets já atendidos
- [x] callByName in service page
- [x] Botão de zerar as senhas exibidas no painel
- [x] Criar a conta dos usuarios para utilizar na segunda-feira
- [x] Quando entra no /monitor, sai e vai para outra pagina, o evento do /monitor continua ali (Ao apertar F5 sai)
- [x] Se a senha 0 for a proxima, ela sempre fica sozinha no monitor
- [x] Quando chama a ultima senha que o atendente atendeu, acaba chamando a atual mesmo não sendo desse atendente
- [x] Mensagem de erro ao logar
- [x] Config.vue: runtime-core.esm-bundler.js:41 [Vue warn]: Failed to resolve component: topbar - If this is a native custom element, make sure to exclude it from component resolution via compilerOptions.isCustomElement.
- [x] Quando havia "await" na função "socket.on" o monitor.vue não recebia as atualizações de configuração
- [x] Ao usar a triagem pelo celular, você cadastra uma senha, e ela só vai ao cadastrar a proxima... (cadastro aaaaaa, cadastro bbbbbb, aparece aaaaa)
- [x] Ao chamar a senha pelo celular, a chamada é a anterior, parecido com o erro de cima...
- [x] Sidebar não preenche toda pagina em /config
- [x] Remover localstorage ao fazer "logout"
- [x] Mensagem de erro ao errar senha
- [x] Criar "indices" das consultas realizadas nas funções para otimizar o processo
- [x] Restringir nomes de usuarios para ter . no meio e limite de caracteres
- [x] Separação de branch entre **main**(portfolio) e **DPU**(trabalho)
- [x] Campo CPF(docNumber) na triagem
- [x] Somente administrador pode ver por quem foi atendido
- [x] Collapse na lista de fila e atendidos
- [x] Impedir que as letras do nome entrem em contato com os botões
- [x] Diferenciar lista de "Fila" de lista de "Atendidos" com um icone ou pela cor
- [x] Corrigir BUG na pagina de configuração que surgiu novamente
- [x] Botão "collapse" totalmente na direita
- [x] Deixar o espaçamento de fora pra dentro, seguindo a ordem: Sidebar > titulo e collapse > itens dentro do collapse
- [x] Finalizar lista de Fila e replicar modelo para lista de Atendidos
- [x] Corrirgir espaçamento entre botões e nome/tipo de atendimento
- [x] Adicionar novamente o campo "atendido por" nos atendidos
- [x] Armazenar nome de usuario junto ao token
- [x] Limite de letras no nome e tipo
- [x] Pagina de atendimento com a borda central menor
- [x] Adicionar uma bibilhoteca de icones
- [x] Organizar rotas e controller no "auth" e "user"
- [x] Colocar funções do mongodb dentro do modulo do mongodb
- [x] Fix: Ao expirar o token, é exibido um erro para o usuario ao inves de voltar para tela de login
- [x] Ao logar, o nome não aparece na navbar
- [x] "Historico de atendimento"
- [x] Icone personalizado
- [x] Exibir historico com opção de data personalizada
- [x] Transformar o histórico de atendimento em um PDF ou planilha
- [x] Sortear historico por categoria
- [x] Opção de chamar pelo nome do atendente
