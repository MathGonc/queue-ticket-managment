# Documentação — Sistema de Senhas (Queue Ticket Management)

## Visão Geral

Sistema de gerenciamento de filas e senhas para a Defensoria Pública. Permite emitir senhas (normais, preferenciais e super-preferenciais), chamar senhas para atendimento em guichês, exibir um painel/monitor em tempo real via WebSocket e consultar o histórico de atendimentos.

## Arquitetura

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Vue 3.5 + Vite 8, Vue Router 5, Pinia 4, Socket.io-client, Bootstrap 5 |
| Backend | Node.js 22+, Express 5, Socket.io 4, JWT, bcrypt |
| Banco de Dados | MongoDB 6/7 (Mongoose 9) |
| Deploy | Standalone no Windows (principal) ou Docker Compose — ver [infra/](../infra/README.md) |

O navegador fala com o backend em `<mesmo host>:3030` (REST + Socket.io). Chamadas de senha e atualizações do monitor são propagadas via Socket.io.

## Como Rodar

Ver [infra/README.md](../infra/README.md). Resumo para desenvolvimento:

```bash
cd backend  && npm install && npm run dev   # API em :3030 (precisa de backend/.env)
cd frontend && npm install && npm run dev   # Vite em :8080
```

## Cargos

| Valor | Cargo | Acesso nas telas |
|-------|-------|------------------|
| 1 | Monitor | Início, painel |
| 2 | Atendente | + triagem, atendimento, histórico |
| 3 | Administrador | + configurações, usuários, excluir senha |

O primeiro administrador de um banco novo é criado com `npm run create-admin` (no backend) ou `infra/standalone/create-admin.cmd`.

## Endpoints da API

"Login" = header `Authorization: Bearer <token>`. O token vale 72h (`JWT_EXPIRES_IN`) e o frontend o renova a cada hora.

### Autenticação / Usuários (`userRoutes`)

| Método | Rota | Descrição | Acesso |
|--------|------|-----------|--------|
| POST | `/login` | Login (retorna token e usuário, sem senha) | Público (5 tentativas/min por IP) |
| GET | `/auth/verify` | Valida o token e devolve o usuário atual do banco | Login |
| POST | `/auth/refresh` | Novo token (recarrega o usuário do banco) | Login |
| POST | `/auth/logout` | Registra a saída no registro de atividades | Login |
| POST | `/register` | Criar usuário | Admin |
| GET | `/api/users` | Listar usuários | Admin |
| PUT | `/api/users/:id` | Atualizar usuário (senha opcional) | Admin |
| DELETE | `/api/users/:id` | Excluir usuário (não exclui a si mesmo) | Admin |

### Senhas (`ticketRoutes`)

| Método | Rota | Descrição | Acesso |
|--------|------|-----------|--------|
| GET | `/loadTicketsInQueue` | Senhas dos últimos 7 dias (fila + atendidas) | Login |
| GET | `/loadTicket/:id` | Buscar senha por ID | Login |
| PUT | `/updateTicketCalled/:id` | Marcar senha como chamada | Login |
| POST | `/insertTicket` | Emitir senha (triagem) | Atendente |
| GET | `/loadTicketHistory` | Histórico paginado (`page`, `limit`, `search`, `startDate`, `endDate`, `sortField`, `sortOrder`) | Atendente |
| DELETE | `/deleteTicket/:id` | Excluir senha | Admin |

### Configurações Globais (`globalRoutes`)

| Método | Rota | Descrição | Acesso |
|--------|------|-----------|--------|
| GET | `/getConfigsDB` | Configurações do monitor | Público (lido pelo painel) |
| GET | `/getGlobalTicketData` | Senha atual/anterior e próximo número | Público (lido pelo painel) |
| PUT | `/updateGlobalTicketData` | Atualizar numeração/chamada | Login |
| POST | `/saveConfigsDB` | Salvar configurações do monitor | Admin |
| PUT | `/resetGlobalTicketData` | Zerar numeração | Admin |

`saveConfigsDB` só grava os campos do monitor: numeração e nome da empresa não são sobrescritos por esta rota.

### Empresa e logo (`brandingRoutes`)

| Método | Rota | Descrição | Acesso |
|--------|------|-----------|--------|
| GET | `/api/branding` | Nome da empresa e versão do logo (`logo: null` se não houver) | Público |
| GET | `/api/branding/logo` | Imagem do logo | Público |
| PUT | `/api/branding/logo` | Importar logo: corpo = arquivo PNG, JPEG ou WebP (até 2 MB; SVG é recusado) | Admin |
| DELETE | `/api/branding/logo` | Remover logo | Admin |
| PUT | `/api/branding/company` | Nome da empresa (`companyName`, até 120 caracteres; usado no PDF do histórico) | Admin |

