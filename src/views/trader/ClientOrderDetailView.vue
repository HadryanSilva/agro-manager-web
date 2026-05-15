<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/accountStore'
import { useTraderFormatters } from '@/composables/useTraderFormatters'
import tradingService from '@/services/tradingService'
import type { ClientOrderDetailResponse } from '@/services/tradingService'

const route        = useRoute()
const router       = useRouter()
const accountStore = useAccountStore()
const { currency, kg } = useTraderFormatters()

const accountId = computed(() => accountStore.selectedAccount?.id)
const orderId   = route.params.orderId as string

const order      = ref<ClientOrderDetailResponse | null>(null)
const loading    = ref(true)
const error      = ref('')
const closing    = ref(false)
const showDelete = ref(false)
const deleteError = ref('')

onMounted(loadOrder)

async function loadOrder() {
  if (!accountId.value) return
  loading.value = true
  error.value   = ''
  try {
    const { data } = await tradingService.getOrder(accountId.value, orderId)
    order.value = data.data
  } catch {
    error.value = 'Erro ao carregar pedido.'
  } finally {
    loading.value = false
  }
}

async function closeOrder() {
  if (!accountId.value || !order.value) return
  closing.value = true
  try {
    await tradingService.closeOrder(accountId.value, orderId)
    await loadOrder()
  } catch {
    error.value = 'Erro ao fechar pedido.'
  } finally {
    closing.value = false
  }
}

