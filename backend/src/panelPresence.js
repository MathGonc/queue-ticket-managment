const { logActivity, clientIp } = require('./activity')

// Presenca do painel (TV): a tela do monitor avisa pelo socket que esta
// aberta ("painelOnline") e que fechou ("painelOffline"). Quedas curtas de
// rede nao sao registradas: a desconexao so entra no registro se o painel
// daquele IP nao voltar em GRACE_MS, e a volta nesse intervalo nao gera
// um novo "conectado".
const GRACE_MS = parseInt(process.env.PANEL_GRACE_MS) || 60 * 1000
const panels = new Map() // ip -> { sockets: Set, since: Date, user, pendingOffline }

function details(ip, panel) {
  return { ip, usuario: panel.user || '' }
}

function online(socket, info = {}) {
  const ip = clientIp(socket)
  let panel = panels.get(ip)
  if (!panel) {
    panel = { sockets: new Set(), since: new Date(), user: String(info.usuario || '').slice(0, 60), pendingOffline: null }
    panels.set(ip, panel)
    logActivity(socket, 'painel_conectado', details(ip, panel), { username: panel.user })
  }
  if (panel.pendingOffline) {
    clearTimeout(panel.pendingOffline)
    panel.pendingOffline = null
  }
  panel.sockets.add(socket.id)
  socket.panelIp = ip
}

function offline(socket) {
  const ip = socket.panelIp
  if (!ip) return
  socket.panelIp = null
  const panel = panels.get(ip)
  if (!panel) return
  panel.sockets.delete(socket.id)
  if (panel.sockets.size > 0 || panel.pendingOffline) return
  panel.pendingOffline = setTimeout(() => {
    panels.delete(ip)
    const minutes = Math.round((Date.now() - panel.since) / 60000)
    logActivity(socket, 'painel_desconectado', { ...details(ip, panel), minutosConectado: minutes }, { username: panel.user })
  }, GRACE_MS)
}

module.exports = { online, offline, GRACE_MS }
