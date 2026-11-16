const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { body, param } = require('express-validator')
const { validate } = require('../middleware/validate')
const User = require('../models/user')
const { loginLimiter } = require('../middleware/rateLimit')
const { authMiddleware, requireRole } = require('../middleware/auth')
const logger = require('../config/logger')

router.post('/register', [
  body('username').notEmpty().trim().isLength({ max: 30 }).withMessage('Username is required (max 30 chars)'),
  body('login').notEmpty().trim().matches(/^[a-zA-Z0-9._-]+$/).withMessage('Login must contain only letters, numbers, dots, hyphens or underscores'),
  body('password').isLength({ min: 4 }).withMessage('Password must be at least 4 characters'),
  body('role').isInt({ min: 1, max: 3 }).withMessage('Role must be between 1 and 3'),
  validate
], async (req, res) => {
  try {
    const { username, login, password, role } = req.body

    const existingUser = await User.findOne({ login })
    if (existingUser) {
      return res.status(400).json({ error: 'Login already in use' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = new User({
      username,
      login,
      password: hashedPassword,
      role,
    })
    await newUser.save()

    res.status(201).json({ message: 'User created successfully' })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/login', loginLimiter, [
  body('login').notEmpty().trim().withMessage('Login is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
], async (req, res) => {
  try {
    const { login, password } = req.body

    const user = await User.findOne({ login })
    if (!user) {
      return res.status(401).json({ error: 'Invalid login or password' })
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid login or password' })
    }

    const token = jwt.sign({ userData: user }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '72h',
    })
    return res.status(200).json({ token, user })
  } catch (error) {
    logger.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return res.status(200).json({ userData: decoded.userData })
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' })
  }
})

// POST /auth/refresh - Refresh token
router.post('/auth/refresh', authMiddleware, (req, res) => {
  try {
    // Issue a new token with the same userData
    const token = jwt.sign({ userData: req.user }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '72h',
    })
    return res.status(200).json({ token })
  } catch (error) {
    logger.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/users - Listar todos (requer role >= 3)
router.get('/api/users', authMiddleware, requireRole(3), async (req, res) => {
  try {
    const users = await User.find({}).select('-password')
    res.json({ users })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// PUT /api/users/:id - Atualizar usuário (requer role >= 3)
router.put('/api/users/:id', authMiddleware, requireRole(3), [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('username').optional().trim().isLength({ max: 30 }),
  body('login').optional().trim().matches(/^[a-zA-Z0-9._-]+$/),
  body('role').optional().isInt({ min: 1, max: 3 }),
  body('password').optional().isLength({ min: 4 }),
  validate
], async (req, res) => {
  try {
    const { username, login, role, password } = req.body
    const updateData = { username, login, role }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password')
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })
    res.json({ user })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// DELETE /api/users/:id - Excluir usuário (requer role >= 3)
router.delete('/api/users/:id', authMiddleware, requireRole(3), async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: 'Não é possível excluir o próprio usuário' })
    }
    await User.findByIdAndDelete(req.params.id)
    res.json({ message: 'Usuário removido' })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

module.exports = router
