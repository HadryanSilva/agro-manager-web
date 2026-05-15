import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import authService from '@/services/authService'
import { createAuthRefreshCoordinator } from '@/services/authRefreshCoordinator'
import type { RegisterPayload, LoginPayload } from '@/services/authService'

export const useAuthStore = defineStore('auth', () => {
  // Access token mantido apenas em memória por segurança
  const accessToken = ref<string | null>(null)

  // Controla se a tentativa de restauração inicial já foi feita
  // Evita múltiplas chamadas simultâneas ao /auth/refresh no startup
  const sessionRestored = ref(false)
  let restorePromise: Promise<void> | null = null

  const isAuthenticated = computed(() => !!accessToken.value)

  // O refresh token é HttpOnly; o frontend tenta restaurar uma vez e deixa o backend decidir.
  const hasStoredSession = computed(() => !sessionRestored.value)

  function setAccessToken(access: string) {
    accessToken.value = access
  }

  function clearAuth() {
    accessToken.value    = null
    sessionRestored.value = true  // marca como resolvido para não tentar restaurar

    import('@/stores/accountStore').then(({ useAccountStore }) => {
      useAccountStore().reset()
    })
    import('@/stores/userStore').then(({ useUserStore }) => {
      useUserStore().clearProfile()
    })
  }

  async function register(payload: RegisterPayload) {
    const { data } = await authService.register(payload)
    setAccessToken(data.data.accessToken)
    sessionRestored.value = true
  }

  async function login(payload: LoginPayload) {
    const { data } = await authService.login(payload)
    setAccessToken(data.data.accessToken)
    sessionRestored.value = true
  }

  async function refreshSession() {
    const { data } = await authService.refresh()
    setAccessToken(data.data.accessToken)
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
    isAuthenticated,
    hasStoredSession,
    sessionRestored,
    setAccessToken,
    clearAuth,
    register,
    login,
    refreshSession,
    refreshSessionOnce,
    restoreSession,
  }
})
