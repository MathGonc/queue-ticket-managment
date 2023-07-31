# Notes:

## **Tricks:**

- Para executar "vue" sem as restrições do windows: _set-executionpolicy RemoteSignedvue_
- Abrir google chrome com console: _"runtimeArgs": ["--auto-open-devtools-for-tabs"]_
- Caso de erro com Nodemon: _npm install -g nodemon_
- &nbsp; "Non-breaking space"
- Console log: (Insert: ctrl + alt + L) | (Delete all: alt + shift + d)

## **To do:**

### To do: (DPU)

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
- [ ] Adicionar bibilhoteca de icones
- [ ] Armazenar nome de usuario junto ao token
- [ ] Limite de letras no nome e tipo
- [ ] Pagina de atendimento com a borda central menor
- [ ] Adicionar uma bibilhoteca de icones
- [ ] Organizar rotas e controller no "auth" e "user"
- [ ] Colocar funções do mongodb dentro do modulo do mongodb
- [ ] Colocar em modo de produção para ficar mais otimizado
- [ ] Passar arquivos que estão em 'Option API' para 'Composition API' (Mais otimizado para o Vue 3)

### To do: (Portfolio)

- [ ] Logo personalizado
- [ ] Mudar os tipos de atendimento na triagem para algo mais generico

### Maybe:

- [ ] Logs para verificação de atendimento, do tipo (logs de triagem, logs de atendimento e relatorio de senhas atendidas em um dia especifico)
- [ ] Adaptação do HTML para o celular
- [ ] Monitor: modo Vertical e Horizontal
- [ ] **Monitor:** Informações de contato abaixo da senha e acima da Bottombar
- [ ] **Topbar:** Relogio no canto superior direito da janela
- [ ] Seleção de idioma: _Português_ e _Inglês_

### Done:

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
- [x] callTicketByName in service page
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
