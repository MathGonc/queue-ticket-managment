// Regras dos assistidos (pessoas): nome, nascimento, identificacao, pendencias,
// juncao de cadastros e os dados da pessoa nas respostas de ticket. Usado pelas
// rotas e pela migracao (scripts/migrate-assistidos.js).
const Assistido = require('./models/assistido')
const TicketModel = require('./models/ticket')
const { isValidCpf } = require('./cpf')

// Ticket excluido so fica oculto; cadastro juntado a outro tambem
const ACTIVE = { deletedAt: null }
const ACTIVE_PERSON = { mescladoEm: null }

// Dia "do calendario" no fuso do servidor (o mesmo das estatisticas diarias)
const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' })
const dayKey = (date) => dayFormat.format(new Date(date))

// ---------- Nomes

// Sempre em maiusculas, sem espacos sobrando (acentos ficam: JOSÉ)
function normalizeName(value) {
  return String(value ?? '').normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleUpperCase('pt-BR')
}

// Sem acento e sem pontuacao: para comparar e buscar (JOSÉ = JOSE)
const plain = (name) => normalizeName(name).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z ]/g, ' ').replace(/\s+/g, ' ').trim()

const PARTICLES = new Set(['DA', 'DE', 'DO', 'DAS', 'DOS', 'E', 'DEL', 'LA'])
// Palavras que contam (sem "da", "de", "dos"... e sem letras soltas)
const words = (name) => plain(name).split(' ').filter((w) => w.length >= 2 && !PARTICLES.has(w))

function firstName(name) {
  return plain(name).split(' ')[0] || ''
}

// Distancia de edicao (troca de duas letras vizinhas conta 1)
function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
    }
  }
  return d[a.length][b.length]
}

// Palavras parecidas: ate 1 letra de erro, ou 2 em palavras de 5+ letras
const similarWord = (x, y) => editDistance(x, y) <= (Math.min(x.length, y.length) >= 5 ? 2 : 1)

// O nome menor cabe no maior (todas as palavras, ou a maioria quando sao 3+)
function containedName(a, b) {
  const [s, l] = words(a).length <= words(b).length ? [words(a), words(b)] : [words(b), words(a)]
  const hit = s.filter((x) => l.some((y) => similarWord(x, y))).length
  return s.length > 0 && (hit === s.length || (s.length >= 3 && hit >= s.length - 1))
}

// Primeiro nome bate (com erro de digitacao) ou aparece no outro nome
function sameFirst(a, b) {
  const wa = words(a)
  const wb = words(b)
  if (!wa.length || !wb.length) return false
  return similarWord(wa[0], wb[0]) || wb.some((y) => similarWord(wa[0], y)) || wa.some((x) => similarWord(x, wb[0]))
}

// Mesma pessoa escrita de outro jeito (digitacao, abreviacao, nome parcial)
function samePerson(a, b) {
  if (firstName(a) && firstName(a) === firstName(b)) return true
  return editDistance(plain(a), plain(b)) <= 2 || (containedName(a, b) && sameFirst(a, b))
}

// Alguma palavra em comum (sobrenome): parente ou representante?
const sharesWord = (a, b) => words(a).some((w) => words(b).includes(w))

// "Mais completo": mais palavras inteiras; depois menos abreviacoes
// ("M.", "S"); depois mais letras. > 0 quando a e mais completo que b.
function nameScore(name) {
  const parts = normalizeName(name).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z. ]/g, ' ').split(' ').filter(Boolean)
  const abbr = parts.filter((w) => w.endsWith('.') || w.replace(/\./g, '').length < 2)
  return { full: parts.length - abbr.length, abbr: abbr.length, letters: plain(name).replace(/ /g, '').length }
}

function compareNames(a, b) {
  const x = nameScore(a)
  const y = nameScore(b)
  return x.full - y.full || y.abbr - x.abbr || x.letters - y.letters
}

