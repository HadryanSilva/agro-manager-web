<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/accountStore'
import { useTraderFormatters } from '@/composables/useTraderFormatters'
import tradingService from '@/services/tradingService'
import type { ClientOrderSummaryResponse, TradingClientResponse, ClientOrderStatus } from '@/services/tradingService'

const router       = useRouter()
const accountStore = useAccountStore()
const { currency, kg } = useTraderFormatters()
const accountId = computed(() => accountStore.selectedAccount?.id)

const orders      = ref<ClientOrderSummaryResponse[]>([])
const clients     = ref<TradingClientResponse[]>([])
const loading     = ref(true)
const error       = ref('')
const totalPages  = ref(0)
const currentPage = ref(0)

const statusFilter = ref<ClientOrderStatus | ''>('')
const clientFilter = ref('')

const deletingId   = ref<string | null>(null)
const deletingName = ref('')
const deleteError  = ref('')

onMounted(async () => {
  await Promise.all([loadClients(), loadOrders()])
})

async function loadClients() {
  if (!accountId.value) return
  try {
    const { data } = await tradingService.listClients(accountId.value)
    clients.value = data.data
  } catch {
    // non-fatal
  }
}

async function loadOrders() {
  if (!accountId.value) return
  loading.value = true
  error.value   = ''
  try {
    const result = await tradingService.listOrders(accountId.value, {
      status:   statusFilter.value || undefined,
      clientId: clientFilter.value || undefined,
      page:     currentPage.value,
      size:     12,
    })
    const page = result.data.data
    orders.value     = page.content
    totalPages.value = page.totalPages
  } catch {
    error.value = 'Erro ao carregar pedidos.'
  } finally {
    loading.value = false
  }
}

function applyFilter() {
  currentPage.value = 0
  loadOrders()
}

function goToPage(page: number) {
  currentPage.value = page
  loadOrders()
}

function openDelete(order: ClientOrderSummaryResponse) {
  deletingId.value   = order.id
  deletingName.value = `Pedido de ${order.clientName} em ${formatDate(order.orderDate)}`
  deleteError.value  = ''
}

