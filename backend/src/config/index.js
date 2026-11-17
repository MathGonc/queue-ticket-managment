const path = require('path')
// quiet: o dotenv 17+ imprime uma mensagem a cada carga
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true })

if (!process.env.JWT_SECRET) {
  // Logger not yet available at this point, use stderr directly
  process.stderr.write('ERRO FATAL: JWT_SECRET não está definido nas variáveis de ambiente.\n')
  process.exit(1)
}

// ALLOWED_ORIGINS vazio ou "*" = aceita qualquer origem. A autenticacao e por
// header Authorization (sem cookies), entao liberar a origem nao abre CSRF.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

module.exports = {
  port: process.env.PORT || 3030,
  dbIp: process.env.DB_IP || '127.0.0.1:27017',
  dbName: process.env.DB_NAME || 'gonc-queue-manager',
  dbUser: process.env.DB_USER,
  dbPass: process.env.DB_PASS,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '72h',
  // Arquivos enviados pelo sistema (ex.: logo). Fora do git; no Docker, volume.
  dataDir: process.env.DATA_DIR || path.resolve(__dirname, '../../../data'),
  corsOrigin: allowedOrigins.length && !allowedOrigins.includes('*') ? allowedOrigins : true
}
