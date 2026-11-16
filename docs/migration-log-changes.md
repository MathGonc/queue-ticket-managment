# Log de Mudanças da Migração

Registro completo de todas as alterações realizadas durante a migração do sistema de gerenciamento de senhas (Defensoria Pública da União - MS) de Vue 3.2 + Vue CLI para Vue 3.5 + Vite 6.

---

## 1. Dependências Atualizadas

| Dependência | Versão Anterior | Versão Nova | Observação |
|-------------|----------------|-------------|------------|
| vue | ^3.2.13 | ^3.5 | Composition API aprimorada, performance melhorada |
| vue-router | ^4.2.2 | ^4.5 | Melhorias de tipagem e performance |
| pinia | ^2.1.4 | ^2.3 | Melhorias de DX e estabilidade |
| axios | ^1.4.0 | ^1.7 | Correções de segurança e bugs |
| socket.io | ^4.7.1 | ^4.8.1 | Melhorias de estabilidade |
| socket.io-client | ^4.7.1 | ^4.8 | Compatibilidade com server ^4.8 |
| bootstrap | ^5.3.0 | ^5.3 | Mantida mesma major, atualização de patch |
| mongoose | ^7.3.2 | ^8.9.5 | Nova major com melhorias de performance e tipagem |
| express | ^4.18.2 | ^4.21.2 | Correções de segurança |
| bcrypt | ^5.1.0 | ^5.1.1 | Correção de bugs |
| jsonwebtoken | ^9.0.1 | ^9.0.2 | Correções de segurança |
| cors | ^2.8.5 | ^2.8.5 | Mantida (já atualizada) |
| maska | ^2.1.9 | ^3 | Nova major com API simplificada |
| @vuepic/vue-datepicker | ^5.4.0 | ^9 | Nova major com suporte Vue 3.5 |
| @vueuse/core | ^10.2.1 | ^12 | Nova major com composables aprimorados |
| vue-feather | ^2.0.0 | ^2 | Mantida mesma versão |
| vue-toastification | ^2.0.0-rc.5 | 2.0.0-rc.5 | Mantida (última versão compatível Vue 3) |
| nodemon | ^3.0.0 | ^3.1.9 | Atualização de minor |
| dotenv | ^16.3.1 | ^16.4.7 | Atualização de minor |

### Dependências Novas Adicionadas

| Dependência | Versão | Pacote | Motivo |
|-------------|--------|--------|--------|
| vite | ^6 | frontend (dev) | Substitui Vue CLI como build tool |
| @vitejs/plugin-vue | ^5 | frontend (dev) | Plugin oficial Vite para Vue |
| express-rate-limit | ^7.5.0 | backend | Rate limiting para proteção contra brute-force |

---

## 2. Dependências Removidas

| Dependência | Versão Anterior | Motivo da Remoção |
|-------------|----------------|-------------------|
| crypto-js | ^4.1.1 | Não utilizado em nenhum arquivo do projeto |
| body-parser | ^1.20.2 | Redundante — Express 4.16+ possui `express.json()` e `express.urlencoded()` built-in |
| mongodb | ^5.7.0 | Redundante — projeto usa Mongoose exclusivamente, driver direto não era necessário |
| core-js | ^3.8.3 | Desnecessário — target de browsers modernos (sem IE11) |
| crypto-browserify | ^3.12.0 | Polyfill do Vue CLI — desnecessário com separação frontend/backend |
| os-browserify | ^0.3.0 | Polyfill do Vue CLI — desnecessário com separação frontend/backend |
| path-browserify | ^1.0.1 | Polyfill do Vue CLI — desnecessário com separação frontend/backend |
| stream-browserify | ^3.0.0 | Polyfill do Vue CLI — desnecessário com separação frontend/backend |
| dotenv-webpack | ^8.0.1 | Substituído pelo handling nativo de variáveis de ambiente do Vite |
| @vue/cli-service | ~5.0.0 | Substituído pelo Vite |
| @vue/cli-plugin-babel | ~5.0.0 | Desnecessário — Vite usa esbuild nativamente |
| @vue/cli-plugin-eslint | ~5.0.0 | Removido nesta fase (ESLint flat config recomendado para futuro) |
| @vue/cli-plugin-router | ~5.0.0 | Desnecessário — vue-router configurado diretamente |
| @babel/core | ^7.12.16 | Desnecessário — Vite não usa Babel |
| @babel/eslint-parser | ^7.12.16 | Removido junto com ESLint nesta fase |
| eslint | ^7.32.0 | Removido nesta fase (recomendado reimplementar com flat config) |
| eslint-plugin-vue | ^8.0.3 | Removido nesta fase |

