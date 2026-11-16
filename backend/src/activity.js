const Activity = require('./models/activity')
const logger = require('./config/logger')

// Tipos de atividade registrados (o frontend tem os rotulos em portugues)
const TYPES = [
  'servidor_iniciado',
  'login', 'login_falhou', 'login_bloqueado', 'logout',
  'senha_emitida', 'senha_chamada', 'senha_rechamada', 'senha_excluida',
  'numeracao_resetada', 'config_monitor_alterada',
  'usuario_criado', 'usuario_alterado', 'usuario_excluido',
]

function clientIp(req) {
  return String(req?.ip || req?.socket?.remoteAddress || '').replace(/^::ffff:/, '')
}

// Registra uma atividade. Nunca derruba a requisicao: se o banco falhar, so
// vai para o log em arquivo. Tambem escreve no log tecnico.
function logActivity(req, type, details = {}, who = null) {
  const actor = who || req?.user || {}
  const entry = {
    date: new Date(),
    type,
    user: actor.username || '',
    login: actor.login || '',
    details,
    ip: clientIp(req),
  }
  logger.info({ activity: entry }, `atividade: ${type}`)
  Activity.create(entry).catch((err) => logger.error(err, 'Falha ao gravar atividade'))
}

module.exports = { logActivity, TYPES }
