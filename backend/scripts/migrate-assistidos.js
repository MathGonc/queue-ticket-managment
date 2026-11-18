// Migracao: separa as pessoas (assistidos) dos tickets. Pode rodar de novo:
// so mexe em tickets que ainda nao tem assistidoId.
//
// Uso:
//   npm run migrate-assistidos                     simulacao: numeros + listas, nao grava
//   npm run migrate-assistidos -- --apply          grava (faca um backup antes)
//   opcoes: --db <banco> (padrao: o do backend), --report <pasta> (listas)
//
// Cada ticket passa a ter so o assistidoId; nome/CPF/nascimento vao para
// legacy_name/legacy_docNumber/legacy_assistedAge (sem uso no sistema).
//
// Tickets:
//   - recados no nome ("(QUER FALAR COM...)", "- THIAGO", "ATDM COM...") e o
//     tipo digitado viram a anotacao da triagem; o tipo vira um tipo oficial
//   - preferencial true/false -> 1/0
// Pessoas (decisoes da revisao de nov/2026):
//   - CPF valido: um cadastro. Nome parecido (digitacao, nome parcial) e
//     nome em branco ficam nele. Nome com sobrenome em comum (parente,
//     representante) vira OUTRO cadastro com o mesmo CPF: pendencia que a
//     triagem resolve. Nome sem nada em comum perde o CPF (vai para "sem CPF").
//   - CPF invalido usado por pessoas sem relacao (numero provisorio) -> sem CPF
//   - CPF invalido de uma pessoa: junta no CPF valido com o mesmo nome, ou com
//     CPF a 1 digito e nome parecido; sem candidato, fica (pendencia)
//   - Sem CPF: nome + nascimento, depois so o nome. Nome de 1 palavra: um
//     cadastro por ticket. 2 ou 3 palavras repetidas: um cadastro com
//     "confirmar nome". 4+ palavras: um cadastro.
//   - 000.000.000-00 e sequencias repetidas = sem CPF
//   - Nome do cadastro: o mais completo do titular. Nascimento: o mais
//     frequente, sem as datas que a triagem antiga copiava da senha anterior.
//   - Ticket com primeiro nome diferente do cadastro: "Registrado como: NOME"
//     na anotacao (o nome de quem veio nao se perde).

const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const config = require('../src/config/index.js')
const { buildMongoUri } = require('../src/config/db.js')
const Assistido = require('../src/models/assistido')
const TicketModel = require('../src/models/ticket')
const GlobalModel = require('../src/models/global')
const { isValidCpf } = require('../src/cpf')
const { mapTipo } = require('../src/tipos')
const {
  normalizeName, plain, words, firstName, editDistance, containedName, samePerson, sharesWord, compareNames, splitNameNotes,
} = require('../src/assistidos')

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : fallback
}
const APPLY = process.argv.includes('--apply')

const fmtCpf = (c) => (c && c.length === 11 ? c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : c || '')
const fmtDay = (d) => (d ? new Date(d).toISOString().slice(0, 10).split('-').reverse().join('/') : '')
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
function writeCsv(file, header, rows) {
  fs.writeFileSync(file, '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(';')).join('\r\n') + '\r\n', 'utf8')
}

function cleanCpf(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  return /^(\d)\1*$/.test(digits) ? '' : digits // 000.000.000-00 = sem CPF
}

// A triagem antiga nao limpava a data de nascimento depois de emitir: a
// proxima pessoa podia sair com a data da anterior. Essas nao vao para o cadastro.
function markCarriedBirths(tickets) {
  const last = new Map()
  let count = 0
  for (const t of [...tickets].sort((a, b) => a.dateQueue - b.dateQueue)) {
    const prev = last.get(t.queuedBy || '')
    if (t.birthRaw && prev?.birthRaw && +prev.birthRaw === +t.birthRaw && prev.nome !== t.nome && prev.cpf !== t.cpf) {
      t.birthCarried = true
      count++
    }
    last.set(t.queuedBy || '', t)
  }
  return count
}

// Nascimento do ticket antigo -> dia as 12:00 UTC (a data UTC gravada ja e o
// dia certo). Data impossivel ou copiada da senha anterior fica de fora.
function birthDay(t) {
  if (!t.birthRaw || t.birthCarried) return null
  const d = new Date(t.birthRaw)
  if (isNaN(d) || d.getUTCFullYear() < 1900 || (t.dateQueue && d > t.dateQueue)) return null
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12))
}

