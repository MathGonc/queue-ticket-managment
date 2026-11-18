// Testes de ponta a ponta da API e do tempo real (node:test).
//
// Sobe o backend de verdade numa porta livre e num BANCO TEMPORARIO
// (qtm_test_<pid>), que e apagado no fim: o banco real nunca e tocado.
// Precisa de um MongoDB acessivel em DB_IP (backend/.env), por exemplo o do
// modo standalone: infra\standalone\start-mongo.cmd
//
//   npm test

const { describe, test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { spawn, execFileSync } = require('node:child_process')
const path = require('node:path')
const fs = require('node:fs')
const os = require('node:os')
const net = require('node:net')
const mongoose = require('mongoose')
const { io } = require('socket.io-client')

const ROOT = path.resolve(__dirname, '..')
const DB_NAME = `qtm_test_${process.pid}`
const LOG_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'qtm-test-logs-'))
const BACKUP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'qtm-test-backup-'))
const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'qtm-test-data-'))
const GRACE_MS = 1500
const PANEL_OK_MS = 400

let port, BASE, server, serverOutput = ''
const sockets = []
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function testEnv() {
  return {
    ...process.env,
    PORT: String(port),
    DB_NAME,
    JWT_SECRET: 'segredo-de-teste',
    LOG_DIR,
    DATA_DIR,
    PANEL_GRACE_MS: String(GRACE_MS),
    PANEL_OK_MS: String(PANEL_OK_MS),
    NODE_ENV: 'production',
  }
}

function freePort() {
  return new Promise((resolve) => {
    const srv = net.createServer().listen(0, '127.0.0.1', () => {
      const { port: p } = srv.address()
      srv.close(() => resolve(p))
    })
  })
}

async function req(method, url, { token, body } = {}) {
  const res = await fetch(BASE + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body !== undefined && method !== 'GET' ? JSON.stringify(body) : undefined,
  })
  let data = null
  try { data = await res.json() } catch { /* sem corpo */ }
  return { status: res.status, data }
}

// Roda um script do backend; se falhar, mostra a saida dele no erro
function runScript(args, env = testEnv()) {
  try {
    return execFileSync(process.execPath, args, { cwd: ROOT, env, stdio: 'pipe' }).toString()
  } catch (err) {
    throw new Error(`${args[0]} falhou:
${err.stdout || ''}${err.stderr || ''}`)
  }
}

const login = (user, password) => req('POST', '/login', { body: { login: user, password } })
const jwtPayload = (token) => JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())

function connect(options = {}) {
  return new Promise((resolve, reject) => {
    const socket = io(BASE, { transports: ['websocket'], forceNew: true, ...options })
    sockets.push(socket)
    socket.on('connect', () => resolve(socket))
    socket.on('connect_error', reject)
  })
}

// Registro de atividades e gravado em segundo plano: espera um pouco
async function activities(token, type) {
  await sleep(300)
  const { data } = await req('GET', `/api/activity?limit=500${type ? `&type=${type}` : ''}`, { token })
  return data.items
}

let admin, attendant, monitor
const tickets = {}

before(async () => {
  port = await freePort()
  BASE = `http://127.0.0.1:${port}`
  server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: testEnv(), stdio: ['ignore', 'pipe', 'pipe'] })
  server.stdout.on('data', (d) => { serverOutput += d })
  server.stderr.on('data', (d) => { serverOutput += d })

  const deadline = Date.now() + 30000
  for (;;) {
    if (server.exitCode !== null) throw new Error(`Backend encerrou ao subir:\n${serverOutput.slice(-2000)}`)
    try {
      const health = await (await fetch(`${BASE}/health`)).json()
      if (health.mongodb === 'connected') break
    } catch { /* ainda subindo */ }
    if (Date.now() > deadline) {
      throw new Error('Backend nao conectou ao MongoDB em 30 s. Suba o banco (infra\\standalone\\start-mongo.cmd).')
    }
    await sleep(300)
  }

  // Trava: o servidor tem que estar no banco TEMPORARIO (criou o documento
  // global la). Se nao estiver, aborta antes de gravar qualquer coisa.
  const check = await mongoose.createConnection(require('../src/config/db.js').buildMongoUri(DB_NAME)).asPromise()
  const globals = await check.db.collection('globals').countDocuments()
  await check.close()
  if (globals !== 1) throw new Error(`O backend de teste nao esta usando o banco ${DB_NAME}; abortando para nao tocar no banco real`)

  execFileSync(process.execPath, ['scripts/create-admin.js', '--login', 'admin.teste', '--name', 'Admin Teste', '--password', 'teste123'],
    { cwd: ROOT, env: testEnv(), stdio: 'ignore' })
})

after(async () => {
  sockets.forEach((s) => s.close())
  if (server && server.exitCode === null) server.kill()
  const conn = await mongoose.createConnection(require('../src/config/db.js').buildMongoUri(DB_NAME)).asPromise().catch(() => null)
  if (conn) {
    await conn.dropDatabase()
    await conn.useDb(`${DB_NAME}_restore`).dropDatabase()
    await conn.close()
  }
  fs.rmSync(LOG_DIR, { recursive: true, force: true })
  fs.rmSync(BACKUP_DIR, { recursive: true, force: true })
  fs.rmSync(DATA_DIR, { recursive: true, force: true })
})

describe('banco novo', () => {
  test('documento global criado no startup', async () => {
    const r = await req('GET', '/getGlobalTicketData')
    assert.equal(r.status, 200)
    assert.equal(r.data.ticket.nextToQueue, 1)
  })

  test('numero da senha oculto no painel por padrao', async () => {
    const r = await req('GET', '/getConfigsDB')
    assert.equal(r.data.config.showTicketNumber, false)
  })
})

describe('rotas protegidas sem login', () => {
  const closed = [
    ['GET', '/loadTicketsInQueue'], ['GET', '/loadTicket/000000000000000000000000'], ['GET', '/loadTicketHistory'],
    ['POST', '/insertTicket'], ['PUT', '/updateTicketCalled/000000000000000000000000'], ['DELETE', '/deleteTicket/000000000000000000000000'],
    ['PUT', '/updateGlobalTicketData'], ['PUT', '/resetGlobalTicketData'], ['POST', '/saveConfigsDB'],
    ['POST', '/register'], ['GET', '/api/users'], ['GET', '/auth/verify'], ['POST', '/auth/refresh'],
    ['GET', '/api/activity'], ['POST', '/api/activity/client'], ['GET', '/api/stats/daily'], ['GET', '/api/logs/files'],
  ]
  for (const [method, url] of closed) {
    test(`${method} ${url} -> 401`, async () => {
      assert.equal((await req(method, url, { body: {} })).status, 401)
    })
  }
})

