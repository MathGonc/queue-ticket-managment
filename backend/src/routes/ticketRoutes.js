const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const { body } = require('express-validator')
const { validate } = require('../middleware/validate')
const TicketModel = require('../models/ticket')
const Assistido = require('../models/assistido')
const logger = require('../config/logger')
const { logActivity } = require('../activity')
const { onlyDigits, isValidCpf } = require('../cpf')
const { getTipos, resolveTipo } = require('../tipos')
const { ACTIVE, plain, splitNameNotes, toBirthDate, personForTicket, PendingError, withPerson } = require('../assistidos')
const { authMiddleware, requireRole } = require('../middleware/auth')

// Cargos: 1 = Monitor, 2 = Atendente, 3 = Administrador
const ROLE_ATTENDANT = 2
const ROLE_ADMIN = 3

// Toda rota de ticket expoe nome/CPF dos assistidos: exige login
router.use(['/loadTicketsInQueue', '/loadTicket', '/insertTicket', '/updateTicketCalled', '/deleteTicket', '/loadTicketHistory', '/tickets'], authMiddleware)

// name/docNumber vem do cadastro da pessoa (assistido)
const HISTORY_SORT_FIELDS = [
  'number', 'name', 'docNumber', 'type', 'queuedBy', 'dateQueue', 'servicedBy', 'dateServiced',
]
const PERSON_SORT = { name: 'pessoa.nome', docNumber: 'pessoa.cpf' }

// So os campos da chamada (o resto do corpo e ignorado)
const CALL_FIELDS = ['status', 'servicedBy', 'dateServiced', 'servicedTable']
const pick = (obj, fields) => Object.fromEntries(fields.filter((f) => obj[f] !== undefined).map((f) => [f, obj[f]]))
const NOTE_MAX = 1000

