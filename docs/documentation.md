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
| GET | `/loadTicketsInQueue` | Senhas dos últimos 7 dias (fila + atendidas), com a pessoa (`name`, `docNumber`, `assistedAge`, vindos do cadastro) e as `visitas` | Login |
| GET | `/loadTicket/:id` | Buscar senha por ID (com a pessoa e as anotações) | Login |
| PUT | `/updateTicketCalled/:id` | Marcar senha como chamada (só grava `status`, `servicedBy`, `dateServiced`, `servicedTable`) | Login |
| POST | `/insertTicket` | Emitir senha: `assistidoId` (pessoa escolhida) ou `cpf`/`nome`/`nascimento` (pessoa nova), `type` (tipo oficial), `notaTriagem`. CPF com 2+ cadastros = 409 (pendência) | Atendente |
| PUT | `/tickets/:id/notaAtendimento` | Anotação do atendimento (painel de atendimento) | Atendente |
| GET | `/loadTicketHistory` | Histórico paginado (`page`, `limit`, `search`, `startDate`, `endDate`, `sortField`, `sortOrder`). A busca procura também no nome/CPF do cadastro e nas anotações | Atendente |
| DELETE | `/deleteTicket/:id` | Excluir senha: **só oculta** (grava `deletedAt` e `deletedBy`; continua no banco) | Admin |

### Assistidos (`assistidoRoutes`)

| Método | Rota | Descrição | Acesso |
|--------|------|-----------|--------|
| GET | `/assistidos/sugestoes?cpf=` ou `?nome=` | Sugestões enquanto digita (3+ dígitos/letras): CPF pelo começo; nome por palavras, sem acento. Até 8, com as pendências | Atendente |
| GET | `/assistidos/triagem?id=`, `?cpf=` ou `?nome=` | Candidatos (cadastros da pessoa, do CPF ou do nome exato) com visitas e pendências, e as senhas de hoje (aviso de duplicidade) | Atendente |
| POST | `/assistidos/resolver` | "Confirmar" do bloco de pendências: `{ manterId?, juntarIds?, nome, cpf \| semCpf }`. Junta os cadastros indicados e os do mesmo CPF | Atendente |

### Sistema (`systemRoutes`)

| Método | Rota | Descrição | Acesso |
|--------|------|-----------|--------|
| GET | `/tiposAtendimento` | Tipos de atendimento em uso (os de Configurações; sem eles, a lista padrão) | Login |
| PUT | `/tiposAtendimento` | Salvar a lista: `{ tipos, renomear: [{ de, para }] }`. Renomear troca o tipo também nas senhas antigas; avisa as triagens abertas | Admin |
| GET | `/api/status` | Status da página inicial: usuários conectados (com login, cada um conta uma vez) e monitor OK (alguma tela do monitor aberta sem parar há mais de 1 minuto, `PANEL_OK_MS`) | Admin |

## Assistidos (pessoas)

O ticket é uma **visita**: guarda só o `assistidoId`, o tipo oficial e as anotações (`notaTriagem`, `notaAtendimento`). Nome, CPF e nascimento ficam no **assistido** (coleção `assistidos`). As rotas devolvem `name`/`docNumber`/`assistedAge` calculados a partir do cadastro. Os campos antigos dos tickets ficaram como `legacy_name`, `legacy_docNumber` e `legacy_assistedAge`, sem uso no sistema.

- **Chave:** o `_id` do assistido. Para encontrar a pessoa na triagem, nesta ordem: **CPF → nome + nascimento → só o nome** (este nunca junta sozinho: a triagem confirma).
- **CPF:** opcional, mas tem que ser escolhido: válido (dígito verificador conferido) ou "Sem CPF" marcado. O mesmo CPF pode ter mais de um cadastro enquanto há dúvida.
- **Pendências** ("Para resolver antes da triagem", travam a emissão até confirmar): CPF com 2+ cadastros (a triagem escolhe o nome certo e os outros são juntados a ele), CPF inválido no cadastro (corrigir ou marcar "Sem CPF") e nome a confirmar (cadastros sem CPF juntados pelo nome). Cadastro juntado fica com `mescladoEm` (não é apagado) e os tickets passam para o escolhido com "Registrado como: NOME" na anotação.
- **Triagem em duas partes**, separadas por uma divisória: dados da pessoa (CPF, nome, nascimento) e atendimento (tipo, anotação, preferencial, emissão). Pessoa nova: tudo liberado e "Cadastrar senha" salva tudo. Pessoa já cadastrada: CPF e nome ficam travados, com lápis (editar) e "x" (trocar a pessoa); qualquer dado alterado mostra "Confirmar dados" acima da divisória, e o atendimento só libera depois de confirmar ou desfazer. O tipo de atendimento aceita busca digitando ou a lista inteira.
- **Visitas** = dias com atendimento (duas senhas no mesmo dia contam uma visita). Aparecem no aviso azul da triagem e no (i) da barra lateral e do histórico ("3ª de 7 visitas"), junto com as anotações.
- **Nome:** sempre em maiúsculas. Recados escritos no nome ("(QUER FALAR COM...)", "- THIAGO") vão para a anotação da triagem.
- **Nascimento:** guardado só como dia (12:00 UTC, o mesmo dia em qualquer fuso do Brasil). Alterado na triagem = correção do cadastro.
- **Tipos oficiais:** lista em `backend/src/tipos.js` (e `frontend/src/utils/tipos.js`). Texto livre de uma tela antiga vira o tipo mais próximo (ou OUTROS) e o texto vai para a anotação.
- **Senhas excluídas** ficam ocultas: somem da fila, do histórico, das estatísticas e das visitas.
- **Migração** dos tickets antigos: `npm run migrate-assistidos` (simulação + listas das pendências criadas em `data/`) e `-- --apply` para gravar; só mexe em tickets sem `assistidoId`. Para voltar ao código antigo: `npm run rollback-assistidos -- --confirm` (devolve `name`/`docNumber`/`assistedAge` aos tickets).

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
│   ├── scripts/               # create-admin, backup-db, restore-db, migrate-assistidos, rollback-assistidos
│   └── src/
│       ├── config/            # Variáveis de ambiente, conexão DB, logger
│       ├── middleware/        # auth (JWT/cargos), rateLimit, validate
│       ├── models/            # Mongoose schemas (ticket, assistido, user, global, activity)
│       ├── assistidos.js      # Regras dos assistidos (nome, nascimento, vinculo, visitas)
│       ├── cpf.js             # Validacao de CPF
│       ├── tipos.js           # Tipos de atendimento oficiais
│       └── routes/            # ticket, assistido, user, global, activity, branding
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
├── data/                      # Logo importado e listas da migracao (fora do git)
├── infra/
│   ├── standalone/            # Scripts para Windows sem Docker
│   └── docker/                # Compose + Dockerfiles + nginx
└── docs/
```