describe('requisicoes sem corpo (Express 5)', () => {
  test('rotas que leem o corpo respondem sem erro 500', async () => {
    const r = await fetch(`${BASE}/login`, { method: 'POST' })
    assert.equal(r.status, 400)
  })
})

describe('login e cadastro', () => {
  test('admin entra e nem a resposta nem o token levam o hash da senha', async () => {
    const r = await login('admin.teste', 'teste123')
    assert.equal(r.status, 200)
    admin = r.data.token
    assert.ok(!('password' in r.data.user))
    assert.ok(!('password' in jwtPayload(admin).userData))
  })

  test('senha errada -> 401', async () => {
    assert.equal((await login('admin.teste', 'errada')).status, 401)
  })

  test('cadastro sem funcao -> 400 com mensagem em portugues', async () => {
    const r = await req('POST', '/register', { token: admin, body: { username: 'Atendente', login: 'atendente.teste', password: '1234' } })
    assert.equal(r.status, 400)
    assert.equal(r.data.errors[0].msg, 'Selecione a função do usuário')
  })

  test('cria atendente (funcao "2" como vem do select) e monitor', async () => {
    assert.equal((await req('POST', '/register', { token: admin, body: { username: 'Atendente', login: 'atendente.teste', password: '1234', role: '2' } })).status, 201)
    assert.equal((await req('POST', '/register', { token: admin, body: { username: 'Monitor', login: 'monitor.teste', password: '1234', role: 1 } })).status, 201)
    attendant = (await login('atendente.teste', '1234')).data.token
    monitor = (await login('monitor.teste', '1234')).data.token
    assert.ok(attendant && monitor)
  })

  test('login repetido -> 400', async () => {
    const r = await req('POST', '/register', { token: admin, body: { username: 'Outro', login: 'atendente.teste', password: '1234', role: 2 } })
    assert.equal(r.status, 400)
  })
})

describe('permissoes por cargo', () => {
  test('atendente nao cadastra usuario, nao zera numeracao nem muda configs', async () => {
    assert.equal((await req('POST', '/register', { token: attendant, body: { username: 'X', login: 'x.y', password: '1234', role: 3 } })).status, 403)
    assert.equal((await req('PUT', '/resetGlobalTicketData', { token: attendant })).status, 403)
    assert.equal((await req('POST', '/saveConfigsDB', { token: attendant, body: {} })).status, 403)
  })

  test('monitor ve a fila, mas nao emite senha nem ve historico', async () => {
    assert.equal((await req('GET', '/loadTicketsInQueue', { token: monitor })).status, 200)
    assert.equal((await req('POST', '/insertTicket', { token: monitor, body: { number: 1, status: 1, name: 'X', preferential: 0, dateQueue: Date.now() } })).status, 403)
    assert.equal((await req('GET', '/loadTicketHistory', { token: monitor })).status, 403)
  })

  test('indicadores, logs e registro so para admin', async () => {
    for (const url of ['/api/stats/daily', '/api/logs/files', '/api/activity']) {
      assert.equal((await req('GET', url, { token: attendant })).status, 403, url)
    }
  })
})

describe('triagem e fila', () => {
  // Mesmo fluxo do sorting.vue
  async function issue(name, preferential, docNumber) {
    const g = (await req('GET', '/getGlobalTicketData')).data.ticket
    const ins = await req('POST', '/insertTicket', { token: attendant, body: {
      number: g.nextToQueue, status: 1, type: 'INICIAL', queuedBy: 'Atendente', preferential, name, docNumber, dateQueue: Date.now(), assistedAge: null } })
    assert.equal(ins.status, 200)
    g.nextToQueue += 1
    assert.equal((await req('PUT', '/updateGlobalTicketData', { token: attendant, body: { ticket: g } })).status, 200)
    await sleep(20)
  }

  test('emite senhas normal, preferencial, 80+ e normal', async () => {
    await issue('Normal Um', 0, '11122233396')
    await issue('Pref Um', 1, '22233344405')
    await issue('Super Um', 2, '')
    await issue('Normal Dois', 0, '')
  })

  test('nome vazio -> 400 "Digite um nome"', async () => {
    const r = await req('POST', '/insertTicket', { token: attendant, body: { number: 99, status: 1, name: '   ', preferential: 0, dateQueue: Date.now() } })
    assert.equal(r.status, 400)
    assert.equal(r.data.errors[0].msg, 'Digite um nome')
  })

  test('CPF com digito verificador errado, incompleto ou repetido -> 400', async () => {
    for (const docNumber of ['11122233344', '1112223339', '11111111111']) {
      const r = await req('POST', '/insertTicket', { token: attendant, body: { number: 99, status: 1, name: 'X', preferential: 0, docNumber, dateQueue: Date.now() } })
      assert.equal(r.status, 400, docNumber)
      assert.equal(r.data.errors[0].msg, 'CPF inválido: confira os números')
    }
  })

  test('fila na ordem 2 > 1 > 0 e por chegada, numeracao sequencial, CPF gravado', async () => {
    const queue = (await req('GET', '/loadTicketsInQueue', { token: attendant })).data.ticket.filter((t) => t.status === 1)
    assert.deepEqual(queue.map((t) => t.name), ['SUPER UM', 'PREF UM', 'NORMAL UM', 'NORMAL DOIS'])
    assert.deepEqual(queue.map((t) => t.number).sort(), [1, 2, 3, 4])
    assert.equal(queue.find((t) => t.name === 'NORMAL UM').docNumber, '11122233396')
    queue.forEach((t) => { tickets[t.name] = t })
  })
})

