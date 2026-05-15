import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import authService from '@/services/authService'
import { createAuthRefreshCoordinator } from '@/services/authRefreshCoordinator'
import type { RegisterPayload, LoginPayload } from '@/services/authService'

const REFRESH_TOKEN_KEY = 'refreshToken'

export const useAuthStore = defineStore('auth', () => {
  // Access token mantido apenas em memória por segurança
  const accessToken = ref<string | null>(null)

  // Refresh token limitado à aba atual para reduzir persistência em caso de XSS.
  const refreshToken = ref<string | null>(sessionStorage.getItem(REFRESH_TOKEN_KEY))

  // Controla se a tentativa de restauração inicial já foi feita
  // Evita múltiplas chamadas simultâneas ao /auth/refresh no startup
  const sessionRestored = ref(false)
  let restorePromise: Promise<void> | null = null

  const isAuthenticated = computed(() => !!accessToken.value)

  // Indica se há possibilidade de restaurar a sessão (tem refresh token salvo)
  const hasStoredSession = computed(() => !!refreshToken.value)

  function setTokens(access: string, refresh: string) {
    accessToken.value = access
    refreshToken.value = refresh
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refresh)
  }

  function clearAuth() {
    accessToken.value    = null
    refreshToken.value   = null
    sessionRestored.value = true  // marca como resolvido para não tentar restaurar
    sessionStorage.removeItem(REFRESH_TOKEN_KEY)

    import('@/stores/accountStore').then(({ useAccountStore }) => {
      useAccountStore().reset()
    })
    import('@/stores/userStore').then(({ useUserStore }) => {
      useUserStore().clearProfile()
    })
  }

  async function register(payload: RegisterPayload) {
    const { data } = await authService.register(payload)
    setTokens(data.data.accessToken, data.data.refreshToken)
    sessionRestored.value = true
  }

  async function login(payload: LoginPayload) {
    const { data } = await authService.login(payload)
    setTokens(data.data.accessToken, data.data.refreshToken)
    sessionRestored.value = true
  }

  async function refreshSession() {
    if (!refreshToken.value) throw new Error('Sem refresh token disponível')
    const { data } = await authService.refresh(refreshToken.value)
    setTokens(data.data.accessToken, data.data.refreshToken)
  }

  const refreshSessionOnce = createAuthRefreshCoordinator(refreshSession)

  /**
   * Tenta restaurar o access token usando o refresh token salvo.
   * Chamado uma única vez no startup da aplicação (App.vue ou router guard).
   * Usa Promise compartilhada para evitar chamadas duplicadas em paralelo.
   */
  async function restoreSession(): Promise<void> {
    if (sessionRestored.value) return
    if (restorePromise) return restorePromise

    restorePromise = (async () => {
      if (!refreshToken.value) {
        sessionRestored.value = true
        return
      }
      try {
        await refreshSession()
      } catch {
        // Refresh token inválido ou expirado — limpa tudo
        clearAuth()
      } finally {
        sessionRestored.value = true
        restorePromise = null
      }
    })()

    return restorePromise
  }

  return {
    accessToken,
    refreshToken,
    isAuthenticated,
    hasStoredSession,
    sessionRestored,
    setTokens,
    clearAuth,
    register,
    login,
    refreshSession,
    refreshSessionOnce,
    restoreSession,
  }
})
