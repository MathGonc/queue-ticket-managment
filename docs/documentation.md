# Documentação — Sistema de Senhas (Queue Ticket Management)

## Visão Geral

Sistema de gerenciamento de filas e senhas para a Defensoria Pública. Permite emitir senhas (normais, preferenciais e super-preferenciais), chamar senhas para atendimento em guichês, exibir um painel/monitor público em tempo real via WebSocket e consultar histórico de atendimentos.

## Arquitetura

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Vue 3.5 + Vite 6, Vue Router 4, Pinia, Socket.io-client |
| Backend | Node.js, Express 4, Socket.io 4, JWT, bcrypt |
| Banco de Dados | MongoDB 7 (Mongoose 8) |
| Deploy | Docker Compose (3 containers: frontend, backend, mongodb) |

Comunicação em tempo real (chamada de senhas, atualização do monitor) é feita via Socket.io. A API REST cuida de CRUD de senhas, usuários e configurações globais.

## Como Rodar

### Desenvolvimento

```bash
# Backend
cd backend
npm install
npm run dev          # nodemon na porta 3030

# Frontend
cd frontend
npm install
npm run dev          # Vite dev server (porta 5173)
```

Requisitos: Node.js 18+, MongoDB rodando localmente ou via Docker.

### Produção (Docker)

```bash
docker compose up -d --build
```

Sobe 3 serviços: `mongodb` (27017), `backend` (3030), `frontend` (80).

## Endpoints da API

### Autenticação / Usuários (`userRoutes`)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/register` | Criar usuário | Não |
| POST | `/login` | Login (retorna JWT) | Não |
| GET | `/auth/verify` | Verificar token JWT | Bearer |
| GET | `/api/users` | Listar usuários | Role ≥ 3 |
| PUT | `/api/users/:id` | Atualizar usuário | Role ≥ 3 |
| DELETE | `/api/users/:id` | Excluir usuário | Role ≥ 3 |

### Senhas (`ticketRoutes`)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/loadTicketsInQueue` | Senhas na fila (últimos 7 dias) | Não |
| GET | `/loadTicket/:id` | Buscar senha por ID | Não |
| POST | `/insertTicket` | Criar nova senha | Não |
| PUT | `/updateTicketCalled/:id` | Atualizar senha (chamar/atender) | Não |
| DELETE | `/deleteTicket/:id` | Excluir senha | Não |
| GET | `/loadTicketHistory` | Histórico completo (limite 10k) | Não |

### Configurações Globais (`globalRoutes`)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/getConfigsDB` | Obter configurações | Não |
| POST | `/saveConfigsDB` | Salvar configurações | Não |
| GET | `/getGlobalTicketData` | Dados globais de senha (contador) | Não |
| PUT | `/updateGlobalTicketData` | Atualizar contador global | Não |
| PUT | `/resetGlobalTicketData` | Resetar contadores | Não |

### WebSocket (Socket.io)

| Evento (emit) | Descrição | Auth |
|----------------|-----------|------|
| `signalUpdateValues` | Notifica atualização de valores | Sim |
| `signalUpdateMonitor` | Atualiza monitor com nome chamado | Sim |
| `signalUpdateMonitorConfigs` | Atualiza configs do monitor | Sim |

## Estrutura de Pastas

```
queue-ticket-managment/
├── backend/
│   ├── server.js              # Entry point (Express + Socket.io)
│   └── src/
│       ├── config/            # Conexão DB e variáveis de ambiente
│       ├── middleware/        # auth.js (JWT), rateLimit.js
│       ├── models/            # Mongoose schemas (ticket, user, global, history)
│       └── routes/            # ticketRoutes, userRoutes, globalRoutes
├── frontend/
│   ├── index.html             # SPA entry
│   ├── vite.config.js         # Config Vite
│   └── src/
│       ├── components/        # sidebar, topbar
│       ├── composables/       # useTickets, useUsers, useGlobal
│       ├── controllers/       # Lógica de negócio (ticket, user, global)
│       ├── pages/             # Páginas (index, login, monitor, service, config, history, sorting)
│       ├── router/            # Vue Router + guards
│       ├── services/          # api.js (Axios instance)
│       ├── stores/            # Pinia (auth)
│       ├── utils/             # Helpers
│       ├── socket.js          # Socket.io client
│       └── main.js            # Bootstrap Vue app
├── docker-compose.yml         # Orquestração dos 3 containers
├── Dockerfile.backend
├── Dockerfile.frontend
└── documentation.md           # Este arquivo
```
