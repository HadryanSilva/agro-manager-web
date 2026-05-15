<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/accountStore'
import { useTraderFormatters } from '@/composables/useTraderFormatters'
import tradingService from '@/services/tradingService'
import type {
  TradingClientResponse,
  TradingSupplierResponse,
  ClientOrderRequest,
} from '@/services/tradingService'

const route        = useRoute()
const router       = useRouter()
const accountStore = useAccountStore()
const { currency, kg } = useTraderFormatters()

const accountId = computed(() => accountStore.selectedAccount?.id)
const orderId   = route.params.orderId as string | undefined

// ── Dados de suporte ──────────────────────────────────────────────────────────

const clients   = ref<TradingClientResponse[]>([])
const suppliers = ref<TradingSupplierResponse[]>([])

// ── Estado da página ──────────────────────────────────────────────────────────

const loading   = ref(true)
const saving    = ref(false)
const formError = ref('')

// ── Tipos internos de formulário ──────────────────────────────────────────────

interface TruckForm {
  _key: number
  truckPlate: string
  quantityKg: number | ''
  freightValue: number | ''
  notes: string
}

interface LegForm {
  _key: number
  supplierId: string
  supplierPricePerKg: number | ''
  notes: string
  trucks: TruckForm[]
}

interface OrderForm {
  clientId: string
  orderDate: string
  clientPricePerKg: number | ''
  notes: string
  legs: LegForm[]
}

// _key counter — not reactive, only used for v-for :key stability
let _key = 0

function newTruck(): TruckForm {
  return { _key: _key++, truckPlate: '', quantityKg: '', freightValue: '', notes: '' }
}

function newLeg(): LegForm {
  return { _key: _key++, supplierId: '', supplierPricePerKg: '', notes: '', trucks: [newTruck()] }
}

const form = ref<OrderForm>({
  clientId:         '',
  orderDate:        new Date().toISOString().slice(0, 10),
  clientPricePerKg: '',
  notes:            '',
  legs:             [newLeg()],
})

// ── Resumo ao vivo ────────────────────────────────────────────────────────────

const summary = computed(() => {
  const clientPrice = Number(form.value.clientPricePerKg) || 0
  let totalKg = 0
  let totalProductCost = 0
  let totalFreight = 0

  for (const leg of form.value.legs) {
    const supplierPrice = Number(leg.supplierPricePerKg) || 0
    for (const truck of leg.trucks) {
      const kgVal = Number(truck.quantityKg) || 0
      totalKg          += kgVal
      totalProductCost += kgVal * supplierPrice
      totalFreight     += Number(truck.freightValue) || 0
    }
  }

  const totalCost    = totalProductCost + totalFreight
  const totalRevenue = totalKg * clientPrice
  const grossMargin  = totalRevenue - totalCost

  return { totalKg, totalRevenue, totalProductCost, totalFreight, totalCost, grossMargin }
})

// ── Inicialização ─────────────────────────────────────────────────────────────

onMounted(async () => {
  if (!accountId.value) return
  loading.value = true
  try {
    const [clientsRes, suppliersRes] = await Promise.all([
      tradingService.listClients(accountId.value),
      tradingService.listSuppliers(accountId.value),
    ])
    clients.value   = clientsRes.data.data
    suppliers.value = suppliersRes.data.data

    if (orderId) {
      const { data } = await tradingService.getOrder(accountId.value, orderId)
      const o = data.data
      form.value = {
        clientId:         o.clientId,
        orderDate:        o.orderDate,
        clientPricePerKg: o.clientPricePerKg,
        notes:            o.notes ?? '',
        legs: o.legs.map(leg => ({
          _key:               _key++,
          supplierId:         leg.supplierId,
          supplierPricePerKg: leg.supplierPricePerKg,
          notes:              leg.notes ?? '',
          trucks: leg.trucks.map(t => ({
            _key:         _key++,
            truckPlate:   t.truckPlate,
            quantityKg:   t.quantityKg,
            freightValue: t.freightValue ?? '',
            notes:        t.notes ?? '',
          })),
        })),
      }
    }
  } catch {
    formError.value = 'Erro ao carregar dados.'
  } finally {
    loading.value = false
  }
})

// ── Manipulação dinâmica de legs e trucks ─────────────────────────────────────

