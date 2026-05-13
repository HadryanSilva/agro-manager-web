import { ref } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'agro_trader_mode'

/**
 * Store do modo comprador.
 * Controla se o usuário está operando no ambiente de compra/revenda.
 * A preferência é persistida no localStorage para sobreviver ao reload.
 */
export const useTraderStore = defineStore('trader', () => {
  // Restaura o estado persistido (false por padrão — modo produtor é o padrão)
  const isTraderMode = ref(localStorage.getItem(STORAGE_KEY) === 'true')

  function enableTraderMode() {
    isTraderMode.value = true
    localStorage.setItem(STORAGE_KEY, 'true')
  }

  function disableTraderMode() {
    isTraderMode.value = false
    localStorage.removeItem(STORAGE_KEY)
  }

  function toggleTraderMode() {
    if (isTraderMode.value) {
      disableTraderMode()
    } else {
      enableTraderMode()
    }
  }

  return { isTraderMode, enableTraderMode, disableTraderMode, toggleTraderMode }
})
