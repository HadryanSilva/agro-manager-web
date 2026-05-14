<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/accountStore'
import { useTraderFormatters } from '@/composables/useTraderFormatters'
import tradingService from '@/services/tradingService'
import type { CustomerOrderResponse, CustomerOrderStatus } from '@/services/tradingService'

const router       = useRouter()
const accountStore = useAccountStore()
const { formatDate, kg, currency } = useTraderFormatters()

const accountId = computed(() => accountStore.selectedAccount?.id)

const orders       = ref<CustomerOrderResponse[]>([])
const loading      = ref(true)
const statusFilter = ref<CustomerOrderStatus | 'ALL'>('ALL')

const deletingId   = ref<string | null>(null)
const deletingName = ref('')

onMounted(loadOrders)

async function loadOrders() {
  if (!accountId.value) return
  loading.value = true
  try {
    const { data } = await tradingService.listOrders(accountId.value)
    orders.value = data.data
  } finally {
    loading.value = false
  }
}

const filteredOrders = computed(() =>
  statusFilter.value === 'ALL'
    ? orders.value
    : orders.value.filter(o => o.status === statusFilter.value)
)

function openDelete(order: CustomerOrderResponse) {
  deletingId.value   = order.id
  deletingName.value = order.customerName
}

async function confirmDelete() {
  if (!accountId.value || !deletingId.value) return
  try {
    await tradingService.deleteOrder(accountId.value, deletingId.value)
    await loadOrders()
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Pedidos de Clientes</h1>
        <p class="page-subtitle">Gerencie os pedidos que originam lotes de compra</p>
      </div>
      <button class="btn btn--primary" @click="router.push({ name: 'trader-orders-new' })">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Novo Pedido
      </button>
    </div>

    <!-- Filtros de status -->
    <div class="filter-bar">
      <button :class="['filter-btn', { 'filter-btn--active': statusFilter === 'ALL' }]" @click="statusFilter = 'ALL'">Todos</button>
      <button :class="['filter-btn', { 'filter-btn--active': statusFilter === 'PENDING' }]" @click="statusFilter = 'PENDING'">Pendentes</button>
      <button :class="['filter-btn', { 'filter-btn--active': statusFilter === 'FULFILLED' }]" @click="statusFilter = 'FULFILLED'">Atendidos</button>
    </div>

    <div v-if="loading" class="loading-state"><div class="spinner" /></div>

    <div v-else-if="filteredOrders.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      <p v-if="orders.length === 0">Nenhum pedido cadastrado.</p>
      <p v-else>Nenhum pedido com este status.</p>
      <button v-if="orders.length === 0" class="btn btn--primary" @click="router.push({ name: 'trader-orders-new' })">Criar primeiro pedido</button>
    </div>

    <div v-else class="orders-list">
      <div v-for="order in filteredOrders" :key="order.id" class="order-card">
        <div class="order-card__header">
          <div class="order-card__info">
            <span class="order-card__name">{{ order.customerName }}</span>
            <span class="order-card__sub">
              {{ order.product }} · Pedido: {{ formatDate(order.orderDate) }}
              <span v-if="order.deliveryDeadline"> · Prazo: {{ formatDate(order.deliveryDeadline) }}</span>
            </span>
          </div>
          <span class="order-status" :class="order.status === 'PENDING' ? 'order-status--pending' : 'order-status--fulfilled'">
            {{ order.status === 'PENDING' ? 'Pendente' : 'Atendido' }}
          </span>
        </div>

        <div class="order-card__metrics">
          <div class="order-metric">
            <span class="order-metric__label">Quantidade</span>
            <span class="order-metric__value">{{ kg(order.quantityKg) }}</span>
          </div>
          <div v-if="order.pricePerKg" class="order-metric">
            <span class="order-metric__label">Preço/Kg acordado</span>
            <span class="order-metric__value">{{ currency(order.pricePerKg) }}</span>
          </div>
          <div v-if="order.customerDocument" class="order-metric">
            <span class="order-metric__label">CPF/CNPJ</span>
            <span class="order-metric__value order-metric__value--mono">{{ order.customerDocument }}</span>
          </div>
        </div>

        <div class="order-card__actions">
          <button
            class="btn btn--secondary btn--sm"
            :disabled="order.status === 'FULFILLED'"
            @click="router.push({ name: 'trader-orders-edit', params: { orderId: order.id } })"
          >Editar</button>
          <button
            class="btn btn--sm btn--danger-outline"
            :disabled="order.status === 'FULFILLED'"
            @click="openDelete(order)"
          >Excluir</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal de confirmação de exclusão -->
  <div v-if="deletingId" class="modal-overlay" @click.self="deletingId = null">
    <div class="modal modal--sm">
      <div class="modal__header">
        <h2 class="modal__title">Excluir Pedido</h2>
      </div>
      <div class="modal__body">
        <p class="confirm-text">Excluir o pedido de <strong>{{ deletingName }}</strong>? Esta ação não pode ser desfeita.</p>
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
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.page-title { font-size: 1.75rem; font-weight: 700; color: var(--color-text); letter-spacing: -0.02em; margin: 0 0 0.25rem; }
.page-subtitle { font-size: 0.875rem; color: var(--color-text-muted); margin: 0; }

/* Filtros */
.filter-bar { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; flex-wrap: wrap; }

.filter-btn {
  padding: 0.3rem 0.875rem;
  border-radius: 20px;
  border: 1px solid var(--color-border);
  background: var(--color-card);
  color: var(--color-text-muted);
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.filter-btn--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  font-weight: 600;
}

/* Lista */
.orders-list { display: flex; flex-direction: column; gap: 0.75rem; }

.order-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem 1.25rem;
  box-shadow: var(--shadow-card);
}

.order-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.order-card__info { display: flex; flex-direction: column; gap: 0.2rem; }
.order-card__name { font-size: 1rem; font-weight: 700; color: var(--color-text); }
.order-card__sub { font-size: 0.8rem; color: var(--color-text-muted); }

.order-status {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.2rem 0.625rem;
  border-radius: 20px;
  white-space: nowrap;
  flex-shrink: 0;
}

.order-status--pending  { background: #fff3e0; color: #e65100; }
.order-status--fulfilled { background: var(--color-primary-light); color: var(--color-primary); }

.order-card__metrics {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.875rem;
}

.order-metric { display: flex; flex-direction: column; gap: 0.125rem; }
.order-metric__label { font-size: 0.72rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 500; }
.order-metric__value { font-size: 0.925rem; font-weight: 700; color: var(--color-text); }
.order-metric__value--mono { font-family: monospace; letter-spacing: 0.03em; }

.order-card__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  border-top: 1px solid var(--color-border);
  padding-top: 0.75rem;
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
.btn--danger-outline { background: transparent; border: 1px solid var(--color-error); color: var(--color-error); }
.btn:disabled  { opacity: 0.45; cursor: not-allowed; }
.btn:not(:disabled):hover { opacity: 0.88; }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal {
  background: var(--color-card);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  width: 100%;
  max-width: 480px;
}

.modal--sm { max-width: 380px; }
.modal__header { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--color-border); }
.modal__title { font-size: 1rem; font-weight: 700; color: var(--color-text); margin: 0; }
.modal__body { padding: 1.25rem 1.5rem; }
.confirm-text { font-size: 0.9rem; color: var(--color-text); margin: 0; line-height: 1.5; }
.modal__footer { padding: 1rem 1.5rem; border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; gap: 0.75rem; }

/* Estados */
.loading-state { display: flex; justify-content: center; padding: 4rem; }
.spinner { width: 32px; height: 32px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state { text-align: center; padding: 4rem 2rem; color: var(--color-text-muted); display: flex; flex-direction: column; align-items: center; gap: 0.875rem; }
.empty-state svg { opacity: 0.35; }

@media (max-width: 600px) {
  .page-container { padding: 1.25rem 1rem; }
  .page-header { flex-direction: column; }
  .order-card__header { flex-direction: column; }
  .order-card__actions { flex-direction: row; }
}
</style>
