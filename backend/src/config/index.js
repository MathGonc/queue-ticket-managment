const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })

if (!process.env.JWT_SECRET) {
  // Logger not yet available at this point, use stderr directly
  process.stderr.write('ERRO FATAL: JWT_SECRET não está definido nas variáveis de ambiente.\n')
  process.exit(1)
}

module.exports = {
  port: process.env.PORT || 3030,
  dbIp: process.env.DB_IP,
  dbName: process.env.DB_NAME,
  dbUser: process.env.DB_USER,
  dbPass: process.env.DB_PASS,
  clientUrl: process.env.CLIENT_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '72h',
  allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []
}
