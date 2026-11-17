# Queue Ticket Management

Sistema de gerenciamento de filas e senhas para atendimento, com painel monitor em tempo real, triagem, atendimento por guichê e histórico.

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Vue 3.5 + Vite 8, Pinia 4, Vue Router 5, Socket.io Client, Bootstrap 5 |
| Backend | Node.js 22+, Express 5, Mongoose 9, Socket.io 4 |
| Banco de dados | MongoDB 7 |
| Segurança | JWT por cargo, bcrypt, rate limit no login |

## Como subir

Ver **[infra/README.md](infra/README.md)**:

- **[Standalone](infra/standalone/README.md)**: Windows sem Docker, cada processo numa janela (`setup.cmd` e depois `start-all.cmd`).
- **[Docker](infra/docker/README.md)**: `docker compose up -d --build` em `infra/docker`.

### Desenvolvimento

```bash
cd backend  && npm install && npm run dev    # API em :3030 (copie backend/.env.example para .env)
cd frontend && npm install && npm run dev    # http://localhost:8080
```

Testes:

- Frontend: `npm test` e `npm run lint` (em `frontend/`).
- Backend: `npm test` (em `backend/`): testes de ponta a ponta da API e do tempo real. Sobe o backend num banco temporário, apagado no fim; precisa de um MongoDB local (`infra\standalone\start-mongo.cmd`).

## Estrutura do Projeto

```
├── frontend/   # Vue 3.5 + Vite 8 (SPA)
├── backend/    # Express + Socket.io (API REST + WebSocket)
├── infra/      # standalone (Windows) e docker
└── docs/       # Documentação técnica e log da migração
```

## Documentação

- [docs/documentation.md](docs/documentation.md): arquitetura, cargos, endpoints e permissões
- [docs/migration-log-changes.md](docs/migration-log-changes.md): migração Vue CLI → Vite e a revisão pós-migração (seção 9)
- [docs/new-features.md](docs/new-features.md): testes, lint, health check, paginação, validação, logs

## Páginas do Sistema

| Página | Descrição |
|--------|-----------|
| Monitor | Exibe a senha atual e anterior com seus guichês |
| Triagem | Cadastro de novas senhas na fila |
| Atendimento | Chamada da próxima senha pelo guichê |
| Histórico | Consulta de senhas atendidas com filtros e exportação PDF |
| Configurações | Gerenciamento de usuários, configurações do monitor |

## Autor

Projeto desenvolvido para a Defensoria Pública da União - MS.

## Licença

Uso interno.