router.get('/loadTicketsInQueue', async (req, res) => {
  try {
    const limitDate = new Date()
    limitDate.setDate(limitDate.getDate() - 7)

    const ticket = await TicketModel.find({
      ...ACTIVE,
      dateQueue: { $gte: limitDate },
    }).lean()

    // fila: prioridade (2 > 1 > 0) e chegada; atendidas: mais recente primeiro
    const sortedTickets = ticket.sort((a, b) => {
      if (a.status === 1 && b.status === 1) {
        if (a.preferential !== b.preferential) return b.preferential - a.preferential
        return new Date(a.dateQueue) - new Date(b.dateQueue)
      } else if (a.status === 2 && b.status === 2) {
        return new Date(b.dateServiced) - new Date(a.dateServiced)
      }
      return a.status - b.status
    })

    // Pessoa e "visitas" de cada senha: o (i) da barra lateral
    return res.status(200).json({ ticket: await withPerson(sortedTickets) })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/loadTicket/:id', async (req, res) => {
  try {
    const ticket = await TicketModel.find({ ...ACTIVE, _id: req.params.id }).lean()
    return res.status(200).json({ ticket: await withPerson(ticket) })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Emissao. A pessoa vem de assistidoId (escolhida na triagem) ou de cpf/nome/
// nascimento (pessoa nova). Os nomes antigos dos campos (name, docNumber,
// assistedAge) tambem sao aceitos: uma tela antiga aberta continua emitindo.
router.post('/insertTicket', requireRole(ROLE_ATTENDANT), [
  body('number').isInt().withMessage('Número da senha inválido'),
  body('status').isInt().withMessage('Status inválido'),
  body('assistidoId').optional({ values: 'falsy' }).custom((id) => mongoose.isValidObjectId(id)).withMessage('Cadastro inválido'),
  body('cpf').optional({ values: 'falsy' }).customSanitizer(onlyDigits)
    .custom(isValidCpf).withMessage('CPF inválido: confira os números'),
  body('docNumber').optional({ values: 'falsy' }).customSanitizer(onlyDigits)
    .custom(isValidCpf).withMessage('CPF inválido: confira os números'),
  body(['nascimento', 'assistedAge']).optional({ values: 'falsy' }).customSanitizer(toBirthDate)
    .custom((date) => date && date.getUTCFullYear() >= 1900 && date <= new Date())
    .withMessage('Data de nascimento inválida'),
  body('notaTriagem').optional().isString().isLength({ max: NOTE_MAX }).withMessage('Anotação muito longa'),
  validate
], async (req, res) => {
  try {
    const b = req.body
    // Recados escritos no nome viram anotacao
    const { nome, nota: nameNote } = splitNameNotes(b.nome ?? b.name)
    if (!b.assistidoId && !nome) return res.status(400).json({ errors: [{ msg: 'Digite um nome' }] })
    const { tipo, nota: typeNote } = resolveTipo(b.type, await getTipos())
    let person
    try {
      person = await personForTicket({
        assistidoId: b.assistidoId || null,
        cpf: b.cpf || b.docNumber || '',
        nome,
        nascimento: b.nascimento || b.assistedAge || null,
      })
    } catch (error) {
      if (error instanceof PendingError) return res.status(409).json({ errors: [{ msg: error.message }] })
      throw error
    }
    const assistidoId = person._id
    // Nome digitado que nao e o do cadastro (representante?) nao se perde
    const notaTriagem = [
      String(b.notaTriagem || '').trim(), nameNote, typeNote, person.registradoComo && `Registrado como: ${person.registradoComo}`,
    ].filter(Boolean).join('\n')

    const ticket = await TicketModel.create({
      number: b.number,
      status: b.status,
      preferential: Number(b.preferential) || 0,
      assistidoId,
      type: tipo,
      queuedBy: b.queuedBy,
      dateQueue: b.dateQueue,
      notaTriagem,
    })
    logActivity(req, 'senha_emitida', {
      numero: ticket.number, preferencial: ticket.preferential, tipo: ticket.type || '', ticketId: String(ticket._id),
    })
    return res.status(200).json({ ticketId: ticket._id, assistidoId })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/updateTicketCalled/:id', async (req, res) => {
  try {
    const _id = req.params.id,
      data = pick(req.body, CALL_FIELDS)
    const before = await TicketModel.findOne({ ...ACTIVE, _id }).select('status number dateQueue preferential').lean()
    if (!before) return res.status(404).json({ error: 'Senha não encontrada' })
    await TicketModel.updateOne({ _id }, { $set: data })

    // Chamada pelo guiche (status 2). Se ja estava atendida, e uma rechamada.
    if (Number(data.status) === 2) {
      const recall = before.status === 2
      const details = { numero: before.number, preferencial: before.preferential, guiche: data.servicedTable ?? null, ticketId: String(_id) }
      if (!recall && data.dateServiced) details.esperaMs = new Date(data.dateServiced) - new Date(before.dateQueue)
      logActivity(req, recall ? 'senha_rechamada' : 'senha_chamada', details)
    }

    return res.status(200).json({})
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Anotacao do atendimento (painel de atendimento)
router.put('/tickets/:id/notaAtendimento', requireRole(ROLE_ATTENDANT), [
  body('notaAtendimento').isString().isLength({ max: NOTE_MAX }).withMessage('Anotação muito longa'),
  validate
], async (req, res) => {
  try {
    const result = await TicketModel.updateOne({ ...ACTIVE, _id: req.params.id }, { $set: { notaAtendimento: req.body.notaAtendimento.trim() } })
    if (!result.matchedCount) return res.status(404).json({ error: 'Senha não encontrada' })
    return res.status(200).json({})
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Excluir so oculta: o ticket continua no banco com quem e quando excluiu
router.delete('/deleteTicket/:id', requireRole(ROLE_ADMIN), async (req, res) => {
  try {
    const _id = req.params.id
    const removed = await TicketModel.findOneAndUpdate(
      { ...ACTIVE, _id },
      { $set: { deletedAt: new Date(), deletedBy: req.user?.username || '' } },
    ).lean()
    if (removed) logActivity(req, 'senha_excluida', { numero: removed.number, status: removed.status, ticketId: String(_id) })

    return res.status(200).json({})
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/loadTicketHistory', requireRole(ROLE_ATTENDANT), async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 10000)
    const search = String(req.query.search || '').trim()
    const startDate = req.query.startDate
    const endDate = req.query.endDate
    const sortField = HISTORY_SORT_FIELDS.includes(req.query.sortField) ? req.query.sortField : 'dateQueue'
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1

    const query = { ...ACTIVE }

    if (search) {
      // Escapa caracteres especiais: a busca e por texto, nao por regex
      const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const pattern = { $regex: escape(search), $options: 'i' }
      // Nome e CPF estao no cadastro da pessoa
      const people = await Assistido.find({
        $or: [
          ...(plain(search) ? [{ nomeBusca: { $regex: escape(plain(search)) } }] : []),
          ...(onlyDigits(search) ? [{ cpf: { $regex: escape(onlyDigits(search)) } }] : []),
        ],
      }).select('_id').lean()
      query.$or = [
        { assistidoId: { $in: people.map((p) => p._id) } },
        { type: pattern },
        { queuedBy: pattern },
        { servicedBy: pattern },
        { notaTriagem: pattern },
        { notaAtendimento: pattern },
      ]
      // A busca do historico original tambem encontrava pelo numero da senha
      if (/^\d+$/.test(search)) {
        query.$or.push({ number: Number(search) })
      }
    }

    if (startDate && endDate) {
      query.dateServiced = { $gte: new Date(startDate), $lte: new Date(endDate) }
    }

    const total = await TicketModel.countDocuments(query)
    const window = [{ $skip: (page - 1) * limit }, { $limit: limit }]
    const lookup = { $lookup: { from: 'assistidos', localField: 'assistidoId', foreignField: '_id', as: 'pessoa' } }
    // Ordenar por nome/CPF precisa da pessoa antes; o resto ordena so a pagina
    const pipeline = PERSON_SORT[sortField]
      ? [{ $match: query }, lookup, { $sort: { [PERSON_SORT[sortField]]: sortOrder, _id: 1 } }, ...window, { $project: { pessoa: 0 } }]
      : [{ $match: query }, { $sort: { [sortField]: sortOrder, _id: 1 } }, ...window]
    const tickets = await TicketModel.aggregate(pipeline)

    // Calculate stats for the filtered set
    const stats = await TicketModel.aggregate([
      { $match: query },
      { $match: { dateServiced: { $ne: null } } },
      { $group: {
        _id: null,
        totalComplete: { $sum: 1 },
        avgWaitTime: { $avg: { $subtract: ['$dateServiced', '$dateQueue'] } }
      }}
    ])

    return res.status(200).json({
      // Pessoa e "visitas" de cada senha: o (i) do historico ("3a de 7")
      ticket: await withPerson(tickets),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: stats[0] || { totalComplete: 0, avgWaitTime: 0 }
    })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
