# Design Document

## Overview

A reestruturação migra o projeto de Vue 3.2 + Vue CLI para Vue 3.5 + Vite 6, mantendo a arquitetura monorepo com separação clara entre frontend e backend. O tooling e padrões de código são modernizados, mas o HTML/CSS existente permanece inalterado — apenas a lógica de script é reescrita.

### Decisões Técnicas

| Decisão | Escolha | Justificativa |
|---------|---------|---------------|
| Linguagem | JavaScript + JSDoc | Projeto pequeno (~15 arquivos lógica), overhead de TS desproporcional |
| Build tool | Vite 6 | Vue CLI descontinuado, Vite é oficial e 10x mais rápido |
| State management | Pinia (manter) | Já funciona bem, é o oficial do Vue 3 |
| HTTP client | Axios (manter) | Familiaridade, interceptors úteis para auth |
| CSS framework | Bootstrap 5 (manter) | Não alterar HTML/CSS — apenas lógica de script |
| Testes | Não incluído nesta fase | Documentar Vitest como recomendação futura |
| Node.js | 22 LTS | Suporte de longo prazo, performance melhorada |
| MongoDB | Manter versão atual | Compatibilidade com dados existentes |
| Padrão CRUD | Seguir padrões existentes | Controllers como userController.js, rotas como userRoutes.js, UI como config.vue |

### Fluxo de Migração

1. Copiar código-fonte atual para pasta `legacy/` como referência
2. Criar estrutura `frontend/` e `backend/`
3. Mover e adaptar arquivos
4. Remover dependências desnecessárias (crypto-js, body-parser, mongodb, core-js, polyfills, dotenv-webpack)
5. Configurar Vite
6. Reescrever componentes com `<script setup>` (apenas lógica, manter HTML/CSS)
7. Implementar middleware de auth no backend
8. Implementar auth no WebSocket
9. Adicionar CRUD de usuários (seguindo padrão existente)
10. Corrigir bugs identificados
11. Atualizar Docker
12. Criar documentação (migration-instructions.md, migration-log-changes.md, documentation.md)
13. Testar compatibilidade com dados existentes

## Architecture

### Estrutura do Projeto

```
queue-ticket-managment/
├── legacy/                      # Cópia do código-fonte original (referência)
│   ├── src/                     # Código frontend original
│   ├── server.js                # Servidor original
│   ├── router.js                # Rotas backend originais
│   ├── config/                  # Configuração original
│   ├── package.json             # Dependências originais
│   ├── vue.config.js            # Config Vue CLI original
│   └── README.md                # Explicação: cópia de referência pré-migração
├── frontend/                    # Aplicação Vue 3.5 + Vite 6
│   ├── src/
│   │   ├── components/          # Componentes reutilizáveis (sidebar, topbar)
│   │   ├── pages/               # Páginas (index, login, config, etc.)
│   │   ├── composables/         # Lógica reutilizável (useTicket, useSocket, etc.)
│   │   ├── services/            # Chamadas HTTP (api.js)
│   │   ├── stores/              # Pinia stores (auth.js)
│   │   ├── router/              # Vue Router config
│   │   ├── utils/               # Funções utilitárias
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env / .env.production
├── backend/                     # Express + Socket.io
│   ├── src/
│   │   ├── routes/              # Rotas Express (user, ticket, global)
│   │   ├── models/              # Mongoose schemas
│   │   ├── middleware/          # Auth, rate-limit, error-handler
│   │   └── config/              # Configuração centralizada
│   ├── server.js
│   ├── package.json
│   └── .env
├── docker-compose.yml
├── Dockerfile.frontend
├── Dockerfile.backend
├── migration-instructions.md    # Instruções de como usar/entender o projeto
├── migration-log-changes.md     # Logs do que foi modificado
├── documentation.md             # Documentação sucinta do projeto
└── README.md
```

### 1. Pasta Legacy (Preservação do Código Original)

**Objetivo:** Manter uma cópia completa do código-fonte antes da migração para consulta em caso de problemas.

