import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import userService from '@/services/userService'
import type { UserProfileResponse } from '@/services/userService'

/**
 * Store global do perfil do usuário autenticado.
 * Carregado uma vez no AppLayout e reutilizado em qualquer componente.
 */
export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfileResponse | null>(null)
  const loaded  = ref(false)

  // Primeiras letras do nome — máximo 2 caracteres
  const initials = computed(() => {
    if (!profile.value) return '?'
    return profile.value.name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase()
  })

  // Primeiro nome apenas (para exibição compacta na sidebar)
  const firstName = computed(() => {
    if (!profile.value) return 'Usuário'
    return profile.value.name.split(' ')[0]
  })

  async function fetchProfile() {
    if (loaded.value) return
    try {
      const { data } = await userService.getProfile()
      profile.value = data.data
      loaded.value  = true
    } catch {
      // Silencia o erro — o layout funciona sem o nome do usuário
    }
  }

  // Limpa o cache ao fazer logout
  function clearProfile() {
    profile.value = null
    loaded.value  = false
  }

  return { profile, loaded, initials, firstName, fetchProfile, clearProfile }
})