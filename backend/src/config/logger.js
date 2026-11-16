const path = require('path')
const pino = require('pino')

// Saidas do log:
//  - console: colorido (pino-pretty) se instalado e fora de producao; senao JSON
//  - arquivo: backend/logs/backend.AAAA-MM-DD.N.log, um por dia, guardando os
//    ultimos LOG_RETENTION_DAYS (padrao 30). LOG_DIR vazio desliga (ex.: Docker,
//    onde o log ja e coletado pelo proprio Docker).

function prettyAvailable() {
  try {
    require.resolve('pino-pretty')
    return true
  } catch {
    return false
  }
}

const level = process.env.LOG_LEVEL || 'info'
const logDir = process.env.LOG_DIR !== undefined
  ? process.env.LOG_DIR
  : path.resolve(__dirname, '../../logs')
const retentionDays = Math.max(parseInt(process.env.LOG_RETENTION_DAYS) || 30, 1)

const targets = []

if (process.env.NODE_ENV !== 'production' && prettyAvailable()) {
  targets.push({
    level,
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:dd/mm HH:MM:ss', ignore: 'pid,hostname' },
  })
} else {
  targets.push({ level, target: 'pino/file', options: { destination: 1 } })
}

if (logDir) {
  targets.push({
    level,
    target: 'pino-roll',
    options: {
      file: path.join(logDir, 'backend'),
      frequency: 'daily',
      dateFormat: 'yyyy-MM-dd',
      mkdir: true,
      limit: { count: retentionDays },
    },
  })
}

const logger = pino({ level, timestamp: pino.stdTimeFunctions.isoTime }, pino.transport({ targets }))

module.exports = logger
module.exports.logDir = logDir
