<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const route  = useRoute()
const router = useRouter()

const tabs = [
  { name: 'settings-profile', label: 'Perfil' },
  { name: 'settings-members', label: 'Membros' },
]
</script>

<template>
  <nav class="settings-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.name"
      class="settings-tabs__item"
      :class="{ 'settings-tabs__item--active': route.name === tab.name }"
      @click="router.push({ name: tab.name })"
    >
      {{ tab.label }}
    </button>
  </nav>
</template>

<style scoped>
.settings-tabs {
  display: flex;
  gap: 0.25rem;
  border-bottom: 1.5px solid var(--color-border);
  margin-bottom: 1.75rem;
  padding-bottom: 0;
}

.settings-tabs__item {
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1.5px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.settings-tabs__item:hover {
  color: var(--color-text);
}

.settings-tabs__item--active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: 600;
}
</style>