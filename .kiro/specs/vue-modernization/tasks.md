# Implementation Plan: Reestruturação do Sistema de Senhas

## Overview

Plano de implementação para a reestruturação do sistema de gerenciamento de senhas, migrando de Vue 3.2 + Vue CLI para Vue 3.5 + Vite 6, com separação de frontend/backend, remoção de dependências desnecessárias, modernização de componentes com `<script setup>` (apenas lógica — HTML/CSS mantido), e melhorias de segurança (JWT, rate limiting, auth WebSocket). O CRUD de usuários segue os padrões existentes do projeto (userController.js, userRoutes.js, config.vue).

## Tasks

### Fase 0: Preservação do Código Legacy

- [x] 0.1 Criar pasta `legacy/` na raiz do projeto
- [x] 0.2 Copiar `src/` (completo), `server.js`, `router.js`, `config/`, `package.json`, `vue.config.js`, `babel.config.js`, `jsconfig.json`, `public/` para `legacy/`
- [x] 0.3 Criar `legacy/README.md` explicando que é uma cópia de referência do código pré-migração (Vue 3.2 + Vue CLI), somente para consulta

### Fase 1: Estrutura do Projeto e Build System

- [x] 1.1 Criar pasta `frontend/` com `package.json` contendo dependências Vue 3.5, Vite 6, vue-router, pinia, socket.io-client, axios, bootstrap, vue-toastification, vue-datepicker, vue-feather, vueuse, maska (SEM crypto-js, core-js, polyfills ou dotenv-webpack)
- [x] 1.2 Criar pasta `backend/` com `package.json` contendo dependências express, mongoose, socket.io, bcrypt, jsonwebtoken, cors, express-rate-limit, dotenv, nodemon (SEM body-parser, mongodb driver direto)
- [x] 1.3 Criar `frontend/vite.config.js` com plugin vue, alias `@` para `src/`, server host 0.0.0.0 porta 8080
- [x] 1.4 Criar `frontend/index.html` com div#app e script type=module apontando para src/main.js
- [x] 1.5 Criar `frontend/.env` e `frontend/.env.production` com variáveis VITE_* (PORT_SERVER, PORT_CLIENT, URL, DEV, SYSTEM_AUTH)
- [x] 1.6 Criar `backend/.env` com variáveis DB_IP, DB_NAME, DB_USER, DB_PASS, PORT, CLIENT_URL, JWT_SECRET, JWT_EXPIRES_IN, ALLOWED_ORIGINS

### Fase 2: Backend — Middleware e Segurança

- [x] 2.1 Criar `backend/src/middleware/auth.js` com funções authMiddleware (valida JWT) e requireRole (verifica role mínimo)
- [x] 2.2 Criar `backend/src/middleware/rateLimit.js` com loginLimiter (5 req/min por IP)
- [x] 2.3 Criar `backend/src/config/index.js` que carrega dotenv e valida presença de JWT_SECRET
- [x] 2.4 Migrar `server.js` para `backend/server.js` com: CORS restrito via ALLOWED_ORIGINS, auth no WebSocket handshake, proteção de eventos de controle para conexões autenticadas, permissão de conexão somente-leitura para monitor, usar express.json() em vez de body-parser

### Fase 3: Backend — Rotas e Modelos

- [x] 3.1 Migrar `src/db/models/` para `backend/src/models/` mantendo schemas idênticos; corrigir history.js (renomear modelo de "User" para "History")
- [x] 3.2 Migrar `src/db/userRoutes.js` para `backend/src/routes/userRoutes.js`: usar JWT_SECRET de env, adicionar early-return no /auth/verify, aplicar loginLimiter no /login (seguir mesmo padrão express router + bcrypt + jwt)
- [x] 3.3 Adicionar endpoints CRUD seguindo padrão de userRoutes.js: GET /api/users (listar sem password), PUT /api/users/:id (atualizar com hash se password), DELETE /api/users/:id (impedir auto-exclusão) — todos com authMiddleware + requireRole(3)
- [x] 3.4 Migrar `src/db/ticketRoutes.js` para `backend/src/routes/ticketRoutes.js`: corrigir variável `response` não declarada, adicionar corpo JSON em respostas de erro
- [x] 3.5 Migrar `src/db/globalRoutes.js` para `backend/src/routes/globalRoutes.js` sem alterações funcionais
- [x] 3.6 Migrar `src/db/db.js` para `backend/src/config/db.js` usando variáveis de env sem prefixo VUE_APP_

### Fase 4: Frontend — Core e Configuração

