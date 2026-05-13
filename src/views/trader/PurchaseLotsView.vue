<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/accountStore'
import { useTraderFormatters } from '@/composables/useTraderFormatters'
import tradingService from '@/services/tradingService'
import type { PurchaseLotSummaryResponse, PurchaseLotStatus } from '@/services/tradingService'

const router       = useRouter()
const accountStore = useAccountStore()
const { currency, kg, formatDate } = useTraderFormatters()

// Conta ativa — computed para reagir a mudanças de conta durante a sessão
const accountId = computed(() => accountStore.selectedAccount?.id)

const lots          = ref<PurchaseLotSummaryResponse[]>([])
const loading       = ref(true)
const error         = ref('')
const filterStatus  = ref<PurchaseLotStatus | ''>('')
const page          = ref(0)
const totalPages    = ref(0)
const totalElements = ref(0)

const deletingId   = ref<string | null>(null)
const deletingName = ref('')

onMounted(loadLots)

async function loadLots() {
  if (!accountId.value) return
  loading.value = true
  error.value   = ''
  try {
    const { data } = await tradingService.listLots(accountId.value, {
      status: filterStatus.value || undefined,
      page: page.value,
      size: 20,
    })
    lots.value          = data.data.content
    totalPages.value    = data.data.totalPages
    totalElements.value = data.data.totalElements
  } catch {
    error.value = 'Erro ao carregar lotes.'
  } finally {
    loading.value = false
  }
}

function changeFilter(status: PurchaseLotStatus | '') {
  filterStatus.value = status
  page.value = 0
  loadLots()
}

function nextPage() { if (page.value < totalPages.value - 1) { page.value++; loadLots() } }
function prevPage() { if (page.value > 0) { page.value--; loadLots() } }

function openDelete(lot: PurchaseLotSummaryResponse) {
  deletingId.value   = lot.id
  deletingName.value = `lote de ${lot.supplierName} em ${formatDate(lot.purchaseDate)}`
}

async function confirmDelete() {
  if (!accountId.value || !deletingId.value) return
  try {
    await tradingService.deleteLot(accountId.value, deletingId.value)
    deletingId.value = null
    await loadLots()
  } catch {
    error.value = 'Erro ao excluir lote.'
    deletingId.value = null
  }
}

// Atualização otimista — evita reload completo da lista ao encerrar um lote
async function closeLot(id: string) {
  if (!accountId.value) return
  try {
    await tradingService.closeLot(accountId.value, id)
    const lot = lots.value.find(l => l.id === id)
    if (lot) lot.status = 'CLOSED'
  } catch {
    error.value = 'Erro ao encerrar lote.'
  }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Lotes de Compra</h1>
        <p class="page-subtitle">{{ totalElements }} lote{{ totalElements !== 1 ? 's' : '' }} registrado{{ totalElements !== 1 ? 's' : '' }}</p>
      </div>
      <button class="btn btn--primary" @click="router.push({ name: 'trader-lots-new' })">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Registrar Lote
      </button>
    </div>

    <!-- Filtros de status -->
    <div class="filter-tabs">
      <button class="filter-tab" :class="{ 'filter-tab--active': filterStatus === '' }" @click="changeFilter('')">Todos</button>
      <button class="filter-tab" :class="{ 'filter-tab--active': filterStatus === 'OPEN' }" @click="changeFilter('OPEN')">Em aberto</button>
      <button class="filter-tab" :class="{ 'filter-tab--active': filterStatus === 'CLOSED' }" @click="changeFilter('CLOSED')">Encerrados</button>
    </div>

    <div v-if="error" class="error-banner">{{ error }}</div>

    <div v-if="loading" class="loading-state"><div class="spinner" /></div>

    <div v-else-if="lots.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
      <p>Nenhum lote encontrado.</p>
      <button class="btn btn--primary" @click="router.push({ name: 'trader-lots-new' })">Registrar primeiro lote</button>
    </div>

    <!-- Lista de lotes -->
    <div v-else class="lots-list">
      <div
        v-for="lot in lots"
        :key="lot.id"
        class="lot-card"
        @click="router.push({ name: 'trader-lot-detail', params: { lotId: lot.id } })"
      >
        <!-- Cabeçalho do card -->
        <div class="lot-card__header">
          <div class="lot-card__left">
            <span class="lot-card__supplier">{{ lot.supplierName }}</span>
            <span class="lot-card__date">{{ formatDate(lot.purchaseDate) }}</span>
          </div>
          <span class="lot-status" :class="`lot-status--${lot.status.toLowerCase()}`">
            {{ lot.status === 'OPEN' ? 'Em aberto' : 'Encerrado' }}
          </span>
        </div>

        <!-- Métricas -->
        <div class="lot-card__metrics">
          <div class="lot-metric">
            <span class="lot-metric__label">Comprado</span>
            <span class="lot-metric__value">{{ kg(lot.totalPurchasedKg) }}</span>
          </div>
          <div class="lot-metric">
            <span class="lot-metric__label">Vendido</span>
            <span class="lot-metric__value">{{ kg(lot.totalSoldKg) }}</span>
          </div>
          <div class="lot-metric">
            <span class="lot-metric__label">Restante</span>
            <span class="lot-metric__value" :class="{ 'lot-metric__value--warn': lot.remainingKg > 0 && lot.status === 'OPEN' }">{{ kg(lot.remainingKg) }}</span>
          </div>
          <div class="lot-metric">
            <span class="lot-metric__label">Custo</span>
            <span class="lot-metric__value lot-metric__value--cost">{{ currency(lot.totalCost) }}</span>
          </div>
          <div class="lot-metric">
            <span class="lot-metric__label">Preço/Kg</span>
            <span class="lot-metric__value">{{ currency(lot.pricePerKg) }}</span>
          </div>
        </div>

        <!-- Progresso de vendas -->
        <div class="lot-card__progress">
          <div class="progress-bar">
            <div
              class="progress-bar__fill"
              :style="{ width: lot.totalPurchasedKg > 0 ? `${Math.min((lot.totalSoldKg / lot.totalPurchasedKg) * 100, 100)}%` : '0%' }"
            />
          </div>
          <span class="progress-label">
            {{ lot.totalPurchasedKg > 0 ? Math.round((lot.totalSoldKg / lot.totalPurchasedKg) * 100) : 0 }}% vendido
          </span>
        </div>

        <!-- Ações -->
        <div class="lot-card__actions" @click.stop>
          <button
            v-if="lot.status === 'OPEN'"
            class="btn btn--sm btn--secondary"
            @click="closeLot(lot.id)"
          >
            Encerrar lote
          </button>
          <button class="btn-icon" title="Editar" @click="router.push({ name: 'trader-lot-edit', params: { lotId: lot.id } })">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon btn-icon--danger" title="Excluir" @click="openDelete(lot)">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Paginação -->
    <div v-if="totalPages > 1" class="pagination">
      <button class="btn btn--secondary btn--sm" :disabled="page === 0" @click="prevPage">Anterior</button>
      <span class="pagination__info">{{ page + 1 }} / {{ totalPages }}</span>
      <button class="btn btn--secondary btn--sm" :disabled="page >= totalPages - 1" @click="nextPage">Próxima</button>
    </div>
  </div>

  <!-- Modal exclusão -->
  <div v-if="deletingId" class="modal-overlay" @click.self="deletingId = null">
    <div class="modal">
      <div class="modal__header">
        <h2 class="modal__title">Excluir Lote</h2>
      </div>
      <div class="modal__body">
        <p>Tem certeza que deseja excluir o <strong>{{ deletingName }}</strong>? Todas as vendas vinculadas também serão removidas.</p>
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

/* Filtros */
.filter-tabs {
  display: flex;
  gap: 0.375rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0;
}

.filter-tab {
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.15s, border-color 0.15s;
}

.filter-tab:hover { color: var(--color-text); }
.filter-tab--active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: 600; }

