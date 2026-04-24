<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="auth-wrapper">
    <div class="auth-brand">
      <span class="auth-brand__icon">🌱</span>
      <span class="auth-brand__name">Agro Manager</span>
    </div>

    <div class="auth-card">
      <RouterView />
    </div>

    <p class="auth-footer">
      © {{ new Date().getFullYear() }} Agro Manager
    </p>
  </div>
</template>

<style scoped>
.auth-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: var(--color-background);
}

.auth-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  text-decoration: none;
}

.auth-brand__icon {
  font-size: 1.5rem;
}

.auth-brand__name {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 2.5rem;
}

.auth-footer {
  margin-top: 2rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

@media (max-width: 480px) {
  .auth-card {
    padding: 2rem 1.5rem;
    border-radius: var(--radius-md);
  }
}
</style>