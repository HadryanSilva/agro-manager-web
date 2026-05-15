# Customer Orders Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar as telas de Pedidos de Clientes no modo comprador e atualizar o formulário de Lotes de Compra para exigir vínculo com um pedido.

**Architecture:** Abordagem incremental — service primeiro, depois rotas e nav, depois views novas, depois modificações nas views existentes. Cada task compila e funciona independentemente. `CustomerOrdersView` lista pedidos com filtro de status e delete inline. `CustomerOrderFormView` é página dedicada para criar/editar. `PurchaseLotFormView` ganha card-picker de pedido no topo. `PurchaseLotDetailView` ganha bloco informativo do pedido vinculado.

**Tech Stack:** Vue 3, TypeScript, Pinia, Vue Router, Axios. Sem UI library — CSS puro com variáveis CSS. `npm run type-check` para verificar compilação.

---

## File Map

**Novos:**
- `src/views/trader/CustomerOrdersView.vue`
- `src/views/trader/CustomerOrderFormView.vue`

**Modificados:**
- `src/services/tradingService.ts` — tipos + 5 métodos order CRUD + atualiza createLot
- `src/router/index.ts` — 3 rotas novas
- `src/layouts/TraderLayout.vue` — novo navItem
- `src/views/trader/PurchaseLotFormView.vue` — card-picker de pedido
- `src/views/trader/PurchaseLotDetailView.vue` — bloco "Pedido do Cliente"

---

## Task 1: Atualizar tradingService.ts

**Files:**
- Modify: `src/services/tradingService.ts`

- [ ] **Step 1: Adicionar `CustomerOrderStatus` e atualizar tipo `PurchaseLotStatus`**

Em `src/services/tradingService.ts`, após a linha `export type PurchaseLotStatus = 'OPEN' | 'CLOSED'`, adicionar:

```typescript
export type CustomerOrderStatus = 'PENDING' | 'FULFILLED'
```

- [ ] **Step 2: Adicionar `customerOrderId` e `customerName` em `PurchaseLotSummaryResponse`**

Substituir a interface `PurchaseLotSummaryResponse` por:

```typescript
export interface PurchaseLotSummaryResponse {
  id: string
  supplierId: string
  supplierName: string
  customerOrderId: string
  customerName: string
  purchaseDate: string
  pricePerKg: number
  status: PurchaseLotStatus
  totalPurchasedKg: number
  totalSoldKg: number
  remainingKg: number
  totalCost: number
  notes: string | null
  createdAt: string
}
```

- [ ] **Step 3: Adicionar `customerOrderId` e `customerName` em `PurchaseLotDetailResponse`**

Substituir a interface `PurchaseLotDetailResponse` por:

```typescript
export interface PurchaseLotDetailResponse {
  id: string
  supplierId: string
  supplierName: string
  supplierCity: string | null
  customerOrderId: string
  customerName: string
  purchaseDate: string
  pricePerKg: number
  status: PurchaseLotStatus
  purchaseTrucks: PurchaseTruckResponse[]
  sales: LotSaleResponse[]
  totalPurchasedKg: number
  totalSoldKg: number
  remainingKg: number
  totalCost: number
  totalRevenue: number
  grossMargin: number
  notes: string | null
  createdAt: string
}
```

- [ ] **Step 4: Adicionar `CreatePurchaseLotRequest` após `PurchaseLotRequest`**

Após o bloco de `PurchaseLotRequest`, adicionar:

```typescript
export interface CreatePurchaseLotRequest {
  customerOrderId: string
  supplierId: string
  purchaseDate: string
  pricePerKg: number
  trucks: PurchaseTruckRequest[]
  notes?: string
}
```

- [ ] **Step 5: Adicionar interfaces de CustomerOrder após `TradingDashboardResponse`**

Após o bloco de `TradingDashboardResponse`, antes de `PageResponse`, adicionar:

