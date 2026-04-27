<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAccountStore } from '@/stores/accountStore'
import expenseService from '@/services/expenseService'
import farmService from '@/services/farmService'
import type { ExpenseResponse, ExpenseCategory } from '@/services/expenseService'
import ConfirmModal from '@/components/ConfirmModal.vue'
import FarmActivityTimeline from '@/components/FarmActivityTimeline.vue'

const router       = useRouter()
const route        = useRoute()
const accountStore = useAccountStore()

const farmId    = route.params.farmId as string
const accountId = computed(() => accountStore.selectedAccount?.id)

const expenses   = ref<ExpenseResponse[]>([])
const farmName   = ref('')
const loading    = ref(true)
const error      = ref('')
const confirmModal = ref<{
  open: boolean
  title: string
  message: string
  confirmLabel: string
  action: (() => Promise<void>) | null
  loading: boolean
}>({
  open: false,
  title: '',
  message: '',
  confirmLabel: 'Confirmar',
  action: null,
  loading: false,
})

type ActiveTab = 'expenses' | 'history'
const activeTab = ref<ActiveTab>('expenses')
 
function openConfirm(title: string, message: string, confirmLabel: string, action: () => Promise<void>) {
  confirmModal.value = { open: true, title, message, confirmLabel, action, loading: false }
}
 
async function handleConfirm() {
  if (!confirmModal.value.action) return
  confirmModal.value.loading = true
  try {
    await confirmModal.value.action()
  } finally {
    confirmModal.value.open    = false
    confirmModal.value.loading = false
    confirmModal.value.action  = null
  }
}
 
function handleCancel() {
  confirmModal.value.open   = false
  confirmModal.value.action = null
}

// Filtros ativos
type CategoryFilter = ExpenseCategory | null
type PaymentFilter  = 'PAID' | 'PENDING' | null

const categoryFilter = ref<CategoryFilter>(null)
const paymentFilter  = ref<PaymentFilter>(null)

// Configuração visual das categorias
const categoryConfig: Record<ExpenseCategory, { label: string; color: string; bg: string }> = {
  INSUMO:  { label: 'Insumo',   color: '#059669', bg: '#d1fae5' },
  SERVICO: { label: 'Serviço',  color: '#2563eb', bg: '#dbeafe' },
}

onMounted(async () => {
  await Promise.all([loadFarm(), loadExpenses()])
})

async function loadFarm() {
  if (!accountId.value) return
  try {
    const { data } = await farmService.findById(accountId.value, farmId)
    farmName.value = data.data.name
  } catch {
    farmName.value = 'Lavoura'
  }
}

async function loadExpenses() {
  if (!accountId.value) return
  loading.value = true
  error.value   = ''
  try {
    const { data } = await expenseService.findAll(accountId.value, farmId)
    expenses.value = data.data
  } catch {
    error.value = 'Erro ao carregar despesas.'
  } finally {
    loading.value = false
  }
}

// Despesas filtradas conforme seleção do usuário
const filtered = computed(() => {
  return expenses.value.filter(e => {
    if (categoryFilter.value && e.category !== categoryFilter.value) return false
    if (paymentFilter.value === 'PAID'    && !e.paid)  return false
    if (paymentFilter.value === 'PENDING' &&  e.paid)  return false
    return true
  })
})

// Totais calculados sobre todas as despesas (sem filtro aplicado)
const totalGeral  = computed(() => expenses.value.reduce((sum, e) => sum + Number(e.value), 0))
const totalPago   = computed(() => expenses.value.filter(e => e.paid).reduce((sum, e) => sum + Number(e.value), 0))
const totalPendente = computed(() => totalGeral.value - totalPago.value)

async function handleMarkAsPaid(expense: ExpenseResponse) {
  if (!accountId.value) return
  try {
    const { data } = await expenseService.markAsPaid(accountId.value, farmId, expense.id)
    // Atualiza o item na lista sem recarregar tudo
    const idx = expenses.value.findIndex(e => e.id === expense.id)
    if (idx !== -1) expenses.value[idx] = data.data
  } catch {
    error.value = 'Erro ao marcar despesa como paga.'
  }
}

