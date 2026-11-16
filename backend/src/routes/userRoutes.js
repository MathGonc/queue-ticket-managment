const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const { body, param } = require('express-validator')
const { validate } = require('../middleware/validate')
const User = require('../models/user')
const { loginLimiter } = require('../middleware/rateLimit')
const { authMiddleware, requireRole, signToken, publicUser } = require('../middleware/auth')
const logger = require('../config/logger')

const ROLE_ADMIN = 3
const LOGIN_PATTERN = /^[a-zA-Z0-9._-]+$/
const MSG = {
  username: 'Nome é obrigatório (máx. 30 caracteres)',
  login: 'Login deve conter apenas letras, números, ponto, hífen ou sublinhado',
  password: 'Senha deve ter pelo menos 4 caracteres',
  role: 'Selecione a função do usuário',
}

// Mesmo formato do express-validator, para o frontend exibir a mensagem
function badRequest(res, msg) {
  return res.status(400).json({ error: msg, errors: [{ msg }] })
}

// Cadastro: somente administrador. O primeiro admin de um banco novo e
// criado pelo script `npm run create-admin` (backend/scripts/create-admin.js).
router.post('/register', authMiddleware, requireRole(ROLE_ADMIN), [
  body('username').trim().notEmpty().withMessage(MSG.username).isLength({ max: 30 }).withMessage(MSG.username),
  body('login').trim().notEmpty().withMessage(MSG.login).matches(LOGIN_PATTERN).withMessage(MSG.login),
  body('password').isLength({ min: 4 }).withMessage(MSG.password),
  body('role').isInt({ min: 1, max: 3 }).withMessage(MSG.role),
  validate
], async (req, res) => {
  try {
    const { username, login, password, role } = req.body

    const existingUser = await User.findOne({ login })
    if (existingUser) {
      return res.status(400).json({ error: 'Login já está em uso' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    await User.create({ username, login, password: hashedPassword, role })

    res.status(201).json({ message: 'Usuário criado com sucesso' })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/login', loginLimiter, [
  body('login').trim().notEmpty().withMessage('Informe o login'),
  body('password').notEmpty().withMessage('Informe a senha'),
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

    return res.status(200).json({ token: signToken(user), user: publicUser(user) })
  } catch (error) {
    logger.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// Valida o token E confere no banco: usuario excluido perde o acesso e
// mudanca de funcao vale na proxima navegacao.
router.get('/auth/verify', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    if (!user) return res.status(401).json({ error: 'Usuário não existe mais' })
    return res.status(200).json({ userData: publicUser(user) })
  } catch (error) {
    logger.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// Renova o token (o frontend chama periodicamente). Recarrega o usuario do
// banco para refletir funcao atualizada e barrar usuario excluido.
router.post('/auth/refresh', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    if (!user) return res.status(401).json({ error: 'Usuário não existe mais' })
    return res.status(200).json({ token: signToken(user), user: publicUser(user) })
  } catch (error) {
    logger.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/users - Listar todos (requer admin)
router.get('/api/users', authMiddleware, requireRole(ROLE_ADMIN), async (req, res) => {
  try {
    const users = await User.find({}).select('-password')
    res.json({ users })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// PUT /api/users/:id - Atualizar usuário (requer admin)
router.put('/api/users/:id', authMiddleware, requireRole(ROLE_ADMIN), [
  param('id').isMongoId().withMessage('ID de usuário inválido'),
  body('username').optional().trim().notEmpty().withMessage(MSG.username).isLength({ max: 30 }).withMessage(MSG.username),
  body('login').optional().trim().matches(LOGIN_PATTERN).withMessage(MSG.login),
  body('role').optional().isInt({ min: 1, max: 3 }).withMessage(MSG.role),
  body('password').optional().isLength({ min: 4 }).withMessage(MSG.password),
  validate
], async (req, res) => {
  try {
    const { username, login, role, password } = req.body
    const isSelf = req.params.id === String(req.user._id)

    if (isSelf && role !== undefined && Number(role) < ROLE_ADMIN) {
      return badRequest(res, 'Não é possível remover seu próprio acesso de administrador')
    }

    if (login) {
      const loginOwner = await User.findOne({ login, _id: { $ne: req.params.id } })
      if (loginOwner) return badRequest(res, 'Login já está em uso')
    }

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

// DELETE /api/users/:id - Excluir usuário (requer admin)
router.delete('/api/users/:id', authMiddleware, requireRole(ROLE_ADMIN), [
  param('id').isMongoId().withMessage('ID de usuário inválido'),
  validate
], async (req, res) => {
  try {
    if (req.params.id === String(req.user._id)) {
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
