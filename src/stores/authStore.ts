import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import authService from '@/services/authService'
import type { RegisterPayload, LoginPayload } from '@/services/authService'

export const useAuthStore = defineStore('auth', () => {
  // Access token mantido apenas em memória por segurança
  const accessToken = ref<string | null>(null)

  // Refresh token persistido no localStorage para sobreviver ao reload da página
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))

  const isAuthenticated = computed(() => !!accessToken.value)

  function setTokens(access: string, refresh: string) {
    accessToken.value = access
    refreshToken.value = refresh
    localStorage.setItem('refreshToken', refresh)
  }

  function clearAuth() {
    accessToken.value = null
    refreshToken.value = null
    localStorage.removeItem('refreshToken')

    // Importação dinâmica para evitar dependência circular entre stores
    import('@/stores/accountStore').then(({ useAccountStore }) => {
      useAccountStore().reset()
    })
  }

  async function register(payload: RegisterPayload) {
    const { data } = await authService.register(payload)
    setTokens(data.data.accessToken, data.data.refreshToken)
  }

  async function login(payload: LoginPayload) {
    const { data } = await authService.login(payload)
    setTokens(data.data.accessToken, data.data.refreshToken)
  }

  async function refreshSession() {
    if (!refreshToken.value) throw new Error('Sem refresh token disponível')
    const { data } = await authService.refresh(refreshToken.value)
    setTokens(data.data.accessToken, data.data.refreshToken)
  }

  return {
    accessToken,
    refreshToken,
    isAuthenticated,
    setTokens,
    clearAuth,
    register,
    login,
    refreshSession
  }
})