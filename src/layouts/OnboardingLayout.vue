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

    <!-- Blobs decorativos -->
    <div class="blob blob-1" aria-hidden="true"></div>
    <div class="blob blob-2" aria-hidden="true"></div>
    <div class="blob blob-3" aria-hidden="true"></div>

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
  background: linear-gradient(160deg, #f0fdf4 0%, #ecfdf5 55%, #d1fae5 100%);
  position: relative;
  overflow: hidden;
}

:global([data-theme="dark"]) .onboarding-wrapper {
  background: linear-gradient(160deg, #0f172a 0%, #0f2419 55%, #022c22 100%);
}

/* ── Blobs decorativos ── */
.blob {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.blob-1 {
  top: -60px;
  right: -60px;
  width: 220px;
  height: 220px;
  background: rgba(5, 150, 105, 0.13);
  filter: blur(30px);
}

.blob-2 {
  bottom: -50px;
  left: -50px;
  width: 170px;
  height: 170px;
  background: rgba(217, 119, 6, 0.10);
  filter: blur(22px);
}

.blob-3 {
  top: 100px;
  left: 30px;
  width: 70px;
  height: 70px;
  background: rgba(5, 150, 105, 0.07);
  filter: blur(12px);
}

:global([data-theme="dark"]) .onboarding-wrapper .blob-1 { background: rgba(52, 211, 153, 0.10); }
:global([data-theme="dark"]) .onboarding-wrapper .blob-2 { background: rgba(251, 191, 36, 0.07); }
:global([data-theme="dark"]) .onboarding-wrapper .blob-3 { background: rgba(52, 211, 153, 0.05); }

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
  z-index: 10;
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
  border: 1px solid rgba(5, 150, 105, 0.20);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.70);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  font-family: inherit;
  font-size: 0.875rem;
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

:global([data-theme="dark"]) .logout-btn {
  background: rgba(30, 41, 59, 0.70);
  border-color: var(--color-border);
}

.onboarding-content {
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
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