**Conteúdo copiado:**
- `src/` (todo o código frontend: pages, components, controllers, db, stores, router)
- `server.js` (servidor Express original)
- `router.js` (rotas backend originais)
- `config/` (configuração auth)
- `package.json` (dependências originais)
- `vue.config.js` (configuração Vue CLI)
- `babel.config.js`, `jsconfig.json` (configs de build)
- `public/` (assets estáticos)

**README da pasta legacy:**
```markdown
# Legacy - Código de Referência

Esta pasta contém uma cópia do código-fonte original do projeto antes da migração para Vue 3.5 + Vite 6.

## Propósito
- Consultar a implementação anterior caso algo quebre durante a migração
- Referência para entender como funcionalidades estavam implementadas
- NÃO deve ser executado — é apenas para leitura/consulta

## Versão Original
- Vue 3.2 + Vue CLI 5
- Express 4.18 (monolito com frontend)
- Dependências misturadas em um único package.json
```

### 2. Estrutura do Projeto (Separação Frontend/Backend)

**Problema atual:** Frontend e backend compartilham o mesmo `package.json`, misturando dependências de browser (vue, pinia) com dependências de servidor (express, mongoose, bcrypt). Isso causa necessidade de polyfills desnecessários.

**Solução:** Separar em dois `package.json` independentes dentro de pastas `frontend/` e `backend/`.

**Frontend `package.json` (dependências principais):**
- vue@^3.5
- vue-router@^4.5
- pinia@^2.3
- vite@^6
- socket.io-client@^4.8
- axios@^1.7 (manter por familiaridade, documentar ofetch como alternativa futura)
- bootstrap@^5.3
- vue-toastification@^2
- @vuepic/vue-datepicker@^9
- vue-feather@^2
- @vueuse/core@^12
- maska@^3

**Backend `package.json` (dependências principais):**
- express@^4.21
- mongoose@^8
- socket.io@^4.8
- bcrypt@^5
- jsonwebtoken@^9
- cors@^2
- express-rate-limit@^7
- dotenv@^16
- nodemon@^3 (dev)

**Dependências REMOVIDAS (não migram para nenhum package.json):**
- `crypto-js` — não utilizado em nenhum arquivo do projeto
- `body-parser` — Express 4.16+ tem `express.json()` e `express.urlencoded()` built-in
- `mongodb` — projeto usa mongoose exclusivamente, driver direto é redundante
- `core-js` — desnecessário com target de browsers modernos (sem IE11)
- `crypto-browserify`, `os-browserify`, `path-browserify`, `stream-browserify` — polyfills necessários apenas porque Vue CLI empacotava código backend junto com frontend
- `dotenv-webpack` — substituído pelo handling nativo de variáveis de ambiente do Vite

### 3. Configuração Vite

**`frontend/vite.config.js`:**
```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '0.0.0.0',
    port: 8080
  }
})
```

### 4. Variáveis de Ambiente

**Frontend (`.env`):**
```
VITE_PORT_SERVER=3030
VITE_PORT_CLIENT=8080
VITE_URL=http://localhost
VITE_DEV=0
VITE_SYSTEM_AUTH=1
```

**Backend (`.env`):**
```
DB_IP=mongodb:27017
DB_NAME=gonc-queue-manager
DB_USER=admin
DB_PASS=admin
PORT=3030
CLIENT_URL=http://localhost:8080
JWT_SECRET=sua-chave-secreta-aqui
JWT_EXPIRES_IN=72h
ALLOWED_ORIGINS=http://localhost:8080
```

## Components and Interfaces

### 5. Middleware de Autenticação (Backend)

**`backend/src/middleware/auth.js`:**
```javascript
const jwt = require('jsonwebtoken')

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' })
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    return res.status(401).json({ error: 'Token mal formatado' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded.userData
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' })
  }
}

function requireRole(minRole) {
  return (req, res, next) => {
    if (!req.user || req.user.role < minRole) {
      return res.status(403).json({ error: 'Sem permissão' })
    }
    next()
  }
}

module.exports = { authMiddleware, requireRole }
```

### 6. Autenticação WebSocket

