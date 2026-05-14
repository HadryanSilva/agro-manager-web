<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAccountStore } from '@/stores/accountStore'
import tradingService from '@/services/tradingService'
import type { CustomerOrderRequest } from '@/services/tradingService'

const router       = useRouter()
const route        = useRoute()
const accountStore = useAccountStore()

const accountId = computed(() => accountStore.selectedAccount?.id)
const orderId   = computed(() => route.params.orderId as string | undefined)
const isEditing = computed(() => !!orderId.value)

// Estado do formulário
const customerName     = ref('')
const customerPhone    = ref('')
const customerDocument = ref('')
const quantityKg       = ref<number | ''>('')
const pricePerKg       = ref<number | ''>('')
const product          = ref('')
const orderDate        = ref('')
const deliveryDeadline = ref('')
const notes            = ref('')

const loading     = ref(false)
const loadingData = ref(true)
const error       = ref('')

onMounted(async () => {
  try {
    if (isEditing.value) await loadOrder()
  } finally {
    loadingData.value = false
  }
})

async function loadOrder() {
  if (!accountId.value || !orderId.value) return
  try {
    const { data } = await tradingService.getOrder(accountId.value, orderId.value)
    const o = data.data

    if (o.status === 'FULFILLED') {
      router.push({ name: 'trader-orders' })
      return
    }

    customerName.value     = o.customerName
    customerPhone.value    = o.customerPhone ?? ''
    customerDocument.value = o.customerDocument ?? ''
    quantityKg.value       = o.quantityKg
    pricePerKg.value       = o.pricePerKg ?? ''
    product.value          = o.product
    orderDate.value        = o.orderDate
    deliveryDeadline.value = o.deliveryDeadline ?? ''
    notes.value            = o.notes ?? ''
  } catch {
    error.value = 'Erro ao carregar pedido para edição.'
  }
}

async function submit() {
  error.value = ''

  if (!customerName.value.trim()) { error.value = 'Nome do cliente é obrigatório.'; return }
  if (!product.value.trim())      { error.value = 'Produto é obrigatório.'; return }
  if (!quantityKg.value || Number(quantityKg.value) <= 0) { error.value = 'Informe a quantidade em Kg.'; return }
  if (!orderDate.value)           { error.value = 'Data do pedido é obrigatória.'; return }
  if (!accountId.value) return

  const payload: CustomerOrderRequest = {
    customerName:     customerName.value.trim(),
    customerPhone:    customerPhone.value.trim() || undefined,
    customerDocument: customerDocument.value.trim() || undefined,
    quantityKg:       Number(quantityKg.value),
    pricePerKg:       pricePerKg.value !== '' ? Number(pricePerKg.value) : undefined,
    product:          product.value.trim(),
    orderDate:        orderDate.value,
    deliveryDeadline: deliveryDeadline.value || undefined,
    notes:            notes.value.trim() || undefined,
  }

  loading.value = true
  try {
    if (isEditing.value && orderId.value) {
      await tradingService.updateOrder(accountId.value, orderId.value, payload)
    } else {
      await tradingService.createOrder(accountId.value, payload)
    }
    router.push({ name: 'trader-orders' })
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Erro ao salvar pedido.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <button class="back-btn" @click="router.push({ name: 'trader-orders' })">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Pedidos de Clientes
      </button>
      <h1 class="page-title">{{ isEditing ? 'Editar Pedido' : 'Novo Pedido de Cliente' }}</h1>
    </div>

    <div v-if="loadingData" class="loading-state"><div class="spinner" /></div>

    <div v-else class="form-layout">
      <div v-if="error" class="error-banner">{{ error }}</div>

      <!-- Seção: Dados do Cliente -->
      <div class="form-card">
        <h2 class="form-section-title">Dados do Cliente</h2>

        <div class="form-group">
          <label class="form-label">Nome *</label>
          <input v-model="customerName" type="text" class="form-input" placeholder="Nome completo do cliente" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Telefone</label>
            <input v-model="customerPhone" type="text" class="form-input" placeholder="(00) 0 0000-0000" />
          </div>
          <div class="form-group">
            <label class="form-label">CPF / CNPJ</label>
            <input v-model="customerDocument" type="text" class="form-input" placeholder="000.000.000-00" />
          </div>
        </div>
      </div>

      <!-- Seção: Dados do Pedido -->
      <div class="form-card">
        <h2 class="form-section-title">Dados do Pedido</h2>

        <div class="form-row form-row--3">
          <div class="form-group form-group--wide">
            <label class="form-label">Produto *</label>
            <input v-model="product" type="text" class="form-input" placeholder="Ex: Soja, Milho, Café..." />
          </div>
          <div class="form-group">
            <label class="form-label">Quantidade (Kg) *</label>
            <input v-model="quantityKg" type="number" step="0.01" min="0" class="form-input" placeholder="0,00" />
          </div>
        </div>

        <div class="form-row form-row--3">
          <div class="form-group">
            <label class="form-label">Preço/Kg acordado (R$)</label>
            <input v-model="pricePerKg" type="number" step="0.0001" min="0" class="form-input" placeholder="0,0000" />
          </div>
          <div class="form-group">
            <label class="form-label">Data do pedido *</label>
            <input v-model="orderDate" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Prazo de entrega</label>
            <input v-model="deliveryDeadline" type="date" class="form-input" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Observações</label>
          <textarea v-model="notes" class="form-input form-textarea" placeholder="Detalhes adicionais sobre o pedido..." />
        </div>
      </div>

      <!-- Ações -->
      <div class="form-actions">
        <button class="btn btn--secondary" @click="router.push({ name: 'trader-orders' })">Cancelar</button>
        <button class="btn btn--primary" :disabled="loading" @click="submit">
          {{ loading ? 'Salvando...' : (isEditing ? 'Salvar alterações' : 'Salvar Pedido') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container { padding: 2rem 1.5rem; max-width: 760px; margin: 0 auto; }

.page-header { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 2rem; }

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0;
}
.back-btn:hover { color: var(--color-text); }

.page-title { font-size: 1.75rem; font-weight: 700; color: var(--color-text); letter-spacing: -0.02em; margin: 0; }

.form-layout { display: flex; flex-direction: column; gap: 1.25rem; }

.form-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
  box-shadow: var(--shadow-card);
}

.form-section-title { font-size: 1rem; font-weight: 700; color: var(--color-text); letter-spacing: -0.01em; margin: 0; }

.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-row--3 { grid-template-columns: 1fr 1fr 1fr; }
.form-group--wide { grid-column: span 2; }

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

.form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }

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
}
.btn--primary  { background: var(--color-primary); color: #fff; }
.btn--secondary { background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-border); }
.btn:disabled  { opacity: 0.6; cursor: not-allowed; }
.btn:not(:disabled):hover { opacity: 0.88; }

.error-banner {
  background: var(--color-error-light);
  color: var(--color-error);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-sm);
  padding: 0.625rem 0.875rem;
  font-size: 0.85rem;
}

.loading-state { display: flex; justify-content: center; padding: 4rem; }
.spinner { width: 32px; height: 32px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .page-container { padding: 1.25rem 1rem; }
  .form-row { grid-template-columns: 1fr; }
  .form-row--3 { grid-template-columns: 1fr; }
  .form-group--wide { grid-column: span 1; }
  .form-actions { flex-direction: column-reverse; }
  .form-actions .btn { width: 100%; justify-content: center; }
}
</style>