```typescript
// ── Pedidos de clientes ───────────────────────────────────────────────────────

export interface CustomerOrderRequest {
  customerName: string
  customerPhone?: string
  customerDocument?: string
  quantityKg: number
  pricePerKg?: number
  product: string
  orderDate: string
  deliveryDeadline?: string
  notes?: string
}

export interface CustomerOrderResponse {
  id: string
  customerName: string
  customerPhone: string | null
  customerDocument: string | null
  quantityKg: number
  pricePerKg: number | null
  product: string
  orderDate: string
  deliveryDeadline: string | null
  status: CustomerOrderStatus
  notes: string | null
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 6: Atualizar `createLot` e adicionar métodos de order no service**

Substituir a linha do método `createLot`:

```typescript
  createLot: (accountId: string, data: PurchaseLotRequest) =>
```

por:

```typescript
  createLot: (accountId: string, data: CreatePurchaseLotRequest) =>
```

Adicionar os métodos de order antes do fechamento do objeto `tradingService` (antes do `}`), após `deleteSale`:

```typescript
  // Pedidos de clientes
  createOrder: (accountId: string, data: CustomerOrderRequest) =>
    api
      .post<{ data: ObjectPayload<CustomerOrderResponse> }>(`/accounts/${accountId}/trading/orders`, data)
      .then(normalizeObjectResponse<CustomerOrderResponse>),

  listOrders: (accountId: string, params?: { status?: CustomerOrderStatus }) =>
    api
      .get<{ data: ListPayload<CustomerOrderResponse> }>(`/accounts/${accountId}/trading/orders`, { params })
      .then(normalizeListResponse<CustomerOrderResponse>),

  getOrder: (accountId: string, orderId: string) =>
    api
      .get<{ data: ObjectPayload<CustomerOrderResponse> }>(`/accounts/${accountId}/trading/orders/${orderId}`)
      .then(normalizeObjectResponse<CustomerOrderResponse>),

  updateOrder: (accountId: string, orderId: string, data: CustomerOrderRequest) =>
    api
      .put<{ data: ObjectPayload<CustomerOrderResponse> }>(`/accounts/${accountId}/trading/orders/${orderId}`, data)
      .then(normalizeObjectResponse<CustomerOrderResponse>),

  deleteOrder: (accountId: string, orderId: string) =>
    api.delete(`/accounts/${accountId}/trading/orders/${orderId}`),
```

- [ ] **Step 7: Verificar compilação TypeScript**

```bash
cd /home/hadryan/Dev/projects/agro-manager-web && npm run type-check
```

Expected: sem erros de tipo.

- [ ] **Step 8: Commit**

```bash
git add src/services/tradingService.ts
git commit -m "feat(trader): add CustomerOrder types and service methods; update createLot to require customerOrderId"
```

---

## Task 2: Rotas + navItem da sidebar

**Files:**
- Modify: `src/router/index.ts`
- Modify: `src/layouts/TraderLayout.vue`

- [ ] **Step 1: Adicionar 3 rotas de order em `router/index.ts`**

Após o bloco `trader-suppliers` (após linha `component: () => import('@/views/trader/TradingSuppliersView.vue')`), antes do bloco `trader-lots`, inserir:

```typescript
        {
          path: 'orders',
          name: 'trader-orders',
          component: () => import('@/views/trader/CustomerOrdersView.vue')
        },
        {
          path: 'orders/new',
          name: 'trader-orders-new',
          component: () => import('@/views/trader/CustomerOrderFormView.vue')
        },
        {
          path: 'orders/:orderId/edit',
          name: 'trader-orders-edit',
          component: () => import('@/views/trader/CustomerOrderFormView.vue')
        },
