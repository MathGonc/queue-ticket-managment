const express = require('express')
const router = express.Router()
const { body } = require('express-validator')
const { validate } = require('../middleware/validate')
const GlobalModel = require('../models/global')
const TicketModel = require('../models/ticket')
const logger = require('../config/logger')
const { logActivity } = require('../activity')
const { getTipos, plainTipo } = require('../tipos')
const presence = require('../presence')
const panelPresence = require('../panelPresence')
const { authMiddleware, requireRole } = require('../middleware/auth')

const ROLE_ADMIN = 3
const MAX_TIPOS = 40

// GET /api/status - status do sistema (pagina inicial, so admin)
router.get('/api/status', authMiddleware, requireRole(ROLE_ADMIN), (req, res) => {
  res.json({ usuariosConectados: presence.usersOnline(), monitor: panelPresence.monitorStatus() })
})

// GET /tiposAtendimento - lista da triagem
router.get('/tiposAtendimento', authMiddleware, async (req, res) => {
  try {
    res.json({ tipos: await getTipos() })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /tiposAtendimento - { tipos: [...], renomear: [{ de, para }] }
// Renomear tambem troca o tipo nas senhas antigas; tipo removido continua
// nas senhas que ja o tinham.
router.put('/tiposAtendimento', authMiddleware, requireRole(ROLE_ADMIN), [
  body('tipos').isArray({ min: 1, max: MAX_TIPOS }).withMessage(`Informe de 1 a ${MAX_TIPOS} tipos`),
  body('tipos.*').isString().trim().notEmpty().withMessage('Tipo em branco').isLength({ max: 60 }).withMessage('Tipo com mais de 60 caracteres'),
  body('renomear').optional().isArray(),
  validate,
], async (req, res) => {
  try {
    const tipos = req.body.tipos.map((t) => t.trim().replace(/\s+/g, ' ').toLocaleUpperCase('pt-BR'))
    if (new Set(tipos.map(plainTipo)).size !== tipos.length) return res.status(400).json({ errors: [{ msg: 'Há tipos repetidos' }] })

    const antes = await getTipos()
    await GlobalModel.updateOne({}, { $set: { tiposAtendimento: tipos } })

    const renomeados = []
    for (const r of req.body.renomear || []) {
      const de = String(r?.de || '').trim()
      const para = String(r?.para || '').trim().replace(/\s+/g, ' ').toLocaleUpperCase('pt-BR')
      if (!de || !tipos.includes(para) || de === para) continue
      const { modifiedCount } = await TicketModel.updateMany({ type: de }, { $set: { type: para } })
      renomeados.push({ de, para, senhas: modifiedCount })
    }

    logActivity(req, 'tipos_alterados', {
      incluidos: tipos.filter((t) => !antes.includes(t) && !renomeados.some((r) => r.para === t)),
      removidos: antes.filter((t) => !tipos.includes(t) && !renomeados.some((r) => r.de === t)),
      renomeados,
    })
    // Triagens abertas recarregam a lista
    req.app.get('io')?.emit('tiposAtualizados')
    res.json({ tipos })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
