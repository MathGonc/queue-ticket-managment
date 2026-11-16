const pino = require('pino')

// pino-pretty e devDependency: so usa se estiver instalado e fora de producao.
// Sem essa checagem o backend quebra no startup quando instalado com --omit=dev.
function prettyAvailable() {
  try {
    require.resolve('pino-pretty')
    return true
  } catch {
    return false
  }
}

const usePretty = process.env.NODE_ENV !== 'production' && prettyAvailable()

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: usePretty
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:dd/mm HH:MM:ss', ignore: 'pid,hostname' } }
    : undefined
})

module.exports = logger