---

## 3. Mudanças Estruturais

### Arquitetura: Monolito → Separação Frontend/Backend

**Antes:** Um único `package.json` na raiz com todas as dependências (frontend + backend misturados). O servidor Express e a aplicação Vue compartilhavam o mesmo projeto.

**Depois:** Dois projetos independentes com `package.json` próprios:
- `frontend/` — Aplicação Vue 3.5 + Vite 6
- `backend/` — Servidor Express + Socket.io

### Arquivos Movidos e Renomeados

| Origem | Destino | Observação |
|--------|---------|------------|
| `src/` (componentes Vue) | `frontend/src/` | Reestruturado com composables |
| `server.js` (raiz) | `backend/server.js` | Refatorado com middleware de auth |
| `router.js` (raiz) | `backend/src/routes/*.js` | Separado em módulos por domínio |
| `src/db/models/` | `backend/src/models/` | Schemas mantidos idênticos |
| `src/db/userRoutes.js` | `backend/src/routes/userRoutes.js` | Adicionado CRUD completo |
| `src/db/ticketRoutes.js` | `backend/src/routes/ticketRoutes.js` | Bugs corrigidos |
| `src/db/globalRoutes.js` | `backend/src/routes/globalRoutes.js` | Sem alterações funcionais |
| `src/db/db.js` | `backend/src/config/db.js` | Variáveis de env atualizadas |
| `config/auth.config.js` | Removido | Chave JWT movida para variável de ambiente |
| `vue.config.js` | `frontend/vite.config.js` | Configuração Vite equivalente |
| `public/` | `frontend/public/` | Mantido sem alterações |

### Arquivos Novos Criados

| Arquivo | Propósito |
|---------|-----------|
| `frontend/src/services/api.js` | Instância Axios centralizada com interceptors |
| `frontend/src/socket.js` | Socket.io com autenticação no handshake |
| `frontend/src/router/guards.js` | Navigation guards com verificação de token |
| `frontend/src/composables/useTickets.js` | Lógica reutilizável de tickets |
| `frontend/src/composables/useGlobal.js` | Lógica reutilizável de configurações globais |
| `frontend/src/composables/useUsers.js` | Lógica reutilizável de CRUD de usuários |
| `frontend/src/controllers/userController.js` | Controller HTTP para usuários |
| `frontend/src/controllers/ticketController.js` | Controller HTTP para tickets |
| `frontend/src/controllers/globalController.js` | Controller HTTP para configurações |
| `backend/src/middleware/auth.js` | Middleware JWT de autenticação |
| `backend/src/middleware/rateLimit.js` | Rate limiting para login |
| `backend/src/config/index.js` | Configuração centralizada com validação |
| `legacy/` | Cópia completa do código pré-migração |

### Arquivos Removidos/Obsoletos

| Arquivo | Motivo |
|---------|--------|
| `config/auth.config.js` | Chave secreta hardcoded — movida para `.env` |
| `vue.config.js` | Substituído por `vite.config.js` |
| `babel.config.js` | Vite não usa Babel |
| `router.js` (raiz) | Rotas separadas em módulos no backend |

---

## 4. Bugs Corrigidos

### 4.1 Nome do Modelo Mongoose em `history.js`

