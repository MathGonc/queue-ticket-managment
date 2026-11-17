const rateLimit = require('express-rate-limit')
const { logActivity } = require('../activity')

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  limit: 5,
  // Conta so as tentativas erradas: varios logins certos no mesmo PC (troca
  // de turno na triagem) nao bloqueiam ninguem
  skipSuccessfulRequests: true,
  message: { error: 'Muitas tentativas. Aguarde 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logActivity(req, 'login_bloqueado', { login: String(req.body?.login || '') }, { login: String(req.body?.login || '') })
    res.status(options.statusCode).json(options.message)
  },
})

module.exports = { loginLimiter }
