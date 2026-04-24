import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import accountService from '@/services/accountService'
import type { AccountResponse } from '@/services/accountService'

export const useAccountStore = defineStore('account', () => {
  const accounts = ref<AccountResponse[]>([])

  // Indica se a lista de contas já foi buscada ao menos uma vez nesta sessão
  const loaded = ref(false)

  const hasAccounts = computed(() => accounts.value.length > 0)

  async function fetchUserAccounts() {
    const { data } = await accountService.getUserAccounts()
    accounts.value = data.data
    loaded.value = true
  }

  async function createAccount(name: string): Promise<AccountResponse> {
    const { data } = await accountService.createAccount({ name })
    accounts.value.push(data.data)
    return data.data
  }

  // Chamado no logout para limpar o estado
  function reset() {
    accounts.value = []
    loaded.value = false
  }

  return { accounts, loaded, hasAccounts, fetchUserAccounts, createAccount, reset }
})