**Problema:** O arquivo `src/db/models/history.js` registrava o modelo como `"User"` no Mongoose, conflitando com o modelo real de usuários (`user.js`).

**Solução:** Renomeado para `mongoose.model("History", HistorySchema)`.

**Impacto:** Evita conflito de nomes de modelo e erros silenciosos ao consultar histórico.

### 4.2 Variável `response` Não Declarada em `ticketRoutes.js`

**Problema:** No endpoint `PUT /updateTicketCalled/:id`, a variável `response` era usada sem declaração (`var`/`let`/`const`), causando vazamento para o escopo global.

**Solução:** Declarada com `const response = await Ticket.findByIdAndUpdate(...)`.

**Impacto:** Evita poluição do escopo global e comportamento imprevisível.

### 4.3 Erro "Headers Already Sent" no `/auth/verify`

**Problema:** O endpoint `/auth/verify` não utilizava `return` antes de `res.status(401)`, permitindo que o código continuasse executando após enviar uma resposta, causando o erro "Cannot set headers after they are sent to the client".

**Solução:** Adicionado `return` em todas as verificações (early-return pattern):
```javascript
if (!authHeader) {
  return res.status(401).json({ error: 'Unauthorized' })
}
```

**Impacto:** Elimina crashes do servidor por tentativa de enviar múltiplas respostas.

### 4.4 Acesso Não Autenticado Causando Erro no Backend

**Problema:** A `sidebar.vue` chamava `/auth/verify` incondicionalmente ao carregar, mesmo quando o usuário não estava autenticado (sem token). Isso gerava requisições desnecessárias e erros 401 no console.

**Solução:** Adicionada verificação de existência do token antes de chamar a API:
```javascript
if (auth.token) {
  const response = await checkToken()
  // ...
}
```

**Impacto:** Páginas públicas (monitor) carregam sem erros; reduz requisições desnecessárias ao backend.

### 4.5 Respostas de Erro Sem Corpo JSON

**Problema:** Alguns endpoints retornavam apenas `res.status(500)` sem corpo, dificultando o tratamento de erros no frontend.

**Solução:** Todas as respostas de erro agora incluem corpo JSON: `res.status(500).json({ error: "mensagem" })`.

**Impacto:** Frontend pode exibir mensagens de erro significativas ao usuário.

---

## 5. Funcionalidades Novas

### 5.1 CRUD Completo de Usuários

- **GET /api/users** — Listar todos os usuários (sem campo password)
- **PUT /api/users/:id** — Atualizar dados do usuário (com hash bcrypt se senha alterada)
- **DELETE /api/users/:id** — Excluir usuário (com proteção contra auto-exclusão)
- Interface de gerenciamento na página de configurações com tabela e formulário de edição
- Proteção por role: apenas administradores (role >= 3) podem gerenciar usuários

### 5.2 Middleware de Autenticação JWT

- Middleware reutilizável `authMiddleware` que valida token em todas as rotas protegidas
- Middleware `requireRole(minRole)` para controle de acesso baseado em função
- Chave JWT configurável via variável de ambiente `JWT_SECRET`
- Tempo de expiração configurável via `JWT_EXPIRES_IN` (padrão: 72h)
- Recusa de inicialização se `JWT_SECRET` não estiver definida

### 5.3 Autenticação no WebSocket

- Token JWT enviado no handshake do Socket.io (`auth: { token }`)
- Validação do token no middleware do Socket.io
- Conexões sem token permitidas em modo somente-leitura (monitor público)
- Eventos de controle (`signalUpdateValues`, `signalUpdateMonitor`, `signalUpdateMonitorConfigs`) restritos a conexões autenticadas

### 5.4 Rate Limiting

- Limitação de 5 tentativas de login por minuto por IP
- Resposta 429 com mensagem amigável em português
- Headers padrão de rate limit incluídos nas respostas

### 5.5 CORS Configurável

- Origens permitidas definidas via variável de ambiente `ALLOWED_ORIGINS`
- Rejeição de requisições de origens não autorizadas

