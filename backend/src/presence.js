// Usuarios conectados agora: conexoes de socket com login valido (cada aba
// aberta conecta uma vez; o mesmo usuario em varias abas conta uma vez).
const connected = new Map() // socket.id -> login

function add(socket) {
  if (socket.authenticated && socket.user) connected.set(socket.id, socket.user.login || socket.user._id || '')
}

function remove(socket) {
  connected.delete(socket.id)
}

function usersOnline() {
  return new Set(connected.values()).size
}

module.exports = { add, remove, usersOnline }
