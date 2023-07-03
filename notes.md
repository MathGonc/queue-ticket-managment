# Notes:

## **To do:**

### Fix:

-   [ ] Quando entra no /monitor, sai e vai para outra pagina, o evento do /monitor continua ali (Ao apertar F5 sai)
-   [ ] Se a senha 0 for a proxima, ela sempre fica sozinha no monitor
-   [ ] Ao usar a triagem pelo celular, você cadastra uma senha, e ela só vai ao cadastrar a proxima... (cadastro aaaaaa, cadastro bbbbbb, aparece aaaaa)
-   [ ] Ao chamar a senha pelo celular, a chamada é a anterior, parecido com o erro de cima...

### Additions:

-   [x] **Monitor:** Atualização em tempo real da pagina para todos os clientes
-   [x] **Monitor:** Som ao atualizar a pagina
-   [x] **Admin:** Limite de guichês entre 00 e 99
-   [x] **Admin:** Botão para chamar nova senha (bloquear botao por 10 segundos apos clicar)
-   [x] **Config:** Criar pagina
-   [x] **Config:** Botão para trocar a senha atual
-   [x] **Triagem:** Criar pagina
-   [x] Recebimento de atualizações global independente da pagina
-   [x] Função de chamar senha agora procurando nas arrays
-   [x] Inserir **Topbar** (logo centralizada)
-   [x] **Monitor:** Leitura de senha em voz alta
-   [x] Inserir **CSS**
-   [x] Notification Toast
-   [x] Fundo cinza claro
-   [x] Estrutura de container, row e col
-   [x] Animação fade nas paginas e na nova senha do monitor
-   [x] Verificação de usuario mobile
-   [x] **Config:** toggle para ativar/desativar _som de notificação_ e _leitura da senha por voz_
-   [x] **Config:** Botão de resetar senhas
-   [x] **Monitor:** Piscar numero ao trocar a senha (sumindo e voltando)
-   [x] **Admin:** Botao para chamar senha atual novamente
-   [ ] **Triagem:** Selecionar o tipo de atendimento (INICIAL, AGENDAMENTO, RETORNO, INFORMAÇÕES e JUNTADA DE DOCUMENTOS)
-   [ ] **Monitor:** Informações de contato abaixo da senha e abaixo da Bottombar
-   [ ] Inserir **Bottombar** (desenvolvimento no canto inferior direito)
-   [ ] Inserir nova sidebar
-   [ ] **Topbar:** Relogio no canto superior direito da janela

### Posteriorly:

-   [ ] Separação de branch entre **main**(portfolio) e **DPU**(trabalho)
-   [ ] **MongoDB**
-   [ ] MongoDB: Usuarios para restrição de acesso ao **Admin** e **Config**
-   [ ] MongoDB: criar tabelas de _senhas cadastradas_ e _senhas já chamadas_ e filtrar por horario de criação
-   [ ] Monitor: modo Vertical e Horizontal
-   [ ] MongoDB: Armazenamento de senhas e configurações
-   [ ] Seleção de idioma: _Português_ e _Inglês_
-   [ ] Adaptação do HTML para o celular

## **Tricks:**

> Para executar "vue" sem as restrições do windows: _set-executionpolicy RemoteSignedvue_

> Abrir google chrome com console: _"runtimeArgs": ["--auto-open-devtools-for-tabs"]_

> Caso de erro com Nodemon: _npm install -g nodemon_
