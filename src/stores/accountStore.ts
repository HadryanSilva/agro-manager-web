import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import accountService from '@/services/accountService'
import type { AccountResponse } from '@/services/accountService'

const STORAGE_KEY = 'agro_selected_account_id'

export const useAccountStore = defineStore('account', () => {
  const accounts = ref<AccountResponse[]>([])
  const loaded   = ref(false)

  // ID da conta selecionada pelo usuário — persistido entre sessões
  const selectedAccountId = ref<string | null>(localStorage.getItem(STORAGE_KEY))

  // Conta ativa: a selecionada explicitamente ou a primeira da lista como fallback
  const selectedAccount = computed<AccountResponse | null>(() => {
    if (accounts.value.length === 0) return null
    if (selectedAccountId.value) {
      const found = accounts.value.find(a => a.id === selectedAccountId.value)
      if (found) return found
    }
    // Fallback para a primeira conta (retrocompatibilidade)
    return accounts.value[0] ?? null
  })

  const hasAccounts = computed(() => accounts.value.length > 0)

  // Seleciona uma conta e persiste a escolha
  function selectAccount(accountId: string) {
    selectedAccountId.value = accountId
    localStorage.setItem(STORAGE_KEY, accountId)
  }

  async function fetchUserAccounts() {
    const { data } = await accountService.getUserAccounts()
    accounts.value = data.data
    loaded.value   = true

    // Se a conta selecionada não existe mais na lista, limpa a seleção
    if (selectedAccountId.value) {
      const stillExists = accounts.value.some(a => a.id === selectedAccountId.value)
      if (!stillExists) {
        selectedAccountId.value = null
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }

  async function createAccount(name: string): Promise<AccountResponse> {
    const { data } = await accountService.createAccount({ name })
    accounts.value.push(data.data)
    // Seleciona automaticamente a conta recém-criada
    selectAccount(data.data.id)
    return data.data
  }

  // Limpa estado completo no logout
  function reset() {
    accounts.value          = []
    loaded.value            = false
    selectedAccountId.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    accounts,
    loaded,
    hasAccounts,
    selectedAccount,
    selectedAccountId,
    selectAccount,
    fetchUserAccounts,
    createAccount,
    reset,
  }
})