// Recados que a equipe escrevia no campo do nome viram anotacao:
// "(QUER FALAR COM PATRICIA)", "- THIAGO OU PATY", "ATDM COM PATRICIA"...
const NOTE_WORDS = ['ATENDIMENTO', 'ATDM', 'ATEND', 'PREFERENCIA', 'PREFERENCIAL', 'REPRESENTANTE', 'NATURALIZACAO',
  'CIUDADANIA', 'FALECIDO', 'FALECIDA', 'CURATELADO', 'CURATELADA', 'CURADOR', 'CURADORA']

function splitNameNotes(raw) {
  const notes = []
  let text = String(raw ?? '').normalize('NFC')
  // Entre parenteses (inclusive um parentese que ficou aberto)
  text = text.replace(/\(([^)]*)\)?/g, (_, inner) => {
    if (inner.trim()) notes.push(inner.trim())
    return ' '
  })
  // Depois de " - " ou "|"
  const cut = text.search(/\s[-–]\s?|\s?[-–]\s|\|/)
  if (cut > 0) {
    const rest = text.slice(cut).replace(/^[\s\-–|]+/, '').trim()
    if (rest) notes.push(rest)
    text = text.slice(0, cut)
  }
  // A partir de uma palavra de recado ("ATDM COM PATRICIA", "QUER FALAR...")
  const parts = text.trim().split(/\s+/)
  const at = parts.findIndex((p, i) => {
    const w = p.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
    return (i > 0 && NOTE_WORDS.includes(w)) || (w === 'QUER' && /^FALAR$/i.test(parts[i + 1] || ''))
  })
  if (at > 0) {
    notes.unshift(parts.slice(at).join(' '))
    text = parts.slice(0, at).join(' ')
  }
  let nome = normalizeName(text).replace(/[\s.,;:*/-]+$/, '')
  // Sem nenhuma letra (ex.: o CPF digitado no campo do nome)
  if (!/[A-ZÀ-Ý]/.test(nome)) {
    if (nome) notes.unshift(nome)
    nome = ''
  }
  return { nome, nota: notes.join(' | ') }
}

// ---------- Data de nascimento

// Dia, gravado as 12:00 UTC. Aceita "AAAA-MM-DD" (triagem nova) ou um
// instante (triagem antiga: o dia no fuso do servidor).
function toBirthDate(value) {
  if (value == null || value === '') return null
  let ymd = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
  if (!ymd) {
    const date = new Date(value)
    if (isNaN(date)) return null
    ymd = dayKey(date)
  }
  const [y, m, d] = ymd.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d, 12))
  return isNaN(date) ? null : date
}

const birthDateString = (date) => (date ? new Date(date).toISOString().slice(0, 10) : null)

// ---------- Cadastro

// Campos de nome sempre juntos (nomeBusca: busca sem acento)
const nameFields = (nome) => ({ nome: normalizeName(nome), nomeBusca: plain(nome) })

async function createPerson({ cpf, nome, nascimento, confirmarNome = false }) {
  const now = new Date()
  const created = await Assistido.create({
    ...nameFields(nome), cpf: cpf || null, cpfValido: cpf ? isValidCpf(cpf) : null,
    nascimento: nascimento || null, confirmarNome, criadoEm: now, atualizadoEm: now,
  })
  return created.toObject()
}

// Segue as juncoes ate o cadastro ativo
async function activePerson(id) {
  let pessoa = await Assistido.findById(id).lean()
  for (let i = 0; pessoa?.mescladoEm && i < 10; i++) pessoa = await Assistido.findById(pessoa.mescladoEm).lean()
  return pessoa && !pessoa.mescladoEm ? pessoa : null
}

