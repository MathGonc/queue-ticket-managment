const rateLimit = require('express-rate-limit')

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5,
  // Conta so as tentativas erradas: varios logins certos no mesmo PC (troca
  // de turno na triagem) nao bloqueiam ninguem
  skipSuccessfulRequests: true,
  message: { error: 'Muitas tentativas. Aguarde 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
})

module.exports = { loginLimiter }
