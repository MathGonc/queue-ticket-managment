# Requirements Document

## Introduction

Este documento descreve os requisitos para a reestruturação completa do sistema de gerenciamento de senhas (monitor de senhas) utilizado na Defensoria Pública da União - MS. O sistema será migrado de Vue 3.2 + Vue CLI para Vue 3.5 + Vite 6, com separação de frontend/backend, modernização de componentes com `<script setup>`, e melhorias de segurança. A compatibilidade com o banco de dados existente (nomes de campos, coleções) será mantida para que usuários legados possam continuar utilizando sem perda de dados.

## Glossary

- **Sistema_Frontend**: Aplicação Vue.js que roda no navegador, responsável pela interface de triagem, atendimento, monitor e configurações
- **Sistema_Backend**: Servidor Express/Node.js que fornece a API REST e gerencia conexões WebSocket
- **Usuário_Autenticado**: Pessoa com token JWT válido e não expirado
- **Usuário_Não_Autenticado**: Pessoa sem token ou com token inválido/expirado
- **Painel_Monitor**: Tela pública que exibe a senha sendo chamada
- **Sidebar**: Componente lateral que exibe fila de senhas e senhas atendidas
- **Guichê**: Posto de atendimento identificado por número
- **Senha**: Ticket numérico sequencial atribuído na triagem
- **Vite**: Ferramenta de build moderna que substitui o Vue CLI descontinuado
- **Composition_API**: Estilo moderno de escrita de componentes Vue 3 com `<script setup>`
- **Pinia**: Gerenciador de estado oficial do Vue 3
- **CRUD_Usuários**: Operações de Criar, Ler, Atualizar e Deletar usuários
- **WebSocket**: Conexão bidirecional em tempo real via Socket.io para atualização do monitor
- **Middleware_Auth**: Função intermediária que valida autenticação antes de processar requisições
- **Pasta_Legacy**: Cópia do código-fonte original antes da migração, para consulta em caso de problemas

## Requirements

### Requisito 1: Reestruturação do Build System com Vite

**User Story:** Como desenvolvedor, eu quero que o projeto migre de Vue CLI para Vite, para que o desenvolvimento seja mais rápido e o projeto use ferramentas mantidas ativamente.

#### Critérios de Aceitação

1. THE Sistema_Frontend SHALL utilizar Vite 6 como ferramenta de build em substituição completa ao Vue CLI
2. THE Sistema_Frontend SHALL utilizar Vue 3.5 ou versão estável mais recente (migrando de Vue 3.2)
3. WHEN o comando `npm run dev` for executado no frontend, THE Sistema_Frontend SHALL iniciar o servidor de desenvolvimento com hot-module-replacement funcional
4. WHEN o comando `npm run build` for executado, THE Sistema_Frontend SHALL gerar arquivos de produção otimizados na pasta `dist`
5. THE Sistema_Frontend SHALL utilizar variáveis de ambiente com prefixo `VITE_` mantendo os mesmos nomes de sufixo (ex: `VUE_APP_PORT_SERVER` passa a ser `VITE_PORT_SERVER`)
6. THE Sistema_Frontend SHALL remover todas as dependências desnecessárias: crypto-js (não utilizado), body-parser (built-in no Express 4.16+), mongodb (redundante com mongoose), core-js (desnecessário com browsers modernos), crypto-browserify, os-browserify, path-browserify, stream-browserify (polyfills do Vue CLI), dotenv-webpack (substituído pelo Vite)
7. THE Sistema_Frontend SHALL separar completamente as dependências de frontend e backend em package.json distintos

### Requisito 2: Reestruturação dos Componentes com Composition API

**User Story:** Como desenvolvedor, eu quero que todos os componentes usem Composition API com `<script setup>`, para que o código seja conciso, moderno e mais fácil de manter.

#### Critérios de Aceitação