/* Cards */
.lots-list { display: flex; flex-direction: column; gap: 1rem; }

.lot-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.25rem 1.5rem;
  cursor: pointer;
  box-shadow: var(--shadow-card);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.lot-card:hover { border-color: var(--color-primary); box-shadow: var(--shadow-card-hover); }

.lot-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.lot-card__left { display: flex; flex-direction: column; gap: 0.15rem; }
.lot-card__supplier { font-weight: 700; color: var(--color-text); font-size: 1rem; }
.lot-card__date { font-size: 0.8rem; color: var(--color-text-muted); }

.lot-status {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
}

.lot-status--open   { background: var(--color-primary-light); color: var(--color-primary); }
.lot-status--closed { background: var(--color-surface); color: var(--color-text-muted); }

/* Métricas */
.lot-card__metrics {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.lot-metric { display: flex; flex-direction: column; gap: 0.125rem; }
.lot-metric__label { font-size: 0.72rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 500; }
.lot-metric__value { font-size: 0.9rem; font-weight: 600; color: var(--color-text); }
.lot-metric__value--cost { color: var(--color-error); }
.lot-metric__value--warn { color: var(--color-warning, #b45309); }

/* Barra de progresso */
.lot-card__progress { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar__fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 3px;
  transition: width 0.3s;
}

.progress-label { font-size: 0.75rem; color: var(--color-text-muted); white-space: nowrap; }

/* Ações */
.lot-card__actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
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

.btn--sm { padding: 0.35rem 0.75rem; font-size: 0.8rem; }
.btn--primary  { background: var(--color-primary); color: #fff; }
.btn--secondary { background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-border); }
.btn--danger   { background: var(--color-error); color: #fff; }
.btn:disabled  { opacity: 0.6; cursor: not-allowed; }
.btn--primary:not(:disabled):hover { opacity: 0.88; }

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

/* Paginação */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.pagination__info { font-size: 0.875rem; color: var(--color-text-muted); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 500; padding: 1rem; }
.modal { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-md); width: 100%; max-width: 400px; }
.modal__header { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--color-border); }
.modal__title { font-size: 1rem; font-weight: 700; color: var(--color-text); margin: 0; }
.modal__body { padding: 1.5rem; font-size: 0.9rem; color: var(--color-text); line-height: 1.5; }
.modal__footer { padding: 1rem 1.5rem; border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; gap: 0.75rem; }

.error-banner { background: var(--color-error-light); color: var(--color-error); border: 1px solid var(--color-error); border-radius: var(--radius-sm); padding: 0.625rem 0.875rem; font-size: 0.85rem; margin-bottom: 1rem; }

.loading-state { display: flex; justify-content: center; padding: 4rem; }
.spinner { width: 32px; height: 32px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state { text-align: center; padding: 4rem 2rem; color: var(--color-text-muted); display: flex; flex-direction: column; align-items: center; gap: 1rem; }

/* Responsivo */
@media (max-width: 768px) {
  .page-container { padding: 1.25rem 1rem; }
  .page-header { flex-direction: column; }
  .lot-card__metrics { gap: 1rem; }
}
</style>