- [x] 4.1 Criar `frontend/src/main.js` com createApp, createPinia, router, Toast, bootstrap imports; verificar token no startup com guard contra ausência
- [x] 4.2 Criar `frontend/src/services/api.js` com axios instance, interceptor de request (adiciona Bearer token), interceptor de response (limpa token em 401)
- [x] 4.3 Criar `frontend/src/socket.js` com função createSocket(token) que passa auth no handshake, e publicSocket para monitor sem auth
- [x] 4.4 Criar `frontend/src/stores/auth.js` com Pinia store (manter mesma interface: token, isAuth, userData, clearToken, setToken, setIsAuth, setUserData)
- [x] 4.5 Criar `frontend/src/router/index.js` com rotas mantendo mesma estrutura (login, monitor, sidebar com children: index, sorting, service, history, config)
- [x] 4.6 Criar `frontend/src/router/guards.js` com beforeEach guard: verificar auth, verificar role, redirecionar para login se necessário — com verificação de token antes de chamar API
- [x] 4.7 Criar `frontend/src/utils/index.js` com funções convertDate, convertHours, isValidDate, calculateAge (manter lógica idêntica)
- [x] 4.8 Criar `frontend/src/config.js` usando import.meta.env em vez de process.env

### Fase 5: Frontend — Componentes com `<script setup>` (apenas lógica, manter HTML/CSS)

- [x] 5.1 Reescrever `App.vue` com `<script setup>`: useAuth, socket.connect no onMounted, manter template/CSS idênticos
- [x] 5.2 Reescrever `topbar.vue` com `<script setup>` (componente simples, manter template/CSS idênticos)
- [x] 5.3 Reescrever `sidebar.vue` com `<script setup>`: useAuth, useRouter, useLocalStorage, verificar token antes de checkToken, manter toda lógica de fila/collapse/delete/call, manter HTML/CSS idênticos
- [x] 5.4 Reescrever `pages/index.vue` com `<script setup>`: useRouter para navegação, manter HTML/CSS
- [x] 5.5 Reescrever `pages/login.vue` com `<script setup>`: ref para login/password, handleLogin com loginUser, manter HTML/CSS
- [x] 5.6 Reescrever `pages/sorting.vue` com `<script setup>`: manter lógica de cadastro de senha, maska, datepicker, preferencial, manter HTML/CSS
- [x] 5.7 Reescrever `pages/service.vue` com `<script setup>`: useLocalStorage para guichê/callByName, callNextTicket, callSameTicket, manter HTML/CSS
- [x] 5.8 Reescrever `pages/monitor.vue` com `<script setup>`: usar publicSocket, manter lógica de speechSynthesis e animações, manter HTML/CSS
- [x] 5.9 Reescrever `pages/history.vue` com `<script setup>`: manter tabela, filtros, paginação, geração de PDF, manter HTML/CSS
- [x] 5.10 Reescrever `pages/config.vue` com `<script setup>`: adicionar seção de listagem/edição/exclusão de usuários usando mesmo padrão Bootstrap de "Registro de usuario" (input-group input-group-sm, btn btn-outline-primary, col-md-auto menu-default), manter configurações do monitor com HTML/CSS idêntico

### Fase 6: Frontend — Controllers e Composables

- [x] 6.1 Criar `frontend/src/controllers/userController.js` seguindo padrão existente (axios com config.url_server, useAuth para token): checkToken, loginUser, registerUser, getUsers, updateUser, deleteUser, updatePassword
- [x] 6.2 Criar `frontend/src/composables/useTickets.js` extraindo lógica de loadTicketsInQueue, loadTicket, insertTicket, updateTicketCalled, deleteTicket, loadTicketHistory
- [x] 6.3 Criar `frontend/src/composables/useGlobal.js` extraindo lógica de loadMonitorConfigs, saveMonitorConfigs, getGlobalTicketData, updateGlobalTicketData, resetGlobalTicketData
- [x] 6.4 Criar `frontend/src/composables/useUsers.js` com loadUsers, updateUser, deleteUser, registerUser (usa funções do controller)

### Fase 7: Docker e Infraestrutura

- [x] 7.1 Criar `Dockerfile.frontend` multi-stage: node:22-alpine para build, nginx:alpine para servir
- [x] 7.2 Criar `nginx.conf` com configuração para SPA (try_files para index.html) e proxy para API
- [x] 7.3 Criar `Dockerfile.backend` com node:22-alpine, npm ci --omit=dev, CMD node server.js
- [x] 7.4 Atualizar `docker-compose.yml` com mongo:7, backend e frontend com env_file, depends_on, restart

### Fase 8: Documentação

