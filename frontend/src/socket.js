import { io } from 'socket.io-client'
import { toast } from '@/services/notify.js'
import config from '@/config.js'
import { useAuth } from '@/stores/auth.js'

const URL = config.url_server

// Socket autenticado: usado para EMITIR eventos de controle (o backend ignora
// sinais de conexoes sem token valido). O token e lido a cada (re)conexao, e
// se o token atual mudou desde o handshake (login apos expirar, refresh), a
// conexao e refeita antes de emitir. Emits feitos durante a reconexao ficam
// em buffer e sao enviados ao conectar.
let authSocket = null
let handshakeToken = null

export function createSocket() {
  const token = useAuth().token

  if (!authSocket) {
    handshakeToken = token
    authSocket = io(URL, {
      auth: (cb) => {
        handshakeToken = useAuth().token
        cb({ token: handshakeToken })
      },
    })
  } else if (token !== handshakeToken) {
    authSocket.disconnect().connect()
  }

  return authSocket
}

// Socket publico: apenas ESCUTA as atualizacoes (monitor, listas, triagem)
export const publicSocket = io(URL)

// Aviso de conexao perdida/restabelecida (so depois que o app montou)
let disconnectToastShown = false
let appReady = false

export function setAppReady() {
  appReady = true
}

function showToast(type, message) {
  if (appReady) toast[type](message)
}

publicSocket.on('disconnect', () => {
  if (!disconnectToastShown) {
    disconnectToastShown = true
    showToast('warning', 'Conexão com o servidor perdida. Reconectando...')
  }
})

publicSocket.on('connect', () => {
  if (disconnectToastShown) {
    disconnectToastShown = false
    showToast('success', 'Conexão restabelecida!')
  }
})
