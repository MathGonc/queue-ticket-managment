# Modo standalone (Windows, sem Docker)

Roda tudo direto no Windows (10 ou 11), sem virtualização. São três processos, cada um na sua janela:

| Janela | Script | Porta |
|--------|--------|-------|
| QTM - MongoDB | `start-mongo.cmd` (ou o serviço do Windows, se existir) | 27017 (só local) |
| QTM - Backend | `start-backend.cmd` | 3030 |
| QTM - Frontend | `start-frontend.cmd` | 8080 |

Todos os `.cmd` podem ser abertos com duplo clique e não dependem da ExecutionPolicy do Windows.

## Pré-requisitos

- **Node.js 22 LTS** (mínimo 20): https://nodejs.org
- **MongoDB**, em uma destas formas:
  - instalado como serviço do Windows: é o único usado. Se estiver parado, o `start-mongo` tenta iniciar o serviço e **nunca** sobe outro `mongod`;
  - instalado sem serviço: o script acha o `mongod.exe` em `C:\Program Files\MongoDB\Server\<versão>\bin`;
  - **portátil**: extraia o zip oficial (MongoDB Community, "Windows x64", formato zip) de modo que exista `infra\standalone\mongodb\bin\mongod.exe`. Só o `mongod.exe` é necessário; essa pasta não vai para o git.
- Acesso ao registro do npm na primeira instalação (o `setup` roda `npm ci`).

## Primeira instalação

1. `setup.cmd`
   - instala as dependências do backend e do frontend;
   - cria `backend\.env` com um `JWT_SECRET` aleatório e `infra\standalone\.env`;
   - gera o build do frontend.
2. Revise `infra\standalone\.env`. O ponto principal é **`MONGO_DBPATH`**: aponte para a pasta onde estão os dados atuais, senão o MongoDB começa vazio. O padrão `C:\data\db` é o mesmo do `mongod` rodado sem parâmetros.
3. Se o MongoDB exige usuário e senha, preencha `DB_USER` e `DB_PASS` em `backend\.env`.
4. **Banco novo?** O `start-mongo` não cria a pasta de dados sozinho, para nunca abrir um banco vazio por engano. Na primeira instalação, rode uma vez `start-mongo.cmd -NovoBanco`. Depois crie o administrador com `create-admin.cmd`. O cadastro pela tela exige um admin logado. Com o banco atual de produção isso não é necessário, porque os usuários já existem.
5. `start-all.cmd`

6. **Início automático** (recomendado): `install-autostart.cmd` cria a tarefa agendada "QTM - Sistema de Senhas", que roda o `start-all` 30 s depois do logon do usuário. Ela também permite subir o sistema remotamente (por SSH as janelas não aparecem na tela): `install-autostart.cmd -Executar`.

O `start-all` abre as três janelas na ordem certa (banco → backend → frontend), espera cada um responder e no final mostra o status e os endereços para acessar pela rede.

### Firewall

As outras máquinas precisam alcançar as portas **8080** (telas) e **3030** (API/tempo real). Em um PowerShell **como administrador**:

```powershell
New-NetFirewallRule -DisplayName "Sistema de Senhas" -Direction Inbound -Protocol TCP -LocalPort 8080,3030 -Action Allow
```

## Uso diário

| Ação | Como |
|------|------|
| Subir tudo | `start-all.cmd` (o que já estiver rodando é mantido) |
| Ver se está tudo no ar | `status.cmd` |
| Parar | `stop-all.cmd` (fecha backend e frontend; o banco continua) |
| Subir só uma parte | `start-mongo.cmd`, `start-backend.cmd`, `start-frontend.cmd` |

Se o backend ou o frontend caírem, a própria janela reinicia o processo em 5 segundos.

## Atualizar o código

1. `stop-all.cmd`
2. Atualize o código (`git pull`).
3. `setup.cmd` (reinstala dependências e refaz o build).
4. `start-all.cmd`

Se você esquecer o passo 3, o `start-frontend` percebe que o código mudou e refaz o build sozinho. Mas dependências novas só entram com o `setup`.

## Migrando da versão antiga (Vue CLI)

- **Feche as janelas antigas** (`npm run serve` e `nodemon`). Elas usam as mesmas portas 8080 e 3030.
- O banco é o mesmo: coleções e campos não mudaram.
- Todos precisam fazer login de novo uma vez, porque a chave dos tokens mudou.
- O `.env` antigo da raiz (`VUE_APP_*`) não é mais usado. A configuração agora fica em `backend\.env`.

## Configuração

`infra\standalone\.env` (modelo: `.env.example`):

| Variável | Padrão | Uso |
|----------|--------|-----|
| `MONGOD_PATH` | (procura sozinho) | Caminho do `mongod.exe` |
| `MONGO_DBPATH` | `C:\data\db` | Pasta dos dados |
| `MONGO_BIND_IP` | `127.0.0.1` | `0.0.0.0` libera o banco para a rede (ex.: Compass de outro PC) |
| `FRONTEND_PORT` | `8080` | Porta das telas |

`backend\.env` (modelo: `backend\.env.example`): `DB_IP`, `DB_NAME`, `DB_USER`, `DB_PASS`, `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `ALLOWED_ORIGINS`.

O frontend não precisa de `.env`. Para personalizar uma máquina, crie `frontend\.env.local` só com o que muda (modelo: `frontend\.env.example`). Exemplo, para ocultar o logo do topo das telas:

```env
VITE_SHOW_LOGO=false
```

Depois de alterar, feche a janela do frontend e rode `start-all.cmd`: o build é refeito sozinho.

Se existir `frontend\.env` ou `frontend\.env.production` com `VITE_URL=http://localhost`, **apague o arquivo ou deixe `VITE_URL` vazio**: com localhost, as outras máquinas não acham o backend. O `setup` avisa quando detecta isso.

## Problemas comuns

| Sintoma | Causa provável |
|---------|----------------|
| `mongod.exe nao encontrado` | MongoDB não instalado; veja Pré-requisitos ou defina `MONGOD_PATH` |
| Sistema abre, mas sem usuários/senhas antigas | `MONGO_DBPATH` aponta para uma pasta nova; ajuste para a pasta dos dados atuais |
| `DB_IP=mongodb:27017` | `backend\.env` com configuração do Docker; rode `setup.cmd -ResetBackendEnv` |
| Funciona nesta máquina, mas não nas outras | Firewall (8080/3030) ou `VITE_URL=localhost` em `frontend\.env*` |
| Porta 8080 ou 3030 em uso | Sistema antigo ainda rodando, ou outra janela "QTM" já aberta |
| `A pasta de dados nao existe` | `MONGO_DBPATH` errado; aponte para os dados atuais (ou `-NovoBanco` se for instalação nova) |
| `stop-all` sem permissão | As janelas foram abertas como administrador; rode o `stop-all` como administrador |
| `EPERM`/`EBUSY` no setup | Feche as janelas do sistema antes de rodar o `setup` |