- [x] 8.1 Criar `migration-instructions.md` em português: instruções de como usar e entender o projeto — pré-requisitos, setup dev, setup produção Docker, variáveis de ambiente, rollback, compatibilidade dados
- [x] 8.2 Criar `migration-log-changes.md` em português: logs do que foi modificado — dependências atualizadas, mudanças estruturais, bugs corrigidos, features novas, breaking changes, recomendações futuras, avaliação TypeScript
- [x] 8.3 Criar `documentation.md` em português: documentação sucinta do projeto — visão geral, arquitetura, como rodar, endpoints da API, estrutura de pastas
- [x] 8.4 Atualizar `README.md` com informações atualizadas do projeto

### Fase 9: Limpeza e Validação

- [x] 9.1 Remover arquivos obsoletos da raiz: babel.config.js, jsconfig.json, vue.config.js, router.js (raiz), config/auth.config.js, src/ (pasta antiga após migração completa)
- [x] 9.2 Remover dependências desnecessárias que não devem existir em nenhum package.json: crypto-js, body-parser, mongodb, core-js, crypto-browserify, os-browserify, path-browserify, stream-browserify, dotenv-webpack
- [x] 9.3 Atualizar .gitignore para nova estrutura (frontend/node_modules, backend/node_modules, frontend/dist, legacy/ pode ser incluído no git)
- [x] 9.4 Validar que todos os campos de banco (users, tickets, globals) permanecem com mesmos nomes e tipos
- [x] 9.5 Testar fluxo completo: login → triagem → atendimento → monitor → histórico → config → CRUD usuários

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 0,
      "tasks": ["0.1", "0.2", "0.3"],
      "description": "Fase 0: Preservação do Código Legacy"
    },
    {
      "wave": 1,
      "tasks": ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6"],
      "description": "Fase 1: Estrutura do Projeto e Build System"
    },
    {
      "wave": 2,
      "tasks": ["2.1", "2.2", "2.3", "2.4"],
      "description": "Fase 2: Backend — Middleware e Segurança"
    },
    {
      "wave": 3,
      "tasks": ["3.1", "3.2", "3.3", "3.4", "3.5", "3.6"],
      "description": "Fase 3: Backend — Rotas e Modelos"
    },
    {
      "wave": 4,
      "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8", "5.1", "5.2", "5.3", "5.4", "5.5", "5.6", "5.7", "5.8", "5.9", "5.10"],
      "description": "Fase 4 e 5: Frontend — Core, Configuração e Componentes (paralelo)"
    },
    {
      "wave": 5,
      "tasks": ["6.1", "6.2", "6.3", "6.4"],
      "description": "Fase 6: Frontend — Controllers e Composables"
    },
    {
      "wave": 6,
      "tasks": ["7.1", "7.2", "7.3", "7.4"],
      "description": "Fase 7: Docker e Infraestrutura"
    },
    {
      "wave": 7,
      "tasks": ["8.1", "8.2", "8.3", "8.4"],
      "description": "Fase 8: Documentação"
    },
    {
      "wave": 8,
      "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5"],
      "description": "Fase 9: Limpeza e Validação"
    }
  ]
}
```

## Notes

- **Versão atual:** O projeto já é Vue 3.2 (não Vue 2). A migração é Vue 3.2 + Vue CLI → Vue 3.5 + Vite 6.
- **HTML/CSS inalterado:** Apenas a lógica de script é reescrita. Para novos elementos de UI (lista de usuários, formulário de edição), copiar o padrão exato de Bootstrap usado em config.vue.
- **Padrão CRUD:** Edit user, delete user e update password seguem EXATAMENTE o padrão existente: frontend controller como `userController.js` (axios + config.url_server), backend routes como `userRoutes.js` (express router + bcrypt + jwt), UI como seção "Registro de usuario" em config.vue.
- **Pasta legacy:** Cópia do código original para consulta. Deve ser criada ANTES de qualquer alteração.
- **Dependências removidas:** crypto-js (não usado), body-parser (built-in Express), mongodb (redundante com mongoose), core-js (browsers modernos), polyfills (Vue CLI), dotenv-webpack (Vite nativo).
- **Compatibilidade de dados:** Nenhuma migration de banco é necessária. Os schemas Mongoose permanecem idênticos.
- **Abordagem incremental:** As fases 4 e 5 (Frontend Core e Componentes) podem ser desenvolvidas em paralelo após a conclusão da Fase 3.
- **Rollback:** A pasta `legacy/` serve como referência. Manter o código original intacto até a validação completa na Fase 9.
- **Idioma:** Toda documentação e mensagens de erro voltadas ao usuário devem ser mantidas em português.
- **Documentação renomeada:** `migration.md` → `migration-instructions.md` (instruções de uso), `update-migration.md` → `migration-log-changes.md` (logs de mudanças), novo `documentation.md` (documentação sucinta do projeto).
