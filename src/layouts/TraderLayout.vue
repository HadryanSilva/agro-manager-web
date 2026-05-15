<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import { useTraderStore } from '@/stores/traderStore'
import ThemeToggle from '@/components/ThemeToggle.vue'
import AccountSwitcher from '@/components/AccountSwitcher.vue'
import SvgIcon from '@/components/SvgIcon.vue'
import type { IconName } from '@/components/SvgIcon.vue'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()
const userStore = useUserStore()
const traderStore = useTraderStore()

// Controle da sidebar em mobile
const sidebarOpen = ref(false)

onMounted(() => {
  userStore.fetchProfile()
})

const navItems: Array<{ name: string; label: string; icon: IconName }> = [
  {
    name: 'trader-dashboard',
    label: 'Dashboard',
    icon: 'chart-grid'
  },
  {
    name: 'trader-suppliers',
    label: 'Fornecedores',
    icon: 'users'
  },
  {
    name: 'trader-clients',
    label: 'Clientes',
    icon: 'user'
  },
  {
    name: 'trader-orders',
    label: 'Pedidos',
    icon: 'file-text'
  },
]

const orderRoutes = ['trader-orders', 'trader-orders-new', 'trader-order-detail', 'trader-order-edit']

function isActive(name: string) {
  if (name === 'trader-orders') return orderRoutes.includes(route.name as string)
  return route.name === name
}

function navigate(name: string) {
  router.push({ name })
  sidebarOpen.value = false
}

// Sai do modo comprador e volta ao ambiente do produtor
function exitTraderMode() {
  traderStore.disableTraderMode()
  router.push({ name: 'dashboard' })
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

      <!-- Badge do modo comprador -->
      <div class="trader-badge">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
        </svg>
        <span>Modo Comprador</span>
      </div>

      <!-- Conta ativa -->
      <AccountSwitcher />

      <!-- Navegação -->
      <nav class="sidebar__nav">
        <button
          v-for="item in navItems"
          :key="item.name"
          class="sidebar__nav-item"
          :class="{ 'sidebar__nav-item--active': isActive(item.name) }"
          @click="navigate(item.name)"
        >
          <span class="sidebar__nav-icon">
            <SvgIcon :name="item.icon" />
          </span>
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <!-- Rodapé da sidebar -->
      <div class="sidebar__footer">

        <!-- Botão voltar ao modo produtor -->
        <button class="sidebar__nav-item trader-exit-btn" @click="exitTraderMode">
          <span class="sidebar__nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            </svg>
          </span>
          <span>Voltar ao Produtor</span>
        </button>

        <div class="sidebar__footer-theme">
          <ThemeToggle />
        </div>

        <button class="sidebar__user" @click="navigate('settings-profile')">
          <div class="sidebar__user-avatar">
            <img
              v-if="userStore.profile?.avatarUrl"
              :src="userStore.profile.avatarUrl"
              :alt="userStore.profile?.name"
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
        <div class="topbar__center">
          <span class="topbar__brand">Agro Manager</span>
          <button class="topbar__exit-btn" @click="exitTraderMode" title="Sair do Modo Comprador">
            <span class="topbar__mode-badge">Comprador</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
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
/* ── Estrutura geral (idêntica ao AppLayout) ─────────────────────────────── */
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-background);
}

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
  margin-bottom: 0.5rem;
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
  font-weight: 800;
  font-size: 1rem;
  color: var(--color-text);
  letter-spacing: -0.02em;
  line-height: 1;
}

/* ── Badge modo comprador ───────────────────────────────────────────────── */
.trader-badge {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin: 0 0.375rem 0.75rem;
  padding: 0.3rem 0.6rem;
  background: var(--color-warning-light, #fff8e6);
  color: var(--color-warning, #b45309);
  border: 1px solid var(--color-warning-border, #fcd34d);
  border-radius: var(--radius-sm);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

/* ── Navegação ───────────────────────────────────────────────────────────── */
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

/* ── Botão voltar ao modo produtor ───────────────────────────────────────── */
.trader-exit-btn {
  color: var(--color-primary);
  font-weight: 600;
}

.trader-exit-btn:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

/* ── Rodapé ──────────────────────────────────────────────────────────────── */
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

/* ── Área principal ──────────────────────────────────────────────────────── */
.app-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.app-content {
  flex: 1;
}

/* ── Usuário ──────────────────────────────────────────────────────────────── */
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
  font-weight: 700;
  font-size: 0.75rem;
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

/* ── Topbar (mobile only) ───────────────────────────────────────────────── */
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

.topbar__center {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.topbar__brand {
  font-weight: 800;
  font-size: 1rem;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.topbar__mode-badge {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-warning, #b45309);
  background: var(--color-warning-light, #fff8e6);
  border: 1px solid var(--color-warning-border, #fcd34d);
  border-radius: 4px;
  padding: 0.1rem 0.35rem;
}

.topbar__exit-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: var(--color-warning, #b45309);
  line-height: 1;
  transition: opacity 0.15s;
}

.topbar__exit-btn:hover { opacity: 0.75; }

/* ── Overlay mobile ─────────────────────────────────────────────────────── */
.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 19;
}

/* ── Responsivo ─────────────────────────────────────────────────────────── */
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
