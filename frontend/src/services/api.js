import axios from 'axios'
import { useAuth } from '@/stores/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_URL + ':' + import.meta.env.VITE_PORT_SERVER,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const auth = useAuth()
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

// Track if a refresh is already in progress to avoid multiple simultaneous refreshes
let isRefreshing = false
let failedQueue = []

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const auth = useAuth()

    // If 401 and we have a token, try to refresh once before clearing
    if (error.response?.status === 401 && auth.token && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT_SERVER}/auth/refresh`,
          {},
          { headers: { Authorization: `Bearer ${auth.token}` } }
        )

        const newToken = response.data.token
        auth.setToken(newToken)
        processQueue(null, newToken)

        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        auth.clearToken()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // If 401 and no token, just clear
    if (error.response?.status === 401) {
      auth.clearToken()
    }

    return Promise.reject(error)
  }
)

export { api }
