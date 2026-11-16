const express = require('express')
const router = express.Router()
const Activity = require('../models/activity')
const { TYPES } = require('../activity')
const { authMiddleware, requireRole } = require('../middleware/auth')
const logger = require('../config/logger')

const ROLE_ADMIN = 3

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
      const pattern = { $regex: user.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
      query.$or = [{ user: pattern }, { login: pattern }]
    }

    const from = req.query.from ? new Date(req.query.from) : null
    const to = req.query.to ? new Date(req.query.to) : null
    if ((from && !isNaN(from)) || (to && !isNaN(to))) {
      query.date = {}
      if (from && !isNaN(from)) query.date.$gte = from
      if (to && !isNaN(to)) query.date.$lte = to
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

module.exports = router