async function confirmDelete() {
  if (!accountId.value) return
  try {
    await tradingService.deleteOrder(accountId.value, orderId)
    router.push({ name: 'trader-orders' })
  } catch (e: any) {
    deleteError.value = e?.response?.data?.message ?? 'Erro ao excluir pedido.'
  }
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <button class="btn-back" @click="router.push({ name: 'trader-orders' })">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        Pedidos
      </button>
    </div>

    <div v-if="loading" class="loading-state"><div class="spinner" /></div>
    <div v-else-if="error" class="empty-state"><p>{{ error }}</p><button class="btn btn--secondary" @click="loadOrder">Tentar novamente</button></div>

    <template v-else-if="order">
      <!-- Cabeçalho do pedido -->
      <div class="detail-header">
        <div class="detail-header__main">
          <div>
            <h1 class="detail-title">{{ order.clientName }}</h1>
            <p class="detail-meta">{{ order.clientPhone }} &bull; {{ formatDate(order.orderDate) }}</p>
          </div>
          <span class="badge" :class="order.status === 'OPEN' ? 'badge--open' : 'badge--closed'">
            {{ order.status === 'OPEN' ? 'Em aberto' : 'Fechado' }}
          </span>
        </div>
        <div v-if="order.notes" class="detail-notes">{{ order.notes }}</div>
        <div class="detail-actions">
          <template v-if="order.status === 'OPEN'">
            <button class="btn btn--secondary" @click="router.push({ name: 'trader-order-edit', params: { orderId: order.id } })">
              Editar
            </button>
            <button class="btn btn--primary" :disabled="closing" @click="closeOrder">
              {{ closing ? 'Fechando...' : 'Fechar Pedido' }}
            </button>
          </template>
          <button v-if="order.status === 'OPEN'" class="btn btn--danger-outline" @click="showDelete = true">Excluir</button>
        </div>
      </div>

      <!-- Legs e trucks -->
      <div v-for="leg in order.legs" :key="leg.id" class="leg-card">
        <div class="leg-card__header">
          <div>
            <span class="leg-supplier">{{ leg.supplierName }}</span>
            <span v-if="leg.supplierCity" class="leg-city"> — {{ leg.supplierCity }}</span>
          </div>
          <span class="leg-price">{{ currency(leg.supplierPricePerKg) }}/kg</span>
        </div>

        <div v-if="leg.notes" class="leg-notes">{{ leg.notes }}</div>

        <table class="trucks-table">
          <thead>
            <tr>
              <th>Placa</th>
              <th class="align-right">Quantidade</th>
              <th class="align-right">Frete</th>
              <th class="align-right">Custo</th>
              <th>Obs.</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="truck in leg.trucks" :key="truck.id">
              <td class="truck-plate">{{ truck.truckPlate }}</td>
              <td class="align-right">{{ kg(truck.quantityKg) }}</td>
              <td class="align-right">{{ truck.freightValue != null ? currency(truck.freightValue) : '—' }}</td>
              <td class="align-right">{{ currency(truck.quantityKg * leg.supplierPricePerKg) }}</td>
              <td class="text-muted">{{ truck.notes ?? '—' }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="leg-totals">
              <td><strong>Subtotal perna</strong></td>
              <td class="align-right"><strong>{{ kg(leg.totalKg) }}</strong></td>
              <td></td>
              <td class="align-right"><strong>{{ currency(leg.totalCost) }}</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Resumo financeiro -->
      <div class="summary-card">
        <h2 class="summary-title">Resumo Financeiro</h2>
        <div class="summary-grid">
          <div class="summary-row">
            <span>Total de Kg</span>
            <span class="summary-value">{{ kg(order.totalKg) }}</span>
          </div>
          <div class="summary-row">
            <span>Preço/kg do Cliente</span>
            <span class="summary-value">{{ currency(order.clientPricePerKg) }}</span>
          </div>
          <div class="summary-row">
            <span>Receita Total</span>
            <span class="summary-value summary-value--positive">{{ currency(order.totalRevenue) }}</span>
          </div>
          <div class="summary-row">
            <span>Custo Total</span>
            <span class="summary-value summary-value--negative">{{ currency(order.totalCost) }}</span>
          </div>
          <div class="summary-row summary-row--highlight">
            <span><strong>Margem Bruta</strong></span>
            <span class="summary-value" :class="order.grossMargin >= 0 ? 'summary-value--positive' : 'summary-value--negative'">
              <strong>{{ currency(order.grossMargin) }}</strong>
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>

  <!-- Modal exclusão -->
  <div v-if="showDelete" class="modal-overlay" @click.self="showDelete = false">
    <div class="modal modal--sm">
      <div class="modal__header">
        <h2 class="modal__title">Excluir Pedido</h2>
      </div>
      <div class="modal__body">
        <div v-if="deleteError" class="error-banner">{{ deleteError }}</div>
        <p class="confirm-text">Tem certeza que deseja excluir este pedido? Todos os dados serão removidos e esta ação não pode ser desfeita.</p>
      </div>
      <div class="modal__footer">
        <button class="btn btn--secondary" @click="showDelete = false">Cancelar</button>
        <button class="btn btn--danger" @click="confirmDelete">Excluir</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container { padding: 2rem 1.5rem; max-width: 900px; margin: 0 auto; }
.page-header { margin-bottom: 1.25rem; }
.btn-back { display: inline-flex; align-items: center; gap: 0.375rem; background: none; border: none; cursor: pointer; color: var(--color-text-muted); font-family: inherit; font-size: 0.875rem; padding: 0; transition: color 0.15s; }
.btn-back:hover { color: var(--color-text); }

.detail-header { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1.5rem; margin-bottom: 1rem; box-shadow: var(--shadow-card); display: flex; flex-direction: column; gap: 0.875rem; }
.detail-header__main { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.detail-title { font-size: 1.5rem; font-weight: 700; color: var(--color-text); margin: 0 0 0.25rem; }
.detail-meta { font-size: 0.875rem; color: var(--color-text-muted); margin: 0; }
.detail-notes { font-size: 0.875rem; color: var(--color-text-muted); font-style: italic; }
.detail-actions { display: flex; gap: 0.625rem; flex-wrap: wrap; }

.badge { font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
.badge--open { background: var(--color-primary-light); color: var(--color-primary); }
.badge--closed { background: var(--color-surface); color: var(--color-text-muted); }

.leg-card { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 0.75rem; box-shadow: var(--shadow-card); }
.leg-card__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
.leg-supplier { font-weight: 700; color: var(--color-text); }
.leg-city { color: var(--color-text-muted); }
.leg-price { font-weight: 600; color: var(--color-primary); font-size: 0.9rem; }
.leg-notes { font-size: 0.825rem; color: var(--color-text-muted); margin-bottom: 0.75rem; font-style: italic; }

.trucks-table { width: 100%; border-collapse: collapse; font-size: 0.855rem; }
.trucks-table th { font-size: 0.72rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; padding: 0.4rem 0.5rem; border-bottom: 1px solid var(--color-border); text-align: left; }
.trucks-table td { padding: 0.5rem 0.5rem; border-bottom: 1px solid var(--color-border); color: var(--color-text); }
.trucks-table tbody tr:last-child td { border-bottom: none; }
.truck-plate { font-weight: 600; font-family: monospace; letter-spacing: 0.04em; }
.align-right { text-align: right; }
.text-muted { color: var(--color-text-muted); }
.leg-totals td { padding: 0.6rem 0.5rem; border-top: 1px solid var(--color-border); background: var(--color-surface); }

.summary-card { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1.5rem; margin-top: 1rem; box-shadow: var(--shadow-card); }
.summary-title { font-size: 0.95rem; font-weight: 700; color: var(--color-text); margin: 0 0 1rem; }
.summary-grid { display: flex; flex-direction: column; gap: 0.5rem; }
.summary-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.875rem; color: var(--color-text); }
.summary-row:nth-child(odd) { background: var(--color-surface); }
.summary-row--highlight { background: var(--color-primary-light) !important; border: 1px solid var(--color-primary); }
.summary-value { font-weight: 600; }
.summary-value--positive { color: var(--color-primary); }
.summary-value--negative { color: var(--color-error); }

.btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: var(--radius-sm); font-family: inherit; font-size: 0.875rem; font-weight: 600; border: none; cursor: pointer; transition: opacity 0.15s; white-space: nowrap; }
.btn--primary { background: var(--color-primary); color: #fff; }
.btn--secondary { background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-border); }
.btn--danger { background: var(--color-error); color: #fff; }
.btn--danger-outline { background: none; color: var(--color-error); border: 1px solid var(--color-error); }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn:not(:disabled):hover { opacity: 0.88; }

.loading-state { display: flex; justify-content: center; padding: 4rem; }
.spinner { width: 32px; height: 32px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { text-align: center; padding: 4rem 2rem; color: var(--color-text-muted); display: flex; flex-direction: column; align-items: center; gap: 1rem; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 500; padding: 1rem; }
.modal { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-md); width: 100%; max-width: 480px; }
.modal--sm { max-width: 380px; }
.modal__header { display: flex; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--color-border); }
.modal__title { font-size: 1rem; font-weight: 700; color: var(--color-text); margin: 0; }
.modal__body { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
.modal__footer { padding: 1rem 1.5rem; border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; gap: 0.75rem; }
.confirm-text { color: var(--color-text); font-size: 0.9rem; line-height: 1.5; margin: 0; }
.error-banner { background: var(--color-error-light); color: var(--color-error); border: 1px solid var(--color-error); border-radius: var(--radius-sm); padding: 0.625rem 0.875rem; font-size: 0.85rem; }

@media (max-width: 600px) {
  .page-container { padding: 1.25rem 1rem; }
  .detail-header__main { flex-direction: column; }
  .detail-actions { flex-direction: column; }
  .trucks-table th:nth-child(4), .trucks-table td:nth-child(4),
  .trucks-table th:nth-child(5), .trucks-table td:nth-child(5) { display: none; }
}
</style>
