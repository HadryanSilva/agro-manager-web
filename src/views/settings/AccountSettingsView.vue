<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/accountStore'
import accountService from '@/services/accountService'
import SettingsTabs from '@/components/SettingsTabs.vue'

const router       = useRouter()
const accountStore = useAccountStore()

const account  = computed(() => accountStore.selectedAccount)
const isOwner  = computed(() => account.value?.userRole === 'OWNER')

// ── Estado do modal de exclusão ──────────────────────────────────────────────
const showDeleteModal  = ref(false)
const confirmationText = ref('')
const deleting         = ref(false)
const deleteError      = ref('')

// O botão final só habilita quando o texto digitado é idêntico ao nome da conta
const canConfirmDelete = computed(
  () => confirmationText.value === account.value?.name
)

function openDeleteModal() {
  confirmationText.value = ''
  deleteError.value      = ''
  showDeleteModal.value  = true
}

function closeDeleteModal() {
  showDeleteModal.value  = false
  confirmationText.value = ''
  deleteError.value      = ''
}

async function handleDeleteAccount() {
    if (!canConfirmDelete.value || !account.value) return

    deleting.value    = true
    deleteError.value = ''

    try {
      await accountService.deleteAccount(account.value.id, confirmationText.value)
    } catch (e: any) {
      deleteError.value = e.response?.data?.message
        ?? 'Erro ao excluir a conta. Tente novamente.'
      deleting.value = false
      return
    }
    
    try {
      accountStore.reset()
      await accountStore.fetchUserAccounts()
      closeDeleteModal()
    } catch (e: any) {
      deleteError.value = e.response?.data?.message
        ?? 'A conta foi excluída, mas não foi possível atualizar a lista de contas. Tente novamente.'
        deleting.value = false
        return
    }
  
    if (accountStore.hasAccounts) {
      router.push({ name: 'dashboard' })
    } else {
      router.push({ name: 'onboarding' })
    }
  }
</script>

<template>
  <div class="account-settings">

    <div class="account-settings__header">
      <h1 class="account-settings__title">Configurações</h1>
    </div>

    <SettingsTabs />

    <!-- Informações gerais da conta -->
    <div class="section">
      <h2 class="section__title">Informações da conta</h2>
      <div class="info-card">
        <div class="info-row">
          <span class="info-row__label">Nome</span>
          <span class="info-row__value">{{ account?.name }}</span>
        </div>
        <div class="info-row">
          <span class="info-row__label">Seu papel</span>
          <span class="info-row__value">
            <span
              class="role-badge"
              :class="`role-badge--${account?.userRole?.toLowerCase()}`"
            >
              {{ account?.userRole === 'OWNER' ? 'Proprietário' : account?.userRole === 'ADMIN' ? 'Admin' : 'Membro' }}
            </span>
          </span>
        </div>
        <div class="info-row">
          <span class="info-row__label">Membros</span>
          <span class="info-row__value">{{ account?.memberCount }}</span>
        </div>
      </div>
    </div>

    <!-- Zona de perigo — apenas para OWNER ─────────────────────── -->
    <div class="section danger-zone" v-if="isOwner">
      <div class="danger-zone__header">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <h2 class="danger-zone__title">Zona de perigo</h2>
      </div>

      <div class="danger-action">
        <div class="danger-action__info">
          <p class="danger-action__label">Excluir esta conta</p>
          <p class="danger-action__description">
            Esta ação é permanente e irreversível. Todos os dados da conta serão destruídos.
          </p>
        </div>
        <button class="btn-danger" @click="openDeleteModal">
          Excluir conta
        </button>
      </div>
    </div>

    <!-- Modal de confirmação de exclusão ────────────────────────── -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">

          <!-- Cabeçalho do modal -->
          <div class="modal__header">
            <div class="modal__icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <h2 class="modal__title" id="delete-modal-title">Excluir conta permanentemente</h2>
              <p class="modal__subtitle">Esta ação não pode ser desfeita</p>
            </div>
          </div>

          <!-- Consequências -->
          <div class="modal__consequences">
            <p class="modal__consequences-title">
              Ao excluir a conta <strong>{{ account?.name }}</strong>, você perderá permanentemente:
            </p>
            <ul class="modal__consequences-list">
              <li>Todos os membros e convites ativos</li>
              <li>Todas as lavouras e suas atividades</li>
              <li>Todos os registros de despesas</li>
              <li>Todos os relatórios financeiros</li>
              <li>Todas as cotações registradas</li>
            </ul>
          </div>

          <!-- Campo de confirmação -->
          <div class="modal__confirm-field">
            <label for="delete-account-confirmation" class="modal__confirm-label">
              Para confirmar, digite o nome exato da conta:
              <strong class="modal__account-name">{{ account?.name }}</strong>
            </label>
            <input
              id="delete-account-confirmation"
              v-model="confirmationText"
              type="text"
              class="modal__confirm-input"
              :class="{ 'modal__confirm-input--valid': canConfirmDelete }"
              :placeholder="account?.name"
              autocomplete="off"
              spellcheck="false"
            />
          </div>

          <!-- Erro -->
          <div v-if="deleteError" class="modal__error">
            {{ deleteError }}
          </div>

          <!-- Ações -->
          <div class="modal__actions">
            <button class="btn-secondary" @click="closeDeleteModal" :disabled="deleting">
              Cancelar
            </button>
            <button
              class="btn-confirm-delete"
              :disabled="!canConfirmDelete || deleting"
              @click="handleDeleteAccount"
            >
              <span v-if="deleting" class="spinner" />
              <span v-else>Excluir permanentemente</span>
            </button>
          </div>

        </div>
      </div>
    </Teleport>

  </div>
