const express = require('express')
const router = express.Router()
const GlobalModel = require('../models/global')
const logger = require('../config/logger')
const { logActivity } = require('../activity')

const MONITOR_FIELDS = ['monitorMode', 'showTicketNumber', 'soundNotification', 'soundCallTicket', 'soundCallTicketVoice']
const { authMiddleware, requireRole } = require('../middleware/auth')

const ROLE_ADMIN = 3

// getConfigsDB e getGlobalTicketData sao publicos: e o que o painel (TV)
// exibe, e o monitor nao pode parar de atualizar se o token expirar.

router.post('/saveConfigsDB', authMiddleware, requireRole(ROLE_ADMIN), async (req, res) => {
  try {
    const updatedData = req.body

    const config = await GlobalModel.findOne()
    const before = config ? config.toObject() : {}

    config ? (config.set(updatedData), await config.save()) : await GlobalModel.create(updatedData)

    const after = (await GlobalModel.findOne().lean()) || {}
    const changes = {}
    for (const field of MONITOR_FIELDS) {
      if (String(before[field]) !== String(after[field])) changes[field] = { de: before[field] ?? null, para: after[field] ?? null }
    }
    if (Object.keys(changes).length) logActivity(req, 'config_monitor_alterada', { alteracoes: changes })

    res.sendStatus(200)
  } catch (error) {
    logger.error(error, 'Erro ao salvar as configurações no banco de dados MongoDB')
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/getConfigsDB', async (req, res) => {
  try {
    const config = await GlobalModel.findOne()

    if (config) {
      req.config = config
      res.status(200).json({ config })
    } else {
      res.status(404).json({ error: 'No configuration found' })
    }
  } catch (error) {
    logger.error(error, 'Erro ao obter as configurações do banco de dados MongoDB')
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/getGlobalTicketData', async (req, res) => {
  try {
    const response = await GlobalModel.findOne().select('ticket')
    if (response) {
      res.status(200).json({
        ticket: response.ticket,
      })
    } else {
      res.status(404).json({ error: 'No global ticket data found' })
    }
  } catch (error) {
    logger.error(error, 'Erro ao obter as configurações do banco de dados MongoDB')
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/updateGlobalTicketData', authMiddleware, async (req, res) => {
  try {
    const data = req.body
    const config = await GlobalModel.findOneAndUpdate({}, { $set: data }, { new: true })

    config ? res.status(200).json({}) : res.status(500).json({ error: 'Internal server error' })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/resetGlobalTicketData', authMiddleware, requireRole(ROLE_ADMIN), async (req, res) => {
  try {
    const ticketResetData = {
      nextToQueue: 1,
      currentNumber: 0,
      currentTable: 0,
      currentUser: '',
      lastNumber: 0,
      lastTable: 0,
      lastUser: '',
    }
    const previous = await GlobalModel.findOne().select('ticket.nextToQueue').lean()
    const config = await GlobalModel.findOneAndUpdate(
      {},
      { ticket: ticketResetData },
      { new: true }
    )
    if (config) logActivity(req, 'numeracao_resetada', { proximaSenhaAntes: previous?.ticket?.nextToQueue ?? null })
    config ? res.status(200).json({}) : res.status(500).json({ error: 'Internal server error' })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