// O mais frequente; empate: o de ocorrencia mais recente
function mostFrequent(items, key) {
  const stats = new Map()
  for (const it of items) {
    const k = key(it)
    const s = stats.get(k) || { n: 0, last: 0, item: it }
    s.n++
    if (+it.dateQueue >= s.last) { s.last = +it.dateQueue; s.item = it }
    stats.set(k, s)
  }
  return [...stats.values()].sort((a, b) => b.n - a.n || b.last - a.last)[0]?.item
}

// Nome e nascimento do cadastro a partir dos tickets dele
function personData(tickets) {
  const named = tickets.filter((t) => firstName(t.nome))
  if (!named.length) return { nome: 'SEM NOME', nascimento: null }
  const titular = firstName(mostFrequent(named, (t) => firstName(t.nome)).nome)
  const own = named.filter((t) => firstName(t.nome) === titular)
  const nome = [...own].sort((a, b) => compareNames(b.nome, a.nome) || b.dateQueue - a.dateQueue)[0].nome
  const withBirth = own.map((t) => ({ ...t, birth: birthDay(t) })).filter((t) => t.birth)
  const nascimento = withBirth.length ? mostFrequent(withBirth, (t) => +t.birth).birth : null
  return { nome, nascimento }
}

async function main() {
  const dbName = arg('db', config.dbName)
  const p2 = (n) => String(n).padStart(2, '0')
  const d = new Date()
  const stamp = `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}`
  const reportDir = path.resolve(arg('report', path.resolve(config.dataDir, `migracao-assistidos-${stamp}`)))

  await mongoose.connect(buildMongoUri(dbName), { serverSelectionTimeoutMS: 8000 })
  console.log(`Banco: ${dbName} | modo: ${APPLY ? 'GRAVANDO' : 'simulacao (nada e gravado)'}`)

  // Tickets ainda sem pessoa (os novos ja nascem com assistidoId)
  const raw = await TicketModel.collection.find({ assistidoId: null }).toArray()
  console.log(`Tickets a migrar: ${raw.length}`)

  // 1) Leitura e limpeza de cada ticket
  const counts = { recadoNome: 0, tipoMovido: 0, semCpfRepetido: 0, preferencial: 0 }
  const tickets = raw.map((r) => {
    const { nome, nota: nameNote } = splitNameNotes(r.name)
    const { tipo, nota: typeNote } = mapTipo(r.type)
    const cpf = cleanCpf(r.docNumber)
    if (nameNote) counts.recadoNome++
    if (typeNote) counts.tipoMovido++
    if (!cpf && String(r.docNumber || '').replace(/\D/g, '')) counts.semCpfRepetido++
    if (typeof r.preferential === 'boolean') counts.preferencial++
    return {
      _id: r._id, raw: r, nome, cpf, tipo, dateQueue: r.dateQueue, queuedBy: r.queuedBy, birthRaw: r.assistedAge || null,
      notes: [nameNote, typeNote].filter(Boolean),
    }
  })
  const carried = markCarriedBirths(tickets)
  console.log(`Recados tirados do nome: ${counts.recadoNome} | tipo digitado -> anotacao: ${counts.tipoMovido} | CPF repetido (000...) -> sem CPF: ${counts.semCpfRepetido} | preferencial true/false: ${counts.preferencial} | nascimentos copiados da senha anterior (fora do cadastro): ${carried}`)

  // 2) Agrupamento por CPF
  const byCpf = new Map()
  const pool = [] // sem CPF
  for (const t of tickets) {
    if (!t.cpf) { pool.push(t); continue }
    if (!byCpf.has(t.cpf)) byCpf.set(t.cpf, [])
    byCpf.get(t.cpf).push(t)
  }
  const clusters = [] // { cpf, tickets, extra }
  const stats = { semCpfOutraPessoa: 0, provisorio: 0, parentes: 0 }
  for (const [cpf, list] of byCpf) {
    const titularName = personData(list).nome
    const main = { cpf, tickets: [] }
    const extras = new Map()
    const unrelated = []
    for (const t of list) {
      if (!t.nome || samePerson(t.nome, titularName)) main.tickets.push(t)
      else if (sharesWord(t.nome, titularName) || containedName(t.nome, titularName)) {
        // Parente/representante: cadastro proprio com o mesmo CPF (pendencia)
        const k = firstName(t.nome)
        if (!extras.has(k)) extras.set(k, { cpf, tickets: [], extra: true })
        extras.get(k).tickets.push(t)
      } else unrelated.push(t)
    }
    if (!isValidCpf(cpf) && unrelated.length) {
      // Numero provisorio usado por pessoas sem relacao: todas ficam sem CPF
      stats.provisorio++
      for (const t of list) { t.fromProvisional = true; pool.push(t) }
      continue
    }
    // Nome sem nada em comum com o titular: tira o CPF
    for (const t of unrelated) { stats.semCpfOutraPessoa++; pool.push(t) }
    clusters.push(main)
    for (const e of extras.values()) { stats.parentes++; clusters.push(e) }
  }

  // 3) CPF invalido de uma pessoa -> CPF valido dela (mesmo nome, ou CPF a 1
  //    digito e nome parecido)
  const validClusters = clusters.filter((c) => isValidCpf(c.cpf))
  const nameIndex = new Map()
  for (const c of validClusters) {
    for (const t of c.tickets) {
      const n = plain(t.nome)
      if (n.split(' ').length < 2) continue
      if (!nameIndex.has(n)) nameIndex.set(n, new Set())
      nameIndex.get(n).add(c)
    }
  }
  // Nome de cada cadastro valido calculado uma vez (a busca abaixo compara muitos)
  const nameOf = new Map(validClusters.map((v) => [v, personData(v.tickets).nome]))
  let juntadosInvalidos = 0
  for (const c of clusters.filter((x) => !isValidCpf(x.cpf))) {
    const names = [...new Set(c.tickets.map((t) => plain(t.nome)))]
    let target = names.map((n) => nameIndex.get(n)).find((s) => s?.size === 1)
    target = target ? [...target][0] : null
    if (!target) {
      const nome = personData(c.tickets).nome
      const near = validClusters.filter((v) => !v.extra && Math.abs(v.cpf.length - c.cpf.length) <= 1 && editDistance(v.cpf, c.cpf) <= 1)
        .filter((v) => editDistance(plain(nameOf.get(v)), plain(nome)) <= 3 || containedName(nameOf.get(v), nome))
      if (near.length === 1) target = near[0]
    }
    if (target) {
      target.tickets.push(...c.tickets)
      c.tickets = []
      juntadosInvalidos++
    }
  }

  // Numero provisorio: quem tem o mesmo nome num CPF valido vai para ele
  for (const t of pool.filter((x) => x.fromProvisional)) {
    const target = nameIndex.get(plain(t.nome))
    if (target?.size === 1) {
      ;[...target][0].tickets.push(t)
      t.moved = true
    }
  }

  // 4) Sem CPF: nome + nascimento, depois so o nome
  const people = clusters.filter((c) => c.tickets.length).map((c) => ({ ...c, cpfValido: isValidCpf(c.cpf), confirmarNome: false }))
  const byName = new Map()
  for (const t of pool.filter((x) => !x.moved)) {
    const n = plain(t.nome)
    if (!n || words(t.nome).length < 2) {
      // Nome de 1 palavra (ou em branco): um cadastro por ticket
      people.push({ cpf: null, cpfValido: null, tickets: [t], confirmarNome: false })
      continue
    }
    if (!byName.has(n)) byName.set(n, [])
    byName.get(n).push(t)
  }
  for (const list of byName.values()) {
    // Nascimentos diferentes = pessoas diferentes (sem data: vai com o grupo maior)
    const births = new Map()
    for (const t of list) {
      const b = birthDay(t)
      if (!b) continue
      if (!births.has(+b)) births.set(+b, [])
      births.get(+b).push(t)
    }
    const groups = births.size ? [...births.values()].sort((a, b) => b.length - a.length) : [[]]
    for (const t of list) if (!birthDay(t)) groups[0].push(t)
    for (const g of groups) {
      // 2 ou 3 palavras juntadas so pelo nome: a triagem confirma depois
      const flag = words(g[0].nome).length <= 3 && g.length > 1
      people.push({ cpf: null, cpfValido: null, tickets: g, confirmarNome: flag })
    }
  }

  // 5) Dados de cada cadastro e anotacoes dos tickets
  for (const p of people) {
    Object.assign(p, personData(p.tickets))
    for (const t of p.tickets) {
      if (t.nome && !samePerson(t.nome, p.nome)) t.notes.push(`Registrado como: ${t.nome}`)
    }
  }
  const shared = new Map()
  for (const p of people) if (p.cpf) shared.set(p.cpf, (shared.get(p.cpf) || 0) + 1)
  const pend = {
    cpfCompartilhado: people.filter((p) => p.cpf && shared.get(p.cpf) > 1),
    cpfInvalido: people.filter((p) => p.cpf && !p.cpfValido),
    confirmarNome: people.filter((p) => p.confirmarNome),
  }
  console.log(`Cadastros: ${people.length} (com CPF ${people.filter((p) => p.cpf).length}, sem CPF ${people.filter((p) => !p.cpf).length})`)
  console.log(`Nome sem relacao com o dono do CPF -> sem CPF: ${stats.semCpfOutraPessoa} | numeros provisorios -> sem CPF: ${stats.provisorio} | CPF invalido juntado ao valido: ${juntadosInvalidos}`)
  console.log(`Pendencias: CPF com 2+ cadastros ${new Set(pend.cpfCompartilhado.map((p) => p.cpf)).size} CPFs (${pend.cpfCompartilhado.length} cadastros) | CPF invalido ${pend.cpfInvalido.length} | confirmar nome ${pend.confirmarNome.length}`)

  // Listas das pendencias criadas (com nomes e CPFs: ficam fora do git, em /data)
  fs.mkdirSync(reportDir, { recursive: true })
  const row = (p) => [fmtCpf(p.cpf), p.nome, p.tickets.length, fmtDay(Math.min(...p.tickets.map((t) => +t.dateQueue))), fmtDay(Math.max(...p.tickets.map((t) => +t.dateQueue)))]
  const head = ['CPF', 'Nome', 'Tickets', 'Primeira', 'Ultima']
  writeCsv(path.join(reportDir, 'pendencia-cpf-com-2-cadastros.csv'), head, pend.cpfCompartilhado.sort((a, b) => a.cpf.localeCompare(b.cpf)).map(row))
  writeCsv(path.join(reportDir, 'pendencia-cpf-invalido.csv'), head, pend.cpfInvalido.map(row))
  writeCsv(path.join(reportDir, 'pendencia-confirmar-nome.csv'), head, pend.confirmarNome.map(row))
  console.log(`Listas em ${reportDir}`)

  if (!APPLY) {
    console.log('Simulacao concluida. Para gravar: --apply (faca um backup antes).')
    return
  }

  // 6) Gravacao
  await Assistido.createIndexes()
  await TicketModel.createIndexes() // so cria os que faltam; nao remove os que ja existem
  const now = new Date()
  const docs = people.map((p) => ({
    _id: new mongoose.Types.ObjectId(),
    cpf: p.cpf || null, cpfValido: p.cpf ? p.cpfValido : null,
    nome: normalizeName(p.nome), nomeBusca: plain(p.nome), nascimento: p.nascimento || null,
    confirmarNome: p.confirmarNome, mescladoEm: null, criadoEm: now, atualizadoEm: now,
  }))
  for (let i = 0; i < docs.length; i += 1000) await Assistido.collection.insertMany(docs.slice(i, i + 1000), { ordered: false })

  const ops = []
  people.forEach((p, i) => {
    for (const t of p.tickets) {
      const r = t.raw
      const $set = {
        assistidoId: docs[i]._id,
        type: t.tipo,
        notaTriagem: [r.notaTriagem, ...t.notes].filter(Boolean).join('\n'),
        notaAtendimento: r.notaAtendimento || '',
        legacy_name: r.name ?? null,
        legacy_docNumber: r.docNumber ?? null,
        legacy_assistedAge: r.assistedAge ?? null,
      }
      if (typeof r.preferential === 'boolean') $set.preferential = r.preferential ? 1 : 0
      ops.push({ updateOne: { filter: { _id: t._id }, update: { $set, $unset: { name: '', docNumber: '', assistedAge: '' } } } })
    }
  })
  let modified = 0
  for (let i = 0; i < ops.length; i += 2000) modified += (await TicketModel.collection.bulkWrite(ops.slice(i, i + 2000), { ordered: false })).modifiedCount
  console.log(`Tickets atualizados: ${modified}`)

  // Painel da TV: nomes em maiusculas tambem na chamada atual e na anterior
  const global = await GlobalModel.findOne().lean()
  if (global?.ticket) {
    await GlobalModel.updateOne({ _id: global._id }, { $set: {
      'ticket.currentUser': normalizeName(global.ticket.currentUser),
      'ticket.lastUser': normalizeName(global.ticket.lastUser),
    } })
  }
  console.log(`Assistidos no banco: ${await Assistido.countDocuments()}. Migracao concluida.`)
}

main()
  .catch((error) => {
    console.error('ERRO:', error.message)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())
