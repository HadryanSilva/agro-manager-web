<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { preference, resolvedTheme, toggle } = useTheme()

// Ícone e tooltip variam conforme a preferência atual
const icon = computed(() => {
  if (preference.value === 'system') return 'system'
  if (preference.value === 'light')  return 'sun'
  return 'moon'
})

const tooltip = computed(() => {
  if (preference.value === 'system') return 'Automático (sistema)'
  if (preference.value === 'light')  return 'Tema claro'
  return 'Tema escuro'
})
</script>

<template>
  <button
    class="theme-toggle"
    :class="`theme-toggle--${resolvedTheme}`"
    :title="tooltip"
    :aria-label="tooltip"
    @click="toggle"
  >
    <!-- Ícone: automático / sistema -->
    <svg v-if="icon === 'system'" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
         viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>

    <!-- Ícone: sol (tema claro) -->
    <svg v-else-if="icon === 'sun'" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
         viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>

    <!-- Ícone: lua (tema escuro) -->
    <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18"
         viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--color-border);
  background: var(--color-card);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  flex-shrink: 0;
}

.theme-toggle:hover {
  background: var(--color-background);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.theme-toggle:active {
  transform: scale(0.94);
}
</style>