function addLeg() {
  form.value.legs.push(newLeg())
}

function removeLeg(index: number) {
  if (form.value.legs.length === 1) return
  form.value.legs.splice(index, 1)
}

function addTruck(leg: LegForm) {
  leg.trucks.push(newTruck())
}

function removeTruck(leg: LegForm, index: number) {
  if (leg.trucks.length === 1) return
  leg.trucks.splice(index, 1)
}

// ── Submit ────────────────────────────────────────────────────────────────────

async function submit() {
  formError.value = ''

  if (!form.value.clientId)                   { formError.value = 'Selecione o cliente.'; return }
  if (!form.value.orderDate)                  { formError.value = 'Informe a data do pedido.'; return }
  if (Number(form.value.clientPricePerKg) <= 0) { formError.value = 'Preço/kg do cliente deve ser maior que zero.'; return }
  if (form.value.legs.length === 0)           { formError.value = 'Adicione ao menos um fornecedor.'; return }

  for (let li = 0; li < form.value.legs.length; li++) {
    const leg = form.value.legs[li]
    if (!leg.supplierId)                         { formError.value = `Selecione o fornecedor na perna ${li + 1}.`; return }
    if (Number(leg.supplierPricePerKg) <= 0)     { formError.value = `Preço/kg do fornecedor na perna ${li + 1} deve ser maior que zero.`; return }
    if (leg.trucks.length === 0)                 { formError.value = `Adicione ao menos um caminhão na perna ${li + 1}.`; return }
    for (let ti = 0; ti < leg.trucks.length; ti++) {
      const t = leg.trucks[ti]
      if (!t.truckPlate.trim())            { formError.value = `Informe a placa do caminhão ${ti + 1} na perna ${li + 1}.`; return }
      if (t.truckPlate.trim().length > 10) { formError.value = `Placa do caminhão ${ti + 1} na perna ${li + 1} deve ter no máximo 10 caracteres.`; return }
      if (Number(t.quantityKg) <= 0)       { formError.value = `Quantidade (kg) do caminhão ${ti + 1} na perna ${li + 1} deve ser maior que zero.`; return }
      if (t.freightValue !== '' && Number(t.freightValue) < 0) { formError.value = `Frete do caminhão ${ti + 1} não pode ser negativo.`; return }
    }
  }

  const payload: ClientOrderRequest = {
    clientId:         form.value.clientId,
    orderDate:        form.value.orderDate,
    clientPricePerKg: Number(form.value.clientPricePerKg),
    notes:            form.value.notes || undefined,
    legs: form.value.legs.map(leg => ({
      supplierId:         leg.supplierId,
      supplierPricePerKg: Number(leg.supplierPricePerKg),
      notes:              leg.notes || undefined,
      trucks: leg.trucks.map(t => ({
        truckPlate:   t.truckPlate.trim().toUpperCase(),
        quantityKg:   Number(t.quantityKg),
        freightValue: t.freightValue !== '' ? Number(t.freightValue) : undefined,
        notes:        t.notes || undefined,
      })),
    })),
  }

  saving.value = true
  try {
    if (orderId) {
      await tradingService.updateOrder(accountId.value!, orderId, payload)
    } else {
      await tradingService.createOrder(accountId.value!, payload)
    }
    router.push({ name: 'trader-orders' })
  } catch (e: any) {
    formError.value = e?.response?.data?.message ?? 'Erro ao salvar pedido. Tente novamente.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ orderId ? 'Editar Pedido' : 'Novo Pedido' }}</h1>
        <p class="page-subtitle">Preencha o pedido, os fornecedores e os caminhões</p>
      </div>
      <button class="btn btn--secondary" @click="router.push({ name: 'trader-orders' })">Cancelar</button>
    </div>

    <div v-if="loading" class="loading-state"><div class="spinner" /></div>

    <form v-else @submit.prevent="submit">
      <div v-if="formError" class="error-banner">{{ formError }}</div>

      <!-- Cabeçalho do pedido -->
      <div class="section-card">
        <h2 class="section-title">Dados do Pedido</h2>
        <div class="form-grid">
          <div class="form-group form-group--wide">
            <label class="form-label">Cliente *</label>
            <select v-model="form.clientId" class="form-input">
              <option value="">Selecione o cliente</option>
              <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Data do Pedido *</label>
            <input v-model="form.orderDate" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Preço/kg do Cliente (R$) *</label>
            <input v-model="form.clientPricePerKg" type="number" step="0.01" min="0" class="form-input" placeholder="0,00" />
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">Observações</label>
            <textarea v-model="form.notes" class="form-input form-textarea" placeholder="Observações sobre o pedido..." />
          </div>
        </div>
      </div>

      <!-- Legs de fornecedores -->
      <div class="legs-section">
        <div v-for="(leg, li) in form.legs" :key="leg._key" class="leg-card">
          <div class="leg-card__header">
            <h3 class="leg-card__title">Fornecedor {{ li + 1 }}</h3>
            <button
              v-if="form.legs.length > 1"
              type="button"
              class="btn-icon btn-icon--danger"
              title="Remover fornecedor"
              @click="removeLeg(li)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="form-grid">
            <div class="form-group form-group--wide">
              <label class="form-label">Fornecedor *</label>
              <select v-model="leg.supplierId" class="form-input">
                <option value="">Selecione o fornecedor</option>
                <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Preço/kg do Fornecedor (R$) *</label>
              <input v-model="leg.supplierPricePerKg" type="number" step="0.01" min="0" class="form-input" placeholder="0,00" />
            </div>
            <div class="form-group form-group--full">
              <label class="form-label">Observações da perna</label>
              <input v-model="leg.notes" type="text" class="form-input" placeholder="Observações opcionais..." />
            </div>
          </div>

          <!-- Trucks da leg -->
          <div class="trucks-section">
            <div v-for="(truck, ti) in leg.trucks" :key="truck._key" class="truck-row">
              <div class="truck-row__fields">
                <div class="form-group">
                  <label class="form-label">Placa *</label>
                  <input v-model="truck.truckPlate" type="text" maxlength="10" class="form-input" placeholder="ABC1D23" style="text-transform:uppercase" />
                </div>
                <div class="form-group">
                  <label class="form-label">Quantidade (kg) *</label>
                  <input v-model="truck.quantityKg" type="number" step="0.01" min="0" class="form-input" placeholder="0,00" />
                </div>
                <div class="form-group">
                  <label class="form-label">Frete (R$)</label>
                  <input v-model="truck.freightValue" type="number" step="0.01" min="0" class="form-input" placeholder="Opcional" />
                </div>
                <div class="form-group form-group--notes">
                  <label class="form-label">Obs.</label>
                  <input v-model="truck.notes" type="text" class="form-input" placeholder="Opcional" />
                </div>
              </div>
              <button
                v-if="leg.trucks.length > 1"
                type="button"
                class="btn-icon btn-icon--danger truck-remove"
                title="Remover caminhão"
                @click="removeTruck(leg, ti)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <button type="button" class="btn btn--ghost btn--sm" @click="addTruck(leg)">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Adicionar Caminhão
            </button>
          </div>
        </div>

        <button type="button" class="btn btn--secondary" @click="addLeg">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Adicionar Fornecedor
        </button>
      </div>

      <!-- Resumo ao vivo -->
      <div class="summary-card">
        <h2 class="section-title">Resumo</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-item__label">Total de Kg</span>
            <span class="summary-item__value">{{ kg(summary.totalKg) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-item__label">Receita Estimada</span>
            <span class="summary-item__value summary-item__value--positive">{{ currency(summary.totalRevenue) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-item__label">Custo Produto</span>
            <span class="summary-item__value">{{ currency(summary.totalProductCost) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-item__label">Custo Frete</span>
            <span class="summary-item__value">{{ currency(summary.totalFreight) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-item__label">Custo Total</span>
            <span class="summary-item__value summary-item__value--negative">{{ currency(summary.totalCost) }}</span>
          </div>
          <div class="summary-item summary-item--highlight">
            <span class="summary-item__label">Margem Bruta</span>
            <span class="summary-item__value" :class="summary.grossMargin >= 0 ? 'summary-item__value--positive' : 'summary-item__value--negative'">
              {{ currency(summary.grossMargin) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Ações -->
      <div class="form-actions">
        <button type="button" class="btn btn--secondary" @click="router.push({ name: 'trader-orders' })">Cancelar</button>
        <button type="submit" class="btn btn--primary" :disabled="saving">
          {{ saving ? 'Salvando...' : (orderId ? 'Salvar Alterações' : 'Criar Pedido') }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.page-container { padding: 2rem 1.5rem; max-width: 860px; margin: 0 auto; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; }
.page-title { font-size: 1.75rem; font-weight: 700; color: var(--color-text); letter-spacing: -0.02em; line-height: 1.2; margin: 0 0 0.25rem; }
.page-subtitle { font-size: 0.875rem; color: var(--color-text-muted); margin: 0; }

.section-card, .leg-card, .summary-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: var(--shadow-card);
}

.section-title { font-size: 0.95rem; font-weight: 700; color: var(--color-text); margin: 0 0 1rem; letter-spacing: -0.01em; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.375rem; }
.form-group--wide { grid-column: span 2; }
.form-group--full { grid-column: 1 / -1; }
.form-group--notes { flex: 1; }
.form-label { font-size: 0.825rem; font-weight: 600; color: var(--color-text); }
.form-input { padding: 0.5rem 0.75rem; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-surface); color: var(--color-text); font-family: inherit; font-size: 0.875rem; width: 100%; box-sizing: border-box; }
.form-input:focus { outline: none; border-color: var(--color-primary); }
.form-textarea { resize: vertical; min-height: 64px; }

.legs-section { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; }

.leg-card__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.leg-card__title { font-size: 0.875rem; font-weight: 700; color: var(--color-primary); margin: 0; text-transform: uppercase; letter-spacing: 0.04em; }

.trucks-section { margin-top: 1rem; display: flex; flex-direction: column; gap: 0.625rem; border-top: 1px solid var(--color-border); padding-top: 1rem; }

.truck-row { display: flex; align-items: flex-end; gap: 0.5rem; }
.truck-row__fields { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.3fr) minmax(0, 1.1fr) minmax(0, 1.5fr); gap: 0.625rem; flex: 1; }

.truck-remove { flex-shrink: 0; margin-bottom: 0.1rem; }

.summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
.summary-item { display: flex; flex-direction: column; gap: 0.25rem; padding: 0.875rem; background: var(--color-surface); border-radius: var(--radius-sm); }
.summary-item--highlight { border: 1px solid var(--color-primary); background: var(--color-primary-light); }
.summary-item__label { font-size: 0.72rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
.summary-item__value { font-size: 1.1rem; font-weight: 700; color: var(--color-text); }
.summary-item__value--positive { color: var(--color-primary); }
.summary-item__value--negative { color: var(--color-error); }

.form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }

.btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: var(--radius-sm); font-family: inherit; font-size: 0.875rem; font-weight: 600; border: none; cursor: pointer; transition: opacity 0.15s; white-space: nowrap; }
.btn--primary { background: var(--color-primary); color: #fff; }
.btn--secondary { background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-border); }
.btn--ghost { background: none; color: var(--color-primary); border: 1px dashed var(--color-border); }
.btn--sm { padding: 0.35rem 0.75rem; font-size: 0.8rem; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn--primary:not(:disabled):hover, .btn--ghost:not(:disabled):hover { opacity: 0.85; }

.btn-icon { width: 30px; height: 30px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); transition: background 0.15s; flex-shrink: 0; }
.btn-icon--danger:hover { background: var(--color-error-light); color: var(--color-error); border-color: var(--color-error); }

.error-banner { background: var(--color-error-light); color: var(--color-error); border: 1px solid var(--color-error); border-radius: var(--radius-sm); padding: 0.625rem 0.875rem; font-size: 0.85rem; margin-bottom: 1rem; }
.loading-state { display: flex; justify-content: center; padding: 4rem; }
.spinner { width: 32px; height: 32px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .page-container { padding: 1.25rem 1rem; }
  .page-header { flex-direction: column; }
  .form-grid { grid-template-columns: 1fr; }
  .form-group--wide, .form-group--full { grid-column: span 1; }
  .truck-row__fields { grid-template-columns: 1fr 1fr; }
  .summary-grid { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 480px) {
  .truck-row__fields { grid-template-columns: 1fr; }
  .summary-grid { grid-template-columns: 1fr; }
}
</style>