async function handleDelete(expense: ExpenseResponse) {
  if (!accountId.value) return
  openConfirm(
    'Remover despesa',
    `Deseja remover "${expense.description}"? Esta ação não pode ser desfeita.`,
    'Remover',
    async () => {
      await expenseService.delete(accountId.value!, farmId, expense.id)
      expenses.value = expenses.value.filter(e => e.id !== expense.id)
    }
  )
}

function formatCurrency(value: number): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
}
</script>

<template>
  <div class="expenses">

    <!-- Cabeçalho -->
    <div class="expenses__header">
      <div class="expenses__back-row">
        <button class="back-btn" @click="router.push({ name: 'farms' })">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Lavouras
        </button>
      </div>
      <div class="expenses__title-row">
        <div>
          <h1 class="expenses__title">Despesas</h1>
          <p class="expenses__subtitle">{{ farmName }}</p>
        </div>
        <button
          class="btn-primary"
          @click="router.push({ name: 'expense-create', params: { farmId } })"
        >
          + Nova despesa
        </button>
      </div>
    </div>

    <!-- Abas de navegação -->
    <div class="expenses__tabs">
      <button
        class="expenses__tab"
        :class="{ 'expenses__tab--active': activeTab === 'expenses' }"
        @click="activeTab = 'expenses'"
      >
        Despesas
      </button>
      <button
        class="expenses__tab"
        :class="{ 'expenses__tab--active': activeTab === 'history' }"
        @click="activeTab = 'history'"
      >
        Histórico
      </button>
    </div>

    <template v-if="activeTab === 'expenses'">
      <!-- Erro -->
      <div v-if="error" class="error-banner">{{ error }}</div>

      <!-- Cards de totais -->
      <div class="totals-grid">
      <div class="total-card">
        <span class="total-card__label">Total geral</span>
        <span class="total-card__value">{{ formatCurrency(totalGeral) }}</span>
      </div>
      <div class="total-card total-card--paid">
        <span class="total-card__label">Total pago</span>
        <span class="total-card__value">{{ formatCurrency(totalPago) }}</span>
      </div>
      <div class="total-card" :class="{ 'total-card--pending': totalPendente > 0 }">
        <span class="total-card__label">A pagar</span>
        <span class="total-card__value">{{ formatCurrency(totalPendente) }}</span>
      </div>
      </div>

      <!-- Filtros -->
      <div class="filters">
      <!-- Categoria -->
      <div class="filters__group">
        <button
          class="filter-btn"
          :class="{ 'filter-btn--active': categoryFilter === null }"
          @click="categoryFilter = null"
        >Todas</button>
        <button
          class="filter-btn"
          :class="{ 'filter-btn--active': categoryFilter === 'INSUMO' }"
          @click="categoryFilter = 'INSUMO'"
        >Insumos</button>
        <button
          class="filter-btn"
          :class="{ 'filter-btn--active': categoryFilter === 'SERVICO' }"
          @click="categoryFilter = 'SERVICO'"
        >Serviços</button>
      </div>

      <!-- Status de pagamento -->
      <div class="filters__group">
        <button
          class="filter-btn"
          :class="{ 'filter-btn--active': paymentFilter === null }"
          @click="paymentFilter = null"
        >Todos</button>
        <button
          class="filter-btn"
          :class="{ 'filter-btn--active': paymentFilter === 'PENDING' }"
          @click="paymentFilter = 'PENDING'"
        >A pagar</button>
        <button
          class="filter-btn"
          :class="{ 'filter-btn--active': paymentFilter === 'PAID' }"
          @click="paymentFilter = 'PAID'"
        >Pagas</button>
      </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
      <span class="spinner" />
      </div>

      <!-- Vazio -->
      <div v-else-if="!loading && filtered.length === 0" class="empty-state">
      <span class="empty-state__icon">💸</span>
      <p v-if="expenses.length === 0">Nenhuma despesa registrada para esta lavoura.</p>
      <p v-else>Nenhuma despesa encontrada com os filtros selecionados.</p>
      <button
        v-if="expenses.length === 0"
        class="btn-primary"
        @click="router.push({ name: 'expense-create', params: { farmId } })"
      >
        Registrar primeira despesa
      </button>
      </div>

      <!-- Tabela (desktop) -->
      <div v-else class="table-wrapper">
      <table class="expenses-table">
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Categoria</th>
            <th>Competência</th>
            <th>Pagamento</th>
            <th>Status</th>
            <th class="col-right">Valor</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="expense in filtered" :key="expense.id" class="expenses-table__row">
            <td class="col-description">{{ expense.description }}</td>
            <td>
              <span
                class="category-badge"
                :style="{
                  background: categoryConfig[expense.category].bg,
                  color: categoryConfig[expense.category].color,
                }"
              >
                {{ categoryConfig[expense.category].label }}
              </span>
            </td>
            <td>{{ formatDate(expense.competenceDate) }}</td>
            <td>{{ formatDate(expense.paymentDate) }}</td>
            <td>
              <span class="status-badge" :class="expense.paid ? 'status-badge--paid' : 'status-badge--pending'">
                {{ expense.paid ? 'Pago' : 'A pagar' }}
              </span>
            </td>
            <td class="col-right col-value">{{ formatCurrency(Number(expense.value)) }}</td>
            <td class="col-actions">
              <button
                v-if="!expense.paid"
                class="action-btn action-btn--pay"
                @click="handleMarkAsPaid(expense)"
                title="Marcar como pago"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
              <button
                class="action-btn"
                @click="router.push({ name: 'expense-edit', params: { farmId, expenseId: expense.id } })"
                title="Editar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button
                class="action-btn action-btn--danger"
                @click="handleDelete(expense)"
                title="Remover"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      </div>

      <!-- Cards mobile -->
      <div v-if="!loading && filtered.length > 0" class="expense-cards">
      <div
        v-for="expense in filtered"
        :key="expense.id"
        class="expense-card"
      >
        <div class="expense-card__top">
          <span class="expense-card__description">{{ expense.description }}</span>
          <span class="expense-card__value">{{ formatCurrency(Number(expense.value)) }}</span>
        </div>
        <div class="expense-card__meta">
          <span
            class="category-badge"
            :style="{
              background: categoryConfig[expense.category].bg,
              color: categoryConfig[expense.category].color,
            }"
          >{{ categoryConfig[expense.category].label }}</span>
          <span class="status-badge" :class="expense.paid ? 'status-badge--paid' : 'status-badge--pending'">
            {{ expense.paid ? 'Pago' : 'A pagar' }}
          </span>
          <span class="expense-card__date">{{ formatDate(expense.competenceDate) }}</span>
        </div>
        <div class="expense-card__actions">
          <button
            v-if="!expense.paid"
            class="action-btn action-btn--pay"
            @click="handleMarkAsPaid(expense)"
          >Marcar como pago</button>
          <button
            class="action-btn"
            @click="router.push({ name: 'expense-edit', params: { farmId, expenseId: expense.id } })"
          >Editar</button>
          <button
            class="action-btn action-btn--danger"
            @click="handleDelete(expense)"
          >Remover</button>
        </div>
      </div>
      </div>
    </template>
    <!-- Aba Histórico — só aparece quando activeTab === 'history' -->
    <template v-else>
      <FarmActivityTimeline :farmId="farmId" />
    </template>
  </div>
    <ConfirmModal
    :open="confirmModal.open"
    :title="confirmModal.title"
    :message="confirmModal.message"
    :confirm-label="confirmModal.confirmLabel"
    :loading="confirmModal.loading"
    variant="danger"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  />
