# Novas Funcionalidades — Guia do Desenvolvedor

Documentação detalhada das melhorias implementadas na versão 2.1 do sistema de gerenciamento de senhas.

---

## Índice

1. [Vitest — Testes Unitários](#1-vitest--testes-unitários)
2. [ESLint Flat Config](#2-eslint-flat-config)
3. [Lazy Loading de Rotas](#3-lazy-loading-de-rotas)
4. [Health Check Endpoint](#4-health-check-endpoint)
5. [Paginação Server-Side no Histórico](#5-paginação-server-side-no-histórico)
6. [Refresh Token](#6-refresh-token)
7. [Validação de Input no Backend](#7-validação-de-input-no-backend)
8. [Logs Estruturados com Pino](#8-logs-estruturados-com-pino)
9. [Notificação de Desconexão WebSocket](#9-notificação-de-desconexão-websocket)
10. [Confirmação Visual de Senha Chamada](#10-confirmação-visual-de-senha-chamada)

---

## 1. Vitest — Testes Unitários

### Descrição

Framework de testes unitários integrado ao Vite, com suporte a componentes Vue e ambiente DOM simulado.

### Dependências Adicionadas

```json
{
  "devDependencies": {
    "vitest": "^3.1.0",
    "@vue/test-utils": "^2.4.6",
    "happy-dom": "^17.4.4"
  }
}
```

### Configuração

A configuração do Vitest está no `frontend/vite.config.js`:

```js
export default defineConfig({
  // ... outras configs
  test: {
    environment: 'happy-dom',
    globals: true,
    root: './src'
  }
})
```

**Opções:**
- `environment: 'happy-dom'` — Simula o DOM do navegador para testes de componentes
- `globals: true` — Disponibiliza `describe`, `it`, `expect` sem importação explícita
- `root: './src'` — Diretório raiz para busca de arquivos de teste

### Como Usar

**Executar todos os testes uma vez:**
```bash
cd frontend
npm test
```

**Executar testes em modo watch (re-executa ao salvar):**
```bash
cd frontend
npm run test:watch
```

**Executar um arquivo específico:**
```bash
cd frontend
npx vitest run src/__tests__/utils.test.js
```

### Estrutura de Testes

```
frontend/src/
├── __tests__/
│   └── utils.test.js          # Testes das funções utilitárias
└── stores/
    └── __tests__/
        └── auth.test.js       # Testes do store de autenticação
```

### Exemplo de Teste

```js
import { describe, it, expect } from 'vitest'
import { convertHours } from '../utils/index.js'

describe('convertHours', () => {
  it('should convert 3661000 ms to 1h 1m 1s', () => {
    expect(convertHours(3661000)).toBe('1h 1m 1s')
  })
})
```

### Testes Disponíveis

**`src/__tests__/utils.test.js`:**
- `convertDate` — Formatação de datas para pt-BR
- `convertHours` — Conversão de milissegundos para formato legível
- `isValidDate` — Validação de strings de data
- `calculateAge` — Cálculo de idade a partir de data de nascimento

**`src/stores/__tests__/auth.test.js`:**
- `setToken` — Armazenamento de token no store e localStorage
- `clearToken` — Limpeza de token e estado de autenticação
- `setUserData` — Definição de dados do usuário
- Getters — `isAuthenticated`, `getUsername`

### Adicionando Novos Testes

Crie arquivos `*.test.js` ou `*.spec.js` em qualquer pasta `__tests__/` dentro de `src/`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

describe('Meu Teste', () => {
  beforeEach(() => {
    setActivePinia(createPinia()) // Necessário para testar stores Pinia
  })

  it('deve funcionar', () => {
    expect(true).toBe(true)
  })
})
```

---

## 2. ESLint Flat Config

### Descrição

Linter JavaScript/Vue configurado com o novo formato flat config do ESLint 9+, que substitui o formato `.eslintrc` depreciado.

### Dependências Adicionadas

```json
{
  "devDependencies": {
    "eslint": "^9.21.0",
    "@eslint/js": "^9.21.0",
    "eslint-plugin-vue": "^9.32.0"
  }
}
```

### Configuração

Arquivo `frontend/eslint.config.js`:

```js
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'no-unused-vars': 'warn',
      'no-console': 'off',
    }
  }
]
```

**Regras personalizadas:**
- `vue/multi-word-component-names: 'off'` — Permite nomes de componente com uma palavra (ex: `sidebar`, `topbar`)
- `no-unused-vars: 'warn'` — Avisa sobre variáveis não utilizadas (não bloqueia)
- `no-console: 'off'` — Permite uso de `console.log` no frontend

### Como Usar

**Executar lint em todo o código:**
```bash
cd frontend
npm run lint
```

**Lint com correção automática:**
```bash
cd frontend
npx eslint src/ --fix
```

**Lint em arquivo específico:**
```bash
cd frontend
npx eslint src/pages/history.vue
```

### Integração com IDE

Para VS Code, instale a extensão ESLint e adicione ao `.vscode/settings.json`:

```json
{
  "eslint.useFlatConfig": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

### Personalizando Regras

Adicione ou modifique regras no objeto de configuração:

```js
{
  rules: {
    'vue/no-v-html': 'error',        // Proíbe v-html (XSS)
    'no-debugger': 'error',           // Proíbe debugger em produção
    'prefer-const': 'warn',           // Sugere const quando possível
  }
}
```

---

## 3. Lazy Loading de Rotas

### Descrição

Carregamento sob demanda das páginas da aplicação, reduzindo o tamanho do bundle inicial e melhorando o tempo de carregamento.

### Como Funciona

Em vez de importar todas as páginas no bundle principal, cada página é carregada apenas quando o usuário navega até ela:

```js
// Import estático (carregado imediatamente)
import sidebar from "@/components/sidebar.vue";
import login from "@/pages/login.vue";

// Import dinâmico (carregado sob demanda)
const history = () => import("@/pages/history.vue");
const config = () => import("@/pages/config.vue");
```

### Páginas com Import Estático

| Página | Motivo |
|--------|--------|
| `sidebar.vue` | Layout wrapper — sempre visível |
| `login.vue` | Primeira página que o usuário vê |

### Páginas com Lazy Loading

| Página | Rota |
|--------|------|
| `index.vue` | `/` |
| `sorting.vue` | `/sorting` |
| `service.vue` | `/service` |
| `history.vue` | `/history` |
| `config.vue` | `/config` |
| `monitor.vue` | `/monitor` |

### Impacto no Build

O Vite automaticamente cria chunks separados para cada página lazy-loaded:

```
dist/assets/
├── index-[hash].js        # Bundle principal (menor)
├── history-[hash].js      # Carregado ao acessar /history
├── config-[hash].js       # Carregado ao acessar /config
├── sorting-[hash].js      # Carregado ao acessar /sorting
└── ...
```

### Verificando o Resultado

```bash
cd frontend
npm run build
```

O output mostrará os chunks gerados e seus tamanhos.

---

## 4. Health Check Endpoint

### Descrição

Endpoint para verificação de saúde do serviço, útil para monitoramento, load balancers e orquestradores de containers.

### Endpoint

```
GET /health
```

### Resposta

```json
{
  "status": "ok",
  "timestamp": "2024-03-15T14:30:00.000Z",
  "uptime": 3600.5,
  "mongodb": "connected"
}
```

**Campos:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `status` | string | Sempre `"ok"` se o servidor responde |
| `timestamp` | string | Data/hora atual em ISO 8601 |
| `uptime` | number | Tempo de atividade do processo em segundos |
| `mongodb` | string | `"connected"` ou `"disconnected"` |

### Verificação do MongoDB

O campo `mongodb` usa `mongoose.connection.readyState`:
- `1` → `"connected"`
- Qualquer outro valor → `"disconnected"`

### Uso com Docker

O `infra/docker/Dockerfile.backend` define um `HEALTHCHECK` que chama `/health` com o próprio Node (a imagem não tem `curl`). No modo standalone, `infra/standalone/status.cmd` usa o mesmo endpoint.

### Uso com Monitoramento

```bash
# Verificação simples
curl http://localhost:3030/health

# Com jq para formatação
curl -s http://localhost:3030/health | jq .

# Script de monitoramento
curl -sf http://localhost:3030/health > /dev/null && echo "OK" || echo "FALHA"
```

---

## 5. Paginação Server-Side no Histórico

### Descrição

O endpoint de histórico agora suporta paginação, busca e ordenação no servidor, evitando carregar milhares de registros de uma vez.

### Endpoint

```
GET /loadTicketHistory?page=1&limit=50&search=&startDate=&endDate=&sortField=dateQueue&sortOrder=desc
```

### Parâmetros de Query

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `page` | number | 1 | Página atual |
| `limit` | number | 50 | Itens por página |
| `search` | string | "" | Busca em nome, documento, tipo, triagem, atendente |
| `startDate` | ISO string | — | Data inicial do filtro de período |
| `endDate` | ISO string | — | Data final do filtro de período |
| `sortField` | string | "dateQueue" | Campo para ordenação |
| `sortOrder` | string | "desc" | Direção: "asc" ou "desc" |

### Resposta

```json
{
  "ticket": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1250,
    "pages": 25
  },
  "stats": {
    "totalComplete": 1100,
    "avgWaitTime": 450000
  }
}
```

### Compatibilidade

Se nenhum parâmetro for enviado, o endpoint retorna a primeira página com 50 itens (comportamento padrão seguro).

### Frontend — Como Funciona

A página `history.vue` agora:
1. Faz requisições paginadas ao servidor
2. Usa debounce de 400ms na busca para evitar requisições excessivas
3. Atualiza automaticamente ao mudar página, filtro de data ou itens por página
4. Exibe estatísticas (total de atendimentos, tempo médio de espera)

### Exemplo de Uso no Controller

```js
import { loadTicketHistory } from '@/controllers/ticketController.js'

// Com parâmetros
const response = await loadTicketHistory({
  page: 2,
  limit: 100,
  search: 'João',
  sortField: 'dateServiced',
  sortOrder: 'desc'
})

// Sem parâmetros (retorna padrão)
const response = await loadTicketHistory()
```

---

## 6. Refresh Token

### Descrição

Mecanismo de renovação automática de token JWT, evitando que o usuário seja deslogado durante uso ativo do sistema.

### Endpoint Backend

```
POST /auth/refresh
Authorization: Bearer <token-atual>
```

**Resposta:**
```json
{
  "token": "novo-token-jwt",
  "user": { "_id": "...", "username": "...", "login": "...", "role": 3 }
}
```

O endpoint:
- Valida o token atual (via `authMiddleware`)
- Recarrega o usuário do banco (401 se foi excluído)
- Emite um novo token com expiração renovada (sem o hash da senha)
- Usa o mesmo `JWT_EXPIRES_IN` configurado (padrão: 72h)

### Renovação no Frontend

> Revisado após a migração: o refresh-on-401 com fila de requisições foi removido. Ele não funcionava, porque `/auth/refresh` exige um token **válido** e um 401 significa justamente token expirado/inválido.

1. **Renovação preventiva:** o `App.vue` chama `refreshToken()` a cada 1 hora enquanto a aba estiver aberta. Monitor e guichês ficam logados indefinidamente, desde que a máquina não fique mais de 72h desligada.
2. **Usuário atualizado:** o refresh recarrega o usuário do banco. Função alterada vale na hora; usuário excluído perde o acesso.
3. **401 em qualquer chamada:** `services/api.js` encerra a sessão, mostra "Sessão expirada" e volta ao login.

### Função Manual

```js
import { refreshToken } from '@/controllers/userController.js'

// Refresh manual (se necessário)
const response = await refreshToken()
```

### Variáveis de Ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `JWT_EXPIRES_IN` | `72h` | Tempo de expiração do token |
| `JWT_SECRET` | — | Chave secreta para assinatura (obrigatória) |

---

## 7. Validação de Input no Backend

### Descrição

Validação de dados de entrada em todos os endpoints críticos usando `express-validator`, prevenindo dados malformados e ataques de injeção.

### Dependência

```json
{
  "dependencies": {
    "express-validator": "^7.2.1"
  }
}
```

### Middleware Reutilizável

Arquivo `backend/src/middleware/validate.js`:

```js
const { validationResult } = require('express-validator')

function validate(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  next()
}

module.exports = { validate }
```

### Validações por Endpoint

#### POST /register

| Campo | Regras |
|-------|--------|
| `username` | Obrigatório, trim, máximo 30 caracteres |
| `login` | Obrigatório, trim, apenas letras/números/pontos/hífens/underscores |
| `password` | Mínimo 4 caracteres |
| `role` | Inteiro entre 1 e 3 |

#### POST /login

| Campo | Regras |
|-------|--------|
| `login` | Obrigatório, trim |
| `password` | Obrigatório |

#### POST /insertTicket

| Campo | Regras |
|-------|--------|
| `number` | Inteiro obrigatório |
| `status` | Inteiro obrigatório |
| `name` | Obrigatório, trim |

#### PUT /api/users/:id

| Campo | Regras |
|-------|--------|
| `id` (param) | MongoDB ObjectId válido |
| `username` | Opcional, trim, máximo 30 caracteres |
| `login` | Opcional, trim, padrão alfanumérico |
| `role` | Opcional, inteiro entre 1 e 3 |
| `password` | Opcional, mínimo 4 caracteres |

### Resposta de Erro de Validação

```json
{
  "errors": [
    {
      "type": "field",
      "msg": "Password must be at least 4 characters",
      "path": "password",
      "location": "body"
    }
  ]
}
```

### Adicionando Validação a Novos Endpoints

```js
const { body } = require('express-validator')
const { validate } = require('../middleware/validate')

router.post('/meu-endpoint', [
  body('campo').notEmpty().withMessage('Campo obrigatório'),
  body('email').isEmail().withMessage('Email inválido'),
  validate
], async (req, res) => {
  // req.body já está validado aqui
})
```

---

## 8. Logs Estruturados com Pino

### Descrição

Sistema de logging estruturado que substitui `console.log`/`console.error` por logs JSON em produção e logs formatados em desenvolvimento.

### Dependências

```json
{
  "dependencies": {
    "pino": "^9.6.0"
  },
  "devDependencies": {
    "pino-pretty": "^13.0.0"
  }
}
```

### Configuração

Arquivo `backend/src/config/logger.js`:

```js
const pino = require('pino')

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' 
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined
})

module.exports = logger
```

### Variáveis de Ambiente

| Variável | Padrão | Opções | Descrição |
|----------|--------|--------|-----------|
| `LOG_LEVEL` | `info` | `fatal`, `error`, `warn`, `info`, `debug`, `trace` | Nível mínimo de log |
| `NODE_ENV` | — | `production`, `development` | Controla formatação dos logs |

### Comportamento por Ambiente

**Desenvolvimento** (`NODE_ENV !== 'production'`):
```
[14:30:00.000] INFO: Servidor Express rodando na porta 3030
[14:30:01.234] INFO: GET /health 200 - 5ms
```

**Produção** (`NODE_ENV=production`):
```json
{"level":30,"time":1710510600000,"msg":"Servidor Express rodando na porta 3030"}
{"level":30,"time":1710510601234,"method":"GET","url":"/health","status":200,"responseTime":"5ms","msg":"GET /health 200 - 5ms"}
```

### Request Logging

Cada requisição HTTP é logada automaticamente com:
- Método HTTP (GET, POST, PUT, DELETE)
- URL completa
- Status code da resposta
- Tempo de resposta em milissegundos

### Como Usar nos Seus Arquivos

```js
const logger = require('../config/logger')

// Informação
logger.info('Operação concluída')
logger.info({ userId: '123', action: 'login' }, 'Usuário logou')

// Erro
logger.error(error, 'Falha ao processar requisição')
logger.error({ code: 'DB_ERROR', detail: err.message }, 'Erro no banco')

// Warning
logger.warn('Token próximo da expiração')

// Debug (só aparece se LOG_LEVEL=debug)
logger.debug({ query: filter }, 'Executando query')
```

### Integração com Ferramentas

Os logs JSON em produção são compatíveis com:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Grafana Loki**
- **AWS CloudWatch**
- **Datadog**

Para redirecionar logs para arquivo:
```bash
node server.js > app.log 2>&1
```

---

## 9. Notificação de Desconexão WebSocket

### Descrição

Notificações visuais (toasts) quando a conexão WebSocket com o servidor é perdida ou restabelecida.

### Como Funciona

O arquivo `frontend/src/socket.js` monitora eventos de conexão do `publicSocket`:

```js
publicSocket.on('disconnect', () => {
  // Mostra toast de aviso
  toast.warning('Conexão com o servidor perdida. Reconectando...')
})

publicSocket.on('connect', () => {
  // Mostra toast de sucesso (apenas se estava desconectado)
  toast.success('Conexão restabelecida!')
})
```

### Proteção contra Spam

Uma flag `disconnectToastShown` evita múltiplas notificações em conexões instáveis:
- O toast de desconexão só aparece uma vez
- O toast de reconexão só aparece se houve desconexão prévia
- A flag é resetada ao reconectar

### Comportamento Visual

| Evento | Toast | Cor |
|--------|-------|-----|
| Desconexão | "Conexão com o servidor perdida. Reconectando..." | Amarelo (warning) |
| Reconexão | "Conexão restabelecida!" | Verde (success) |

### Personalização

Para alterar as mensagens ou comportamento, edite `frontend/src/socket.js`:

```js
// Exemplo: adicionar delay antes de mostrar toast de desconexão
let disconnectTimer = null

publicSocket.on('disconnect', () => {
  disconnectTimer = setTimeout(() => {
    // Só mostra se ainda estiver desconectado após 2s
    if (!state.connected) {
      toast.warning('Conexão perdida...')
    }
  }, 2000)
})
```

---

## 10. Confirmação Visual de Senha Chamada

### Descrição

Feedback visual imediato quando uma senha é chamada na sidebar, com animação de destaque verde no ticket.

### Como Funciona

1. Ao chamar um ticket com sucesso, `lastCalledTicketId` é definido com o ID do ticket
2. A classe CSS `.ticket-called` é aplicada condicionalmente ao ticket
3. Após 3 segundos, `lastCalledTicketId` é limpo e a animação desaparece

### Implementação

**Template (sidebar.vue):**
```html
<div class="ticket row" :class="{ 'ticket-called': ticket.ticketList._id === lastCalledTicketId }">
```

**Script:**
```js
const lastCalledTicketId = ref(null)

function handleCallTicket(_id) {
  callTicket(_id).then(() => {
    lastCalledTicketId.value = _id
    setTimeout(() => {
      lastCalledTicketId.value = null
    }, 3000)
  })
}
```

**CSS:**
```css
.sidebar .ticket.ticket-called {
  border-color: rgba(40, 167, 69, 0.8);
  box-shadow: 0 0 10px rgba(40, 167, 69, 0.4);
  animation: callPulse 0.5s ease-in-out 2;
}

@keyframes callPulse {
  0%, 100% { box-shadow: 0 0 5px rgba(40, 167, 69, 0.4); }
  50% { box-shadow: 0 0 15px rgba(40, 167, 69, 0.8); }
}
```

### Comportamento

- A borda do ticket fica verde
- Um efeito de "pulso" (box-shadow) pisca 2 vezes
- Após 3 segundos, o destaque desaparece suavemente

### Personalização

Para alterar a duração do destaque:
```js
setTimeout(() => {
  lastCalledTicketId.value = null
}, 5000) // 5 segundos em vez de 3
```

Para alterar a cor da animação, modifique os valores `rgba(40, 167, 69, ...)` no CSS.

---

## Resumo de Dependências

### Frontend (devDependencies)

| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `vitest` | ^3.1.0 | Framework de testes |
| `@vue/test-utils` | ^2.4.6 | Utilitários de teste Vue |
| `happy-dom` | ^17.4.4 | Ambiente DOM para testes |
| `eslint` | ^9.21.0 | Linter JavaScript |
| `@eslint/js` | ^9.21.0 | Configuração base ESLint |
| `eslint-plugin-vue` | ^9.32.0 | Regras Vue para ESLint |

### Backend (dependencies)

| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `express-validator` | ^7.2.1 | Validação de input |
| `pino` | ^9.6.0 | Logging estruturado |

### Backend (devDependencies)

| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `pino-pretty` | ^13.0.0 | Formatação de logs em dev |

---

## Variáveis de Ambiente

### Backend (.env)

| Variável | Obrigatória | Padrão | Descrição |
|----------|-------------|--------|-----------|
| `JWT_SECRET` | ✅ | — | Chave secreta para tokens JWT |
| `JWT_EXPIRES_IN` | ❌ | `72h` | Tempo de expiração do token |
| `LOG_LEVEL` | ❌ | `info` | Nível mínimo de logging |
| `NODE_ENV` | ❌ | — | `production` para logs JSON |
| `PORT` | ❌ | `3030` | Porta do servidor |
| `DB_IP` | ✅ | — | IP/host do MongoDB |
| `DB_NAME` | ✅ | — | Nome do banco de dados |
| `DB_USER` | ✅ | — | Usuário do MongoDB |
| `DB_PASS` | ✅ | — | Senha do MongoDB |
| `ALLOWED_ORIGINS` | ❌ | — | Origens CORS (separadas por vírgula) |

### Frontend (.env)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `VITE_URL` | ✅ | URL base do servidor (ex: `http://localhost`) |
| `VITE_PORT_SERVER` | ✅ | Porta do backend (ex: `3030`) |
| `VITE_PORT_CLIENT` | ✅ | Porta do frontend (ex: `8080`) |
| `VITE_DEV` | ❌ | `1` para modo desenvolvimento |
| `VITE_SYSTEM_AUTH` | ❌ | Configuração de autenticação |

---

## Scripts Disponíveis

### Frontend

```bash
cd frontend

npm run dev          # Servidor de desenvolvimento (Vite)
npm run build        # Build de produção
npm run preview      # Preview do build
npm test             # Executar testes (uma vez)
npm run test:watch   # Testes em modo watch
npm run lint         # Verificar código com ESLint
```

### Backend

```bash
cd backend

npm start            # Iniciar servidor (produção)
npm run dev          # Servidor com hot-reload (nodemon)
```

---

## Guia Rápido de Desenvolvimento

### Primeiro Setup

```bash
# Instalar dependências
cd frontend && npm install
cd ../backend && npm install

# Configurar variáveis de ambiente
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Editar os arquivos .env com suas configurações

# Iniciar em desenvolvimento
cd backend && npm run dev    # Terminal 1
cd frontend && npm run dev   # Terminal 2
```

### Antes de Commitar

```bash
cd frontend
npm run lint          # Verificar erros de lint
npm test             # Executar testes
npm run build        # Verificar se o build funciona
```

### Monitorando o Backend

```bash
# Verificar saúde do serviço
curl http://localhost:3030/health

# Logs em desenvolvimento são formatados automaticamente com pino-pretty
# Em produção, use: node server.js | npx pino-pretty (para debug)
```
