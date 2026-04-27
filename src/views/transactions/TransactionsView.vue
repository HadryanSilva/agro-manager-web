<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/accountStore'
import transactionService from '@/services/transactionService'
import farmService from '@/services/farmService'
import type { TransactionResponse, PageResponse } from '@/services/transactionService'
import type { ExpenseCategory } from '@/services/expenseService'
import type { FarmResponse } from '@/services/farmService'

const router       = useRouter()
const accountStore = useAccountStore()
const accountId    = computed(() => accountStore.selectedAccount?.id)

// ── Estado principal ──────────────────────────────────────────────
const result   = ref<PageResponse<TransactionResponse> | null>(null)
const farms    = ref<FarmResponse[]>([])
const loading  = ref(true)
const error    = ref('')

// ── Filtros ───────────────────────────────────────────────────────
const filterFarmId    = ref<string>('')
const filterCategory  = ref<ExpenseCategory | ''>('')
const filterPaid      = ref<'' | 'true' | 'false'>('')
const filterStartDate = ref('')
const filterEndDate   = ref('')
const currentPage     = ref(0)
const PAGE_SIZE       = 20

const categoryConfig: Record<ExpenseCategory, { label: string; color: string; bg: string }> = {
  INSUMO:  { label: 'Insumo',  color: '#059669', bg: '#d1fae5' },
  SERVICO: { label: 'Serviço', color: '#2563eb', bg: '#dbeafe' },
}

// Número de filtros ativos (para indicador visual)
const activeFilterCount = computed(() =>
  [filterFarmId.value, filterCategory.value, filterPaid.value,
   filterStartDate.value, filterEndDate.value].filter(Boolean).length
)

onMounted(async () => {
  await loadFarms()
  await fetchTransactions()
})

async function loadFarms() {
  if (!accountId.value) return
  try {
    const { data } = await farmService.findAll(accountId.value)
    farms.value = data.data
  } catch { /* silencia — filtro de lavoura apenas não aparece */ }
}

async function fetchTransactions() {
  if (!accountId.value) return
  loading.value = true
  error.value   = ''
  try {
    const { data } = await transactionService.getTransactions(accountId.value, {
      farmId:    filterFarmId.value    || undefined,
      category:  (filterCategory.value || undefined) as ExpenseCategory | undefined,
      paid:      filterPaid.value !== '' ? filterPaid.value === 'true' : undefined,
      startDate: filterStartDate.value || undefined,
      endDate:   filterEndDate.value   || undefined,
      page:      currentPage.value,
      size:      PAGE_SIZE,
    })
    result.value = data.data
  } catch {
    error.value = 'Erro ao carregar transações.'
  } finally {
    loading.value = false
  }
}

// Ao mudar qualquer filtro, volta para a página 0 e recarrega
function applyFilters() {
  currentPage.value = 0
  fetchTransactions()
}

function clearFilters() {
  filterFarmId.value    = ''
  filterCategory.value  = ''
  filterPaid.value      = ''
  filterStartDate.value = ''
  filterEndDate.value   = ''
  currentPage.value     = 0
  fetchTransactions()
}

function goToPage(page: number) {
  currentPage.value = page
  fetchTransactions()
}

// Formata moeda BRL
function formatCurrency(value: number): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Formata data pt-BR
function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
}

