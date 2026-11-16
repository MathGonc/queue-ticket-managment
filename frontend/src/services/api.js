import axios from 'axios'
import { useAuth } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import config from '@/config.js'

// O router e injetado por router/index.js (importar aqui criaria um ciclo:
// router -> guards -> userController -> api -> router)
let router = null
export function bindRouter(instance) {
  router = instance
}

const api = axios.create({
  baseURL: config.url_server,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((request) => {
  const auth = useAuth()
  if (auth.token) {
    request.headers.Authorization = `Bearer ${auth.token}`
  }
  return request
})

// 401 com token = sessao expirada/invalida: encerra a sessao e volta ao login.
// (Um refresh nessa hora nao adiantaria: /auth/refresh exige token valido.
// A renovacao preventiva e feita a cada 1h pelo App.vue.)
let redirecting = false

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const auth = useAuth()

    if (error.response?.status === 401 && auth.token && !error.config?.skipAuthRedirect) {
      auth.clearToken()

      if (!redirecting && router) {
        redirecting = true
        useToast().error('Sessão expirada. Faça login novamente.')
        await router.push({ name: 'login' }).finally(() => { redirecting = false })
      }
    }

    return Promise.reject(error)
  }
)

export { api }