O logo fica em `data/logo.<ext>` na raiz do projeto (`DATA_DIR` muda a pasta; no Docker é o volume `branding_data`). A pasta não vai para o git. O nome da empresa fica no banco, na configuração global.

### Registro de atividades (`activityRoutes`)

| Método | Rota | Descrição | Acesso |
|--------|------|-----------|--------|
| GET | `/api/activity` | Atividades com filtros `type` (lista separada por vírgula), `user`, `from`, `to`, `page`, `limit` | Admin |
| POST | `/api/activity/client` | Eventos que só o navegador conhece: `pdf_historico` (Atendente) e `guiche_alterado` (Login); detalhes validados | Login |
| GET | `/api/stats/daily` | Indicadores por dia (`from`, `to`; padrão 30 dias): emitidas, preferenciais, atendidas, espera média e máxima | Admin |
| GET | `/api/logs/files` | Arquivos de log técnico disponíveis | Admin |
| GET | `/api/logs` | Linhas de um arquivo de log (`file`, `level`, `search`, `limit`), mais recentes primeiro | Admin |

Tipos registrados:

- **Acesso:** login, login falhou (motivo), login bloqueado, logout, sinal de tempo real recusado (sem login; no máximo 1 por IP e evento a cada 10 min).
- **Senhas:** emitida, chamada (guichê e espera), chamada novamente, excluída, numeração zerada; guichê alterado pelo atendente; PDF do histórico (quem gerou e filtros).
- **Painel (TV):** conectado e desconectado. Quedas de até 60 s (`PANEL_GRACE_MS`) não são registradas.
- **Sistema:** configuração do monitor (de → para), logo importado ou removido, nome da empresa (de → para), usuário criado/alterado/excluído, servidor iniciado, erro do servidor (respostas 500), backup concluído ou falhou.

O registro identifica a senha pelo número: **não guarda nome nem CPF do assistido**. Fica na tela de Configurações, aba Registro (admin), com indicadores e exportação em CSV; a aba Logs mostra o último backup e os logs técnicos.

### Logs técnicos

Além da janela, o backend grava em `backend/logs/backend.AAAA-MM-DD.N.log` (JSON, um arquivo por dia, últimos `LOG_RETENTION_DAYS` = 30). `LOG_DIR` muda a pasta; vazio desliga (é o padrão no Docker).

### Outros

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Status do backend e da conexão com o MongoDB |

### WebSocket (Socket.io)

| Evento (cliente → servidor) | Descrição | Exige token no handshake |
|----------------|-----------|------|
| `signalUpdateValues` | Listas/numeração mudaram | Sim |
| `signalUpdateMonitor` | Nova chamada no painel | Sim |
| `signalUpdateMonitorConfigs` | Configurações do monitor mudaram | Sim |

O servidor retransmite como `receiveUpdateGlobal`, `receiveUpdateMonitor` e `receiveUpdateMonitorConfigs` para todos os clientes. Sinais de conexões sem token válido são ignorados.

O próprio servidor emite `receiveUpdateBranding` quando o logo ou o nome da empresa mudam: as telas abertas atualizam sem recarregar.

## Estrutura de Pastas

```
queue-ticket-managment/
├── backend/
│   ├── server.js              # Entry point (Express + Socket.io)
│   ├── scripts/create-admin.js
│   └── src/
│       ├── config/            # Variáveis de ambiente, conexão DB, logger
│       ├── middleware/        # auth (JWT/cargos), rateLimit, validate
│       ├── models/            # Mongoose schemas (ticket, user, global, history)
│       └── routes/            # ticket, user, global, activity, branding
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── components/        # sidebar, topbar, config/ (abas de Configurações)
│       ├── composables/       # useTheme (claro/escuro), useBranding (logo/empresa)
│       ├── controllers/       # Chamadas HTTP (ticket, user, global, activity, branding)
│       ├── pages/             # index, login, monitor, service, config, history, sorting
│       ├── router/            # Rotas + guard de navegação
│       ├── services/api.js    # Axios (token + tratamento de 401)
│       ├── stores/            # Pinia (auth)
│       ├── utils/             # Funções puras + callTicket.js
│       ├── socket.js          # Socket.io (público para escutar, autenticado para emitir)
│       └── main.js
├── data/                      # Logo importado (fora do git)
├── infra/
│   ├── standalone/            # Scripts para Windows sem Docker
│   └── docker/                # Compose + Dockerfiles + nginx
└── docs/
```
