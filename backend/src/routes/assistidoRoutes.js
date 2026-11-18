const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const { body } = require('express-validator')
const { validate } = require('../middleware/validate')
const Assistido = require('../models/assistido')
const TicketModel = require('../models/ticket')
const logger = require('../config/logger')
const { logActivity } = require('../activity')
const { onlyDigits, isValidCpf } = require('../cpf')
const {
  ACTIVE, ACTIVE_PERSON, dayKey, plain, splitNameNotes, toBirthDate, nameFields, createPerson, activePerson,
  mergePeople, summaries,
} = require('../assistidos')
const { authMiddleware, requireRole } = require('../middleware/auth')

const ROLE_ATTENDANT = 2
const MAX_SUGGESTIONS = 8

router.use('/assistidos', authMiddleware, requireRole(ROLE_ATTENDANT))

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Mais recentes primeiro (ultima visita)
function byLastVisit(list) {
  return list.sort((a, b) => (b.ultima ? +new Date(b.ultima.data) : 0) - (a.ultima ? +new Date(a.ultima.data) : 0))
}

// Senhas de hoje (no fuso do servidor) destas pessoas: aviso de duplicidade
async function ticketsToday(ids) {
  if (!ids.length) return []
  const since = new Date(Date.now() - 36 * 3600e3)
  const today = dayKey(new Date())
  const rows = await TicketModel.find({ ...ACTIVE, assistidoId: { $in: ids }, dateQueue: { $gte: since } })
    .select('number dateQueue status assistidoId').sort({ dateQueue: 1 }).lean()
  return rows.filter((t) => dayKey(t.dateQueue) === today)
    .map((t) => ({ number: t.number, dateQueue: t.dateQueue, status: t.status, assistidoId: t.assistidoId }))
}