**`backend/server.js` (trecho socket):**
```javascript
const jwt = require('jsonwebtoken')

io.use((socket, next) => {
  const token = socket.handshake.auth?.token
  if (!token) {
    // Permite conexão sem auth para monitor (somente leitura)
    socket.authenticated = false
    return next()
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    socket.user = decoded.userData
    socket.authenticated = true
    next()
  } catch (err) {
    socket.authenticated = false
    next()
  }
})

io.on('connection', (socket) => {
  // Eventos de controle requerem autenticação
  socket.on('signalUpdateValues', () => {
    if (!socket.authenticated) return
    io.emit('receiveUpdateGlobal')
  })

  socket.on('signalUpdateMonitor', (callByName) => {
    if (!socket.authenticated) return
    io.emit('receiveUpdateMonitor', callByName)
  })

  socket.on('signalUpdateMonitorConfigs', () => {
    if (!socket.authenticated) return
    io.emit('receiveUpdateMonitorConfigs')
  })
})
```

### 7. Rate Limiting

**`backend/src/middleware/rateLimit.js`:**
```javascript
const rateLimit = require('express-rate-limit')

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5,
  message: { error: 'Muitas tentativas. Aguarde 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
})

module.exports = { loginLimiter }
```

### 8. CRUD de Usuários (Backend)

**Padrão seguido:** Mesmo estilo de `userRoutes.js` (express router, bcrypt, jwt).

**Novos endpoints em `backend/src/routes/userRoutes.js`:**

```javascript
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { authMiddleware, requireRole } = require("../middleware/auth");

// GET /api/users - Listar todos (requer role >= 3)
router.get('/api/users', authMiddleware, requireRole(3), async (req, res) => {
  try {
    const users = await User.find({}).select('-password')
    res.json({ users })
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// PUT /api/users/:id - Atualizar usuário (requer role >= 3)
router.put('/api/users/:id', authMiddleware, requireRole(3), async (req, res) => {
  try {
    const { username, login, role, password } = req.body
    const updateData = { username, login, role }
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }
    
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password')
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })
    res.json({ user })
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// DELETE /api/users/:id - Excluir usuário (requer role >= 3)
router.delete('/api/users/:id', authMiddleware, requireRole(3), async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: 'Não é possível excluir o próprio usuário' })
    }
    await User.findByIdAndDelete(req.params.id)
    res.json({ message: 'Usuário removido' })
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})
```

### 9. CRUD de Usuários (Frontend — Controller)

**Padrão seguido:** Mesmo estilo de `userController.js` (axios com config.url_server, useAuth para token).

**`frontend/src/controllers/userController.js`:**
```javascript
import axios from "axios";
import config from "../config.js";
import { useAuth } from "../stores/auth.js";

export async function getUsers() {
  const auth = useAuth();
  try {
    const tokenAuth = "Bearer " + auth.token;
    const response = await axios.get(`${config.url_server}/api/users`, {
      headers: { Authorization: tokenAuth }
    });
    return response;
  } catch (error) {
    return error.response;
  }
}

export async function updateUser(id, userData) {
  const auth = useAuth();
  try {
    const tokenAuth = "Bearer " + auth.token;
    const response = await axios.put(`${config.url_server}/api/users/${id}`, userData, {
      headers: { Authorization: tokenAuth }
    });
    return response;
  } catch (error) {
    return error.response;
  }
}

export async function deleteUser(id) {
  const auth = useAuth();
  try {
    const tokenAuth = "Bearer " + auth.token;
    const response = await axios.delete(`${config.url_server}/api/users/${id}`, {
      headers: { Authorization: tokenAuth }
    });
    return response;
  } catch (error) {
    return error.response;
  }
}

export async function updatePassword(id, newPassword) {
  const auth = useAuth();
  try {
    const tokenAuth = "Bearer " + auth.token;
    const response = await axios.put(`${config.url_server}/api/users/${id}`, { password: newPassword }, {
      headers: { Authorization: tokenAuth }
    });
    return response;
  } catch (error) {
    return error.response;
  }
}
```

### 10. CRUD de Usuários (Frontend — UI)

**Padrão seguido:** Mesmo estilo HTML/CSS de config.vue — seção "Registro de usuario" com Bootstrap input-groups.

