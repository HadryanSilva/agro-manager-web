<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import tradingService from '@/services/tradingService'
import type { TradingSupplierResponse, TradingSupplierRequest } from '@/services/tradingService'

const accountStore = useAccountStore()

// Conta ativa — computed para reagir a mudanças de conta durante a sessão
const accountId = computed(() => accountStore.selectedAccount?.id)

const suppliers  = ref<TradingSupplierResponse[]>([])
const loading    = ref(true)
const saving     = ref(false)
const error      = ref('')
const search     = ref('')

// Timer de debounce como variável simples — não precisa ser reativo
// Limpo no unmount para evitar execução após destruição do componente
let searchTimer: ReturnType<typeof setTimeout> | null = null

onUnmounted(() => {
  if (searchTimer) clearTimeout(searchTimer)
})

// Modal de criação/edição
const showModal      = ref(false)
const editingId      = ref<string | null>(null)
const form           = ref<TradingSupplierRequest>({ name: '', phone: '', city: '', notes: '' })
const formError      = ref('')

// Modal de confirmação de exclusão
const deletingId     = ref<string | null>(null)
const deletingName   = ref('')

onMounted(loadSuppliers)

async function loadSuppliers() {
  if (!accountId.value) return
  loading.value = true
  error.value   = ''
  try {
    const { data } = await tradingService.listSuppliers(accountId.value, search.value || undefined)
    suppliers.value = data.data
  } catch {
    error.value = 'Erro ao carregar fornecedores.'
  } finally {
    loading.value = false
  }
}

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(loadSuppliers, 350)
}

function openCreate() {
  editingId.value = null
  form.value = { name: '', phone: '', city: '', notes: '' }
  formError.value = ''
  showModal.value = true
}

function openEdit(supplier: TradingSupplierResponse) {
  editingId.value = supplier.id
  form.value = { name: supplier.name, phone: supplier.phone ?? '', city: supplier.city ?? '', notes: supplier.notes ?? '' }
  formError.value = ''
  showModal.value = true
}

async function submitForm() {
  if (!form.value.name.trim()) { formError.value = 'Nome é obrigatório.'; return }
  if (!accountId.value) return

  saving.value    = true
  formError.value = ''
  try {
    if (editingId.value) {
      await tradingService.updateSupplier(accountId.value, editingId.value, form.value)
    } else {
      await tradingService.createSupplier(accountId.value, form.value)
    }
    showModal.value = false
    await loadSuppliers()
  } catch {
    formError.value = 'Erro ao salvar fornecedor. Tente novamente.'
  } finally {
    saving.value = false
  }
}

function openDelete(supplier: TradingSupplierResponse) {
  deletingId.value   = supplier.id
  deletingName.value = supplier.name
}

async function confirmDelete() {
  if (!accountId.value || !deletingId.value) return
  try {
    await tradingService.deleteSupplier(accountId.value, deletingId.value)
    deletingId.value = null
    await loadSuppliers()
  } catch (e: any) {
    const msg = e?.response?.data?.message ?? ''
    error.value = msg.includes('lotes') ? 'Este fornecedor possui lotes vinculados e não pode ser excluído.' : 'Erro ao excluir fornecedor.'
    deletingId.value = null
  }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Fornecedores</h1>
        <p class="page-subtitle">Produtores de quem você compra melancia</p>
      </div>
      <button class="btn btn--primary" @click="openCreate">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Novo Fornecedor
      </button>
    </div>

    <!-- Busca -->
    <div class="search-row">
      <div class="search-input-wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          v-model="search"
          type="text"
          placeholder="Buscar por nome..."
          class="search-input"
          @input="onSearchInput"
        />
      </div>
    </div>

    <!-- Erro global -->
    <div v-if="error" class="error-banner">{{ error }}</div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state"><div class="spinner" /></div>

    <!-- Vazio -->
    <div v-else-if="suppliers.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      <p>{{ search ? 'Nenhum fornecedor encontrado.' : 'Nenhum fornecedor cadastrado ainda.' }}</p>
      <button v-if="!search" class="btn btn--primary" @click="openCreate">Cadastrar primeiro fornecedor</button>
    </div>

    <!-- Lista -->
    <div v-else class="suppliers-grid">
      <div v-for="s in suppliers" :key="s.id" class="supplier-card">
        <div class="supplier-card__header">
          <div class="supplier-card__avatar">{{ s.name.charAt(0).toUpperCase() }}</div>
          <div class="supplier-card__info">
            <span class="supplier-card__name">{{ s.name }}</span>
            <span v-if="s.city" class="supplier-card__city">{{ s.city }}</span>
          </div>
        </div>
        <div v-if="s.phone" class="supplier-card__phone">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.1 6.1l.9-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          {{ s.phone }}
        </div>
        <div v-if="s.notes" class="supplier-card__notes">{{ s.notes }}</div>
        <div class="supplier-card__actions">
          <button class="btn-icon" title="Editar" @click="openEdit(s)">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon btn-icon--danger" title="Excluir" @click="openDelete(s)">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal criar/editar -->
  <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
    <div class="modal">
      <div class="modal__header">
        <h2 class="modal__title">{{ editingId ? 'Editar Fornecedor' : 'Novo Fornecedor' }}</h2>
        <button class="modal__close" @click="showModal = false">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="modal__body">
        <div v-if="formError" class="error-banner">{{ formError }}</div>

        <div class="form-group">
          <label class="form-label">Nome *</label>
          <input v-model="form.name" class="form-input" type="text" placeholder="Nome do fornecedor" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Telefone</label>
            <input v-model="form.phone" class="form-input" type="text" placeholder="(00) 00000-0000" />
          </div>
          <div class="form-group">
            <label class="form-label">Cidade</label>
            <input v-model="form.city" class="form-input" type="text" placeholder="Ex: Cristalina, GO" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Observações</label>
          <textarea v-model="form.notes" class="form-input form-textarea" placeholder="Informações adicionais sobre o fornecedor..." />
        </div>
      </div>

      <div class="modal__footer">
        <button class="btn btn--secondary" @click="showModal = false">Cancelar</button>
        <button class="btn btn--primary" :disabled="saving" @click="submitForm">
          {{ saving ? 'Salvando...' : (editingId ? 'Salvar alterações' : 'Cadastrar') }}
        </button>
      </div>
    </div>
  </div>

  <!-- Modal confirmação de exclusão -->
  <div v-if="deletingId" class="modal-overlay" @click.self="deletingId = null">
    <div class="modal modal--sm">
      <div class="modal__header">
        <h2 class="modal__title">Excluir Fornecedor</h2>
      </div>
      <div class="modal__body">
        <p class="confirm-text">Tem certeza que deseja excluir <strong>{{ deletingName }}</strong>? Esta ação não pode ser desfeita.</p>
      </div>
      <div class="modal__footer">
        <button class="btn btn--secondary" @click="deletingId = null">Cancelar</button>
        <button class="btn btn--danger" @click="confirmDelete">Excluir</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container { padding: 2rem 1.5rem; max-width: 900px; margin: 0 auto; }

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.page-title { font-size: 1.75rem; font-weight: 700; color: var(--color-text); letter-spacing: -0.02em; line-height: 1.2; margin: 0 0 0.25rem; }
.page-subtitle { font-size: 0.875rem; color: var(--color-text-muted); margin: 0; }

/* Busca */
.search-row { margin-bottom: 1.5rem; }

.search-input-wrap {
  position: relative;
  max-width: 340px;
}

.search-input-wrap svg {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-card);
  color: var(--color-text);
  font-family: inherit;
  font-size: 0.875rem;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* Grid */
.suppliers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.supplier-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  box-shadow: var(--shadow-card);
  transition: box-shadow 0.15s;
}

