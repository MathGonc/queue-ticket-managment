const express = require('express')
const router = express.Router()
const { body } = require('express-validator')
const { validate } = require('../middleware/validate')
const TicketModel = require('../models/ticket')
const logger = require('../config/logger')
const { authMiddleware, requireRole } = require('../middleware/auth')

// Cargos: 1 = Monitor, 2 = Atendente, 3 = Administrador
const ROLE_ATTENDANT = 2
const ROLE_ADMIN = 3

// Toda rota de ticket expoe nome/CPF dos assistidos: exige login
router.use(['/loadTicketsInQueue', '/loadTicket', '/insertTicket', '/updateTicketCalled', '/deleteTicket', '/loadTicketHistory'], authMiddleware)

const HISTORY_SORT_FIELDS = [
  'number', 'name', 'docNumber', 'type', 'queuedBy', 'dateQueue', 'servicedBy', 'dateServiced',
]

router.get('/loadTicketsInQueue', async (req, res) => {
  try {
    const limitDate = new Date()
    limitDate.setDate(limitDate.getDate() - 7)

    const ticket = await TicketModel.find({
      dateQueue: { $gte: limitDate },
    }).sort({
      status: 1, // In Queue
      preferential: -1, // 0 = No, 1 = Yes, 2 = Super preferential, 80+
      dateQueue: 1,
      dateServiced: -1,
    })

    // após ordenar, refinamos dentro do array retornado
    const sortedTickets = ticket.sort((a, b) => {
      if (a.status === 1 && b.status === 1) {
        // fila: prioridade primeiro, depois por dataQueue
        if (a.preferential !== b.preferential) {
          return b.preferential - a.preferential // 2 > 1 > 0
        }

        return new Date(a.dateQueue) - new Date(b.dateQueue)
      } else if (a.status === 2 && b.status === 2) {
        // atendidas: mais recente primeiro
        return new Date(b.dateServiced) - new Date(a.dateServiced)
      } else {
        // fila (1) antes de atendidos (2)
        return a.status - b.status
      }
    })

    return res.status(200).json({ ticket: sortedTickets })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/loadTicket/:id', async (req, res) => {
  try {
    const _id = req.params.id
    const ticket = await TicketModel.find({ _id: _id })

    return res.status(200).json({ ticket })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/insertTicket', requireRole(ROLE_ATTENDANT), [
  body('number').isInt().withMessage('Número da senha inválido'),
  body('status').isInt().withMessage('Status inválido'),
  body('name').trim().notEmpty().withMessage('Digite um nome'),
  validate
], async (req, res) => {
  try {
    const updatedData = req.body
    await TicketModel.create(updatedData)
    return res.status(200).json({})
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/updateTicketCalled/:id', async (req, res) => {
  try {
    const _id = req.params.id,
      data = req.body
    await TicketModel.findByIdAndUpdate(_id, data)

    return res.status(200).json({})
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/deleteTicket/:id', requireRole(ROLE_ADMIN), async (req, res) => {
  try {
    const _id = req.params.id
    await TicketModel.findByIdAndDelete(_id)

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

    const query = {}

    if (search) {
      // Escapa caracteres especiais: a busca e por texto, nao por regex
      const pattern = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
      query.$or = [
        { name: pattern },
        { docNumber: pattern },
        { type: pattern },
        { queuedBy: pattern },
        { servicedBy: pattern },
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
    const tickets = await TicketModel.find(query)
      .sort({ [sortField]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)

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
      ticket: tickets,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: stats[0] || { totalComplete: 0, avgWaitTime: 0 }
    })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
