import { ref, computed, watch } from 'vue'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'agro-theme'

// ── Estado global singleton ───────────────────────────────────────────────────
// Compartilhado entre todas as instâncias do composable sem necessidade de Pinia

const preference = ref<ThemePreference>(
  (localStorage.getItem(STORAGE_KEY) as ThemePreference) ?? 'system'
)

// Detecta o tema atual do sistema operacional
const systemTheme = ref<ResolvedTheme>(
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
)

// Atualiza o tema do sistema quando o usuário altera nas configurações do SO
window.matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', (e) => {
    systemTheme.value = e.matches ? 'dark' : 'light'
  })

// Tema efetivamente aplicado: resolve "system" para o valor real
const resolvedTheme = computed<ResolvedTheme>(() =>
  preference.value === 'system' ? systemTheme.value : preference.value
)

// Aplica o atributo data-theme no elemento raiz sempre que o tema mudar
watch(resolvedTheme, (theme) => {
  document.documentElement.setAttribute('data-theme', theme)
}, { immediate: true })

// ── Composable público ────────────────────────────────────────────────────────

export function useTheme() {

  function setPreference(pref: ThemePreference) {
    preference.value = pref
    localStorage.setItem(STORAGE_KEY, pref)
  }

  /**
   * Ciclo de estados ao clicar no toggle:
   *   system → oposto ao atual (sobrescreve)
   *   light  → dark
   *   dark   → system (volta ao automático)
   */
  function toggle() {
    const next: Record<ThemePreference, ThemePreference> = {
      system: resolvedTheme.value === 'dark' ? 'light' : 'dark',
      light:  'dark',
      dark:   'system'
    }
    setPreference(next[preference.value])
  }

  return {
    preference,     // 'light' | 'dark' | 'system'
    resolvedTheme,  // tema efetivamente aplicado
    setPreference,
    toggle
  }
}