### 5.6 Serviço HTTP Centralizado

- Instância Axios com baseURL configurada automaticamente
- Interceptor de request: adiciona token Bearer automaticamente
- Interceptor de response: limpa token e redireciona em caso de 401

### 5.7 Navigation Guards Aprimorados

- Verificação de token antes de chamar API de verificação
- Verificação de role para rotas protegidas
- Redirecionamento automático para login quando não autenticado

---

## 6. Breaking Changes

### 6.1 Prefixo de Variáveis de Ambiente

**Antes:** `VUE_APP_PORT_SERVER`, `VUE_APP_PORT_CLIENT`, `VUE_APP_URL`, etc.

**Depois:** `VITE_PORT_SERVER`, `VITE_PORT_CLIENT`, `VITE_URL`, etc.

**Ação necessária:** Atualizar todos os arquivos `.env` com o novo prefixo `VITE_`.

### 6.2 Separação de `package.json`

**Antes:** Um único `package.json` na raiz com `npm install` instalando tudo.

**Depois:** Dois `package.json` separados:
- `cd frontend && npm install` para dependências do frontend
- `cd backend && npm install` para dependências do backend

**Ação necessária:** Executar `npm install` em ambas as pastas.

### 6.3 Comandos de Desenvolvimento

| Antes | Depois |
|-------|--------|
| `npm run serve` (Vue CLI) | `cd frontend && npm run dev` (Vite) |
| `npm run dev` (nodemon na raiz) | `cd backend && npm run dev` (nodemon) |
| `npm run build` (Vue CLI) | `cd frontend && npm run build` (Vite) |

### 6.4 Configuração Docker

**Antes:** Um único `Dockerfile` para o monolito.

**Depois:** Dois Dockerfiles separados:
- `Dockerfile.frontend` — Multi-stage: Node 22 (build) + Nginx (produção)
- `Dockerfile.backend` — Node 22 com `npm ci --omit=dev`

**Ação necessária:** Usar `docker compose up` com o novo `docker-compose.yml`.

### 6.5 Acesso a Variáveis de Ambiente no Código

**Antes:** `process.env.VUE_APP_*`

**Depois:** `import.meta.env.VITE_*`

### 6.6 Mongoose 7 → 8

- `mongoose.set('strictQuery', false)` não é mais necessário (comportamento padrão alterado)
- Algumas opções de query depreciadas foram removidas
- Compatibilidade de dados mantida — nenhuma migration necessária

### 6.7 Autenticação Obrigatória para WebSocket

**Antes:** Qualquer cliente podia emitir eventos de controle via WebSocket.

**Depois:** Apenas conexões autenticadas podem emitir eventos de controle. Conexões sem token funcionam em modo somente-leitura.

---

## 7. Recomendações Futuras

### 7.1 Vitest — Framework de Testes

**Recomendação:** Adicionar Vitest como framework de testes unitários e de integração.

**Justificativa:** Integração nativa com Vite, API compatível com Jest, execução extremamente rápida, suporte a ESM nativo.

**Implementação sugerida:**
- Testes unitários para composables (`useTickets`, `useGlobal`, `useUsers`)
- Testes unitários para middleware de autenticação
- Testes unitários para funções utilitárias (`convertDate`, `calculateAge`)
- Testes de integração para rotas da API com `mongodb-memory-server`

### 7.2 ofetch — Cliente HTTP Moderno

**Recomendação:** Avaliar substituição do Axios por `ofetch` (do ecossistema UnJS/Nuxt).

**Justificativa:** Mais leve (~1KB vs ~13KB), suporte nativo a TypeScript, auto-parse de JSON, retry automático, funciona em Node.js e browser sem configuração.

**Quando migrar:** Em uma fase futura quando houver necessidade de refatorar os controllers HTTP.

### 7.3 ESLint Flat Config

**Recomendação:** Reimplementar ESLint com a nova configuração flat (`eslint.config.js`).

**Justificativa:** O formato `.eslintrc` está depreciado. A flat config é mais simples, explícita e performática.