</template>

<style scoped>
.account-settings { padding: 2rem 1.5rem; max-width: 640px; }
.account-settings__header { margin-bottom: 1.5rem; }
.account-settings__title {
  font-size: 1.375rem; font-weight: 700; color: var(--color-text); margin: 0;
}

/* ── Seções ─────────────────────────────────────────────────────── */
.section { margin-top: 2rem; }
.section__title {
  font-size: 1rem; font-weight: 600; color: var(--color-text); margin: 0 0 1rem;
}

/* ── Informações ────────────────────────────────────────────────── */
.info-card {
  background: var(--color-card); border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md); overflow: hidden;
}
.info-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.875rem 1.25rem; gap: 1rem;
  border-bottom: 1px solid var(--color-border);
}
.info-row:last-child { border-bottom: none; }
.info-row__label {
  font-size: 0.875rem; color: var(--color-text-muted); font-weight: 500;
}
.info-row__value { font-size: 0.875rem; color: var(--color-text); font-weight: 600; }

.role-badge {
  display: inline-block; padding: 0.2rem 0.625rem; border-radius: 999px;
  font-size: 0.75rem; font-weight: 600;
}
.role-badge--owner  { background: #ede9fe; color: #7c3aed; }
.role-badge--admin  { background: #dbeafe; color: #2563eb; }
.role-badge--member { background: #d1fae5; color: #059669; }

/* ── Zona de perigo ─────────────────────────────────────────────── */
.danger-zone {
  border: 1.5px solid #fca5a5;
  border-radius: var(--radius-md);
  padding: 1.25rem;
  background: var(--color-error-light);
}
.danger-zone__header {
  display: flex; align-items: center; gap: 0.5rem;
  color: var(--color-error); margin-bottom: 1rem;
}
.danger-zone__title {
  font-size: 0.9375rem; font-weight: 600; color: var(--color-error); margin: 0;
}
.danger-action {
  display: flex; align-items: center; justify-content: space-between;
  gap: 1rem; flex-wrap: wrap;
}
.danger-action__label {
  font-size: 0.875rem; font-weight: 600; color: var(--color-text); margin: 0 0 0.25rem;
}
.danger-action__description {
  font-size: 0.8125rem; color: var(--color-text-muted); margin: 0;
}
.btn-danger {
  padding: 0.5rem 1.125rem; background: var(--color-error);
  border: none; border-radius: var(--radius-sm);
  font-family: inherit; font-size: 0.875rem; font-weight: 600;
  color: #fff; cursor: pointer; white-space: nowrap; transition: opacity 0.15s; flex-shrink: 0;
}
.btn-danger:hover { opacity: 0.85; }

/* ── Modal ──────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0, 0, 0, 0.6);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}
.modal {
  background: var(--color-card); border-radius: var(--radius-lg);
  border: 1.5px solid var(--color-border);
  width: 100%; max-width: 480px; padding: 1.75rem;
  display: flex; flex-direction: column; gap: 1.25rem;
}
.modal__header {
  display: flex; align-items: flex-start; gap: 0.875rem;
}
.modal__icon {
  display: flex; align-items: center; justify-content: center;
  width: 42px; height: 42px; border-radius: var(--radius-md);
  background: var(--color-error-light); color: var(--color-error); flex-shrink: 0;
}
.modal__title {
  font-size: 1rem; font-weight: 700; color: var(--color-text); margin: 0 0 0.2rem;
}
.modal__subtitle {
  font-size: 0.8125rem; color: var(--color-text-muted); margin: 0;
}

/* Consequências */
.modal__consequences {
  background: var(--color-background); border: 1px solid var(--color-border);
  border-radius: var(--radius-md); padding: 1rem 1.125rem;
}
.modal__consequences-title {
  font-size: 0.8125rem; color: var(--color-text); margin: 0 0 0.625rem; line-height: 1.5;
}
.modal__consequences-list {
  margin: 0; padding-left: 1.25rem;
  font-size: 0.8125rem; color: var(--color-text-muted); line-height: 1.7;
}

/* Campo de confirmação */
.modal__confirm-field { display: flex; flex-direction: column; gap: 0.5rem; }
.modal__confirm-label {
  font-size: 0.8125rem; color: var(--color-text); line-height: 1.5;
}
.modal__account-name {
  display: inline-block; margin-top: 0.25rem;
  padding: 0.125rem 0.375rem; border-radius: 4px;
  background: var(--color-background); border: 1px solid var(--color-border);
  font-family: monospace; font-size: 0.875rem; color: var(--color-text);
}
.modal__confirm-input {
  padding: 0.625rem 0.875rem;
  border: 1.5px solid var(--color-border); border-radius: var(--radius-sm);
  font-family: inherit; font-size: 0.9rem; color: var(--color-text);
  background: var(--color-background); width: 100%; box-sizing: border-box;
  transition: border-color 0.15s;
}
.modal__confirm-input:focus { outline: none; border-color: var(--color-error); }
.modal__confirm-input--valid { border-color: #059669; }

/* Erro */
.modal__error {
  padding: 0.625rem 0.875rem; border-radius: var(--radius-sm);
  background: var(--color-error-light); color: var(--color-error);
  font-size: 0.8125rem; border: 1px solid #fecaca;
}

/* Ações */
.modal__actions { display: flex; justify-content: flex-end; gap: 0.75rem; }
.btn-secondary {
  padding: 0.6rem 1.25rem; border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm); background: var(--color-card);
  font-family: inherit; font-size: 0.875rem; font-weight: 500;
  color: var(--color-text-muted); cursor: pointer; transition: border-color 0.15s;
}
.btn-secondary:hover:not(:disabled) { border-color: var(--color-text-muted); }
.btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-confirm-delete {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.6rem 1.25rem; background: var(--color-error);
  border: none; border-radius: var(--radius-sm);
  font-family: inherit; font-size: 0.875rem; font-weight: 600;
  color: #fff; cursor: pointer; transition: opacity 0.15s; min-width: 180px;
  justify-content: center;
}
.btn-confirm-delete:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-confirm-delete:not(:disabled):hover { opacity: 0.85; }

/* Spinner */
.spinner {
  width: 16px; height: 16px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Responsividade ─────────────────────────────────────────────── */
@media (max-width: 600px) {
  .account-settings { padding: 1.25rem 1rem; }
  .danger-action { flex-direction: column; align-items: flex-start; }
  .btn-danger { width: 100%; }
  .modal { padding: 1.25rem; }
  .modal__actions { flex-direction: column-reverse; }
  .btn-secondary, .btn-confirm-delete { width: 100%; justify-content: center; }
}
</style>