1. THE Sistema_Frontend SHALL reescrever todos os componentes utilizando `<script setup>` com Composition API
2. THE Sistema_Frontend SHALL utilizar `useRouter()` e `useRoute()` em vez de `this.$router` e `this.$route`
3. THE Sistema_Frontend SHALL utilizar `ref()`, `reactive()` e `computed()` para gerenciamento de estado local
4. THE Sistema_Frontend SHALL manter a estrutura HTML e CSS existente dos componentes sem alterações visuais — apenas a lógica de script será alterada
5. THE Sistema_Frontend SHALL manter o Pinia como gerenciador de estado com a mesma estrutura de stores

### Requisito 3: Correção do Bug de Acesso Não Autenticado

**User Story:** Como usuário não autenticado, eu quero acessar páginas públicas sem causar erros no servidor, para que o sistema permaneça estável.

#### Critérios de Aceitação

1. WHEN um Usuário_Não_Autenticado acessar uma página que carrega a Sidebar, THE Sistema_Frontend SHALL verificar a existência de token antes de chamar `/auth/verify`
2. IF o token estiver ausente, THEN THE Sistema_Frontend SHALL renderizar a Sidebar sem dados de usuário e sem fazer requisição ao backend
3. IF a chamada ao `/auth/verify` retornar erro, THEN THE Sistema_Frontend SHALL limpar o token local e redirecionar para login
4. THE Sistema_Backend SHALL utilizar early-return com `return res.status(401).json(...)` em todas as verificações do endpoint `/auth/verify` para evitar erro "headers already sent"
5. WHEN o endpoint `/auth/verify` receber requisição sem header Authorization válido, THE Sistema_Backend SHALL retornar 401 e encerrar o processamento imediatamente

### Requisito 4: CRUD Completo de Usuários

**User Story:** Como administrador, eu quero gerenciar todos os usuários (criar, listar, editar, excluir, alterar senha), para que eu mantenha o controle de acesso atualizado.

#### Critérios de Aceitação

1. THE Sistema_Frontend SHALL exibir uma tabela com todos os usuários cadastrados na página de configurações (nome, login, função)
2. WHEN o administrador clicar em editar um usuário, THE Sistema_Frontend SHALL exibir formulário preenchido com dados atuais (nome, login, função) seguindo o mesmo padrão HTML/CSS da seção "Registro de usuario" em config.vue (Bootstrap input-groups com input-group-sm)
3. WHEN o formulário de edição for submetido, THE Sistema_Backend SHALL atualizar os dados do usuário no banco de dados mantendo os nomes de campos existentes (username, login, password, role)
4. WHEN a senha de um usuário for alterada, THE Sistema_Backend SHALL aplicar hash bcrypt antes de salvar
5. WHEN o administrador excluir um usuário, THE Sistema_Backend SHALL remover o registro do banco de dados
6. IF o administrador tentar excluir o próprio usuário logado, THEN THE Sistema_Frontend SHALL impedir a operação com mensagem de erro
7. THE Sistema_Backend SHALL expor endpoints `GET /api/users`, `PUT /api/users/:id` e `DELETE /api/users/:id`
8. THE Sistema_Backend SHALL exigir autenticação com role >= 3 para acessar endpoints de gerenciamento de usuários
9. THE Sistema_Frontend SHALL implementar o controller de usuários seguindo o mesmo padrão de `userController.js` (axios com config.url_server, useAuth para token)
10. THE Sistema_Backend SHALL implementar as rotas seguindo o mesmo padrão de `userRoutes.js` (express router, bcrypt, jwt)

### Requisito 5: Segurança do Token JWT

**User Story:** Como administrador do sistema, eu quero que as credenciais de segurança sejam configuráveis e não expostas no código, para que o sistema seja seguro.

#### Critérios de Aceitação

1. THE Sistema_Backend SHALL utilizar variável de ambiente `JWT_SECRET` para a chave de assinatura do token JWT
2. THE Sistema_Backend SHALL utilizar variável de ambiente `JWT_EXPIRES_IN` para o tempo de expiração do token (padrão: 72h)
3. THE Sistema_Backend SHALL remover toda referência hardcoded a chaves secretas no código-fonte
4. THE Sistema_Backend SHALL remover o arquivo `config/auth.config.js` que contém chave secreta exposta
5. IF a variável `JWT_SECRET` não estiver definida, THEN THE Sistema_Backend SHALL recusar inicialização e exibir erro claro no console