// GET /assistidos/sugestoes?cpf=123  ou  ?nome=mar sil
// Enquanto digita: CPF pelo comeco; nome por palavras (cada palavra digitada
// casa com o comeco de alguma palavra do nome, sem acento). Ate 8, os mais
// recentes primeiro, com as pendencias de cada um.
router.get('/assistidos/sugestoes', async (req, res) => {
  try {
    const cpf = onlyDigits(req.query.cpf)
    const nome = plain(req.query.nome)
    let filter
    if (cpf.length >= 3) filter = { cpf: { $regex: `^${cpf}` } }
    else if (nome.replace(/ /g, '').length >= 3) {
      filter = { $and: nome.split(' ').map((w) => ({ nomeBusca: { $regex: `(^| )${escape(w)}` } })) }
    } else return res.json({ sugestoes: [] })
    const found = await Assistido.find({ ...ACTIVE_PERSON, ...filter }).limit(60).lean()
    const list = byLastVisit(await summaries(found)).slice(0, MAX_SUGGESTIONS)
    return res.json({ sugestoes: list })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /assistidos/triagem?id=...  |  ?cpf=...  |  ?nome=... (Sem CPF)
// O que a triagem precisa depois de escolher/digitar a pessoa:
// - candidatos: os cadastros possiveis (1 = a pessoa; 2+ = seletor de pendencia)
// - hoje: senhas que eles ja tiraram hoje (aviso de duplicidade)
// Com id, vem tambem os outros cadastros do mesmo CPF (pendencia).
router.get('/assistidos/triagem', async (req, res) => {
  try {
    let candidatos = []
    if (req.query.id) {
      if (!mongoose.isValidObjectId(req.query.id)) return res.status(400).json({ error: 'Cadastro inválido' })
      const pessoa = await activePerson(req.query.id)
      if (!pessoa) return res.status(404).json({ error: 'Cadastro não encontrado' })
      const others = pessoa.cpf ? await Assistido.find({ ...ACTIVE_PERSON, cpf: pessoa.cpf, _id: { $ne: pessoa._id } }).lean() : []
      candidatos = [pessoa, ...others]
    } else if (req.query.cpf) {
      const cpf = onlyDigits(req.query.cpf)
      if (!isValidCpf(cpf)) return res.status(400).json({ error: 'CPF inválido' })
      candidatos = await Assistido.find({ ...ACTIVE_PERSON, cpf }).lean()
    } else if (req.query.nome) {
      const nome = plain(splitNameNotes(req.query.nome).nome)
      if (!nome) return res.status(400).json({ error: 'Informe o nome' })
      candidatos = await Assistido.find({ ...ACTIVE_PERSON, nomeBusca: nome }).lean()
    } else {
      return res.status(400).json({ error: 'Informe a pessoa, o CPF ou o nome' })
    }
    const list = await summaries(candidatos)
    // Com id, o escolhido fica primeiro; nos outros casos, o mais recente
    const ordered = req.query.id ? [list[0], ...byLastVisit(list.slice(1))] : byLastVisit(list)
    return res.json({ candidatos: ordered, hoje: await ticketsToday(candidatos.map((p) => p._id)) })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /assistidos/resolver - "Confirmar" do bloco de pendencias
// Define quem a pessoa e (nome, CPF valido ou Sem CPF, nascimento) e junta a
// ela os outros cadastros indicados e os que tiverem o mesmo CPF.
//   { manterId?, juntarIds: [], nome, cpf? | semCpf: true, nascimento? }
// Sem manterId, cria a pessoa (ex.: "pessoa nova" no seletor).
router.post('/assistidos/resolver', [
  body('nome').isString().trim().notEmpty().withMessage('Digite o nome'),
  body('cpf').optional({ values: 'falsy' }).customSanitizer(onlyDigits).custom(isValidCpf).withMessage('CPF inválido: confira os números'),
  body('semCpf').optional().isBoolean(),
  body('manterId').optional({ values: 'falsy' }).custom((id) => mongoose.isValidObjectId(id)).withMessage('Cadastro inválido'),
  body('juntarIds').optional().isArray(),
  body('juntarIds.*').custom((id) => mongoose.isValidObjectId(id)).withMessage('Cadastro inválido'),
  body('nascimento').optional({ values: 'falsy' }).customSanitizer(toBirthDate)
    .custom((date) => date && date.getUTCFullYear() >= 1900 && date <= new Date()).withMessage('Data de nascimento inválida'),
  validate
], async (req, res) => {
  try {
    const { manterId, semCpf } = req.body
    const cpf = req.body.cpf || null
    // CPF e opcional, mas tem que ser escolhido: valido ou "Sem CPF"
    if (!cpf && semCpf !== true) return res.status(400).json({ errors: [{ msg: 'Digite o CPF ou marque "Sem CPF"' }] })
    const { nome } = splitNameNotes(req.body.nome)
    if (!nome) return res.status(400).json({ errors: [{ msg: 'Digite o nome' }] })

    let pessoa
    if (manterId) {
      pessoa = await activePerson(manterId)
      if (!pessoa) return res.status(404).json({ errors: [{ msg: 'Cadastro não encontrado' }] })
    } else {
      pessoa = await createPerson({ cpf, nome, nascimento: req.body.nascimento || null })
    }

    const set = { ...nameFields(nome), cpf, cpfValido: cpf ? true : null, confirmarNome: false, atualizadoEm: new Date() }
    if (req.body.nascimento) set.nascimento = req.body.nascimento
    await Assistido.updateOne({ _id: pessoa._id }, { $set: set })

    // Os indicados e todos os outros com o mesmo CPF viram esta pessoa
    const sameCpf = cpf ? await Assistido.find({ ...ACTIVE_PERSON, cpf, _id: { $ne: pessoa._id } }).select('_id').lean() : []
    const juntar = [...(req.body.juntarIds || []), ...sameCpf.map((p) => p._id)]
    const juntados = juntar.length ? await mergePeople(pessoa._id, juntar) : 0
    logActivity(req, 'cadastro_resolvido', { juntados, comCpf: !!cpf, novo: !manterId })

    const [resumo] = await summaries([await Assistido.findById(pessoa._id).lean()])
    return res.json({ assistido: resumo, juntados })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