describe('tempo real e chamada', () => {
  let listener
  const received = []

  test('sinais sem login sao ignorados e registrados uma vez por evento', async () => {
    listener = await connect()
    listener.on('receiveUpdateMonitor', (v) => received.push(['monitor', v]))
    listener.on('receiveUpdateGlobal', () => received.push(['global']))
    const anon = await connect()
    anon.emit('signalUpdateMonitor', true)
    anon.emit('signalUpdateMonitor', true)
    anon.emit('signalUpdateValues')
    await sleep(400)
    assert.equal(received.length, 0)
    const refused = await activities(admin, 'sinal_recusado')
    assert.deepEqual(refused.map((a) => a.details.evento).sort(), ['signalUpdateMonitor', 'signalUpdateValues'])
  })

  test('chamada (fluxo do callTicket): painel, guiche gravado e espera no registro', async () => {
    const t = tickets['SUPER UM']
    const ticket = (await req('GET', `/loadTicket/${t._id}`, { token: attendant })).data.ticket[0]
    const g = (await req('GET', '/getGlobalTicketData')).data.ticket
    Object.assign(g, { currentNumber: ticket.number, currentTable: 5, currentUser: ticket.name, currentServicedBy: 'Atendente' })
    assert.equal((await req('PUT', '/updateGlobalTicketData', { token: attendant, body: { ticket: g } })).status, 200)
    const called = { ...ticket, status: 2, servicedBy: 'Atendente', servicedTable: 5, dateServiced: new Date() }
    assert.equal((await req('PUT', `/updateTicketCalled/${ticket._id}`, { token: attendant, body: called })).status, 200)

    const auth = await connect({ auth: { token: attendant } })
    auth.emit('signalUpdateValues')
    auth.emit('signalUpdateMonitor', true)
    await sleep(400)
    assert.ok(received.some(([kind, v]) => kind === 'monitor' && v === true))
    assert.ok(received.some(([kind]) => kind === 'global'))

    const panel = (await req('GET', '/getGlobalTicketData')).data.ticket
    assert.equal(panel.currentUser, 'SUPER UM')
    assert.equal(panel.currentTable, 5)
    assert.equal((await req('GET', `/loadTicket/${ticket._id}`, { token: attendant })).data.ticket[0].servicedTable, 5)

    const call = (await activities(admin, 'senha_chamada'))[0]
    assert.equal(call.details.guiche, 5)
    assert.equal(call.details.preferencial, 2)
    assert.equal(call.login, 'atendente.teste')
    assert.ok(call.details.esperaMs >= 0)
  })

  test('chamar de novo vira "senha_rechamada"', async () => {
    const t = (await req('GET', `/loadTicket/${tickets['SUPER UM']._id}`, { token: attendant })).data.ticket[0]
    await req('PUT', `/updateTicketCalled/${t._id}`, { token: attendant, body: { ...t, status: 2, servicedTable: 5, dateServiced: new Date() } })
    assert.equal((await activities(admin, 'senha_rechamada')).length, 1)
  })

  test('proxima da fila passa a ser a preferencial', async () => {
    const queue = (await req('GET', '/loadTicketsInQueue', { token: attendant })).data.ticket
    assert.equal(queue[0].name, 'PREF UM')
  })
})