### Requisito 6: Segurança do WebSocket

**User Story:** Como administrador, eu quero que apenas usuários autenticados possam emitir eventos via WebSocket, para que pessoas externas não manipulem o painel de senhas.

#### Critérios de Aceitação

1. WHEN um cliente tentar conectar via WebSocket, THE Sistema_Backend SHALL validar o token JWT enviado no handshake antes de aceitar a conexão
2. IF o token do handshake for inválido ou ausente, THEN THE Sistema_Backend SHALL rejeitar a conexão WebSocket com erro de autenticação
3. THE Sistema_Frontend SHALL enviar o token JWT armazenado como parâmetro `auth` no handshake do Socket.io
4. WHEN o Painel_Monitor conectar sem autenticação, THE Sistema_Backend SHALL permitir a conexão em modo somente-leitura (receber eventos mas não emitir sinais de controle)
5. THE Sistema_Backend SHALL restringir a emissão dos eventos `signalUpdateValues` e `signalUpdateMonitor` apenas a conexões autenticadas

### Requisito 7: Segurança do CORS e Rate Limiting

**User Story:** Como administrador, eu quero que o backend restrinja origens de requisição e limite tentativas de login, para prevenir ataques externos.

#### Critérios de Aceitação

1. THE Sistema_Backend SHALL configurar CORS para aceitar requisições apenas das origens definidas em variável de ambiente `ALLOWED_ORIGINS`
2. THE Sistema_Backend SHALL aplicar rate limiting no endpoint de login limitando a 5 tentativas por minuto por IP
3. IF o limite de tentativas de login for excedido, THEN THE Sistema_Backend SHALL retornar status 429 com mensagem informando tempo de espera
4. THE Sistema_Backend SHALL aplicar middleware de autenticação JWT em todas as rotas protegidas (exceto login, register e rotas públicas do monitor)

### Requisito 8: Correção de Bugs Secundários

**User Story:** Como desenvolvedor, eu quero que bugs identificados na análise sejam corrigidos, para que o sistema seja robusto.

#### Critérios de Aceitação

1. THE Sistema_Backend SHALL declarar a variável `response` com `const` no endpoint `PUT /updateTicketCalled/:id` para evitar vazamento global
2. THE Sistema_Backend SHALL retornar corpo JSON em todas as respostas de erro (substituir `res.status(500)` por `res.status(500).json({error: "..."})`)
3. THE Sistema_Frontend SHALL corrigir o arquivo de inicialização do Pinia (`stores/index.js`) removendo a exportação de variável inexistente
4. THE Sistema_Frontend SHALL garantir que o modelo `history.js` do banco não conflite com o modelo `user.js` (ambos usam nome "User" no mongoose)

### Requisito 9: Atualização do Docker

**User Story:** Como operador, eu quero que a infraestrutura Docker reflita a nova arquitetura, para que o deploy funcione corretamente.

#### Critérios de Aceitação

1. THE Dockerfile_Frontend SHALL utilizar Node.js 22 LTS para build e nginx para servir arquivos estáticos em produção
2. THE Dockerfile_Backend SHALL utilizar Node.js 22 LTS como imagem base
3. THE docker-compose.yml SHALL manter a estrutura de três serviços (mongodb, backend, frontend) com as dependências corretas
4. WHEN o comando `docker compose up` for executado, THE Sistema SHALL iniciar todos os serviços na ordem correta
5. THE docker-compose.yml SHALL utilizar variáveis de ambiente centralizadas via arquivo `.env`

### Requisito 10: Preservação do Código Legacy

**User Story:** Como desenvolvedor, eu quero ter uma cópia do código-fonte original antes da migração, para poder consultar a implementação anterior caso algo quebre.

#### Critérios de Aceitação

