<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/accountStore'
import type { AccountRole } from '@/services/accountService'

const router       = useRouter()
const accountStore = useAccountStore()

const open = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const roleConfig: Record<AccountRole, { label: string; color: string; bg: string }> = {
  OWNER:  { label: 'Owner',  color: '#7c3aed', bg: '#ede9fe' },
  ADMIN:  { label: 'Admin',  color: '#2563eb', bg: '#dbeafe' },
  MEMBER: { label: 'Membro', color: '#059669', bg: '#d1fae5' },
}

// Outras contas (exceto a ativa)
const otherAccounts = computed(() =>
  accountStore.accounts.filter(a => a.id !== accountStore.selectedAccount?.id)
)

function toggle() {
  // Só abre o dropdown se houver mais de uma conta ou para criar nova
  open.value = !open.value
}

function handleSelect(accountId: string) {
  accountStore.selectAccount(accountId)
  open.value = false
}

function handleCreateAccount() {
  open.value = false
  router.push({ name: 'create-account' })
}

// Fecha o dropdown ao clicar fora
function handleClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', handleClickOutside))

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}
</script>

<template>
  <div class="account-switcher" ref="dropdownRef">

    <!-- Botão da conta ativa -->
    <button
      class="switcher-trigger"
      :class="{ 'switcher-trigger--open': open }"
      @click="toggle"
      :title="accountStore.accounts.length > 1 ? 'Trocar conta' : accountStore.selectedAccount?.name"
    >
      <div class="switcher-avatar">
        {{ getInitials(accountStore.selectedAccount?.name ?? '?') }}
      </div>
      <div class="switcher-info">
        <span class="switcher-name">{{ accountStore.selectedAccount?.name }}</span>
        <span
          class="switcher-role"
          :style="{
            color: roleConfig[accountStore.selectedAccount?.userRole ?? 'MEMBER'].color
          }"
        >
          {{ roleConfig[accountStore.selectedAccount?.userRole ?? 'MEMBER'].label }}
        </span>
      </div>
      <svg
        class="switcher-chevron"
        :class="{ 'switcher-chevron--up': open }"
        xmlns="http://www.w3.org/2000/svg" width="14" height="14"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
      >
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>

    <!-- Dropdown -->
    <Transition name="dropdown">
      <div v-if="open" class="switcher-dropdown">

        <!-- Conta ativa (readonly) -->
        <div class="dropdown-section-label">Conta ativa</div>
        <div class="dropdown-item dropdown-item--active">
          <div class="dropdown-item__avatar">
            {{ getInitials(accountStore.selectedAccount?.name ?? '?') }}
          </div>
          <div class="dropdown-item__info">
            <span class="dropdown-item__name">{{ accountStore.selectedAccount?.name }}</span>
            <span
              class="dropdown-item__role"
              :style="{
                background: roleConfig[accountStore.selectedAccount?.userRole ?? 'MEMBER'].bg,
                color: roleConfig[accountStore.selectedAccount?.userRole ?? 'MEMBER'].color
              }"
            >
              {{ roleConfig[accountStore.selectedAccount?.userRole ?? 'MEMBER'].label }}
            </span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2.5" class="check-icon">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <!-- Outras contas -->
        <template v-if="otherAccounts.length > 0">
          <div class="dropdown-divider" />
          <div class="dropdown-section-label">Outras contas</div>
          <button
            v-for="account in otherAccounts"
            :key="account.id"
            class="dropdown-item dropdown-item--btn"
            @click="handleSelect(account.id)"
          >
            <div class="dropdown-item__avatar dropdown-item__avatar--muted">
              {{ getInitials(account.name) }}
            </div>
            <div class="dropdown-item__info">
              <span class="dropdown-item__name">{{ account.name }}</span>
              <span
                class="dropdown-item__role"
                :style="{
                  background: roleConfig[account.userRole].bg,
                  color: roleConfig[account.userRole].color
                }"
              >
                {{ roleConfig[account.userRole].label }}
              </span>
            </div>
          </button>
        </template>

        <!-- Criar nova conta -->
        <div class="dropdown-divider" />
        <button class="dropdown-item dropdown-item--btn dropdown-item--create" @click="handleCreateAccount">
          <div class="dropdown-item__icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <span>Nova conta</span>
        </button>

      </div>
    </Transition>
  </div>
</template>

<style scoped>
.account-switcher {
  position: relative;
}

/* ── Trigger ─────────────────────────────────────────────────────── */
.switcher-trigger {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.5rem 0.625rem;
  border: 1.5px solid transparent;
  border-radius: var(--radius-sm);
  background: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background 0.15s, border-color 0.15s;
}

.switcher-trigger:hover,
.switcher-trigger--open {
  background: var(--color-background);
  border-color: var(--color-border);
}

.switcher-avatar {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.switcher-info {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  flex: 1;
  min-width: 0;
}

.switcher-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.switcher-role {
  font-size: 0.7rem;
  font-weight: 500;
}

.switcher-chevron {
  color: var(--color-text-muted);
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.switcher-chevron--up {
  transform: rotate(180deg);
}

/* ── Dropdown ────────────────────────────────────────────────────── */
.switcher-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 50;
  overflow: hidden;
  min-width: 220px;
}

.dropdown-section-label {
  padding: 0.5rem 0.875rem 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.dropdown-divider {
  height: 1px;
  background: var(--color-border);
  margin: 0.25rem 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.875rem;
}

.dropdown-item--btn {
  width: 100%;
  border: none;
  background: none;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s;
}

.dropdown-item--btn:hover {
  background: var(--color-background);
}

.dropdown-item--active {
  background: var(--color-primary-light);
}

.dropdown-item__avatar {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 0.65rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dropdown-item__avatar--muted {
  background: var(--color-background);
  color: var(--color-text-muted);
}

.dropdown-item__info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  flex: 1;
  min-width: 0;
}

.dropdown-item__name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-item__role {
  display: inline-flex;
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
  font-size: 0.65rem;
  font-weight: 600;
  width: fit-content;
}

.check-icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.dropdown-item--create {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  font-weight: 500;
}

.dropdown-item--create:hover {
  color: var(--color-primary);
}

.dropdown-item--create:hover .dropdown-item__icon {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.dropdown-item__icon {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: var(--color-background);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.12s, color 0.12s;
}

/* ── Animação dropdown ───────────────────────────────────────────── */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>