**Seção de gerenciamento na página config.vue:**
```html
<!-- Segue o mesmo padrão de container > row > col-md-auto > menu-default -->
<div class="row justify-content-md-center">
  <div class="col-md-auto menu-default">
    <h5>Gerenciamento de usuários</h5>
    
    <!-- Tabela de usuários -->
    <table class="table table-sm">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Login</th>
          <th>Função</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user._id">
          <td>{{ user.username }}</td>
          <td>{{ user.login }}</td>
          <td>{{ getRoleName(user.role) }}</td>
          <td>
            <button class="btn btn-outline-primary btn-sm" @click="editUser(user)">Editar</button>
            <button class="btn btn-outline-danger btn-sm" @click="handleDeleteUser(user._id)">Excluir</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal/Formulário de edição — mesmo padrão input-group do "Registro de usuario" -->
    <div v-if="editingUser">
      <h6>Editar usuário</h6>
      <form @submit.prevent="handleUpdateUser()">
        <div class="input-group input-group-sm mb-1">
          <span class="input-group-text" id="inputGroup-sizing-sm">Nome:</span>
          <input type="text" maxlength="30" class="form-control" v-model="editingUser.username" required />
        </div>
        <div class="input-group input-group-sm mb-1">
          <span class="input-group-text" id="inputGroup-sizing-sm">Login:</span>
          <input type="text" maxlength="30" class="form-control" v-model="editingUser.login" required />
        </div>
        <div class="input-group input-group-sm mb-1">
          <span class="input-group-text" id="inputGroup-sizing-sm">Nova senha:</span>
          <input type="password" class="form-control" v-model="editingUser.newPassword" placeholder="Deixe vazio para manter" />
        </div>
        <div class="input-group input-group-sm mb-2">
          <span class="input-group-text">Função</span>
          <select class="custom-select" v-model="editingUser.role" required>
            <option value="1">Monitor</option>
            <option value="2">Atendente</option>
            <option value="3">Administrador</option>
          </select>
        </div>
        <button type="submit" class="btn btn-outline-primary btn-sm">Salvar</button>
        <button type="button" class="btn btn-outline-secondary btn-sm" @click="editingUser = null">Cancelar</button>
      </form>
    </div>
  </div>
</div>
```

### 11. Correção do Bug de Acesso Não Autenticado

**Frontend (`sidebar.vue`):**
```javascript
// Antes (bugado):
await checkToken().then((response) => {
  if (response.data.userData) this.username = this.auth.userData.username;
});

// Depois (corrigido):
const auth = useAuth()
if (auth.token) {
  try {
    const response = await checkToken()
    if (response?.data?.userData) {
      username.value = auth.userData.username
    }
  } catch {
    auth.clearToken()
  }
}
```

**Backend (`/auth/verify`):**
```javascript
router.get('/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return res.status(200).json({ userData: decoded.userData })
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' })
  }
})
```

### 12. Correção do Modelo History

**Problema:** `src/db/models/history.js` registra o modelo como "User" no mongoose, conflitando com o modelo real de User.

**Solução:**
```javascript
const HistoryModel = mongoose.model("History", HistorySchema)
module.exports = HistoryModel
```

### 13. Socket.io no Frontend com Auth

**`frontend/src/socket.js`:**
```javascript
import { reactive } from 'vue'
import { io } from 'socket.io-client'

const URL = import.meta.env.VITE_URL + ':' + import.meta.env.VITE_PORT_SERVER

export const state = reactive({ connected: false })

export function createSocket(token) {
  const socket = io(URL, {
    auth: { token }
  })

  socket.on('connect', () => { state.connected = true })
  socket.on('disconnect', () => { state.connected = false })

  return socket
}

// Socket público para o monitor (sem auth)
export const publicSocket = io(URL)
publicSocket.on('connect', () => { state.connected = true })
publicSocket.on('disconnect', () => { state.connected = false })
```

### 14. Docker — Produção

**`Dockerfile.frontend`:**
```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**`Dockerfile.backend`:**
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ .
EXPOSE 3030
CMD ["node", "server.js"]
```

**`docker-compose.yml`:**
```yaml
services:
  mongodb:
    image: mongo:7
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${DB_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${DB_PASS}
    volumes:
      - mongodb_data:/data/db

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "${PORT:-3030}:3030"
    env_file: ./backend/.env
    depends_on:
      - mongodb
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mongodb_data:
```