// Pendencias "para resolver antes da triagem"
async function pendencias(pessoas) {
  const cpfs = [...new Set(pessoas.map((p) => p.cpf).filter(Boolean))]
  const shared = new Map()
  if (cpfs.length) {
    const rows = await Assistido.aggregate([
      { $match: { ...ACTIVE_PERSON, cpf: { $in: cpfs } } },
      { $group: { _id: '$cpf', n: { $sum: 1 } } },
    ])
    for (const r of rows) shared.set(r._id, r.n)
  }
  return new Map(pessoas.map((p) => {
    const list = []
    if ((shared.get(p.cpf) || 0) > 1) list.push({ tipo: 'cpf_compartilhado', texto: `Este CPF tem ${shared.get(p.cpf)} cadastros: escolha o nome correto` })
    if (p.cpf && p.cpfValido === false) list.push({ tipo: 'cpf_invalido', texto: 'CPF do cadastro é inválido: digite o CPF correto ou marque "Sem CPF"' })
    if (p.confirmarNome) list.push({ tipo: 'confirmar_nome', texto: 'Nome juntado de senhas sem CPF: confirme o nome completo' })
    return [String(p._id), list]
  }))
}

// Junta os cadastros "sources" no "target": os tickets passam para o target.
// Se o primeiro nome era outro, o ticket ganha "Registrado como: NOME" na
// anotacao da triagem (o nome de quem veio nao se perde).
async function mergePeople(targetId, sourceIds) {
  const target = await Assistido.findById(targetId).lean()
  const sources = await Assistido.find({ ...ACTIVE_PERSON, _id: { $in: sourceIds.filter((id) => String(id) !== String(targetId)) } }).lean()
  const now = new Date()
  for (const s of sources) {
    if (!samePerson(s.nome, target.nome)) await appendTriageNote({ assistidoId: s._id }, `Registrado como: ${s.nome}`)
    await TicketModel.updateMany({ assistidoId: s._id }, { $set: { assistidoId: target._id } })
    await Assistido.updateOne({ _id: s._id }, { $set: { mescladoEm: target._id, atualizadoEm: now } })
  }
  return sources.length
}

// Acrescenta uma linha na anotacao da triagem dos tickets do filtro
function appendTriageNote(filter, text) {
  return TicketModel.updateMany(filter, [{
    $set: {
      notaTriagem: {
        $cond: [
          { $gt: [{ $strLenCP: { $ifNull: ['$notaTriagem', ''] } }, 0] },
          { $concat: ['$notaTriagem', '\n', text] },
          text,
        ],
      },
    },
  }], { updatePipeline: true })
}

// Pessoa da senha que esta sendo emitida (rota /insertTicket):
// - assistidoId: a pessoa escolhida na triagem (nascimento alterado = correcao)
// - CPF: o cadastro desse CPF; nenhum = cria; mais de um = pendencia
// - Sem CPF: pessoa nova (a triagem escolhe um cadastro existente pelo seletor)
// Devolve { _id, registradoComo } (nome digitado que nao e o do cadastro)
class PendingError extends Error {}

async function personForTicket({ assistidoId, cpf, nome, nascimento }) {
  const now = new Date()
  if (assistidoId) {
    const pessoa = await activePerson(assistidoId)
    if (!pessoa) throw new PendingError('Cadastro não encontrado: selecione a pessoa de novo')
    if (nascimento && +nascimento !== +pessoa.nascimento) {
      await Assistido.updateOne({ _id: pessoa._id }, { $set: { nascimento, atualizadoEm: now } })
    }
    return { _id: pessoa._id, registradoComo: '' }
  }
  if (cpf) {
    const list = await Assistido.find({ ...ACTIVE_PERSON, cpf }).lean()
    if (list.length > 1) throw new PendingError('Este CPF tem mais de um cadastro: resolva a pendência antes de emitir')
    if (list.length === 1) {
      const pessoa = list[0]
      const set = {}
      // Tela antiga (nome livre): so troca por um mais completo da mesma pessoa
      if (nome && samePerson(nome, pessoa.nome) && compareNames(nome, pessoa.nome) > 0) Object.assign(set, nameFields(nome))
      if (nascimento && +nascimento !== +pessoa.nascimento) set.nascimento = nascimento
      if (Object.keys(set).length) await Assistido.updateOne({ _id: pessoa._id }, { $set: { ...set, atualizadoEm: now } })
      // Outra pessoa com este CPF (representante?): o nome digitado nao se perde
      return { _id: pessoa._id, registradoComo: nome && !samePerson(nome, pessoa.nome) ? nome : '' }
    }
  }
  return { _id: (await createPerson({ cpf, nome, nascimento }))._id, registradoComo: '' }
}

