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
    await issue('Normal Um', 0, '11122233344')
    await issue('Pref Um', 1, '22233344455')
    await issue('Super Um', 2, '')
    await issue('Normal Dois', 0, '')
  })

  test('nome vazio -> 400 "Digite um nome"', async () => {
    const r = await req('POST', '/insertTicket', { token: attendant, body: { number: 99, status: 1, name: '   ', preferential: 0, dateQueue: Date.now() } })
    assert.equal(r.status, 400)
    assert.equal(r.data.errors[0].msg, 'Digite um nome')
  })

  test('fila na ordem 2 > 1 > 0 e por chegada, numeracao sequencial, CPF gravado', async () => {
    const queue = (await req('GET', '/loadTicketsInQueue', { token: attendant })).data.ticket.filter((t) => t.status === 1)
    assert.deepEqual(queue.map((t) => t.name), ['Super Um', 'Pref Um', 'Normal Um', 'Normal Dois'])
    assert.deepEqual(queue.map((t) => t.number).sort(), [1, 2, 3, 4])
    assert.equal(queue.find((t) => t.name === 'Normal Um').docNumber, '11122233344')
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
    const t = tickets['Super Um']
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
    assert.equal(panel.currentUser, 'Super Um')
    assert.equal(panel.currentTable, 5)
    assert.equal((await req('GET', `/loadTicket/${ticket._id}`, { token: attendant })).data.ticket[0].servicedTable, 5)

    const call = (await activities(admin, 'senha_chamada'))[0]
    assert.equal(call.details.guiche, 5)
    assert.equal(call.details.preferencial, 2)
    assert.equal(call.login, 'atendente.teste')
    assert.ok(call.details.esperaMs >= 0)
  })

  test('chamar de novo vira "senha_rechamada"', async () => {
    const t = (await req('GET', `/loadTicket/${tickets['Super Um']._id}`, { token: attendant })).data.ticket[0]
    await req('PUT', `/updateTicketCalled/${t._id}`, { token: attendant, body: { ...t, status: 2, servicedTable: 5, dateServiced: new Date() } })
    assert.equal((await activities(admin, 'senha_rechamada')).length, 1)
  })

  test('proxima da fila passa a ser a preferencial', async () => {
    const queue = (await req('GET', '/loadTicketsInQueue', { token: attendant })).data.ticket
    assert.equal(queue[0].name, 'Pref Um')
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
    const r = await req('GET', `/loadTicketHistory?search=${tickets['Super Um'].number}`, { token: attendant })
    assert.ok(r.data.ticket.some((t) => t.name === 'Super Um'))
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
    assert.equal((await req('DELETE', `/deleteTicket/${tickets['Normal Dois']._id}`, { token: admin })).status, 200)
    assert.equal((await activities(admin, 'senha_excluida'))[0].details.numero, tickets['Normal Dois'].number)
  })

  test('logout registrado', async () => {
    assert.equal((await req('POST', '/auth/logout', { token: monitor })).status, 200)
    assert.equal((await activities(admin, 'logout'))[0].login, 'monitor.teste')
  })
})

describe('registro de atividades', () => {
  test('nao guarda nome nem CPF do assistido', async () => {
    const all = JSON.stringify(await activities(admin))
    for (const secret of ['Super Um', 'Pref Um', 'Normal Um', '11122233344', '22233344455']) {
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