// Páginas visíveis na paginação (janela de 5)
const visiblePages = computed(() => {
  if (!result.value) return []
  const total   = result.value.totalPages
  const current = result.value.page
  const delta   = 2
  const pages: number[] = []
  for (let i = Math.max(0, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    pages.push(i)
  }
  return pages
})
</script>

<template>
  <div class="transactions">

    <!-- Cabeçalho -->
    <div class="transactions__header">
      <h1 class="transactions__title">Transações</h1>
      <p class="transactions__subtitle">
        Todas as despesas da conta <strong>{{ accountStore.selectedAccount?.name }}</strong>
      </p>
    </div>

    <!-- ── Barra de filtros ──────────────────────────────────────── -->
    <div class="filters-bar">

      <!-- Lavoura -->
      <select class="filter-select" v-model="filterFarmId" @change="applyFilters">
        <option value="">Todas as lavouras</option>
        <option v-for="farm in farms" :key="farm.id" :value="farm.id">
          {{ farm.name }}
        </option>
      </select>

      <!-- Categoria -->
      <select class="filter-select" v-model="filterCategory" @change="applyFilters">
        <option value="">Todas as categorias</option>
        <option value="INSUMO">Insumos</option>
        <option value="SERVICO">Serviços</option>
      </select>

      <!-- Status de pagamento -->
      <select class="filter-select" v-model="filterPaid" @change="applyFilters">
        <option value="">Todos os status</option>
        <option value="false">A pagar</option>
        <option value="true">Pagas</option>
      </select>

      <!-- Data inicial -->
      <input
        type="date"
        class="filter-input"
        v-model="filterStartDate"
        @change="applyFilters"
        title="Data de competência inicial"
      />

      <!-- Data final -->
      <input
        type="date"
        class="filter-input"
        v-model="filterEndDate"
        @change="applyFilters"
        title="Data de competência final"
      />

      <!-- Limpar filtros -->
      <button
        v-if="activeFilterCount > 0"
        class="btn-clear"
        @click="clearFilters"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        Limpar ({{ activeFilterCount }})
      </button>
    </div>

    <!-- Erro -->
    <div v-if="error" class="error-banner">{{ error }}</div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state"><span class="spinner" /></div>

    <template v-else-if="result">

      <!-- ── Totalizadores ──────────────────────────────────────── -->
      <div class="summary-row">
        <div class="summary-item">
          <span class="summary-item__label">Transações encontradas</span>
          <span class="summary-item__value">{{ result.totalElements }}</span>
        </div>
        <div class="summary-item summary-item--highlight">
          <span class="summary-item__label">Total filtrado</span>
          <span class="summary-item__value">{{ formatCurrency(result.totalValue) }}</span>
        </div>
      </div>

      <!-- Sem resultados -->
      <div v-if="result.content.length === 0" class="empty-state">
        <span class="empty-state__icon">💸</span>
        <p>Nenhuma transação encontrada com os filtros selecionados.</p>
        <button v-if="activeFilterCount > 0" class="btn-clear-center" @click="clearFilters">
          Limpar filtros
        </button>
      </div>

      <template v-else>

        <!-- ── Tabela desktop ──────────────────────────────────── -->
        <div class="table-wrapper">
          <table class="transactions-table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Lavoura</th>
                <th>Categoria</th>
                <th>Competência</th>
                <th>Pagamento</th>
                <th>Status</th>
                <th class="col-right">Valor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="tx in result.content"
                :key="tx.id"
                class="transactions-table__row"
                @click="router.push({ name: 'farm-expenses', params: { farmId: tx.farmId } })"
              >
                <td class="col-desc">{{ tx.description }}</td>
                <td class="col-farm">{{ tx.farmName }}</td>
                <td>
                  <span
                    class="badge"
                    :style="{
                      background: categoryConfig[tx.category].bg,
                      color: categoryConfig[tx.category].color
                    }"
                  >
                    {{ categoryConfig[tx.category].label }}
                  </span>
                </td>
                <td>{{ formatDate(tx.competenceDate) }}</td>
                <td>{{ formatDate(tx.paymentDate) }}</td>
                <td>
                  <span class="badge" :class="tx.paid ? 'badge--paid' : 'badge--pending'">
                    {{ tx.paid ? 'Pago' : 'A pagar' }}
                  </span>
                </td>
                <td class="col-right col-value">{{ formatCurrency(Number(tx.value)) }}</td>
                <td class="col-arrow">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                       fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ── Cards mobile ────────────────────────────────────── -->
        <div class="tx-cards">
          <div
            v-for="tx in result.content"
            :key="`mob-${tx.id}`"
            class="tx-card"
            @click="router.push({ name: 'farm-expenses', params: { farmId: tx.farmId } })"
          >
            <div class="tx-card__top">
              <span class="tx-card__desc">{{ tx.description }}</span>
              <span class="tx-card__value">{{ formatCurrency(Number(tx.value)) }}</span>
            </div>
            <div class="tx-card__meta">
              <span class="tx-card__farm">{{ tx.farmName }}</span>
              <span
                class="badge"
                :style="{
                  background: categoryConfig[tx.category].bg,
                  color: categoryConfig[tx.category].color
                }"
              >{{ categoryConfig[tx.category].label }}</span>
              <span class="badge" :class="tx.paid ? 'badge--paid' : 'badge--pending'">
                {{ tx.paid ? 'Pago' : 'A pagar' }}
              </span>
            </div>
            <div class="tx-card__date">{{ formatDate(tx.competenceDate) }}</div>
          </div>
        </div>

        <!-- ── Paginação ───────────────────────────────────────── -->
        <div class="pagination" v-if="result.totalPages > 1">
          <button
            class="page-btn"
            :disabled="result.page === 0"
            @click="goToPage(result.page - 1)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <button
            v-if="visiblePages[0] > 0"
            class="page-btn"
            @click="goToPage(0)"
          >1</button>
          <span v-if="visiblePages[0] > 1" class="page-ellipsis">…</span>

          <button
            v-for="p in visiblePages"
            :key="p"
            class="page-btn"
            :class="{ 'page-btn--active': p === result.page }"
            @click="goToPage(p)"
          >{{ p + 1 }}</button>

          <span v-if="visiblePages[visiblePages.length - 1] < result.totalPages - 2" class="page-ellipsis">…</span>
          <button
            v-if="visiblePages[visiblePages.length - 1] < result.totalPages - 1"
            class="page-btn"
            @click="goToPage(result.totalPages - 1)"
          >{{ result.totalPages }}</button>

          <button
            class="page-btn"
            :disabled="result.last"
            @click="goToPage(result.page + 1)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          <span class="pagination__info">
            Página {{ result.page + 1 }} de {{ result.totalPages }}
          </span>
        </div>

      </template>
    </template>
  </div>