### 15. Serviço HTTP Centralizado (Frontend)

**`frontend/src/services/api.js`:**
```javascript
import axios from 'axios'
import { useAuth } from '@/stores/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_URL + ':' + import.meta.env.VITE_PORT_SERVER,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const auth = useAuth()
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const auth = useAuth()
      auth.clearToken()
    }
    return Promise.reject(error)
  }
)

export { api }
```

## Data Models

### Compatibilidade com Dados Legados

**Campos de banco mantidos sem alteração:**
- Coleção `users`: `username`, `login`, `password`, `role`, `table`, `language`
- Coleção `tickets`: `number`, `status`, `preferential`, `name`, `docNumber`, `type`, `queuedBy`, `dateQueue`, `servicedBy`, `dateServiced`, `assistedAge`
- Coleção `globals`: `ticket.*`, `monitorMode`, `soundNotification`, `soundCallTicket`, `soundCallTicketVoice`

**Nenhuma migration de banco é necessária.** Os schemas Mongoose permanecem idênticos.

## Correctness Properties

As propriedades de correção garantem a integridade dos dados e o comportamento correto do sistema durante e após a migração.

### Property 1: Integridade dos dados na migração

*Para qualquer* schema Mongoose (users, tickets, globals), os campos devem permanecer idênticos antes e depois da reestruturação. Nenhum campo deve ser renomeado, removido ou ter seu tipo alterado.

**Validates: Requirements 9.3**

### Property 2: Autenticação JWT consistente

*Para qualquer* token JWT válido emitido pelo sistema, a verificação deve retornar os mesmos dados de usuário (userData) que foram codificados no momento da emissão.

**Validates: Requirements 2.1**

### Property 3: Controle de acesso por role

*Para qualquer* requisição autenticada, o acesso a endpoints protegidos deve ser concedido se e somente se o role do usuário for maior ou igual ao role mínimo exigido pelo endpoint.

**Validates: Requirements 2.1, 3.3**

### Property 4: Preservação do código legacy

*Para qualquer* arquivo na pasta `legacy/`, o conteúdo deve ser idêntico ao arquivo original correspondente no momento da cópia. A pasta legacy é somente-leitura e não deve ser modificada durante a migração.

**Validates: Requirements 10.1, 10.2**

## Error Handling

### Estratégia de Tratamento de Erros

**Backend:**
- Respostas de erro padronizadas com formato JSON `{ error: "mensagem" }`
- Códigos HTTP apropriados: 401 (não autenticado), 403 (sem permissão), 404 (não encontrado), 400 (requisição inválida)
- Rate limiting retorna 429 com mensagem amigável em português
- Validação de token JWT com early-return para headers ausentes ou malformados

**Frontend:**
- Interceptor Axios global captura respostas 401 e limpa o token automaticamente
- Verificação de token antes de chamadas à API para evitar requisições desnecessárias
- Toast notifications para feedback de erros ao usuário
- Fallback gracioso quando WebSocket não está autenticado (modo somente-leitura para monitor)

**WebSocket:**
- Conexões sem token são permitidas mas marcadas como `authenticated = false`
- Eventos de controle são silenciosamente ignorados para conexões não autenticadas
- Erros de verificação de token não desconectam o socket (permite modo monitor)

## Testing Strategy

### Recomendação de Testes

**Framework recomendado:** Vitest (integração nativa com Vite, compatível com API do Jest)

**Testes unitários (prioridade futura):**
- Composables (`useTickets`, `useGlobal`, `useUsers`): testar lógica de negócio isolada
- Middleware de autenticação: testar validação de JWT, verificação de roles
- Utilitários (`convertDate`, `calculateAge`): funções puras, fáceis de testar

**Testes de integração:**
- Rotas da API: testar endpoints com banco em memória (mongodb-memory-server)
- WebSocket: testar autenticação e emissão de eventos

**Testes E2E (recomendação futura):**
- Cypress ou Playwright para fluxos completos: login → triagem → atendimento → monitor

**Nota:** Testes não estão incluídos nesta fase de migração. A prioridade é manter paridade funcional com o sistema atual. Vitest deve ser adicionado como dependência de desenvolvimento no `frontend/package.json` em uma fase posterior.
