<script setup lang="ts">
import { useAccountStore } from '@/stores/accountStore'

const accountStore = useAccountStore()
</script>

<template>
  <div class="dashboard">
    <div class="dashboard__header">
      <h1 class="dashboard__title">Dashboard</h1>
      <p class="dashboard__subtitle">
        Bem-vindo à conta <strong>{{ accountStore.accounts[0]?.name }}</strong>.
      </p>
    </div>

    <div class="dashboard__empty">
      <span class="dashboard__empty-icon">🌱</span>
      <p>O dashboard está em construção.</p>
      <p class="dashboard__empty-hint">Use o menu lateral para navegar.</p>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 2rem 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
}

.dashboard__header {
  margin-bottom: 2rem;
}

.dashboard__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.dashboard__subtitle {
  margin-top: 0.25rem;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.dashboard__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 4rem 2rem;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  box-shadow: var(--shadow-card);
}

.dashboard__empty-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.dashboard__empty-hint {
  font-size: 0.8rem;
  color: var(--color-text-placeholder);
}
</style>