# Notes:

## **To do:**

### Fix:

- [x] Quando entra no /monitor, sai e vai para outra pagina, o evento do /monitor continua ali (Ao apertar F5 sai)
- [x] Se a senha 0 for a proxima, ela sempre fica sozinha no monitor
- [x] Quando chama a ultima senha que o atendente atendeu, acaba chamando a atual mesmo não sendo desse atendente
- [x] Mensagem de erro ao logar
- [x] Config.vue: runtime-core.esm-bundler.js:41 [Vue warn]: Failed to resolve component: topbar - If this is a native custom element, make sure to exclude it from component resolution via compilerOptions.isCustomElement.
- [ ] Ao usar a triagem pelo celular, você cadastra uma senha, e ela só vai ao cadastrar a proxima... (cadastro aaaaaa, cadastro bbbbbb, aparece aaaaa)
- [ ] Ao chamar a senha pelo celular, a chamada é a anterior, parecido com o erro de cima...

### Posteriorly:

- [x] **MongoDB**
- [x] MongoDB: Sistema de registro(via config)
- [x] MongoDB: Sistema de login e autenticação
- [x] MongoDB: Pasta "db" com funções do banco de dados separada
- [x] Mensagem de "sem permissão" ao tentar acessar uma pagina que não tem permissão
- [x] Adicionar submit e required em outros formularios igual no login
- [x] Limpar campo e notificações na criação de usuario
- [x] Pagina de login
- [ ] MongoDB: Armazenamento de configurações globais (monitor mode e som)
- [x] Restrições para diferentes roles acessarem diferentes paginas
- [x] Nome do usuario logado no canto superior direito (deixar no mesmo arquivo da sidebar)
- [x] MongoDB: Tabela de tickets
- [ ] MongoDB: Sidebar mostrar os tickets registrados na fila porem não chamados (ticketInQueue == 1) filtrando por horario
- [ ] Variavel "nextTicketToQueue" ser filtrada pelo ultimo ticket registrado porem não chamado (ticketInQueue == 1)
- [ ] MongoDB: currentTicket mostrar o ultimo ticket registrado e chamado (ticketInQueue == 2) filtrando por horario
- [ ] Opção de resetar as senhas todo dia
- [ ] Separação de branch entre **main**(portfolio) e **DPU**(trabalho)

### Maybe:

- [ ] Logs para verificação de atendimento, do tipo (logs de triagem, logs de atendimento e relatorio de senhas atendidas em um dia especifico)
- [ ] Adaptação do HTML para o celular
- [ ] Monitor: modo Vertical e Horizontal
- [ ] **Monitor:** Informações de contato abaixo da senha e acima da Bottombar
- [ ] **Topbar:** Relogio no canto superior direito da janela
- [ ] Seleção de idioma: _Português_ e _Inglês_

### Essential:

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

## **Tricks:**

> Para executar "vue" sem as restrições do windows: _set-executionpolicy RemoteSignedvue_

> Abrir google chrome com console: _"runtimeArgs": ["--auto-open-devtools-for-tabs"]_

> Caso de erro com Nodemon: _npm install -g nodemon_

> &nbsp; "Non-breaking space"
