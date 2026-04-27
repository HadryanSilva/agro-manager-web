import { ref, computed, watch } from 'vue'

export type ThemePreference = 'light' | 'dark'

const STORAGE_KEY = 'agro-theme'

// ── Estado global singleton ───────────────────────────────────────
// Detecta o tema do sistema para usar como valor inicial quando não
// há preferência salva pelo usuário
function getInitialTheme(): ThemePreference {
  const saved = localStorage.getItem(STORAGE_KEY) as ThemePreference | null
  if (saved === 'light' || saved === 'dark') return saved
  // Sem preferência salva: respeita o tema do sistema
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const theme = ref<ThemePreference>(getInitialTheme())

// Aplica o atributo data-theme no elemento raiz sempre que o tema mudar
watch(theme, (t) => {
  document.documentElement.setAttribute('data-theme', t)
}, { immediate: true })

// ── Composable público ────────────────────────────────────────────

export function useTheme() {

  function setTheme(t: ThemePreference) {
    theme.value = t
    localStorage.setItem(STORAGE_KEY, t)
  }

  // Alterna diretamente entre light e dark — sem estado intermediário
  function toggle() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  return {
    theme,          // tema efetivamente aplicado: 'light' | 'dark'
    setTheme,
    toggle,
  }
}