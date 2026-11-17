const Activity = require('./models/activity')
const logger = require('./config/logger')

// Tipos de atividade registrados (o frontend tem os rotulos em portugues)
const TYPES = [
  'servidor_iniciado', 'erro_servidor',
  'login', 'login_falhou', 'login_bloqueado', 'logout',
  'senha_emitida', 'senha_chamada', 'senha_rechamada', 'senha_excluida',
  'numeracao_resetada', 'config_monitor_alterada',
  'usuario_criado', 'usuario_alterado', 'usuario_excluido',
  'painel_conectado', 'painel_desconectado', 'sinal_recusado',
  'backup_concluido', 'backup_falhou',
  'pdf_historico', 'guiche_alterado',
  'logo_alterado', 'logo_removido', 'empresa_alterada',
]

function clientIp(req) {
  return String(req?.ip || req?.socket?.remoteAddress || req?.handshake?.address || '').replace(/^::ffff:/, '')
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
  return Activity.create(entry).catch((err) => logger.error(err, 'Falha ao gravar atividade'))
}

// Evita inundar o registro com o mesmo evento repetido (ex.: uma aba antiga
// mandando sinais sem login a cada chamada): no maximo 1 por chave por janela.
const recent = new Map()
function logActivityThrottled(key, windowMs, ...args) {
  const now = Date.now()
  if (recent.get(key) > now - windowMs) return
  recent.set(key, now)
  if (recent.size > 1000) {
    for (const [k, t] of recent) if (t < now - windowMs) recent.delete(k)
  }
  logActivity(...args)
}

module.exports = { logActivity, logActivityThrottled, clientIp, TYPES }
