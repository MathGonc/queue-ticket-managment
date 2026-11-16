import { reactive } from 'vue'
import { io } from 'socket.io-client'

const URL = import.meta.env.VITE_URL + ':' + import.meta.env.VITE_PORT_SERVER

export const state = reactive({ connected: false })

let authSocket = null

export function createSocket(token) {
  // Reutiliza socket existente se já conectado com o mesmo token
  if (authSocket && authSocket.connected) {
    return authSocket
  }

  // Desconecta socket anterior se existir
  if (authSocket) {
    authSocket.disconnect()
  }

  authSocket = io(URL, {
    auth: { token }
  })

  authSocket.on('connect', () => { state.connected = true })
  authSocket.on('disconnect', () => { state.connected = false })

  return authSocket
}

export function getAuthSocket() {
  return authSocket
}

// Socket público para o monitor (sem auth)
export const publicSocket = io(URL)

// Disconnect notification handling - deferred until app is ready
let disconnectToastShown = false
let appReady = false

export function setAppReady() {
  appReady = true
}

function showToast(type, message) {
  if (!appReady) return
  try {
    import('vue-toastification').then(({ useToast }) => {
      const toast = useToast()
      toast[type](message)
    }).catch(() => {
      // Toast not available yet, ignore
    })
  } catch {
    // Ignore errors if toast is not ready
  }
}

publicSocket.on('disconnect', () => { 
  state.connected = false
  if (!disconnectToastShown) {
    disconnectToastShown = true
    showToast('warning', 'Conexão com o servidor perdida. Reconectando...')
  }
})

publicSocket.on('connect', () => { 
  state.connected = true
  if (disconnectToastShown) {
    disconnectToastShown = false
    showToast('success', 'Conexão restabelecida!')
  }
})