```

- [ ] **Step 2: Adicionar navItem em `TraderLayout.vue`**

No array `navItems`, após o objeto `trader-suppliers` e antes do objeto `trader-lots`, inserir:

```typescript
  {
    name: 'trader-orders',
    label: 'Pedidos de Clientes',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`
  },
```

- [ ] **Step 3: Verificar compilação**

```bash
npm run type-check
```

Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/router/index.ts src/layouts/TraderLayout.vue
git commit -m "feat(trader): add CustomerOrder routes and sidebar nav item"
```

---

## Task 3: CustomerOrdersView.vue

**Files:**
- Create: `src/views/trader/CustomerOrdersView.vue`

- [ ] **Step 1: Criar o arquivo**

Criar `src/views/trader/CustomerOrdersView.vue` com o conteúdo abaixo:

```vue
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
```

- [ ] **Step 2: Verificar compilação**

```bash
npm run type-check
```

Expected: sem erros.

- [ ] **Step 3: Verificar visualmente**

```bash
npm run dev
```

Abrir `http://localhost:5173`, entrar no modo comprador, clicar em "Pedidos de Clientes" na sidebar. Deve mostrar a lista (vazia se ainda não houver pedidos) com os 3 filtros e o botão "Novo Pedido".

- [ ] **Step 4: Commit**

```bash
git add src/views/trader/CustomerOrdersView.vue
git commit -m "feat(trader): add CustomerOrdersView with status filter and delete confirm"
```

---

## Task 4: CustomerOrderFormView.vue

**Files:**
- Create: `src/views/trader/CustomerOrderFormView.vue`

- [ ] **Step 1: Criar o arquivo**

Criar `src/views/trader/CustomerOrderFormView.vue`:

```vue
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
```

- [ ] **Step 2: Verificar compilação**

```bash
npm run type-check
```

Expected: sem erros.

- [ ] **Step 3: Verificar visualmente**

Com `npm run dev` rodando: clicar em "Novo Pedido" na lista de pedidos. Deve abrir o formulário com 2 seções. Preencher os campos obrigatórios e salvar — deve redirecionar para a lista e exibir o pedido criado com badge "Pendente".

Testar edição: clicar em "Editar" em um pedido. Formulário deve pré-preencher os campos. Salvar → volta para a lista.

- [ ] **Step 4: Commit**

```bash
git add src/views/trader/CustomerOrderFormView.vue
git commit -m "feat(trader): add CustomerOrderFormView with create and edit modes"
```

---

## Task 5: Atualizar PurchaseLotFormView.vue

**Files:**
- Modify: `src/views/trader/PurchaseLotFormView.vue`

- [ ] **Step 1: Atualizar import para incluir os novos tipos**

Na linha 7 do arquivo, substituir:

```typescript
import type { TradingSupplierResponse, PurchaseTruckRequest } from '@/services/tradingService'
```

por:

```typescript
import type { TradingSupplierResponse, PurchaseTruckRequest, CustomerOrderResponse } from '@/services/tradingService'
```

- [ ] **Step 2: Adicionar estado do card-picker após o bloco de estado do formulário**

Após a linha `const trucks = ref<TruckRow[]>([makeTruckRow()])`, adicionar:

```typescript
// Estado do picker de pedido
const selectedOrder  = ref<CustomerOrderResponse | null>(null)
const pendingOrders  = ref<CustomerOrderResponse[]>([])
const showOrderPicker = ref(false)
```

- [ ] **Step 3: Adicionar `loadPendingOrders()` e atualizar `onMounted`**

Após a função `loadSuppliers()`, adicionar:

```typescript
async function loadPendingOrders() {
  if (!accountId.value) return
  const { data } = await tradingService.listOrders(accountId.value, { status: 'PENDING' })
  pendingOrders.value = data.data
}
```

Substituir o bloco `onMounted` por:

```typescript
onMounted(async () => {
  try {
    await Promise.all([loadSuppliers(), loadPendingOrders()])
    if (isEditing.value) await loadLot()
  } finally {
    loadingData.value = false
  }
})
```

- [ ] **Step 4: Atualizar `loadLot()` para carregar o pedido vinculado**

Dentro da função `loadLot()`, após a linha `notes.value = lot.notes ?? ''`, adicionar:

```typescript
    // Carrega o pedido vinculado para exibir no card-picker (somente leitura em edição)
    if (lot.customerOrderId) {
      const { data: orderData } = await tradingService.getOrder(accountId.value, lot.customerOrderId)
      selectedOrder.value = orderData.data
    }
```

- [ ] **Step 5: Atualizar `submit()` — validação e bloco try/catch**

Adicionar validação de pedido no início de `submit()`, após a linha `error.value = ''`:

```typescript
  if (!isEditing.value && !selectedOrder.value) {
    error.value = 'Selecione um pedido de cliente.'
    return
  }
```

Substituir o bloco completo `loading.value = true ... try { if (isEditing...) ... } catch ... finally` (linhas 105-131) por:

```typescript
  if (!accountId.value) return

  const truckData = trucks.value.map(t => ({
    truckPlate: t.truckPlate.toUpperCase().trim(),
    quantityKg: Number(t.quantityKg),
    notes: t.notes || undefined,
  }))

  loading.value = true
  try {
    if (isEditing.value && lotId.value) {
      const updatePayload: import('@/services/tradingService').PurchaseLotRequest = {
        supplierId:   supplierId.value,
        purchaseDate: purchaseDate.value,
        pricePerKg:   Number(pricePerKg.value),
        notes:        notes.value || undefined,
        trucks:       truckData,
      }
      const { data } = await tradingService.updateLot(accountId.value, lotId.value, updatePayload)
      router.push({ name: 'trader-lot-detail', params: { lotId: data.data.id } })
    } else {
      const createPayload: import('@/services/tradingService').CreatePurchaseLotRequest = {
        customerOrderId: selectedOrder.value!.id,
        supplierId:      supplierId.value,
        purchaseDate:    purchaseDate.value,
        pricePerKg:      Number(pricePerKg.value),
        notes:           notes.value || undefined,
        trucks:          truckData,
      }
      const { data } = await tradingService.createLot(accountId.value, createPayload)
      router.push({ name: 'trader-lot-detail', params: { lotId: data.data.id } })
    }
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Erro ao salvar lote.'
  } finally {
    loading.value = false
  }
```

Remover também a linha `if (!accountId.value) return` que ficava antes do bloco original (linha 103) — já está inclusa no novo bloco acima.

- [ ] **Step 6: Adicionar card-picker no template**

No `<template>`, dentro de `<div v-else class="form-layout">`, antes do primeiro `<div class="form-card">`, inserir:

```html
      <!-- Card-picker de pedido (apenas no modo criação) -->
      <div class="form-card" v-if="!isEditing">
        <h2 class="form-section-title">Pedido do Cliente *</h2>

        <!-- Estado: pedido não selecionado -->
        <div v-if="!selectedOrder && !showOrderPicker" class="order-picker order-picker--empty" @click="showOrderPicker = true">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span>Selecionar pedido PENDING...</span>
          <span class="order-picker__hint">Clique para ver pedidos disponíveis</span>
        </div>

        <!-- Lista de pedidos disponíveis -->
        <div v-if="showOrderPicker" class="order-picker-list">
          <div v-if="pendingOrders.length === 0" class="order-picker-empty">
            <p>Nenhum pedido disponível.</p>
            <button class="link-btn" @click="router.push({ name: 'trader-orders-new' })">Criar pedido de cliente</button>
          </div>
          <div
            v-for="o in pendingOrders"
            :key="o.id"
            class="order-picker-item"
            :class="{ 'order-picker-item--selected': selectedOrder?.id === o.id }"
            @click="selectedOrder = o; showOrderPicker = false"
          >
            <div class="order-picker-item__info">
              <span class="order-picker-item__name">{{ o.customerName }}</span>
              <span class="order-picker-item__sub">
                {{ o.product }} · {{ o.quantityKg.toLocaleString('pt-BR') }} Kg
                <span v-if="o.deliveryDeadline"> · Prazo: {{ o.deliveryDeadline }}</span>
              </span>
            </div>
            <span class="order-badge">PENDING</span>
          </div>
        </div>

        <!-- Estado: pedido selecionado -->
        <div v-if="selectedOrder && !showOrderPicker" class="order-picker order-picker--selected">
          <div class="order-picker__check">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="order-picker__detail">
            <span class="order-picker__name">{{ selectedOrder.customerName }}</span>
            <span class="order-picker__sub">
              {{ selectedOrder.product }} · {{ selectedOrder.quantityKg.toLocaleString('pt-BR') }} Kg
              <span v-if="selectedOrder.deliveryDeadline"> · Prazo: {{ selectedOrder.deliveryDeadline }}</span>
            </span>
          </div>
          <button class="btn btn--secondary btn--sm" @click="showOrderPicker = true">Trocar</button>
        </div>
      </div>

      <!-- Pedido vinculado (somente leitura em edição) -->
      <div v-if="isEditing && selectedOrder" class="form-card order-card-readonly">
        <h2 class="form-section-title">Pedido do Cliente</h2>
        <div class="order-picker order-picker--selected order-picker--disabled">
          <div class="order-picker__check">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="order-picker__detail">
            <span class="order-picker__name">{{ selectedOrder.customerName }}</span>
            <span class="order-picker__sub">{{ selectedOrder.product }}</span>
          </div>
          <span class="order-badge order-badge--fulfilled">ATENDIDO</span>
        </div>
        <p class="form-hint">O pedido vinculado não pode ser alterado após a criação do lote.</p>
      </div>
```

- [ ] **Step 7: Adicionar CSS do card-picker**

No `<style scoped>`, antes do `/* Responsivo */`, adicionar:

```css
/* Card-picker de pedido */
.order-picker {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: border-color 0.15s;
}

.order-picker--empty {
  border: 1.5px dashed var(--color-border);
  color: var(--color-text-muted);
  font-size: 0.875rem;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.25rem;
  gap: 0.25rem;
}

.order-picker--empty:hover { border-color: var(--color-primary); color: var(--color-primary); }

.order-picker__hint { font-size: 0.75rem; color: var(--color-text-muted); }

.order-picker--selected {
  border: 1.5px solid var(--color-primary);
  background: var(--color-primary-light);
  cursor: default;
}

.order-picker--disabled { opacity: 0.75; }

.order-picker__check {
  width: 32px;
  height: 32px;
  background: var(--color-primary);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.order-picker__detail { flex: 1; display: flex; flex-direction: column; gap: 0.15rem; }
.order-picker__name { font-weight: 700; color: var(--color-text); font-size: 0.9rem; }
.order-picker__sub { font-size: 0.78rem; color: var(--color-text-muted); }

.order-picker-list {
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.order-picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0.875rem;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background 0.12s;
}

.order-picker-item:last-child { border-bottom: none; }
.order-picker-item:hover { background: var(--color-primary-light); }
.order-picker-item--selected { background: var(--color-primary-light); }

.order-picker-item__info { display: flex; flex-direction: column; gap: 0.125rem; }
.order-picker-item__name { font-weight: 600; font-size: 0.875rem; color: var(--color-text); }
.order-picker-item__sub { font-size: 0.75rem; color: var(--color-text-muted); }

.order-picker-empty { padding: 1rem; text-align: center; color: var(--color-text-muted); font-size: 0.875rem; }

.order-badge {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  background: #fff3e0;
  color: #e65100;
  white-space: nowrap;
  flex-shrink: 0;
}

.order-badge--fulfilled { background: var(--color-primary-light); color: var(--color-primary); }

.order-card-readonly { opacity: 0.9; }
```

- [ ] **Step 8: Verificar compilação**

```bash
npm run type-check
```

Expected: sem erros.

- [ ] **Step 9: Verificar visualmente**

Abrir "Novo Lote de Compra". O card-picker deve aparecer no topo antes dos campos existentes. Clicar no card tracejado → abre lista de pedidos PENDING. Clicar em um pedido → card fecha, mostra pedido selecionado com borda verde e botão "Trocar". Tentar submeter sem selecionar pedido → mensagem de erro.

Abrir um lote existente para edição → card-picker exibe o pedido vinculado como somente leitura.

- [ ] **Step 10: Commit**

```bash
git add src/views/trader/PurchaseLotFormView.vue
git commit -m "feat(trader): add customer order card-picker to PurchaseLotFormView"
```

---

## Task 6: Atualizar PurchaseLotDetailView.vue

**Files:**
- Modify: `src/views/trader/PurchaseLotDetailView.vue`

- [ ] **Step 1: Adicionar bloco "Pedido do Cliente" após a barra de progresso**

No template, após o fechamento da `<div class="progress-section">` (linha ~217) e antes da `<div class="section-card">` de caminhões (linha ~220), inserir:

```html
      <!-- Pedido do cliente vinculado -->
      <div class="section-card customer-order-card">
        <div class="customer-order-header">
          <h2 class="section-title">Pedido do Cliente</h2>
          <span class="order-status order-status--fulfilled">Atendido</span>
        </div>
        <div class="customer-order-info">
          <div>
            <p class="customer-order-name">{{ lot.customerName }}</p>
            <p class="customer-order-sub">
              Pedido vinculado · ID: {{ lot.customerOrderId.slice(0, 8) }}...
            </p>
          </div>
        </div>
      </div>
```

- [ ] **Step 2: Adicionar CSS para o bloco de pedido**

No `<style scoped>`, após o bloco `.section-card`, adicionar:

```css
.customer-order-card { border-left: 3px solid var(--color-primary); }

.customer-order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.customer-order-info { display: flex; align-items: center; gap: 1rem; }
.customer-order-name { font-size: 1rem; font-weight: 700; color: var(--color-text); margin: 0 0 0.2rem; }
.customer-order-sub { font-size: 0.8rem; color: var(--color-text-muted); margin: 0; }

.order-status {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.2rem 0.625rem;
  border-radius: 20px;
}

.order-status--fulfilled { background: var(--color-primary-light); color: var(--color-primary); }
```

- [ ] **Step 3: Verificar compilação**

```bash
npm run type-check
```

Expected: sem erros.

- [ ] **Step 4: Verificar visualmente**

Abrir o detalhe de um lote existente. O bloco "Pedido do Cliente" deve aparecer entre a barra de progresso e "Caminhões de Recebimento", com borda esquerda verde, nome do cliente e badge "Atendido".

> **Nota:** Lotes criados antes da implementação do backend não têm `customerOrderId` — o banco retorna erro 409 ao tentar criar lote sem vínculo. Os lotes de testes precisam ser criados via nova API.

- [ ] **Step 5: Commit**

```bash
git add src/views/trader/PurchaseLotDetailView.vue
git commit -m "feat(trader): add customer order info block to PurchaseLotDetailView"
```

---

## Checklist de Verificação Final

Antes de marcar como completo:

- [ ] Sidebar mostra "Pedidos de Clientes" entre Fornecedores e Lotes de Compra
- [ ] `GET /trader/orders` → lista com badges PENDENTE/ATENDIDO, filtros funcionam
- [ ] `POST /trader/orders/new` → cria pedido, redireciona para lista com novo item
- [ ] `PUT /trader/orders/:id/edit` → pré-preenche campos, salva e redireciona
- [ ] Botões Editar/Excluir desabilitados em pedidos ATENDIDOS
- [ ] `POST /trader/lots/new` → card-picker mostra pedidos PENDING, submete com `customerOrderId`
- [ ] Editar lote existente → card-picker mostra pedido vinculado como readonly
- [ ] Detalhe do lote → bloco "Pedido do Cliente" com nome e badge verde
- [ ] `npm run type-check` → zero erros