</template>

<style scoped>
.expenses {
  padding: 2rem 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
}

/* ── Cabeçalho ────────────────────────────────────────────────── */
.expenses__back-row { margin-bottom: 0.75rem; }

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;
}
.back-btn:hover { color: var(--color-primary); }

.expenses__title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.expenses__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.expenses__subtitle {
  margin-top: 0.2rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

/* ── Erro ─────────────────────────────────────────────────────── */
.error-banner {
  background: var(--color-error-light);
  color: var(--color-error);
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  margin: 1rem 0;
}

/* ── Totais ───────────────────────────────────────────────────── */
.totals-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 1.5rem 0;
}

.total-card {
  padding: 1.25rem;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
}

.total-card--paid    { border-color: #6ee7b7; background: #f0fdf4; }
.total-card--pending { border-color: var(--color-warning); background: var(--color-warning-light); }

.total-card__label {
  display: block;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-text-muted);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 0.4rem;
}

.total-card__value {
  display: block;
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

/* ── Filtros ──────────────────────────────────────────────────── */
.filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.filters__group {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.35rem 0.875rem;
  border: 1.5px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-card);
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s;
}
.filter-btn:hover         { border-color: var(--color-primary); color: var(--color-primary); }
.filter-btn--active       { background: var(--color-primary-light); border-color: var(--color-primary); color: var(--color-primary); }