**Plugins sugeridos:**
- `eslint-plugin-vue` (regras Vue 3)
- `@eslint/js` (regras JavaScript recomendadas)
- `eslint-plugin-security` (regras de segurança)

### 7.4 Avaliação de TypeScript

**Recomendação:** Avaliar adoção gradual de TypeScript em fases futuras.

**Análise:**

| Fator | Avaliação |
|-------|-----------|
| Tamanho do projeto | Pequeno (~15 arquivos de lógica) — overhead de TS pode ser desproporcional |
| Equipe | Se equipe pequena e familiarizada com JS, benefício é marginal |
| Complexidade | Lógica de negócio simples (CRUD, filas) — poucos tipos complexos |
| Manutenção | TypeScript brilha em projetos grandes com muitos contribuidores |
| Custo de migração | Médio — requer reescrever todos os arquivos + configurar tsconfig |

**Decisão atual:** Manter JavaScript com JSDoc para tipagem opcional. O overhead de TypeScript é desproporcional para o tamanho e complexidade deste projeto.

**Cenários onde TS valeria a pena:**
- Se o projeto crescer significativamente (>50 arquivos de lógica)
- Se a equipe de desenvolvimento aumentar (>3 pessoas)
- Se houver necessidade de APIs tipadas compartilhadas entre frontend e backend

**Abordagem gradual sugerida (se decidir adotar):**
1. Adicionar `tsconfig.json` com `allowJs: true`
2. Renomear arquivos gradualmente (`.js` → `.ts`)
3. Começar pelos modelos e interfaces da API
4. Tipar composables e stores por último

### 7.5 Alternativas ao Bootstrap

**Recomendação:** Avaliar alternativas ao Bootstrap para projetos futuros.

**Opções:**

| Alternativa | Vantagem | Desvantagem |
|-------------|----------|-------------|
| Tailwind CSS | Utility-first, tree-shaking excelente, bundle menor | Curva de aprendizado, HTML verboso |
| PrimeVue | Componentes Vue nativos, acessibilidade built-in | Bundle maior, menos flexível |
| Vuetify 3 | Material Design completo, boa DX | Pesado, opinionated |
| UnoCSS | Extremamente rápido, compatível com Tailwind | Menos maduro, comunidade menor |

**Decisão atual:** Manter Bootstrap 5. O projeto já tem todo o HTML/CSS implementado com Bootstrap e a migração visual não faz parte do escopo atual. Trocar framework CSS exigiria reescrever todo o HTML.

### 7.6 Testes E2E

**Recomendação:** Adicionar testes end-to-end com Cypress ou Playwright.

**Fluxos prioritários para testar:**
1. Login → Triagem → Atendimento → Monitor
2. CRUD de usuários (criar, editar, excluir)
3. Fluxo de senha: emissão → chamada → atendimento → histórico

### 7.7 Monitoramento e Observabilidade

**Recomendação:** Adicionar logging estruturado e health checks.

**Sugestões:**
- `pino` para logging estruturado no backend (JSON logs)
- Endpoint `/health` para verificação de saúde do serviço
- Métricas básicas de requisições (tempo de resposta, taxa de erro)

---

## Resumo da Migração

| Métrica | Valor |
|---------|-------|
| Dependências removidas | 14 pacotes |
| Dependências atualizadas | 18 pacotes |
| Dependências novas | 3 pacotes |
| Bugs corrigidos | 5 |
| Funcionalidades novas | 7 |
| Breaking changes | 7 |
| Arquivos movidos/renomeados | ~25 |
| Arquivos novos criados | ~15 |
| Compatibilidade de dados | 100% mantida |

---

*Documento gerado como parte da migração Vue 3.2 + Vue CLI → Vue 3.5 + Vite 6 do sistema de gerenciamento de senhas.*

---

## 8. Melhorias Pós-Migração (v2.1)

As seguintes melhorias foram implementadas após a migração principal:

