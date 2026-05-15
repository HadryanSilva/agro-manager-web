<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import { useTraderStore } from '@/stores/traderStore'
import ThemeToggle from '@/components/ThemeToggle.vue'
import AccountSwitcher from '@/components/AccountSwitcher.vue'
import SvgIcon from '@/components/SvgIcon.vue'
import type { IconName } from '@/components/SvgIcon.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Controle da sidebar em mobile
const sidebarOpen  = ref(false)
const userStore    = useUserStore()
const traderStore  = useTraderStore()

// Ativa o modo comprador e navega para o dashboard do comprador
function enterTraderMode() {
  traderStore.enableTraderMode()
  router.push({ name: 'trader-dashboard' })
}
 
onMounted(() => {
  userStore.fetchProfile()
})

const navItems: Array<{ name: string; label: string; icon: IconName; comingSoon?: boolean }> = [
  {
    name: 'dashboard',
    label: 'Dashboard',
    icon: 'chart-grid'
  },
  {
    name: 'transactions',
    label: 'Transações',
    icon: 'money'
  },
  {
    name: 'quotations',
    label: 'Cotações',
    icon: 'check-square'
  },
  {
    name: 'sales',
    label: 'Vendas',
    comingSoon: true,
    icon: 'package'
  },
  {
    name: 'farms',
    label: 'Lavouras',
    icon: 'leaf'
  },
  {
    name: 'reports',
    label: 'Relatórios',
    icon: 'bar-chart'
  },
  {
    name: 'settings-profile',
    label: 'Configurações',
    icon: 'settings'
  }
]

function isActive(routeName: string): boolean {
  const current = route.name as string
 
  if (routeName === 'reports') {
    return current === 'reports' || current === 'farm-report'
  }
  if (routeName === 'settings-profile') {
    return current === 'settings-profile' || current === 'settings-members' || current === 'settings-account'
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

      <!-- Botão de entrada no modo comprador -->
      <button class="trader-mode-btn" @click="enterTraderMode">
        <span class="trader-mode-btn__icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="17 1 21 5 17 9"/>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
            <polyline points="7 23 3 19 7 15"/>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
          </svg>
        </span>
        <span class="trader-mode-btn__text">Modo Comprador</span>
        <span class="trader-mode-btn__arrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </span>
      </button>

      <!-- Navegação principal -->
      <nav class="sidebar__nav">
        <button
          v-for="item in navItems"
          :key="item.name"
          class="sidebar__nav-item"
          :class="{ 'sidebar__nav-item--active': isActive(item.name) }"
          :disabled="item.comingSoon"
          @click="navigate(item.name)"
        >
          <span class="sidebar__nav-icon">
            <SvgIcon :name="item.icon" />
          </span>
          <span>{{ item.label }}</span>
          <span v-if="item.comingSoon" class="nav-badge">Em breve</span>
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
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: -0.02em;
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

.sidebar__nav-item:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.nav-badge {
  margin-left: auto;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  line-height: 1.4;
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
  font-size: 1rem;
  font-weight: 800;
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
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-primary-light);
}

.sidebar__user-info {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  min-width: 0;
}

.sidebar__user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__user-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* ── Botão modo comprador ───────────────────────────────────────────────── */

.trader-mode-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: calc(100% - 0.75rem);
  margin: 0.25rem 0 0.75rem 0.375rem;
  padding: 0.45rem 0.625rem;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-sm);
  background: none;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-text-muted);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  letter-spacing: 0.01em;
}

.trader-mode-btn:hover {
  background: var(--color-warning-light, #fff8e6);
  color: var(--color-warning, #b45309);
  border-color: var(--color-warning-border, #fcd34d);
  border-style: solid;
}

.trader-mode-btn__icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.trader-mode-btn__text {
  flex: 1;
}

.trader-mode-btn__arrow {
  display: flex;
  align-items: center;
  opacity: 0.5;
}
</style>