describe('empresa e logo', () => {
  // PNG valido de 1x1 pixel
  const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')
  const upload = (token, body, type = 'image/png') => fetch(`${BASE}/api/branding/logo`, {
    method: 'PUT', headers: { 'Content-Type': type, ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body,
  })

  test('sem logo e sem nome no comeco (rota publica)', async () => {
    const r = await req('GET', '/api/branding')
    assert.equal(r.status, 200)
    assert.deepEqual(r.data, { companyName: '', logo: null })
    assert.equal((await fetch(`${BASE}/api/branding/logo`)).status, 404)
  })

  test('so admin importa; arquivo que nao e imagem e recusado', async () => {
    assert.equal((await upload(null, PNG)).status, 401)
    assert.equal((await upload(attendant, PNG)).status, 403)
    assert.equal((await upload(admin, Buffer.from('<svg onload=alert(1)>'), 'image/svg+xml')).status, 400)
    assert.equal((await upload(admin, Buffer.alloc(3 * 1024 * 1024, 1))).status, 413)
  })

  test('importa PNG, avisa as telas abertas e serve a imagem', async () => {
    const tela = await connect()
    let avisada = false
    tela.on('receiveUpdateBranding', () => { avisada = true })
    const r = await upload(admin, PNG)
    assert.equal(r.status, 200)
    await sleep(300)
    assert.ok(avisada)
    const branding = (await req('GET', '/api/branding')).data
    assert.ok(branding.logo.version > 0)
    const img = await fetch(`${BASE}/api/branding/logo`)
    assert.equal(img.headers.get('content-type'), 'image/png')
    assert.deepEqual(Buffer.from(await img.arrayBuffer()), PNG)
    assert.ok(fs.existsSync(path.join(DATA_DIR, 'logo.png')))
    assert.equal((await activities(admin, 'logo_alterado'))[0].details.formato, 'png')
  })

  test('nome da empresa: so admin, ate 120 caracteres, entra no registro', async () => {
    assert.equal((await req('PUT', '/api/branding/company', { token: attendant, body: { companyName: 'X' } })).status, 403)
    assert.equal((await req('PUT', '/api/branding/company', { token: admin, body: { companyName: 'x'.repeat(121) } })).status, 400)
    assert.equal((await req('PUT', '/api/branding/company', { token: admin, body: { companyName: '  Defensoria Teste  ' } })).status, 200)
    assert.equal((await req('GET', '/api/branding')).data.companyName, 'Defensoria Teste')
    assert.deepEqual((await activities(admin, 'empresa_alterada'))[0].details, { de: '', para: 'Defensoria Teste' })
  })

  test('salvar o monitor nao sobrescreve numeracao nem nome da empresa', async () => {
    const before = (await req('GET', '/getGlobalTicketData')).data.ticket.nextToQueue
    const stale = { ...(await req('GET', '/getConfigsDB')).data.config, companyName: 'Velho', ticket: { nextToQueue: 999 } }
    assert.equal((await req('POST', '/saveConfigsDB', { token: admin, body: stale })).status, 200)
    assert.equal((await req('GET', '/getGlobalTicketData')).data.ticket.nextToQueue, before)
    assert.equal((await req('GET', '/api/branding')).data.companyName, 'Defensoria Teste')
  })

  test('remove o logo', async () => {
    assert.equal((await req('DELETE', '/api/branding/logo', { token: admin })).status, 200)
    assert.equal((await fetch(`${BASE}/api/branding/logo`)).status, 404)
    assert.equal((await req('GET', '/api/branding')).data.logo, null)
    assert.equal((await activities(admin, 'logo_removido')).length, 1)
  })
})

describe('historico', () => {
  test('busca pelo numero da senha', async () => {
    const r = await req('GET', `/loadTicketHistory?search=${tickets['SUPER UM'].number}`, { token: attendant })
    assert.ok(r.data.ticket.some((t) => t.name === 'SUPER UM'))
  })

  test('caractere especial na busca nao quebra; ordenacao e limite validados', async () => {
    assert.equal((await req('GET', `/loadTicketHistory?search=${encodeURIComponent('Pref (')}`, { token: attendant })).status, 200)
    const r = await req('GET', '/loadTicketHistory?sortField=password&limit=1000000', { token: attendant })
    assert.equal(r.status, 200)
    assert.equal(r.data.pagination.limit, 10000)
    assert.equal(r.data.stats.totalComplete, 1)
  })
})

describe('eventos do navegador', () => {
  test('PDF do historico: detalhes sanitizados', async () => {
    const r = await req('POST', '/api/activity/client', { token: attendant, body: { type: 'pdf_historico', details: { busca: 'x'.repeat(300), de: '2026-11-01T00:00:00Z', ate: 'lixo', registros: '42' } } })
    assert.equal(r.status, 200)
    const pdf = (await activities(admin, 'pdf_historico'))[0]
    assert.equal(pdf.details.busca.length, 100)
    assert.equal(pdf.details.ate, null)
    assert.equal(pdf.details.registros, 42)
  })

  test('monitor nao registra PDF; guiche valido sim, invalido nao; tipo livre recusado', async () => {
    assert.equal((await req('POST', '/api/activity/client', { token: monitor, body: { type: 'pdf_historico', details: {} } })).status, 403)
    assert.equal((await req('POST', '/api/activity/client', { token: monitor, body: { type: 'guiche_alterado', details: { de: 2, para: 5 } } })).status, 200)
    assert.equal((await req('POST', '/api/activity/client', { token: monitor, body: { type: 'guiche_alterado', details: { para: 150 } } })).status, 400)
    assert.equal((await req('POST', '/api/activity/client', { token: admin, body: { type: 'login', details: {} } })).status, 400)
    assert.equal((await activities(admin, 'guiche_alterado'))[0].details.para, 5)
  })
})

describe('painel (TV)', () => {
  test('conectado; queda curta nao gera registro; desconexao real sim', async () => {
    let tv = await connect()
    tv.emit('painelOnline', { usuario: 'Monitor TV' })
    await sleep(300)
    assert.equal((await activities(admin, 'painel_conectado')).length, 1)
    tv.close()
    await sleep(300)
    tv = await connect()
    tv.emit('painelOnline', { usuario: 'Monitor TV' })
    await sleep(GRACE_MS + 500)
    assert.equal((await activities(admin, 'painel_conectado')).length, 1)
    assert.equal((await activities(admin, 'painel_desconectado')).length, 0)
    tv.close()
    await sleep(GRACE_MS + 800)
    const off = await activities(admin, 'painel_desconectado')
    assert.equal(off.length, 1)
    assert.equal(off[0].user, 'Monitor TV')
  })
})

describe('erros, indicadores e logs', () => {
  test('resposta 500 entra no registro com metodo e rota (sem query)', async () => {
    assert.equal((await req('GET', '/loadTicket/id-invalido?x=1', { token: admin })).status, 500)
    const err = (await activities(admin, 'erro_servidor'))[0]
    assert.equal(err.details.rota, '/loadTicket/id-invalido')
  })

  test('indicadores por dia', async () => {
    const r = await req('GET', '/api/stats/daily', { token: admin })
    assert.equal(r.status, 200)
    assert.equal(r.data.totals.emitidas, 4)
    assert.equal(r.data.totals.atendidas, 1)
    assert.equal(r.data.totals.preferenciais, 2)
  })

  test('logs tecnicos: lista, filtra por nivel e texto, recusa caminho fora da pasta', async () => {
    await sleep(500)
    const files = (await req('GET', '/api/logs/files', { token: admin })).data
    assert.equal(files.enabled, true)
    const file = files.files[0].name
    assert.match(file, /^backend\.\d{4}-\d{2}-\d{2}\.\d+\.log$/)
    const warn = await req('GET', `/api/logs?file=${file}&level=warn`, { token: admin })
    assert.ok(warn.data.items.every((l) => ['warn', 'error', 'fatal'].includes(l.level)))
    const search = await req('GET', `/api/logs?file=${file}&search=loadTicket`, { token: admin })
    assert.ok(search.data.items.length > 0)
    assert.equal((await req('GET', '/api/logs?file=..%2F.env', { token: admin })).status, 400)
  })
})

describe('backup', () => {
  test('backup registra a atividade e a restauracao reproduz os dados', async () => {
    const env = testEnv()
    runScript(['scripts/backup-db.js', '--dir', BACKUP_DIR, '--keep', '2'], env)
    const done = (await activities(admin, 'backup_concluido'))[0]
    assert.equal(done.user, 'sistema')
    assert.ok(done.details.colecoes.users >= 3)

    const folder = path.join(BACKUP_DIR, fs.readdirSync(BACKUP_DIR).find((n) => n.startsWith('backup-qtm-')))
    runScript(['scripts/restore-db.js', '--from', folder, '--db', `${DB_NAME}_restore`, '--confirm'], env)
    const conn = await mongoose.createConnection(require('../src/config/db.js').buildMongoUri(DB_NAME)).asPromise()
    const { EJSON } = mongoose.mongo.BSON
    for (const name of ['users', 'tickets', 'globals']) {
      const original = await conn.db.collection(name).find({}).sort({ _id: 1 }).toArray()
      const restored = await conn.useDb(`${DB_NAME}_restore`).db.collection(name).find({}).sort({ _id: 1 }).toArray()
      assert.equal(EJSON.stringify(restored), EJSON.stringify(original), name)
    }
    await conn.close()
  })
})

describe('sessao e usuarios', () => {
  let attendantId, monitorId, adminId

  test('refresh devolve token e usuario; lista de usuarios sem senha', async () => {
    const r = await req('POST', '/auth/refresh', { token: attendant })
    assert.equal(r.status, 200)
    assert.equal(r.data.user.login, 'atendente.teste')
    const users = (await req('GET', '/api/users', { token: admin })).data.users
    assert.ok(users.every((u) => !('password' in u)))
    attendantId = users.find((u) => u.login === 'atendente.teste')._id
    monitorId = users.find((u) => u.login === 'monitor.teste')._id
    adminId = users.find((u) => u.login === 'admin.teste')._id
  })

  test('mudanca de funcao vale na hora (verify le do banco) e entra no registro', async () => {
    assert.equal((await req('PUT', `/api/users/${attendantId}`, { token: admin, body: { username: 'Atendente', login: 'atendente.teste', role: '1' } })).status, 200)
    assert.equal((await req('GET', '/auth/verify', { token: attendant })).data.userData.role, 1)
    const changed = (await activities(admin, 'usuario_alterado'))[0]
    assert.deepEqual(changed.details.campos, ['role'])
  })

  test('protecoes: login repetido, admin nao tira o proprio acesso nem se exclui', async () => {
    assert.equal((await req('PUT', `/api/users/${monitorId}`, { token: admin, body: { login: 'admin.teste' } })).status, 400)
    assert.equal((await req('PUT', `/api/users/${adminId}`, { token: admin, body: { role: 2 } })).status, 400)
    assert.equal((await req('DELETE', `/api/users/${adminId}`, { token: admin })).status, 400)
  })

  test('edicao sem corpo nao quebra (Express 5)', async () => {
    const r = await fetch(`${BASE}/api/users/${monitorId}`, { method: 'PUT', headers: { Authorization: `Bearer ${admin}` } })
    assert.equal(r.status, 200)
  })

  test('usuario excluido perde o acesso e nao renova o token', async () => {
    assert.equal((await req('DELETE', `/api/users/${attendantId}`, { token: admin })).status, 200)
    assert.equal((await req('GET', '/auth/verify', { token: attendant })).status, 401)
    assert.equal((await req('POST', '/auth/refresh', { token: attendant })).status, 401)
  })
})

describe('administracao', () => {
  test('salvar configs registra a mudanca (de -> para)', async () => {
    const cfg = (await req('GET', '/getConfigsDB')).data.config
    assert.equal((await req('POST', '/saveConfigsDB', { token: admin, body: { ...cfg, showTicketNumber: true } })).status, 200)
    const change = (await activities(admin, 'config_monitor_alterada'))[0]
    assert.deepEqual(change.details.alteracoes.showTicketNumber, { de: false, para: true })
  })

  test('zerar numeracao e excluir senha', async () => {
    assert.equal((await req('PUT', '/resetGlobalTicketData', { token: admin })).status, 200)
    assert.equal((await req('GET', '/getGlobalTicketData')).data.ticket.nextToQueue, 1)
    assert.equal((await req('DELETE', `/deleteTicket/${tickets['NORMAL DOIS']._id}`, { token: admin })).status, 200)
    assert.equal((await activities(admin, 'senha_excluida'))[0].details.numero, tickets['NORMAL DOIS'].number)
  })

  test('logout registrado', async () => {
    assert.equal((await req('POST', '/auth/logout', { token: monitor })).status, 200)
    assert.equal((await activities(admin, 'logout'))[0].login, 'monitor.teste')
  })
})

describe('registro de atividades', () => {
  test('nao guarda nome nem CPF do assistido', async () => {
    const all = JSON.stringify(await activities(admin))
    for (const secret of ['SUPER UM', 'PREF UM', 'NORMAL UM', '11122233396', '22233344405']) {
      assert.ok(!all.includes(secret), secret)
    }
  })

  test('filtros por tipo e por usuario', async () => {
    const byType = (await req('GET', '/api/activity?type=senha_emitida', { token: admin })).data.items
    assert.equal(byType.length, 4)
    const byUser = (await req('GET', '/api/activity?user=monitor.teste', { token: admin })).data.items
    assert.ok(byUser.length > 0 && byUser.every((a) => a.login === 'monitor.teste'))
  })
})

describe('assistidos, visitas, anotacoes e exclusao', () => {
  let conn, db
  before(async () => {
    conn = await mongoose.createConnection(require('../src/config/db.js').buildMongoUri(DB_NAME)).asPromise()
    db = conn.db
  })
  after(() => conn.close())
  const pessoas = (filter) => db.collection('assistidos').find({ mescladoEm: null, ...filter }).toArray()
  const pessoa = async (cpf) => (await pessoas({ cpf }))[0] || null
  const ticketDb = (id) => db.collection('tickets').findOne({ _id: new mongoose.Types.ObjectId(String(id)) })
  const insert = (body) => req('POST', '/insertTicket', { token: attendant, body: {
    number: 50, status: 1, type: 'RETORNO', queuedBy: 'Atendente', preferential: 0, dateQueue: Date.now(), ...body } })

  test('toda senha tem pessoa; o ticket nao guarda nome nem CPF', async () => {
    const p = await pessoa('11122233396')
    assert.equal(p.nome, 'NORMAL UM')
    assert.equal(p.cpfValido, true)
    const t = await db.collection('tickets').findOne({ assistidoId: p._id })
    assert.equal(t.name, undefined)
    assert.equal(t.docNumber, undefined)
    // Sem CPF tambem vira cadastro (cpf null)
    assert.equal((await pessoas({ cpf: null })).length, 2)
    assert.equal(await db.collection('tickets').countDocuments({ assistidoId: null }), 0)
  })

  test('nome: so troca por um mais completo da mesma pessoa; outro nome vai para a anotacao', async () => {
    assert.equal((await insert({ name: 'normal um da silva', docNumber: '11122233396', assistedAge: '1950-03-03' })).status, 200)
    let p = await pessoa('11122233396')
    assert.equal(p.nome, 'NORMAL UM DA SILVA')
    assert.equal(p.nascimento.toISOString(), '1950-03-03T12:00:00.000Z')

    await insert({ name: 'Normal U. da Silva', docNumber: '11122233396' })
    const r = await insert({ name: 'Outra Pessoa', docNumber: '11122233396' })
    p = await pessoa('11122233396')
    assert.equal(p.nome, 'NORMAL UM DA SILVA')
    assert.equal(p.nascimento.toISOString(), '1950-03-03T12:00:00.000Z')
    assert.match((await ticketDb(r.data.ticketId)).notaTriagem, /Registrado como: OUTRA PESSOA/)
  })

  test('tipo vira oficial e o texto digitado vai para a anotacao; recado do nome tambem', async () => {
    const r = await insert({ name: 'Fulano de Tal (quer falar com Patricia)', docNumber: '', type: 'retorno - trazer RG', notaTriagem: 'chegou cedo' })
    assert.equal(r.status, 200)
    const t = await ticketDb(r.data.ticketId)
    assert.equal(t.type, 'RETORNO')
    assert.equal(t.notaTriagem, 'chegou cedo\nquer falar com Patricia\nretorno - trazer RG')
    assert.equal((await db.collection('assistidos').findOne({ _id: t.assistidoId })).nome, 'FULANO DE TAL')
  })

  test('nascimento no futuro -> 400', async () => {
    const r = await insert({ name: 'X', docNumber: '', assistedAge: '2999-01-01' })
    assert.equal(r.status, 400)
    assert.equal(r.data.errors[0].msg, 'Data de nascimento inválida')
  })

  test('sugestoes enquanto digita: CPF pelo comeco, nome por palavras sem acento', async () => {
    const byCpf = (await req('GET', '/assistidos/sugestoes?cpf=111.22', { token: attendant })).data.sugestoes
    assert.deepEqual(byCpf.map((s) => s.nome), ['NORMAL UM DA SILVA'])
    const byName = (await req('GET', `/assistidos/sugestoes?nome=${encodeURIComponent('norm sílv')}`, { token: attendant })).data.sugestoes
    assert.equal(byName[0].cpf, '11122233396')
    assert.equal(byName[0].visitas, 1)
    assert.deepEqual((await req('GET', '/assistidos/sugestoes?nome=no', { token: attendant })).data.sugestoes, [])
    assert.ok([401, 403].includes((await req('GET', '/assistidos/sugestoes?cpf=111', { token: monitor })).status))
  })

  test('triagem: candidatos do CPF, do nome (Sem CPF) e senhas de hoje', async () => {
    const r = await req('GET', '/assistidos/triagem?cpf=111.222.333-96', { token: attendant })
    assert.equal(r.status, 200)
    assert.equal(r.data.candidatos.length, 1)
    assert.equal(r.data.candidatos[0].nascimento, '1950-03-03')
    assert.equal(r.data.candidatos[0].ultima.tipo, 'RETORNO')
    // 4 senhas hoje = 1 visita
    assert.equal(r.data.candidatos[0].visitas, 1)
    assert.equal(r.data.hoje.length, 4)
    assert.deepEqual((await req('GET', '/assistidos/triagem?cpf=52998224725', { token: attendant })).data, { candidatos: [], hoje: [] })
    assert.equal((await req('GET', '/assistidos/triagem?cpf=11122233344', { token: attendant })).status, 400)
    const semCpf = await req('GET', `/assistidos/triagem?nome=${encodeURIComponent('  super   um ')}`, { token: attendant })
    assert.equal(semCpf.data.candidatos.length, 1)
    assert.equal(semCpf.data.hoje.length, 1)
  })

  test('CPF com 2 cadastros: emissao recusada ate resolver; resolver junta e anota', async () => {
    const now = new Date()
    const base = { cpfValido: true, nascimento: null, confirmarNome: false, mescladoEm: null, criadoEm: now, atualizadoEm: now }
    const { insertedIds } = await db.collection('assistidos').insertMany([
      { ...base, cpf: '07787808136', nome: 'DARA MASSUDA ARTERO', nomeBusca: 'DARA MASSUDA ARTERO' },
      { ...base, cpf: '07787808136', nome: 'DIEGO MASSUDA ARTERO', nomeBusca: 'DIEGO MASSUDA ARTERO' },
    ])
    const [dara, diego] = [insertedIds[0], insertedIds[1]]
    await db.collection('tickets').insertOne({ number: 70, status: 2, preferential: 0, assistidoId: diego, type: 'INFORMAÇÕES',
      dateQueue: new Date('2026-01-19T14:00:00Z'), notaTriagem: '', notaAtendimento: '', deletedAt: null })

    const tri = (await req('GET', `/assistidos/triagem?id=${dara}`, { token: attendant })).data
    assert.equal(tri.candidatos.length, 2)
    assert.equal(tri.candidatos[0].pendencias[0].tipo, 'cpf_compartilhado')

    const blocked = await insert({ name: 'Dara', docNumber: '07787808136' })
    assert.equal(blocked.status, 409)

    // CPF e obrigatorio na resolucao: valido ou "Sem CPF"
    assert.equal((await req('POST', '/assistidos/resolver', { token: attendant, body: { manterId: dara, nome: 'DARA MASSUDA ARTERO' } })).status, 400)
    const ok = await req('POST', '/assistidos/resolver', { token: attendant, body: { manterId: dara, nome: 'dara massuda artero', cpf: '077.878.081-36' } })
    assert.equal(ok.status, 200)
    assert.equal(ok.data.juntados, 1)
    assert.deepEqual(ok.data.assistido.pendencias, [])
    const moved = await db.collection('tickets').findOne({ number: 70, dateQueue: new Date('2026-01-19T14:00:00Z') })
    assert.equal(String(moved.assistidoId), String(dara))
    assert.equal(moved.notaTriagem, 'Registrado como: DIEGO MASSUDA ARTERO')
    assert.equal(String((await db.collection('assistidos').findOne({ _id: diego })).mescladoEm), String(dara))
    // Cadastro juntado leva ao ativo
    assert.equal((await insert({ assistidoId: String(diego) })).status, 200)
    assert.equal((await activities(admin, 'cadastro_resolvido'))[0].details.juntados, 1)
  })

  test('CPF invalido do cadastro: resolver com CPF valido ou Sem CPF', async () => {
    const now = new Date()
    const { insertedId } = await db.collection('assistidos').insertOne({ cpf: '12345678900', cpfValido: false, nome: 'JOSE DIGITADO',
      nomeBusca: 'JOSE DIGITADO', nascimento: null, confirmarNome: false, mescladoEm: null, criadoEm: now, atualizadoEm: now })
    const tri = (await req('GET', `/assistidos/triagem?id=${insertedId}`, { token: attendant })).data
    assert.equal(tri.candidatos[0].pendencias[0].tipo, 'cpf_invalido')
    const r = await req('POST', '/assistidos/resolver', { token: attendant, body: { manterId: insertedId, nome: 'JOSE DIGITADO', semCpf: true } })
    assert.equal(r.status, 200)
    const p = await db.collection('assistidos').findOne({ _id: insertedId })
    assert.equal(p.cpf, null)
    assert.equal(p.cpfValido, null)
  })

  test('fila e historico trazem pessoa e visitas; busca e ordem pelo nome', async () => {
    const queue = (await req('GET', '/loadTicketsInQueue', { token: attendant })).data.ticket
    const withCpf = queue.find((t) => t.docNumber === '11122233396')
    assert.equal(withCpf.name, 'NORMAL UM DA SILVA')
    assert.equal(withCpf.visitas.numero, 1)
    assert.equal(withCpf.visitas.anterior, null)
    const hist = (await req('GET', `/loadTicketHistory?search=${encodeURIComponent('normal um da')}&sortField=name&sortOrder=asc`, { token: attendant })).data
    assert.ok(hist.ticket.length >= 4 && hist.ticket.every((t) => t.name === 'NORMAL UM DA SILVA' && t.visitas.total === 1))
    const sorted = (await req('GET', '/loadTicketHistory?sortField=name&sortOrder=asc&limit=500', { token: attendant })).data.ticket.map((t) => t.name)
    assert.deepEqual(sorted, [...sorted].sort())
  })

  test('anotacao do atendimento', async () => {
    const t = tickets['PREF UM']
    assert.equal((await req('PUT', `/tickets/${t._id}/notaAtendimento`, { token: attendant, body: { notaAtendimento: ' trouxe RG ' } })).status, 200)
    const loaded = (await req('GET', `/loadTicket/${t._id}`, { token: attendant })).data.ticket[0]
    assert.equal(loaded.notaAtendimento, 'trouxe RG')
    assert.equal(loaded.name, 'PREF UM')
    assert.ok((await req('PUT', `/tickets/${t._id}/notaAtendimento`, { token: monitor, body: { notaAtendimento: 'x' } })).status >= 401)
  })

  test('excluir so oculta: some da fila, do historico e das buscas, mas fica no banco', async () => {
    const id = tickets['NORMAL DOIS']._id
    const queue = (await req('GET', '/loadTicketsInQueue', { token: attendant })).data.ticket
    assert.ok(!queue.some((t) => t._id === id))
    assert.deepEqual((await req('GET', `/loadTicket/${id}`, { token: attendant })).data.ticket, [])
    const hist = (await req('GET', `/loadTicketHistory?search=${encodeURIComponent('NORMAL DOIS')}`, { token: attendant })).data
    assert.equal(hist.pagination.total, 0)
    const stored = await ticketDb(id)
    assert.ok(stored.deletedAt instanceof Date)
    assert.equal(stored.deletedBy, 'Admin Teste')
    assert.equal((await req('PUT', `/updateTicketCalled/${id}`, { token: attendant, body: { status: 2 } })).status, 404)
  })

  test('chamada grava so os campos da chamada', async () => {
    const t = tickets['PREF UM']
    const before = await ticketDb(t._id)
    const r = await req('PUT', `/updateTicketCalled/${t._id}`, { token: attendant, body: {
      status: 2, servicedBy: 'Atendente', servicedTable: 3, dateServiced: new Date(), name: 'TROCADO', deletedAt: new Date(), assistidoId: null, notaTriagem: 'x' } })
    assert.equal(r.status, 200)
    const stored = await ticketDb(t._id)
    assert.equal(stored.deletedAt, null)
    assert.equal(stored.servicedTable, 3)
    assert.equal(String(stored.assistidoId), String(before.assistidoId))
    assert.equal(stored.notaTriagem, before.notaTriagem)
    assert.equal(stored.name, undefined)
  })

  test('migracao: simulacao nao grava; aplicar separa pessoas e pode rodar de novo', async () => {
    const tk = db.collection('tickets')
    const base = { status: 2, type: 'RETORNO', queuedBy: 'X', dateQueue: new Date('2024-05-10T14:00:00Z'), preferential: 0 }
    await tk.insertMany([
      // Formato antigo: nome misturado, nascimento a meia-noite de Brasilia, preferencial booleano
      { ...base, number: 901, name: 'maria  souza', docNumber: '52998224725', preferential: true, assistedAge: new Date('1960-07-20T03:00:00Z') },
      { ...base, number: 902, name: 'MARIA DE SOUZA LIMA (QUER FALAR COM PATRICIA)', docNumber: '52998224725', dateQueue: new Date('2025-01-10T14:00:00Z'), type: 'INFORMACAO - BPC' },
      { ...base, number: 906, name: '529.982.247-25', docNumber: '52998224725', dateQueue: new Date('2025-02-10T14:00:00Z') },
      // Parente (sobrenome em comum) e pessoa sem relacao no mesmo CPF
      { ...base, number: 907, name: 'JOAO DE SOUZA LIMA', docNumber: '52998224725', dateQueue: new Date('2025-03-10T14:00:00Z') },
      { ...base, number: 908, name: 'PEDRO ALVARES CABRAL', docNumber: '52998224725', dateQueue: new Date('2025-04-10T14:00:00Z') },
      { ...base, number: 903, name: 'Joao Sem Cpf Nenhum', docNumber: '00000000000', queuedBy: 'Y' },
      { ...base, number: 904, name: 'Jose Digitado Errado', docNumber: '12345678900', queuedBy: 'Y' },
      // Triagem antiga nao limpava a data: a proxima pessoa saiu com a da Maria
      { ...base, number: 905, name: 'Pedro Copiado', docNumber: '11144477735', assistedAge: new Date('1960-07-20T03:00:00Z'), dateQueue: new Date('2024-05-10T14:05:00Z') },
      // Sem CPF: 2 palavras repetidas -> um cadastro a confirmar; 1 palavra -> um por ticket
      { ...base, number: 909, name: 'Hilton Souza', docNumber: '', queuedBy: 'Y' },
      { ...base, number: 910, name: 'HILTON SOUZA', docNumber: '', queuedBy: 'Y' },
      { ...base, number: 911, name: 'Bernardo', docNumber: '', queuedBy: 'Y' },
      { ...base, number: 912, name: 'BERNARDO', docNumber: '', queuedBy: 'Y' },
    ])
    const report = fs.mkdtempSync(path.join(os.tmpdir(), 'qtm-migracao-'))
    try {
      const sim = runScript(['scripts/migrate-assistidos.js', '--report', report])
      assert.match(sim, /simulacao/)
      assert.equal(await pessoa('52998224725'), null)
      assert.ok(fs.existsSync(path.join(report, 'pendencia-cpf-com-2-cadastros.csv')))

      runScript(['scripts/migrate-assistidos.js', '--apply', '--report', report])
      const doCpf = await pessoas({ cpf: '52998224725' })
      assert.deepEqual(doCpf.map((p) => p.nome).sort(), ['JOAO DE SOUZA LIMA', 'MARIA DE SOUZA LIMA'])
      const maria = doCpf.find((p) => p.nome.startsWith('MARIA'))
      assert.equal(maria.nascimento.toISOString(), '1960-07-20T12:00:00.000Z')
      const old = await tk.findOne({ number: 901 })
      assert.equal(String(old.assistidoId), String(maria._id))
      assert.equal(old.preferential, 1)
      assert.equal(old.name, undefined)
      assert.equal(old.legacy_name, 'maria  souza')
      assert.equal(old.legacy_docNumber, '52998224725')
      const t902 = await tk.findOne({ number: 902 })
      assert.equal(t902.type, 'INFORMAÇÕES')
      assert.equal(t902.notaTriagem, 'QUER FALAR COM PATRICIA\nINFORMACAO - BPC')
      // Sem relacao com a dona do CPF: perde o CPF
      const pedro = await db.collection('assistidos').findOne({ _id: (await tk.findOne({ number: 908 })).assistidoId })
      assert.equal(pedro.cpf, null)
      assert.equal((await db.collection('assistidos').findOne({ _id: (await tk.findOne({ number: 903 })).assistidoId })).cpf, null)
      assert.equal((await pessoa('12345678900')).cpfValido, false)
      assert.equal((await pessoa('11144477735')).nascimento, null)
      const hilton = await pessoas({ nomeBusca: 'HILTON SOUZA' })
      assert.equal(hilton.length, 1)
      assert.equal(hilton[0].confirmarNome, true)
      assert.equal((await pessoas({ nomeBusca: 'BERNARDO' })).length, 2)
      assert.equal(await tk.countDocuments({ assistidoId: null }), 0)

      const again = runScript(['scripts/migrate-assistidos.js', '--apply', '--report', report])
      assert.match(again, /Tickets atualizados: 0/)

      // Volta ao formato antigo (rollback): migrados pelo legacy_, novos pelo cadastro
      runScript(['scripts/rollback-assistidos.js', '--confirm'])
      assert.equal((await tk.findOne({ number: 901 })).name, 'maria  souza')
      assert.equal((await ticketDb(tickets['PREF UM']._id)).name, 'PREF UM')
    } finally {
      fs.rmSync(report, { recursive: true, force: true })
    }
  })
})

describe('tipos de atendimento e status do sistema', () => {
  test('lista padrao; so admin altera; renomear troca nas senhas antigas', async () => {
    const padrao = (await req('GET', '/tiposAtendimento', { token: attendant })).data.tipos
    assert.equal(padrao[0], 'INICIAL')
    assert.ok(padrao.includes('OUTROS'))
    assert.equal((await req('PUT', '/tiposAtendimento', { token: attendant, body: { tipos: ['A'] } })).status, 403)
    assert.equal((await req('PUT', '/tiposAtendimento', { token: admin, body: { tipos: ['RETORNO', 'retorno'] } })).status, 400)

    const novos = padrao.map((t) => (t === 'RETORNO' ? 'Retorno do assistido' : t)).concat('VISITA TECNICA')
    const r = await req('PUT', '/tiposAtendimento', { token: admin, body: { tipos: novos, renomear: [{ de: 'RETORNO', para: 'Retorno do assistido' }] } })
    assert.equal(r.status, 200)
    assert.ok(r.data.tipos.includes('RETORNO DO ASSISTIDO'))
    const hist = (await req('GET', `/loadTicketHistory?search=${encodeURIComponent('RETORNO DO ASSISTIDO')}`, { token: attendant })).data
    assert.ok(hist.pagination.total > 0)
    assert.equal((await req('GET', `/loadTicketHistory?search=${encodeURIComponent('^RETORNO$')}`, { token: attendant })).data.pagination.total, 0)
    const log = (await activities(admin, 'tipos_alterados'))[0]
    assert.deepEqual(log.details.incluidos, ['VISITA TECNICA'])
    assert.equal(log.details.renomeados[0].de, 'RETORNO')
  })

  test('senha usa a lista em uso: tipo fora dela vai para OUTROS com o texto na anotacao', async () => {
    const ok = await req('POST', '/insertTicket', { token: attendant, body: {
      number: 80, status: 1, preferential: 0, dateQueue: Date.now(), name: 'Tipo Teste', docNumber: '', type: 'VISITA TECNICA' } })
    const t1 = (await req('GET', `/loadTicket/${ok.data.ticketId}`, { token: attendant })).data.ticket[0]
    assert.equal(t1.type, 'VISITA TECNICA')
    const other = await req('POST', '/insertTicket', { token: attendant, body: {
      number: 81, status: 1, preferential: 0, dateQueue: Date.now(), name: 'Tipo Teste', docNumber: '', type: 'algo novo' } })
    const t2 = (await req('GET', `/loadTicket/${other.data.ticketId}`, { token: attendant })).data.ticket[0]
    assert.equal(t2.type, 'OUTROS')
    assert.equal(t2.notaTriagem, 'algo novo')
  })

  test('status: usuarios conectados e monitor OK so depois do tempo minimo aberto', async () => {
    assert.equal((await req('GET', '/api/status', { token: attendant })).status, 403)
    await connect({ auth: { token: admin } })
    const tv = await connect()
    tv.emit('painelOnline', { usuario: 'TV Recepcao' })
    await sleep(100)
    let s = (await req('GET', '/api/status', { token: admin })).data
    assert.ok(s.usuariosConectados >= 1)
    assert.equal(s.monitor.ok, false)
    await sleep(PANEL_OK_MS + 100)
    s = (await req('GET', '/api/status', { token: admin })).data
    assert.equal(s.monitor.ok, true)
    assert.equal(s.monitor.usuario, 'TV Recepcao')
    tv.close()
    await sleep(150)
    assert.equal((await req('GET', '/api/status', { token: admin })).data.monitor.ok, false)
  })
})

// Por ultimo: bloqueia o login deste IP por 1 minuto
describe('limite de tentativas de login', () => {
  test('logins certos nao contam; erros bloqueiam com 429 e entram no registro', async () => {
    for (let i = 0; i < 6; i++) assert.equal((await login('admin.teste', 'teste123')).status, 200)
    let status
    for (let i = 0; i < 6 && status !== 429; i++) status = (await login('bloqueio.teste', 'x')).status
    assert.equal(status, 429)
    assert.ok((await activities(admin, 'login_bloqueado')).length >= 1)
  })
})