// ---------- Visitas e dados da pessoa nas respostas

// Dias com atendimento de cada pessoa (duas senhas no mesmo dia = 1 visita),
// em ordem. Map assistidoId -> [{ dia, data, tipo }]
async function visitDays(assistidoIds) {
  const ids = [...new Set(assistidoIds.filter(Boolean).map(String))]
  const map = new Map()
  if (!ids.length) return map
  const rows = await TicketModel.find({ ...ACTIVE, assistidoId: { $in: ids } })
    .select('assistidoId dateQueue type servicedBy').sort({ dateQueue: 1 }).lean()
  for (const row of rows) {
    const key = String(row.assistidoId)
    if (!map.has(key)) map.set(key, [])
    const days = map.get(key)
    const dia = dayKey(row.dateQueue)
    const last = days[days.length - 1]
    // Um item por dia: a data e a da primeira senha; tipo e atendente, da ultima
    if (last?.dia !== dia) days.push({ dia, data: row.dateQueue, tipo: row.type || '', atendente: row.servicedBy || '' })
    else {
      if (row.type) last.tipo = row.type
      if (row.servicedBy) last.atendente = row.servicedBy
    }
  }
  return map
}

// Acrescenta em cada ticket a pessoa (name, docNumber, assistedAge, como as
// telas ja liam) e as visitas: esta foi a N-esima de quantas, a primeira, a
// ultima e a anterior a esta (com o tipo)
async function withPerson(tickets) {
  const ids = [...new Set(tickets.map((t) => t.assistidoId).filter(Boolean).map(String))]
  const people = new Map((await Assistido.find({ _id: { $in: ids } }).select('nome cpf nascimento').lean()).map((p) => [String(p._id), p]))
  const days = await visitDays(ids)
  return tickets.map((t) => {
    const pessoa = people.get(String(t.assistidoId))
    const base = { ...t, name: pessoa?.nome || '', docNumber: pessoa?.cpf || '', assistedAge: pessoa?.nascimento || null }
    const list = days.get(String(t.assistidoId))
    const i = list ? list.findIndex((d) => d.dia === dayKey(t.dateQueue)) : -1
    if (i < 0) return { ...base, visitas: null }
    const previous = i > 0 ? list[i - 1] : null
    return {
      ...base,
      visitas: {
        numero: i + 1,
        total: list.length,
        primeira: list[0].data,
        ultima: list[list.length - 1].data,
        anterior: previous && { data: previous.data, tipo: previous.tipo },
      },
    }
  })
}

// Resumo de cadastros para a triagem (sugestoes, seletor de pendencias)
async function summaries(pessoas) {
  const days = await visitDays(pessoas.map((p) => p._id))
  const pend = await pendencias(pessoas)
  return pessoas.map((p) => {
    const list = days.get(String(p._id)) || []
    const last = list[list.length - 1]
    return {
      _id: p._id,
      nome: p.nome,
      cpf: p.cpf || '',
      nascimento: birthDateString(p.nascimento),
      visitas: list.length,
      ultima: last ? { data: last.data, tipo: last.tipo, atendente: last.atendente } : null,
      pendencias: pend.get(String(p._id)) || [],
    }
  })
}

module.exports = {
  ACTIVE, ACTIVE_PERSON, TIMEZONE, dayKey,
  normalizeName, plain, words, firstName, editDistance, similarWord, containedName, sameFirst, samePerson, sharesWord,
  compareNames, splitNameNotes, toBirthDate, birthDateString,
  nameFields, createPerson, activePerson, pendencias, mergePeople, appendTriageNote, PendingError, personForTicket,
  visitDays, withPerson, summaries,
}
