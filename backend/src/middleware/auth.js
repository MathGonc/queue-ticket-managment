const jwt = require('jsonwebtoken')
const config = require('../config/index.js')

// Dados do usuario que vao no token e nas respostas. Nunca inclui o hash da senha.
function publicUser(user) {
  const data = typeof user.toObject === 'function' ? user.toObject() : { ...user }
  delete data.password
  return data
}

function signToken(user) {
  return jwt.sign({ userData: publicUser(user) }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  })
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' })
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    return res.status(401).json({ error: 'Token mal formatado' })
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    req.user = decoded.userData
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' })
  }
}

function requireRole(minRole) {
  return (req, res, next) => {
    if (!req.user || req.user.role < minRole) {
      return res.status(403).json({ error: 'Sem permissão' })
    }
    next()
  }
}

module.exports = { authMiddleware, requireRole, signToken, publicUser }
