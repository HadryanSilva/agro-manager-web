import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Injeta o access token em todas as requisições autenticadas
api.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  if (authStore.accessToken) {
    config.headers.Authorization = `Bearer ${authStore.accessToken}`
  }
  return config
})

// Tenta renovar o token automaticamente ao receber 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const authStore = useAuthStore()

    const isUnauthorized = error.response?.status === 401
    const hasRefreshToken = !!authStore.refreshToken
    const notAlreadyRetried = !originalRequest._retry
    const notRefreshEndpoint = !originalRequest.url?.includes('/auth/refresh')

    if (isUnauthorized && hasRefreshToken && notAlreadyRetried && notRefreshEndpoint) {
      originalRequest._retry = true

      try {
        await authStore.refreshSession()
        originalRequest.headers.Authorization = `Bearer ${authStore.accessToken}`
        return api(originalRequest)
      } catch {
        authStore.clearAuth()
        window.location.href = '/auth/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api