### 8.1 Vitest — Testes Unitários

- Adicionado `vitest`, `@vue/test-utils` e `happy-dom` como devDependencies
- Configuração de teste adicionada ao `vite.config.js` (environment: happy-dom)
- Testes criados para:
  - `src/utils/index.js` — convertDate, convertHours, isValidDate, calculateAge
  - `src/stores/auth.js` — setToken, clearToken, setUserData, getters
- Scripts: `"test": "vitest run"`, `"test:watch": "vitest"`

### 8.2 ESLint Flat Config

- Criado `frontend/eslint.config.js` usando formato flat config (ESLint 9+)
- Instalados `eslint`, `eslint-plugin-vue`, `@eslint/js`
- Configurado para Vue 3 + ES modules
- Script: `"lint": "eslint src/"`

### 8.3 Lazy Loading de Rotas

- Todas as páginas usam dynamic imports: `() => import('@/pages/...')`
- Exceções (imports estáticos): `sidebar.vue` (layout wrapper) e `login.vue` (primeira página)
- Reduz bundle inicial e melhora tempo de carregamento

### 8.4 Health Check Endpoint

- `GET /health` retorna status do servidor e conexão MongoDB
- Campos: `status`, `timestamp`, `uptime`, `mongodb` (connected/disconnected)
- Usa `mongoose.connection.readyState` para verificar estado do banco

### 8.5 Paginação Server-Side no Histórico

- Endpoint `GET /loadTicketHistory` aceita: `page`, `limit`, `search`, `startDate`, `endDate`, `sortField`, `sortOrder`
- Retorna: `{ ticket, pagination: { page, limit, total, pages }, stats }`
- Frontend usa paginação server-side com debounce na busca
- Compatibilidade mantida: sem parâmetros retorna primeira página com 50 itens

### 8.6 Refresh Token

- Endpoint `POST /auth/refresh` emite novo token com expiração renovada
- Função `refreshToken()` no frontend `userController.js`
- Interceptor Axios com auto-refresh: em caso de 401, tenta refresh antes de limpar sessão
- Queue de requisições pendentes durante refresh para evitar múltiplas tentativas

### 8.7 Validação de Input no Backend

- Instalado `express-validator`
- Middleware reutilizável em `backend/src/middleware/validate.js`
- Validações aplicadas em: `/register`, `/login`, `/insertTicket`, `/api/users/:id`
- Retorna erros 400 com detalhes dos campos inválidos

### 8.8 Logs Estruturados com Pino

- Instalados `pino` e `pino-pretty` (dev)
- Logger configurado em `backend/src/config/logger.js`
- Todos os `console.log`/`console.error` substituídos por `logger.info`/`logger.error`
- `pino-pretty` ativado automaticamente em desenvolvimento (NODE_ENV !== 'production')
- Middleware de request logging: método, URL, status, tempo de resposta

### 8.9 Notificação de Desconexão WebSocket

- Handlers de disconnect/reconnect no `publicSocket` em `frontend/src/socket.js`
- Toast warning "Conexão com o servidor perdida" ao desconectar
- Toast success "Conexão restabelecida!" ao reconectar
- Debounce via flag para evitar spam em conexões instáveis

### 8.10 Confirmação Visual de Senha Chamada

- Classe `.ticket-called` com animação de pulso verde na sidebar
- `lastCalledTicketId` ref reativa que limpa após 3 segundos
- Animação CSS `callPulse` com box-shadow verde

### Dependências Adicionadas nesta Fase

| Dependência | Versão | Pacote | Motivo |
|-------------|--------|--------|--------|
| vitest | ^3.1.0 | frontend (dev) | Framework de testes unitários |
| @vue/test-utils | ^2.4.6 | frontend (dev) | Utilitários de teste Vue |
| happy-dom | ^17.4.4 | frontend (dev) | DOM environment para testes |
| eslint | ^9.21.0 | frontend (dev) | Linter JavaScript |
| @eslint/js | ^9.21.0 | frontend (dev) | Regras base ESLint |
| eslint-plugin-vue | ^9.32.0 | frontend (dev) | Regras Vue para ESLint |
| express-validator | ^7.2.1 | backend | Validação de input |
| pino | ^9.6.0 | backend | Logging estruturado |
| pino-pretty | ^13.0.0 | backend (dev) | Formatação de logs em dev |

