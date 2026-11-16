# Queue Ticket Management

Sistema de gerenciamento de filas e senhas para atendimento, com painel monitor em tempo real, triagem, atendimento por guichê e histórico.

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Vue 3.5 + Vite 6, Pinia, Vue Router, Socket.io Client |
| Backend | Express 4.21, Mongoose 8, Socket.io 4.8 |
| Banco de dados | MongoDB 7 |
| Infraestrutura | Docker, Nginx |
| Segurança | JWT, bcrypt, CORS, Rate Limiting |

## Quick Start

### Desenvolvimento

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (outro terminal)
cd frontend
npm install
npm run dev
```

O frontend estará em `http://localhost:8080` e o backend em `http://localhost:3030`.

### Produção (Docker)

```bash
docker compose up --build
```

Os serviços sobem na ordem: MongoDB → Backend → Frontend (porta 80).

## Estrutura do Projeto

```
├── frontend/          # Vue 3.5 + Vite 6 (SPA)
├── backend/           # Express + Socket.io (API REST + WebSocket)
├── legacy/            # Cópia do código pré-migração (referência)
├── docs/              # Documentação do projeto
├── docker-compose.yml
├── Dockerfile.frontend
└── Dockerfile.backend
```

## Documentação

- [**migration-instructions.md**](./docs/migration-instructions.md) — Como usar o projeto: pré-requisitos, setup, variáveis de ambiente, rollback
- [**migration-log-changes.md**](./docs/migration-log-changes.md) — Log de mudanças: dependências, bugs corrigidos, breaking changes
- [**documentation.md**](./docs/documentation.md) — Documentação técnica: arquitetura, endpoints da API, estrutura de pastas

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