</template>

<style scoped>
.transactions {
  padding: 2rem 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
}

/* ── Cabeçalho ──────────────────────────────────────────────────── */
.transactions__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
}
.transactions__subtitle {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
}

/* ── Barra de filtros ───────────────────────────────────────────── */
.filters-bar {
  display: flex;
  gap: 0.625rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
  align-items: center;
}

.filter-select,
.filter-input {
  padding: 0.5rem 0.75rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-card);
  font-family: inherit;
  font-size: 0.8125rem;
  color: var(--color-text);
  cursor: pointer;
  transition: border-color 0.15s;
  height: 36px;
}
.filter-select:focus,
.filter-input:focus { outline: none; border-color: var(--color-primary); }

.filter-input { min-width: 130px; }

.btn-clear {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border: 1.5px solid var(--color-error);
  border-radius: var(--radius-sm);
  background: var(--color-error-light);
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-error);
  cursor: pointer;
  transition: opacity 0.15s;
  height: 36px;
}
.btn-clear:hover { opacity: 0.8; }

/* ── Utilitários ────────────────────────────────────────────────── */
.error-banner {
  background: var(--color-error-light);
  color: var(--color-error);
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.loading-state { display: flex; justify-content: center; padding: 4rem 0; }
.spinner {
  display: inline-block;
  width: 28px; height: 28px;
  border: 2.5px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Totalizadores ──────────────────────────────────────────────── */
.summary-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 1rem;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-card);
}

.summary-item--highlight { border-color: var(--color-primary); }

.summary-item__label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.summary-item__value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}

.summary-item--highlight .summary-item__value { color: var(--color-primary); }

/* ── Estado vazio ───────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}
.empty-state__icon { font-size: 2.5rem; }

.btn-clear-center {
  padding: 0.5rem 1.25rem;
  border: 1.5px solid var(--color-primary);
  border-radius: var(--radius-sm);
  background: var(--color-primary-light);
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-primary);
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-clear-center:hover { opacity: 0.8; }

/* ── Tabela ─────────────────────────────────────────────────────── */
.table-wrapper {
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  margin-bottom: 1rem;
}

.transactions-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }

.transactions-table thead { background: var(--color-background); }

.transactions-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1.5px solid var(--color-border);
}

.transactions-table__row { cursor: pointer; transition: background 0.12s; }
.transactions-table__row:hover { background: var(--color-background); }

.transactions-table td {
  padding: 0.8rem 1rem;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.transactions-table tbody tr:last-child td { border-bottom: none; }

.col-desc  { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
.col-farm  { max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--color-text-muted); font-size: 0.8125rem; }
.col-right { text-align: right; }
.col-value { font-weight: 700; white-space: nowrap; }
.col-arrow { color: var(--color-text-muted); text-align: right; width: 24px; }

/* ── Badges ─────────────────────────────────────────────────────── */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.625rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}
.badge--paid    { background: #d1fae5; color: #059669; }
.badge--pending { background: #fef3c7; color: #d97706; }

/* ── Cards mobile ───────────────────────────────────────────────── */
.tx-cards { display: none; }

/* ── Paginação ──────────────────────────────────────────────────── */
.pagination {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 34px;
  padding: 0 0.5rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-card);
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s;
}
.page-btn:hover:not(:disabled)  { border-color: var(--color-primary); color: var(--color-primary); }
.page-btn:disabled               { opacity: 0.4; cursor: default; }
.page-btn--active                { background: var(--color-primary); border-color: var(--color-primary); color: #fff; font-weight: 700; }

.page-ellipsis { color: var(--color-text-muted); font-size: 0.875rem; padding: 0 0.25rem; }

.pagination__info {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-left: 0.5rem;
}

/* ── Responsividade ─────────────────────────────────────────────── */
@media (max-width: 900px) {
  .table-wrapper { display: none; }
  .tx-cards      { display: flex; flex-direction: column; gap: 0.625rem; margin-bottom: 1rem; }
}

@media (max-width: 640px) {
  .transactions { padding: 1.25rem 1rem; }
  .filters-bar  { gap: 0.5rem; }
  .filter-select,
  .filter-input  { flex: 1; min-width: 0; }
  .summary-row   { gap: 0.625rem; }
  .summary-item  { flex: 1; }
}

.tx-card {
  padding: 1rem;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.12s;
}
.tx-card:hover { background: var(--color-background); }

.tx-card__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.tx-card__desc  { font-weight: 600; font-size: 0.9rem; color: var(--color-text); }
.tx-card__value { font-weight: 700; font-size: 0.9rem; white-space: nowrap; color: var(--color-text); }

.tx-card__meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 0.375rem;
}
.tx-card__farm  { font-size: 0.78rem; color: var(--color-text-muted); }
.tx-card__date  { font-size: 0.75rem; color: var(--color-text-muted); }
</style>