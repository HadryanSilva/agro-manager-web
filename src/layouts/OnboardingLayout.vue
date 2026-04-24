<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="onboarding-wrapper">
    <div class="onboarding-brand">
      <span class="onboarding-brand__icon">🌱</span>
      <span class="onboarding-brand__name">Agro Manager</span>
    </div>

    <div class="onboarding-content">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.onboarding-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: var(--color-background);
}

.onboarding-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2.5rem;
}

.onboarding-brand__icon {
  font-size: 1.5rem;
}

.onboarding-brand__name {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.onboarding-content {
  width: 100%;
  max-width: 680px;
}
</style>