.supplier-card:hover { box-shadow: var(--shadow-card-hover); }

.supplier-card__header { display: flex; align-items: center; gap: 0.75rem; }

.supplier-card__avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.supplier-card__info { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
.supplier-card__name { font-weight: 600; color: var(--color-text); font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.supplier-card__city { font-size: 0.78rem; color: var(--color-text-muted); }

.supplier-card__phone {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.supplier-card__notes {
  font-size: 0.82rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.supplier-card__actions {
  display: flex;
  gap: 0.375rem;
  margin-top: 0.25rem;
  justify-content: flex-end;
}

/* Botões */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
  white-space: nowrap;
}

.btn--primary  { background: var(--color-primary); color: #fff; }
.btn--secondary { background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-border); }
.btn--danger   { background: var(--color-error); color: #fff; }
.btn:disabled  { opacity: 0.6; cursor: not-allowed; }
.btn--primary:not(:disabled):hover, .btn--danger:not(:disabled):hover { opacity: 0.88; }

.btn-icon {
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  transition: background 0.15s, color 0.15s;
}

.btn-icon:hover { background: var(--color-surface); color: var(--color-text); }
.btn-icon--danger:hover { background: var(--color-error-light); color: var(--color-error); border-color: var(--color-error); }

/* Formulário */
.form-group { display: flex; flex-direction: column; gap: 0.375rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

.form-label { font-size: 0.825rem; font-weight: 600; color: var(--color-text); }

.form-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  font-family: inherit;
  font-size: 0.875rem;
  width: 100%;
  box-sizing: border-box;
}

.form-input:focus { outline: none; border-color: var(--color-primary); }
.form-textarea { resize: vertical; min-height: 80px; }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
  padding: 1rem;
}

.modal {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal--sm { max-width: 380px; }

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.modal__title { font-size: 1rem; font-weight: 700; color: var(--color-text); margin: 0; }

.modal__close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 0.25rem;
  display: flex;
  align-items: center;
}

.modal__body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.modal__footer { padding: 1rem 1.5rem; border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; gap: 0.75rem; }

.confirm-text { color: var(--color-text); font-size: 0.9rem; line-height: 1.5; margin: 0; }

.error-banner {
  background: var(--color-error-light);
  color: var(--color-error);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-sm);
  padding: 0.625rem 0.875rem;
  font-size: 0.85rem;
}

/* Estados */
.loading-state { display: flex; justify-content: center; padding: 4rem; }

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.empty-state { text-align: center; padding: 4rem 2rem; color: var(--color-text-muted); display: flex; flex-direction: column; align-items: center; gap: 1rem; }

/* Responsivo */
@media (max-width: 768px) {
  .page-container { padding: 1.25rem 1rem; }
  .page-header { flex-direction: column; }
  .suppliers-grid { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
}
</style>
