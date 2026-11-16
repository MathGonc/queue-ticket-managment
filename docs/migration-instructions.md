# Instruções de Migração — Sistema de Gerenciamento de Senhas

Este documento descreve como configurar, executar e manter o projeto após a reestruturação (Vue 3.5 + Vite 6 com separação frontend/backend).

---

## 1. Pré-requisitos

| Ferramenta | Versão Mínima | Observação |
|------------|---------------|------------|
| Node.js    | 22.x          | Recomendado usar a versão LTS mais recente |
| npm        | 10.x          | Incluído com Node.js 22 |
| Docker     | 24.x          | Necessário apenas para produção |
| Docker Compose | 2.x       | Incluído no Docker Desktop |
| MongoDB    | 7.x           | Usado via container Docker ou instalação local |

### Instalação do Node.js

Baixe a versão 22 LTS em [nodejs.org](https://nodejs.org/) ou use um gerenciador de versões como `nvm`:

```bash
nvm install 22
nvm use 22
```

### Instalação do Docker (produção)

Baixe o Docker Desktop em [docker.com](https://www.docker.com/products/docker-desktop/) e certifique-se de que o Docker Compose v2 está habilitado.

---

## 2. Setup de Desenvolvimento

### 2.1 Instalar dependências

Na raiz do projeto, instale as dependências de cada módulo separadamente:

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2.2 Configurar variáveis de ambiente

**Backend** — edite `backend/.env`:

```env
DB_IP=localhost:27017
DB_NAME=gonc-queue-manager
DB_USER=admin
DB_PASS=admin
PORT=3030
CLIENT_URL=http://localhost:8080
JWT_SECRET=sua-chave-secreta-aqui
JWT_EXPIRES_IN=72h
ALLOWED_ORIGINS=http://localhost:8080
```

> **Importante:** Em desenvolvimento local (sem Docker), altere `DB_IP` de `mongodb:27017` para `localhost:27017`, pois o hostname `mongodb` só funciona dentro da rede Docker.

**Frontend** — o arquivo `frontend/.env` já vem configurado para desenvolvimento:

```env
VITE_PORT_SERVER=3030
VITE_PORT_CLIENT=8080
VITE_URL=http://localhost
VITE_DEV=0
VITE_SYSTEM_AUTH=1
```

### 2.3 Iniciar o MongoDB localmente

Se não estiver usando Docker, inicie o MongoDB manualmente:

```bash
mongod --auth --port 27017
```

Ou use o container isolado:

```bash
docker run -d --name mongo-dev -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=admin \
  mongo:7
```

### 2.4 Iniciar o Backend

```bash
cd backend
npm run dev
```

O servidor inicia na porta 3030 com hot-reload via nodemon.

### 2.5 Iniciar o Frontend

```bash
cd frontend
npm run dev
```

O Vite inicia o servidor de desenvolvimento na porta 8080 com hot-module-replacement (HMR).

### 2.6 Acessar o sistema

- **Aplicação:** http://localhost:8080
- **API Backend:** http://localhost:3030
- **Monitor (público):** http://localhost:8080/monitor

---

## 3. Setup de Produção com Docker

### 3.1 Configurar variáveis de ambiente

Certifique-se de que o arquivo `backend/.env` está configurado para produção:

```env
DB_IP=mongodb:27017
DB_NAME=gonc-queue-manager
DB_USER=admin
DB_PASS=SENHA_SEGURA_AQUI
PORT=3030
CLIENT_URL=http://SEU_IP_OU_DOMINIO
JWT_SECRET=CHAVE_FORTE_ALEATORIA_AQUI
JWT_EXPIRES_IN=72h
ALLOWED_ORIGINS=http://SEU_IP_OU_DOMINIO
```

> **Segurança:** Em produção, altere `DB_USER`, `DB_PASS` e `JWT_SECRET` para valores seguros e únicos.

### 3.2 Build e execução

Na raiz do projeto:

```bash
docker compose up -d --build
```

Isso irá:
1. Criar o container MongoDB 7 com volume persistente
2. Fazer build do backend (Node.js 22 Alpine)
3. Fazer build do frontend (Vite build + Nginx)
4. Iniciar todos os serviços com restart automático

### 3.3 Verificar status

```bash
docker compose ps
docker compose logs -f
```

### 3.4 Parar os serviços

```bash
docker compose down
```

> **Nota:** Os dados do MongoDB são persistidos no volume `mongodb_data`. Para remover os dados também, use `docker compose down -v`.

### 3.5 Portas expostas

| Serviço   | Porta | Descrição |
|-----------|-------|-----------|
| Frontend  | 80    | Aplicação web (Nginx) |
| Backend   | 3030  | API REST + WebSocket |
| MongoDB   | 27017 | Banco de dados (acesso interno) |

---

## 4. Variáveis de Ambiente

### 4.1 Backend (`backend/.env`)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DB_IP` | Host e porta do MongoDB | `mongodb:27017` (Docker) ou `localhost:27017` (local) |
| `DB_NAME` | Nome do banco de dados | `gonc-queue-manager` |
| `DB_USER` | Usuário de autenticação do MongoDB | `admin` |
| `DB_PASS` | Senha de autenticação do MongoDB | `admin` |
| `PORT` | Porta do servidor Express | `3030` |
| `CLIENT_URL` | URL do frontend (usado para CORS) | `http://localhost:8080` |
| `JWT_SECRET` | Chave secreta para assinatura de tokens JWT | Valor aleatório e seguro |
| `JWT_EXPIRES_IN` | Tempo de expiração do token JWT | `72h` |
| `ALLOWED_ORIGINS` | Origens permitidas no CORS (separadas por vírgula) | `http://localhost:8080` |

### 4.2 Frontend (`frontend/.env` e `frontend/.env.production`)

| Variável | Descrição | Dev | Produção |
|----------|-----------|-----|----------|
| `VITE_PORT_SERVER` | Porta do backend | `3030` | `3030` |
| `VITE_PORT_CLIENT` | Porta do frontend | `8080` | `80` |
| `VITE_URL` | URL base do servidor | `http://localhost` | `http://localhost` |
| `VITE_DEV` | Modo de desenvolvimento (0=não, 1=sim) | `0` | `0` |
| `VITE_SYSTEM_AUTH` | Habilitar autenticação (0=desabilitado, 1=habilitado) | `1` | `1` |

### 4.3 Docker Compose (`.env` na raiz — legado)

O arquivo `.env` na raiz contém variáveis no formato antigo (`VUE_APP_*`) e é utilizado pelo `docker-compose.yml` para referência de `DB_USER` e `DB_PASS`. Em novas instalações, configure diretamente no `backend/.env`.

---

## 5. Rollback (Reverter para Código Legado)

Caso seja necessário reverter para a versão anterior do sistema (Vue 3.2 + Vue CLI), siga os passos:

### 5.1 Estrutura de referência

O código original completo está preservado na pasta `legacy/`:

```
legacy/
├── src/           # Código-fonte original (componentes, rotas, db)
├── config/        # Configuração de autenticação
├── public/        # Arquivos estáticos
├── server.js      # Servidor Express original (monolítico)
├── router.js      # Rotas Vue Router originais
├── package.json   # Dependências originais
├── vue.config.js  # Configuração Vue CLI
├── babel.config.js
├── jsconfig.json
└── README.md      # Explicação sobre a pasta legacy
```

### 5.2 Procedimento de rollback

1. **Parar os serviços atuais:**
   ```bash
   docker compose down
   ```

2. **Restaurar os arquivos originais:**
   ```bash
   # Copiar arquivos da pasta legacy para a raiz
   cp legacy/server.js ./server.js
   cp legacy/router.js ./router.js
   cp legacy/package.json ./package.json
   cp legacy/vue.config.js ./vue.config.js
   cp legacy/babel.config.js ./babel.config.js
   cp legacy/jsconfig.json ./jsconfig.json
   cp -r legacy/src ./src
   cp -r legacy/config ./config
   cp -r legacy/public ./public
   ```

3. **Restaurar o `.env` original (formato `VUE_APP_*`):**
   O arquivo `.env` na raiz do projeto ainda contém as variáveis no formato antigo.

4. **Instalar dependências originais:**
   ```bash
   npm install
   ```

5. **Iniciar o sistema legado:**
   ```bash
   npm run serve   # Frontend (Vue CLI)
   node server.js  # Backend (mesmo processo ou separado)
   ```

### 5.3 Observações sobre rollback

- O banco de dados **não precisa de alteração** — os dados são compatíveis em ambas as versões.
- O Docker Compose antigo (se existia) precisará ser restaurado separadamente.
- Recomenda-se testar o rollback em ambiente de homologação antes de aplicar em produção.

---

## 6. Compatibilidade com Dados Existentes

### 6.1 Nenhuma migração de banco é necessária

O banco de dados MongoDB permanece **100% compatível** entre a versão legada e a nova versão. Não há necessidade de executar scripts de migração, alterar coleções ou modificar documentos existentes.

### 6.2 Coleções mantidas

| Coleção | Descrição | Alteração |
|---------|-----------|-----------|
| `users` | Usuários do sistema (login, senha, role, guichê) | Nenhuma |
| `tickets` | Senhas ativas na fila | Nenhuma |
| `histories` | Histórico de senhas atendidas | Nenhuma |
| `globals` | Configurações globais (monitor, contadores) | Nenhuma |

### 6.3 Schemas Mongoose

Os schemas Mongoose (`backend/src/models/`) mantêm exatamente os mesmos campos, tipos e nomes da versão anterior:

- **user.js:** `name`, `login`, `password`, `role`, `guiche`
- **ticket.js:** `position`, `name`, `date`, `birthDate`, `age`, `preferential`, `called`, `guiche`, `callName`
- **history.js:** `position`, `name`, `date`, `birthDate`, `age`, `preferential`, `guiche`, `callName`, `dateOut`
- **global.js:** `lastTicket`, `monitorTitle`, `monitorMessage`, `monitorLogo`

### 6.4 Garantias de compatibilidade

- Os nomes dos campos no banco **não foram alterados**.
- Os tipos de dados **permanecem idênticos**.
- Os índices existentes **continuam funcionando**.
- Dados inseridos pela versão legada **são lidos normalmente** pela nova versão e vice-versa.
- É possível alternar entre versões sem perda de dados.

---

## Resumo de Comandos

| Ação | Comando |
|------|---------|
| Instalar dependências (backend) | `cd backend && npm install` |
| Instalar dependências (frontend) | `cd frontend && npm install` |
| Iniciar backend (dev) | `cd backend && npm run dev` |
| Iniciar frontend (dev) | `cd frontend && npm run dev` |
| Build frontend (produção) | `cd frontend && npm run build` |
| Iniciar backend (produção) | `cd backend && npm start` |
| Subir tudo com Docker | `docker compose up -d --build` |
| Parar Docker | `docker compose down` |
| Ver logs Docker | `docker compose logs -f` |
