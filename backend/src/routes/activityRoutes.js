const fs = require('fs')
const path = require('path')
const express = require('express')
const router = express.Router()
const Activity = require('../models/activity')
const TicketModel = require('../models/ticket')
const { TYPES, logActivity } = require('../activity')
const { authMiddleware, requireRole } = require('../middleware/auth')
const logger = require('../config/logger')

const ROLE_ATTENDANT = 2
const ROLE_ADMIN = 3
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function parseDate(value) {
  const date = value ? new Date(value) : null
  return date && !isNaN(date) ? date : null
}

// GET /api/activity?page&limit&type=a,b&user=texto&from=ISO&to=ISO
router.get('/api/activity', authMiddleware, requireRole(ROLE_ADMIN), async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 500)
    const query = {}

    const types = String(req.query.type || '').split(',').map((t) => t.trim()).filter((t) => TYPES.includes(t))
    if (types.length) query.type = { $in: types }

    const user = String(req.query.user || '').trim()
    if (user) {
      const pattern = { $regex: escapeRegex(user), $options: 'i' }
      query.$or = [{ user: pattern }, { login: pattern }]
    }

    const from = parseDate(req.query.from)
    const to = parseDate(req.query.to)
    if (from || to) {
      query.date = {}
      if (from) query.date.$gte = from
      if (to) query.date.$lte = to
    }

    const [total, items] = await Promise.all([
      Activity.countDocuments(query),
      Activity.find(query).sort({ date: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ])

    res.json({ items, pagination: { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) }, types: TYPES })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// POST /api/activity/client - eventos que so o navegador conhece.
// Apenas os tipos abaixo, com detalhes validados (nada de texto livre grande).
const CLIENT_EVENTS = {
  pdf_historico: {
    minRole: ROLE_ATTENDANT,
    details: (d) => ({
      busca: String(d.busca || '').slice(0, 100),
      de: parseDate(d.de)?.toISOString() || null,
      ate: parseDate(d.ate)?.toISOString() || null,
      registros: Math.max(parseInt(d.registros) || 0, 0),
    }),
  },
  guiche_alterado: {
    minRole: 1,
    details: (d) => {
      const para = parseInt(d.para)
      if (!(para >= 1 && para <= 99)) return null
      const de = parseInt(d.de)
      return { de: de >= 1 && de <= 99 ? de : null, para }
    },
  },
}

router.post('/api/activity/client', authMiddleware, (req, res) => {
  const event = CLIENT_EVENTS[req.body?.type]
  if (!event) return res.status(400).json({ error: 'Tipo de evento invalido' })
  if ((req.user?.role || 0) < event.minRole) return res.status(403).json({ error: 'Sem permissão' })
  const details = event.details(req.body.details || {})
  if (!details) return res.status(400).json({ error: 'Detalhes invalidos' })
  logActivity(req, req.body.type, details)
  res.json({})
})

// GET /api/stats/daily?from=ISO&to=ISO - indicadores por dia (padrao: 30 dias)
router.get('/api/stats/daily', authMiddleware, requireRole(ROLE_ADMIN), async (req, res) => {
  try {
    const to = parseDate(req.query.to) || new Date()
    const from = parseDate(req.query.from) || new Date(to.getTime() - 30 * 864e5)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    const served = { $and: [{ $eq: ['$status', 2] }, { $gt: ['$dateServiced', null] }] }
    const wait = { $subtract: ['$dateServiced', '$dateQueue'] }

    const days = await TicketModel.aggregate([
      // deletedAt: ticket excluido so fica oculto e nao conta
      { $match: { dateQueue: { $gte: from, $lte: to }, deletedAt: null } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$dateQueue', timezone } },
          emitidas: { $sum: 1 },
          preferenciais: { $sum: { $cond: [{ $gt: ['$preferential', 0] }, 1, 0] } },
          atendidas: { $sum: { $cond: [served, 1, 0] } },
          esperaTotal: { $sum: { $cond: [served, wait, 0] } },
          esperaMax: { $max: { $cond: [served, wait, null] } },
        },
      },
      { $sort: { _id: -1 } },
    ])

    const result = days.map((d) => ({
      dia: d._id,
      emitidas: d.emitidas,
      preferenciais: d.preferenciais,
      atendidas: d.atendidas,
      esperaMediaMs: d.atendidas ? Math.round(d.esperaTotal / d.atendidas) : null,
      esperaMaxMs: d.esperaMax ?? null,
    }))
    const totals = result.reduce((acc, d) => {
      acc.emitidas += d.emitidas
      acc.preferenciais += d.preferenciais
      acc.atendidas += d.atendidas
      acc.esperaTotal += (d.esperaMediaMs || 0) * d.atendidas
      return acc
    }, { emitidas: 0, preferenciais: 0, atendidas: 0, esperaTotal: 0 })

    res.json({
      from, to, timezone, days: result,
      totals: {
        emitidas: totals.emitidas,
        preferenciais: totals.preferenciais,
        atendidas: totals.atendidas,
        esperaMediaMs: totals.atendidas ? Math.round(totals.esperaTotal / totals.atendidas) : null,
      },
    })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Logs tecnicos (arquivos backend.AAAA-MM-DD.N.log em LOG_DIR)
const LOG_FILE = /^backend\.\d{4}-\d{2}-\d{2}\.\d+\.log$/
const LEVELS = { 10: 'trace', 20: 'debug', 30: 'info', 40: 'warn', 50: 'error', 60: 'fatal' }

// GET /api/logs/files
router.get('/api/logs/files', authMiddleware, requireRole(ROLE_ADMIN), (req, res) => {
  if (!logger.logDir || !fs.existsSync(logger.logDir)) return res.json({ enabled: Boolean(logger.logDir), files: [] })
  const files = fs.readdirSync(logger.logDir)
    .filter((name) => LOG_FILE.test(name))
    .map((name) => {
      const stat = fs.statSync(path.join(logger.logDir, name))
      return { name, size: stat.size, modified: stat.mtime }
    })
    .sort((a, b) => b.modified - a.modified)
  res.json({ enabled: true, files })
})

// GET /api/logs?file=&level=warn&search=&limit=300 - linhas mais recentes primeiro
router.get('/api/logs', authMiddleware, requireRole(ROLE_ADMIN), (req, res) => {
  try {
    const file = String(req.query.file || '')
    if (!logger.logDir || !LOG_FILE.test(file)) return res.status(400).json({ error: 'Arquivo de log invalido' })
    const fullPath = path.join(logger.logDir, file)
    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'Arquivo nao encontrado' })

    const minLevel = { info: 30, warn: 40, error: 50 }[req.query.level] || 0
    const search = String(req.query.search || '').toLowerCase()
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 300, 1), 2000)

    const lines = fs.readFileSync(fullPath, 'utf8').split('\n').filter(Boolean)
    const items = []
    for (let i = lines.length - 1; i >= 0 && items.length < limit; i--) {
      let entry
      try { entry = JSON.parse(lines[i]) } catch { continue }
      if ((entry.level || 0) < minLevel) continue
      if (search && !lines[i].toLowerCase().includes(search)) continue
      const { level, time, msg, pid, hostname, ...extra } = entry
      items.push({ time, level: LEVELS[level] || String(level), msg: msg || '', extra })
    }
    res.json({ file, total: lines.length, items })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

module.exports = router