1. THE Sistema SHALL copiar a arquitetura atual (código-fonte) para uma pasta `legacy/` antes de iniciar as alterações de migração
2. THE Pasta_Legacy SHALL conter a estrutura completa de `src/`, `server.js`, `router.js`, `config/`, `package.json`, `vue.config.js` e demais arquivos de configuração relevantes
3. THE Pasta_Legacy SHALL ser incluída no repositório como referência de consulta
4. THE Pasta_Legacy SHALL conter um README explicando que é uma cópia de referência do código pré-migração

### Requisito 11: Remoção de Dependências Desnecessárias

**User Story:** Como desenvolvedor, eu quero que dependências não utilizadas ou redundantes sejam removidas, para que o projeto seja mais leve e sem confusão.

#### Critérios de Aceitação

1. THE Sistema SHALL remover `crypto-js` do package.json (não utilizado em nenhum lugar do código)
2. THE Sistema SHALL remover `body-parser` do package.json (Express 4.16+ possui parsing JSON/urlencoded built-in)
3. THE Sistema SHALL remover `mongodb` do package.json (projeto usa mongoose, driver direto é redundante)
4. THE Sistema SHALL remover `core-js` do package.json (desnecessário com target de browsers modernos)
5. THE Sistema SHALL remover `crypto-browserify`, `os-browserify`, `path-browserify`, `stream-browserify` do package.json (polyfills necessários apenas pelo Vue CLI para módulos Node.js do backend empacotados no frontend)
6. THE Sistema SHALL remover `dotenv-webpack` do package.json (substituído pelo handling nativo de env do Vite)

### Requisito 12: Documentação do Projeto

**User Story:** Como desenvolvedor ou operador, eu quero documentação clara e organizada, para entender como usar, manter e acompanhar as mudanças do projeto.

#### Critérios de Aceitação

1. THE migration-instructions.md SHALL conter instruções de como usar e entender o projeto (pré-requisitos, setup dev, setup produção Docker, variáveis de ambiente, rollback, compatibilidade dados)
2. THE migration-instructions.md SHALL listar pré-requisitos (Node.js 22, Docker, MongoDB 7+)
3. THE migration-instructions.md SHALL documentar todas as variáveis de ambiente necessárias com valores de exemplo
4. THE migration-instructions.md SHALL incluir instruções de rollback
5. THE migration-instructions.md SHALL incluir seção de compatibilidade com dados existentes no MongoDB
6. THE migration-log-changes.md SHALL listar todas as dependências atualizadas (versão anterior → nova)
7. THE migration-log-changes.md SHALL descrever mudanças estruturais (arquivos removidos, adicionados, renomeados)
8. THE migration-log-changes.md SHALL documentar bugs corrigidos com descrição do problema e solução
9. THE migration-log-changes.md SHALL documentar funcionalidades novas e breaking changes
10. THE migration-log-changes.md SHALL incluir seção de recomendações tecnológicas futuras (Vitest, ofetch, ESLint flat config, alternativas ao Bootstrap)
11. THE documentation.md SHALL conter documentação sucinta do projeto (visão geral, arquitetura, como rodar, endpoints da API, estrutura de pastas)
12. TODOS os documentos de documentação SHALL ser escritos em português brasileiro

### Requisito 13: Preservação do HTML/CSS Existente

**User Story:** Como desenvolvedor, eu quero que a migração altere apenas a lógica de script, para minimizar riscos visuais e manter consistência.

#### Critérios de Aceitação

1. THE Sistema_Frontend SHALL manter todo HTML e CSS existente sem alterações durante a migração
2. WHEN novos elementos de UI forem necessários (lista de usuários, modal de edição), THE Sistema_Frontend SHALL copiar o padrão exato de Bootstrap utilizado em config.vue (input-group input-group-sm, form-control, btn btn-outline-primary, col-md-auto menu-default)
3. THE Sistema_Frontend SHALL utilizar apenas classes Bootstrap já presentes no projeto para novos componentes
4. THE Sistema_Frontend SHALL manter a mesma estrutura de layout (container > row > col-md-auto > menu-default) para novas seções
