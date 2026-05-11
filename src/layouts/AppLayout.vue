<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import ThemeToggle from '@/components/ThemeToggle.vue'
import AccountSwitcher from '@/components/AccountSwitcher.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Controle da sidebar em mobile
const sidebarOpen = ref(false)
const userStore = useUserStore()
 
onMounted(() => {
  userStore.fetchProfile()
})

const navItems = [
  {
    name: 'dashboard',
    label: 'Dashboard',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`
  },
  {
    name: 'transactions',
    label: 'Transações',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`
  },
  {
    name: 'quotations',
    label: 'Cotações',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`
  },
  {
    name: 'sales',
    label: 'Vendas',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`
  },
  {
    name: 'farms',
    label: 'Lavouras',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`
  },
  {
    name: 'reports',
    label: 'Relatórios',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>`
  },
  {
    name: 'settings-profile',
    label: 'Configurações',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
  }
]

function isActive(routeName: string): boolean {
  const current = route.name as string
 
  if (routeName === 'reports') {
    return current === 'reports' || current === 'farm-report'
  }
  if (routeName === 'settings-profile') {
    return current === 'settings-profile' || current === 'settings-members'
  }
  if (routeName === 'farms') {
    return ['farms', 'farm-create', 'farm-edit', 'farm-expenses',
            'expense-create', 'expense-edit'].includes(current)
  }
  if (routeName === 'quotations') {
    return ['quotations', 'quotation-create', 'quotation-edit'].includes(current)
  }
  return current === routeName
}

function navigate(name: string) {
  router.push({ name })
  sidebarOpen.value = false
}

function logout() {
  authStore.clearAuth()
  userStore.clearProfile()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="app-layout">

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
        <div class="sidebar__brand-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
          </svg>
        </div>
        <span class="sidebar__brand-name">Agro Manager</span>
      </div>

      <!-- Conta ativa -->
      <AccountSwitcher />

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
        <div class="sidebar__footer-theme">
          <ThemeToggle />
        </div>

        <button class="sidebar__user" @click="navigate('settings-profile')">
          <div class="sidebar__user-avatar">
            <img
              v-if="userStore.profile?.avatarUrl"
              :src="userStore.profile.avatarUrl"
              :alt="userStore.profile.name"
            />
            <span v-else class="sidebar__user-initials">{{ userStore.initials }}</span>
          </div>
          <div class="sidebar__user-info">
            <span class="sidebar__user-name">{{ userStore.firstName }}</span>
            <span class="sidebar__user-label">Ver perfil</span>
          </div>
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
        <span class="topbar__brand">Agro Manager</span>
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
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  padding: 1.5rem 0.875rem 1.25rem;
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
  padding: 0 0.375rem;
  margin-bottom: 1.25rem;
}

.sidebar__brand-icon {
  width: 28px;
  height: 28px;
  background: var(--color-primary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary-light);
  flex-shrink: 0;
}

.sidebar__brand-name {
  font-family: 'DM Serif Display', serif;
  font-style: italic;
  font-size: 1.05rem;
  color: var(--color-text);
  letter-spacing: -0.01em;
  line-height: 1;
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.sidebar__nav-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.575rem 0.625rem;
  border: none;
  border-left: 2px solid transparent;
  border-radius: var(--radius-sm);
  background: none;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.sidebar__nav-item:hover {
  background: var(--color-surface);
  color: var(--color-text);
}

.sidebar__nav-item--active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-left-color: var(--color-primary);
  font-weight: 600;
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

.sidebar__footer {
  padding-top: 0.875rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 0.5rem;
}

.sidebar__footer-theme {
  padding: 0 0.375rem 0.25rem;
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
  border-bottom: 1px solid var(--color-border);
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
  font-family: 'DM Serif Display', serif;
  font-style: italic;
  font-size: 1rem;
  color: var(--color-text);
  letter-spacing: -0.01em;
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

.sidebar__user {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.5rem 0.625rem;
  border: none;
  border-radius: var(--radius-sm);
  background: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background 0.15s;
}

.sidebar__user:hover {
  background: var(--color-surface);
}

.sidebar__user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar__user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sidebar__user-initials {
  font-family: 'DM Serif Display', serif;
  font-size: 0.7rem;
  color: var(--color-primary-light);
}

.sidebar__user-info {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  min-width: 0;
}

.sidebar__user-name {
  font-size: 0.825rem;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__user-label {
  font-size: 0.68rem;
  color: var(--color-text-muted);
}
</style>