/* ── Loading / Vazio ──────────────────────────────────────────── */
.loading-state {
  display: flex;
  justify-content: center;
  padding: 4rem 0;
}

.spinner {
  display: inline-block;
  width: 28px;
  height: 28px;
  border: 2.5px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 2rem;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}
.empty-state__icon { font-size: 2.5rem; }

/* ── Tabela (desktop) ────────────────────────────────────────── */
.table-wrapper {
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.expenses-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.expenses-table thead { background: var(--color-background); }

.expenses-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border-bottom: 1.5px solid var(--color-border);
}

.expenses-table td {
  padding: 0.875rem 1rem;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.expenses-table__row:last-child td { border-bottom: none; }

.col-description {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.col-right  { text-align: right; }
.col-value  { font-weight: 600; white-space: nowrap; }
.col-actions { white-space: nowrap; text-align: right; }

/* ── Badges ──────────────────────────────────────────────────── */
.category-badge,
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.625rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge--paid    { background: #d1fae5; color: #059669; }
.status-badge--pending { background: var(--color-warning-light); color: var(--color-warning); }

/* ── Botões de ação ──────────────────────────────────────────── */
.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.35rem 0.625rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-card);
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s;
  margin-left: 0.375rem;
}

.action-btn:hover         { border-color: var(--color-primary); color: var(--color-primary); }
.action-btn--pay:hover    { border-color: #059669; color: #059669; }
.action-btn--danger:hover { border-color: var(--color-error); color: var(--color-error); }

/* ── Botão primário ──────────────────────────────────────────── */
.btn-primary {
  padding: 0.6rem 1.25rem;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.15s;
}
.btn-primary:hover { opacity: 0.85; }

/* ── Cards mobile (ocultos no desktop) ──────────────────────── */
.expense-cards { display: none; }

/* ── Responsividade ──────────────────────────────────────────── */
@media (max-width: 768px) {
  .table-wrapper { display: none; }
  .expense-cards { display: flex; flex-direction: column; gap: 0.75rem; }
  .totals-grid   { grid-template-columns: 1fr; gap: 0.625rem; }
  .filters       { gap: 0.75rem; }
}

@media (max-width: 640px) {
  .expenses { padding: 1.25rem 1rem; }
}

.expense-card {
  padding: 1rem 1.125rem;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
}

.expense-card__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.expense-card__description {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-text);
}

.expense-card__value {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--color-text);
  white-space: nowrap;
}

.expense-card__meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 0.75rem;
}

.expense-card__date {
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.expense-card__actions {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.expense-card__actions .action-btn { margin-left: 0; }

.expenses__tabs {
  display: flex;
  gap: 0.25rem;
  border-bottom: 1.5px solid var(--color-border);
  margin-bottom: 1.5rem;
}
 
.expenses__tab {
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1.5px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.expenses__tab:hover { color: var(--color-text); }
.expenses__tab--active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: 600;
}
</style>