async function confirmDelete() {
  if (!accountId.value || !deletingId.value) return
  try {
    await tradingService.deleteOrder(accountId.value, deletingId.value)
    deletingId.value = null
    await loadOrders()
  } catch (e: any) {
    const msg = e?.response?.data?.message ?? ''
    deleteError.value = msg || 'Erro ao excluir pedido.'
  }
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function marginClass(margin: number) {
  return margin >= 0 ? 'value--positive' : 'value--negative'
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Pedidos</h1>
        <p class="page-subtitle">Pedidos dos clientes e suas pernas de fornecedor</p>
      </div>
      <button class="btn btn--primary" @click="router.push({ name: 'trader-orders-new' })">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Novo Pedido
      </button>
    </div>

    <!-- Filtros -->
    <div class="filter-row">
      <select v-model="statusFilter" class="form-select" @change="applyFilter">
        <option value="">Todos os status</option>
        <option value="OPEN">Em aberto</option>
        <option value="CLOSED">Fechados</option>
      </select>
      <select v-model="clientFilter" class="form-select" @change="applyFilter">
        <option value="">Todos os clientes</option>
        <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </div>

    <div v-if="error" class="error-banner">{{ error }}</div>
    <div v-if="loading" class="loading-state"><div class="spinner" /></div>

    <div v-else-if="orders.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <p>{{ statusFilter || clientFilter ? 'Nenhum pedido encontrado com esses filtros.' : 'Nenhum pedido cadastrado ainda.' }}</p>
      <button v-if="!statusFilter && !clientFilter" class="btn btn--primary" @click="router.push({ name: 'trader-orders-new' })">Criar primeiro pedido</button>
    </div>

    <div v-else class="orders-table">
      <div class="orders-table__header">
        <span>Cliente</span>
        <span>Data</span>
        <span class="align-right">Total Kg</span>
        <span class="align-right">Receita</span>
        <span class="align-right">Margem</span>
        <span class="align-center">Status</span>
        <span></span>
      </div>
      <div
        v-for="order in orders"
        :key="order.id"
        class="orders-table__row"
        @click="router.push({ name: 'trader-order-detail', params: { orderId: order.id } })"
      >
        <span class="client-name">{{ order.clientName }}</span>
        <span class="date">{{ formatDate(order.orderDate) }}</span>
        <span class="align-right">{{ kg(order.totalKg) }}</span>
        <span class="align-right">{{ currency(order.totalRevenue) }}</span>
        <span class="align-right" :class="marginClass(order.grossMargin)">{{ currency(order.grossMargin) }}</span>
        <span class="align-center">
          <span class="badge" :class="order.status === 'OPEN' ? 'badge--open' : 'badge--closed'">
            {{ order.status === 'OPEN' ? 'Aberto' : 'Fechado' }}
          </span>
        </span>
        <span class="row-actions" @click.stop>
          <button
            class="btn-icon"
            title="Editar"
            :disabled="order.status === 'CLOSED'"
            @click="router.push({ name: 'trader-order-edit', params: { orderId: order.id } })"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button
            class="btn-icon btn-icon--danger"
            title="Excluir"
            :disabled="order.status === 'CLOSED'"
            @click="openDelete(order)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </span>
      </div>
    </div>

    <!-- Paginação -->
    <div v-if="totalPages > 1" class="pagination">
      <button class="btn btn--secondary btn--sm" :disabled="currentPage === 0" @click="goToPage(currentPage - 1)">Anterior</button>
      <span class="pagination__info">{{ currentPage + 1 }} / {{ totalPages }}</span>
      <button class="btn btn--secondary btn--sm" :disabled="currentPage >= totalPages - 1" @click="goToPage(currentPage + 1)">Próxima</button>
    </div>
  </div>

  <!-- Modal confirmação de exclusão -->
  <div v-if="deletingId" class="modal-overlay" @click.self="deletingId = null">
    <div class="modal modal--sm">
      <div class="modal__header">
        <h2 class="modal__title">Excluir Pedido</h2>
      </div>
      <div class="modal__body">
        <div v-if="deleteError" class="error-banner">{{ deleteError }}</div>
        <p class="confirm-text">Tem certeza que deseja excluir <strong>{{ deletingName }}</strong>? Todos os dados do pedido serão removidos.</p>
      </div>
      <div class="modal__footer">
        <button class="btn btn--secondary" @click="deletingId = null">Cancelar</button>
        <button class="btn btn--danger" @click="confirmDelete">Excluir</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container { padding: 2rem 1.5rem; max-width: 1100px; margin: 0 auto; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; }
.page-title { font-size: 1.75rem; font-weight: 700; color: var(--color-text); letter-spacing: -0.02em; line-height: 1.2; margin: 0 0 0.25rem; }
.page-subtitle { font-size: 0.875rem; color: var(--color-text-muted); margin: 0; }
.filter-row { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.form-select { padding: 0.5rem 0.75rem; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-card); color: var(--color-text); font-family: inherit; font-size: 0.875rem; cursor: pointer; }
.form-select:focus { outline: none; border-color: var(--color-primary); }
.orders-table { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-card); }
.orders-table__header { display: grid; grid-template-columns: 1fr 90px 90px 110px 110px 90px 80px; gap: 0.5rem; padding: 0.75rem 1rem; background: var(--color-surface); font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid var(--color-border); }
.orders-table__row { display: grid; grid-template-columns: 1fr 90px 90px 110px 110px 90px 80px; gap: 0.5rem; padding: 0.875rem 1rem; border-bottom: 1px solid var(--color-border); cursor: pointer; font-size: 0.875rem; color: var(--color-text); align-items: center; transition: background 0.1s; }
.orders-table__row:last-child { border-bottom: none; }
.orders-table__row:hover { background: var(--color-surface); }
.client-name { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.date { color: var(--color-text-muted); font-size: 0.82rem; }
.align-right { text-align: right; }
.align-center { text-align: center; }
.value--positive { color: var(--color-primary); font-weight: 600; }
.value--negative { color: var(--color-error); font-weight: 600; }
.badge { font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 20px; white-space: nowrap; }
.badge--open { background: var(--color-primary-light); color: var(--color-primary); }
.badge--closed { background: var(--color-surface); color: var(--color-text-muted); }
.row-actions { display: flex; gap: 0.25rem; justify-content: flex-end; }
.btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: var(--radius-sm); font-family: inherit; font-size: 0.875rem; font-weight: 600; border: none; cursor: pointer; transition: opacity 0.15s; white-space: nowrap; }
.btn--primary { background: var(--color-primary); color: #fff; }
.btn--secondary { background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-border); }
.btn--danger { background: var(--color-error); color: #fff; }
.btn--sm { padding: 0.375rem 0.75rem; font-size: 0.8rem; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn--primary:not(:disabled):hover { opacity: 0.88; }
.btn-icon { width: 30px; height: 30px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); transition: background 0.15s; }
.btn-icon:disabled { opacity: 0.35; cursor: not-allowed; }
.btn-icon:not(:disabled):hover { background: var(--color-surface); color: var(--color-text); }
.btn-icon--danger:not(:disabled):hover { background: var(--color-error-light); color: var(--color-error); border-color: var(--color-error); }
.pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1.5rem; }
.pagination__info { font-size: 0.875rem; color: var(--color-text-muted); }
.error-banner { background: var(--color-error-light); color: var(--color-error); border: 1px solid var(--color-error); border-radius: var(--radius-sm); padding: 0.625rem 0.875rem; font-size: 0.85rem; margin-bottom: 0.5rem; }
.loading-state { display: flex; justify-content: center; padding: 4rem; }
.spinner { width: 32px; height: 32px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { text-align: center; padding: 4rem 2rem; color: var(--color-text-muted); display: flex; flex-direction: column; align-items: center; gap: 1rem; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 500; padding: 1rem; }
.modal { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-md); width: 100%; max-width: 480px; }
.modal--sm { max-width: 380px; }
.modal__header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--color-border); }
.modal__title { font-size: 1rem; font-weight: 700; color: var(--color-text); margin: 0; }
.modal__body { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
.modal__footer { padding: 1rem 1.5rem; border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; gap: 0.75rem; }
.confirm-text { color: var(--color-text); font-size: 0.9rem; line-height: 1.5; margin: 0; }
@media (max-width: 900px) {
  .orders-table__header, .orders-table__row { grid-template-columns: 1fr 80px 90px 80px; }
  .orders-table__header span:nth-child(3),
  .orders-table__row span:nth-child(3),
  .orders-table__header span:nth-child(5),
  .orders-table__row span:nth-child(5) { display: none; }
}
@media (max-width: 600px) {
  .page-container { padding: 1.25rem 1rem; }
  .page-header { flex-direction: column; }
  .orders-table__header, .orders-table__row { grid-template-columns: 1fr 80px 80px; }
  .orders-table__header span:nth-child(3),
  .orders-table__row span:nth-child(3),
  .orders-table__header span:nth-child(4),
  .orders-table__row span:nth-child(4),
  .orders-table__header span:nth-child(5),
  .orders-table__row span:nth-child(5),
  .orders-table__header span:nth-child(7),
  .orders-table__row span:nth-child(7) { display: none; }
}
</style>
