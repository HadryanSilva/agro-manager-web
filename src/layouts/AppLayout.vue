<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useAccountStore } from '@/stores/accountStore'
import ThemeToggle from '@/components/ThemeToggle.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const accountStore = useAccountStore()

// Controle da sidebar em mobile
const sidebarOpen = ref(false)

const accountName = computed(() => accountStore.accounts[0]?.name ?? 'Minha Conta')

const navItems = [
  {
    name: 'dashboard',
    label: 'Dashboard',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`
  },
  {
    name: 'farms',
    label: 'Lavouras',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 2v20"/><path d="M2 12h20"/><path d="M12 2C6.48 2 2 6.48 2 12"/></svg>`
  }
]

function isActive(name: string) {
  return route.name === name || String(route.name).startsWith(name)
}

function navigate(name: string) {
  router.push({ name })
  sidebarOpen.value = false
}

function logout() {
  authStore.clearAuth()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="app-layout">

    <!-- Toggle de tema fixo no canto superior direito -->
    <div class="theme-corner">
      <ThemeToggle />
    </div>

    <!-- Overlay mobile -->
    <div
      v-if="sidebarOpen"
      class="sidebar-overlay"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar--open': sidebarOpen }">
      <!-- Brand -->
      <div class="sidebar__brand">
        <span class="sidebar__brand-icon">🌱</span>
        <span class="sidebar__brand-name">Agro Manager</span>
      </div>

      <!-- Conta ativa -->
      <div class="sidebar__account">
        <div class="sidebar__account-dot" />
        <span class="sidebar__account-name">{{ accountName }}</span>
      </div>

      <!-- Navegação principal -->
      <nav class="sidebar__nav">
        <button
          v-for="item in navItems"
          :key="item.name"
          class="sidebar__nav-item"
          :class="{ 'sidebar__nav-item--active': isActive(item.name) }"
          @click="navigate(item.name)"
        >
          <span class="sidebar__nav-icon" v-html="item.icon" />
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <!-- Rodapé da sidebar -->
      <div class="sidebar__footer">
        <button class="sidebar__nav-item" @click="navigate('settings-profile')">
          <span class="sidebar__nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </span>
          <span>Configurações</span>
        </button>

        <button class="sidebar__nav-item sidebar__nav-item--danger" @click="logout">
          <span class="sidebar__nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </span>
          <span>Sair</span>
        </button>
      </div>
    </aside>

    <!-- Área principal -->
    <div class="app-main">
      <!-- Topbar mobile -->
      <header class="topbar">
        <button class="topbar__menu-btn" @click="sidebarOpen = true" aria-label="Abrir menu">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <span class="topbar__brand">🌱 Agro Manager</span>
        <ThemeToggle />
      </header>

      <!-- Conteúdo da rota -->
      <main class="app-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-background);
}

/* ── Sidebar ──────────────────────────────────────────────────────────────── */

.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: var(--color-card);
  border-right: 1.5px solid var(--color-border);
  display: flex;
  flex-direction: column;
  padding: 1.25rem 0.75rem;
  gap: 0.25rem;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.5rem;
  margin-bottom: 1.25rem;
}

.sidebar__brand-icon { font-size: 1.25rem; }

.sidebar__brand-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.sidebar__account {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-primary-light);
  border-radius: var(--radius-sm);
  margin-bottom: 0.75rem;
}

.sidebar__account-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
  flex-shrink: 0;
}

.sidebar__account-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
}

.sidebar__nav-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: none;
  border-radius: var(--radius-sm);
  background: none;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, color 0.15s;
}

.sidebar__nav-item:hover {
  background: var(--color-background);
  color: var(--color-text);
}

.sidebar__nav-item--active {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.sidebar__nav-item--danger:hover {
  background: var(--color-error-light);
  color: var(--color-error);
}

.sidebar__nav-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.theme-corner {
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  z-index: 15;
}

/* Em mobile o topbar já ocupa o topo, então escondemos o canto fixo */
@media (max-width: 768px) {
  .theme-corner {
    display: none;
  }
}

.sidebar__footer {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
  margin-top: auto;
}

/* ── Área principal ───────────────────────────────────────────────────────── */

.app-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.app-content {
  flex: 1;
}

/* ── Topbar (mobile only) ─────────────────────────────────────────────────── */

.topbar {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  background: var(--color-card);
  border-bottom: 1.5px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.topbar__menu-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text);
  display: flex;
  align-items: center;
  padding: 0;
}

.topbar__brand {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

/* ── Overlay mobile ───────────────────────────────────────────────────────── */

.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 19;
}

/* ── Responsividade ───────────────────────────────────────────────────────── */

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 20;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }

  .sidebar--open {
    transform: translateX(0);
  }

  .sidebar-overlay {
    display: block;
  }

  .topbar {
    display: flex;
  }
}
</style>