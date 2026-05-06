<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { useAuthStore } from '@/stores/authStore'

const router   = useRouter()
const authStore = useAuthStore()

// Limpa tokens, perfil e conta — clearAuth já cuida de tudo
function logout() {
  authStore.clearAuth()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="onboarding-wrapper">

    <!-- Toolbar fixa: logout à esquerda, theme toggle à direita -->
    <div class="onboarding-toolbar">
      <button class="logout-btn" @click="logout" title="Sair da conta" aria-label="Sair da conta">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        <span>Sair</span>
      </button>

      <ThemeToggle />
    </div>

    <!-- Brand centralizada -->
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

/* Toolbar fixa no topo com logout e theme toggle */
.onboarding-toolbar {
  position: fixed;
  top: 1.25rem;
  left: 1.25rem;
  right: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* Garante que o toolbar não interfira com o conteúdo centralizado */
  pointer-events: none;
}

/* Reativa eventos apenas nos botões internos */
.onboarding-toolbar > * {
  pointer-events: auto;
}

.logout-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.4rem 0.875rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-card);
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}

.logout-btn:hover {
  border-color: var(--color-error);
  color: var(--color-error);
  background: var(--color-error-light);
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
  margin: 0 auto;
}

@media (max-width: 480px) {
  .logout-btn span {
    display: none;
  }
  .logout-btn {
    padding: 0.4rem 0.5rem;
  }
}
</style>