---

## 9. Revisão pós-migração (branch `vue-migration`)

A migração acima foi gerada por IA e revisada comparando com o código original (commit `a1f4cb6`). Os commits seguintes ao snapshot `4b0db4a` corrigem o que estava quebrado ou descrito de forma imprecisa neste documento.

### 9.1 Regressões introduzidas pela migração (corrigidas)

| Problema | Impacto | Correção |
|----------|---------|----------|
| maska 2 → 3 mudou a API: `v-maska="obj"` passou a ser lido como opções | **CPF salvo vazio em toda senha nova** (sem erro visível) | Dígitos extraídos do valor mascarado (`onlyDigits`) + teste |
| Upsert do documento global removido do `db.js` | Banco novo não emitia senha (404/500) | `ensureGlobalConfig()` no startup |
| `VITE_URL=http://localhost` gravado no build de produção | Outras máquinas chamavam o próprio localhost | URL do backend derivada do host do navegador |
| `ALLOWED_ORIGINS=http://localhost:8080` | CORS bloqueava o frontend servido em outra porta/IP | Vazio = qualquer origem (auth é por header) |
| Logger exigia `pino-pretty` (devDependency) fora de produção | Backend do Docker (`--omit=dev`) não subia | Usa pino-pretty só se instalado; `NODE_ENV=production` na imagem |
| `showTicketNumber` com default `true` | Painel voltaria a mostrar o número | Default `false` (comportamento de produção) |
| Logo do PDF fixa no caminho do build do Vue CLI | Logo quebrada no relatório | Asset importado pelo Vite |
| Guard de rotas reescrito | Perdeu `SYSTEM_AUTH=0`, validação no servidor e toasts | Comportamento original restaurado |
| Validação nova no backend sem mensagem no frontend | Qualquer erro aparecia como "Este usuário já existe" | Mensagens em português exibidas |
| Busca do histórico por regex crua | Não achava pelo número; caracteres especiais davam 500 | Busca por número, regex escapada, ordenação validada |

### 9.2 Itens marcados como feitos que não estavam

- **"Middleware de autenticação em todas as rotas protegidas" (7.4):** só `/api/users` exigia login. Fila, histórico, reset de senhas, configurações e `/register` estavam abertos para qualquer pessoa na rede. Agora todas as rotas exigem login e o cargo adequado (ver `docs/documentation.md`). O primeiro admin é criado por `npm run create-admin`.
- **"Refresh token com auto-refresh no 401" (8.6):** não funcionava (refresh exige token válido). Substituído por renovação preventiva a cada 1h.
- **"Socket autenticado":** o token era capturado na criação do socket; depois de relogar, os sinais podiam ser descartados em silêncio. O token agora é lido a cada handshake.
- **Segurança do token:** o JWT e a resposta do login carregavam o hash da senha. Removido.

### 9.3 Pendência original resolvida

- **"Às vezes ao dar F5 não aparecem opções que dependem de cargo":** o cargo era lido uma vez no `mounted` da sidebar, antes da verificação do token terminar. Agora é `computed` do store, e o guard carrega os dados do usuário antes de abrir a tela.

### 9.4 Limpeza

- Removidos: composables não usados, pasta `legacy/` (o original está no git: `git show a1f4cb6:<arquivo>`), teste duplicado, `nginx.conf` com 160 linhas de proxy nunca usado.
- ESLint voltou ao perfil do projeto original (`vue3-essential`): de 375 avisos de formatação para 0.
- `.env` fora do git; modelos em `*.env.example`.
- Infra reorganizada em `infra/standalone` (Windows sem Docker) e `infra/docker`.
