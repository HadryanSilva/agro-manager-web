<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAccountStore } from '@/stores/accountStore'
import { useTraderFormatters } from '@/composables/useTraderFormatters'
import tradingService from '@/services/tradingService'
import type { PurchaseLotDetailResponse, LotSaleRequest, LotSaleTruckRequest } from '@/services/tradingService'

const router       = useRouter()
const route        = useRoute()
const accountStore = useAccountStore()
const { currency, kg, formatDate } = useTraderFormatters()

// Conta ativa — computed para reagir a mudanças de conta durante a sessão
const accountId = computed(() => accountStore.selectedAccount?.id)

// lotId como computed — reativo a mudanças de rota (evita valor stale em navegação programática)
const lotId = computed(() => route.params.lotId as string)

const lot     = ref<PurchaseLotDetailResponse | null>(null)
const loading = ref(true)
const error   = ref('')

// Modal de nova venda
const showSaleModal = ref(false)
const savingSale    = ref(false)
const saleError     = ref('')

// ── Tipo local com chave estável para cada caminhão do modal ──────────────────
interface SaleTruckRow extends LotSaleTruckRequest { _key: number }
let _truckKeyCounter = 0
const makeSaleTruckRow = (): SaleTruckRow => ({ truckPlate: '', quantityKg: 0, notes: '', _key: ++_truckKeyCounter })

const saleForm = ref<{
  buyerName: string
  saleDate: string
  pricePerKg: number | ''
  notes: string
  trucks: SaleTruckRow[]
}>({
  buyerName: '',
  saleDate: '',
  pricePerKg: '',
  notes: '',
  trucks: [makeSaleTruckRow()]
})

// Modal de exclusão de venda
const deletingSaleId   = ref<string | null>(null)
const deletingSaleName = ref('')

onMounted(loadLot)

async function loadLot() {
  if (!accountId.value) return
  loading.value = true
  error.value = ''
  try {
    const { data } = await tradingService.getLot(accountId.value, lotId.value)
    lot.value = data.data
  } catch {
    error.value = 'Erro ao carregar lote.'
  } finally {
    loading.value = false
  }
}

function openSaleModal() {
  saleForm.value = {
    buyerName: '',
    saleDate: '',
    pricePerKg: '',
    notes: '',
    trucks: [makeSaleTruckRow()]
  }
  saleError.value = ''
  showSaleModal.value = true
}

function addSaleTruck() {
  saleForm.value.trucks.push(makeSaleTruckRow())
}

function removeSaleTruck(index: number) {
  if (saleForm.value.trucks.length === 1) return
  saleForm.value.trucks.splice(index, 1)
}

async function submitSale() {
  saleError.value = ''
  const f = saleForm.value

  if (!f.buyerName.trim())                              { saleError.value = 'Informe o nome do comprador.'; return }
  if (!f.saleDate)                                      { saleError.value = 'Informe a data da venda.'; return }
  if (!f.pricePerKg || Number(f.pricePerKg) <= 0)      { saleError.value = 'Informe o preço por Kg.'; return }

  for (const [i, t] of f.trucks.entries()) {
    if (!t.truckPlate.trim())                           { saleError.value = `Informe a placa do caminhão ${i + 1}.`; return }
    if (!t.quantityKg || Number(t.quantityKg) <= 0)    { saleError.value = `Informe o peso do caminhão ${i + 1}.`; return }
  }

  if (!accountId.value) return

  const payload: LotSaleRequest = {
    buyerName: f.buyerName.trim(),
    saleDate: f.saleDate,
    pricePerKg: Number(f.pricePerKg),
    notes: f.notes || undefined,
    trucks: f.trucks.map(t => ({
      truckPlate: t.truckPlate.toUpperCase().trim(),
      quantityKg: Number(t.quantityKg),
      notes: t.notes || undefined,
    }))
  }

  savingSale.value = true
  try {
    await tradingService.createSale(accountId.value, lotId.value, payload)
    showSaleModal.value = false
    await loadLot()
  } catch (e: any) {
    saleError.value = e?.response?.data?.message ?? 'Erro ao registrar venda.'
  } finally {
    savingSale.value = false
  }
}

async function confirmDeleteSale() {
  if (!accountId.value || !deletingSaleId.value) return
  try {
    await tradingService.deleteSale(accountId.value, lotId.value, deletingSaleId.value)
    deletingSaleId.value = null
    await loadLot()
  } catch {
    error.value = 'Erro ao remover venda.'
    deletingSaleId.value = null
  }
}

const saleTrucksTotal = (trucks: { quantityKg: number }[]) =>
  trucks.reduce((sum, t) => sum + Number(t.quantityKg), 0)
</script>

<template>
  <div class="page-container">
    <!-- Cabeçalho -->
    <div class="page-header">
      <button class="back-btn" @click="router.push({ name: 'trader-lots' })">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Lotes de Compra
      </button>
    </div>

    <div v-if="loading" class="loading-state"><div class="spinner" /></div>
    <div v-else-if="error" class="empty-state"><p>{{ error }}</p></div>

    <template v-else-if="lot">
      <!-- Título e status -->
      <div class="lot-header">
        <div>
          <h1 class="page-title">{{ lot.supplierName }}</h1>
          <p class="page-subtitle">
            Compra em {{ formatDate(lot.purchaseDate) }}
            <span v-if="lot.supplierCity"> · {{ lot.supplierCity }}</span>
          </p>
        </div>
        <div class="header-actions">
          <span class="lot-status" :class="`lot-status--${lot.status.toLowerCase()}`">
            {{ lot.status === 'OPEN' ? 'Em aberto' : 'Encerrado' }}
          </span>
          <button class="btn-icon" title="Editar lote" @click="router.push({ name: 'trader-lot-edit', params: { lotId: lot.id } })">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>
      </div>

      <!-- KPIs do lote -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-card__label">Comprado</span>
          <span class="kpi-card__value">{{ kg(lot.totalPurchasedKg) }}</span>
          <span class="kpi-card__sub">{{ lot.purchaseTrucks.length }} caminhão{{ lot.purchaseTrucks.length !== 1 ? 'ões' : '' }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-card__label">Preço de compra</span>
          <span class="kpi-card__value">{{ currency(lot.pricePerKg) }}/Kg</span>
          <span class="kpi-card__sub">Custo total: {{ currency(lot.totalCost) }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-card__label">Vendido</span>
          <span class="kpi-card__value">{{ kg(lot.totalSoldKg) }}</span>
          <span class="kpi-card__sub">Receita: {{ currency(lot.totalRevenue) }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-card__label">Restante</span>
          <span class="kpi-card__value" :class="{ 'kpi-card__value--warn': lot.remainingKg > 0 }">{{ kg(lot.remainingKg) }}</span>
        </div>
        <div class="kpi-card kpi-card--highlight" :class="lot.grossMargin >= 0 ? 'kpi-card--positive' : 'kpi-card--negative'">
          <span class="kpi-card__label">Margem Bruta</span>
          <span class="kpi-card__value" :class="lot.grossMargin >= 0 ? 'kpi-card__value--positive' : 'kpi-card__value--negative'">
            {{ currency(lot.grossMargin) }}
          </span>
        </div>
      </div>

      <!-- Barra de progresso -->
      <div class="progress-section">
        <div class="progress-bar">
          <div
            class="progress-bar__fill"
            :style="{ width: lot.totalPurchasedKg > 0 ? `${Math.min((lot.totalSoldKg / lot.totalPurchasedKg) * 100, 100)}%` : '0%' }"
          />
        </div>
        <span class="progress-label">
          {{ lot.totalPurchasedKg > 0 ? Math.round((lot.totalSoldKg / lot.totalPurchasedKg) * 100) : 0 }}% do lote vendido
        </span>
      </div>

      <!-- Caminhões de compra -->
      <div class="section-card">
        <h2 class="section-title">Caminhões de Recebimento</h2>
        <div class="trucks-table">
          <div class="trucks-table__header">
            <span>Placa</span>
            <span>Quantidade</span>
            <span>Obs.</span>
          </div>
          <div v-for="truck in lot.purchaseTrucks" :key="truck.id" class="trucks-table__row">
            <span class="truck-plate">{{ truck.truckPlate }}</span>
            <span>{{ kg(truck.quantityKg) }}</span>
            <span class="text-muted">{{ truck.notes ?? '—' }}</span>
          </div>
        </div>
      </div>

      <!-- Vendas -->
      <div class="section-card">
        <div class="section-header">
          <h2 class="section-title">Vendas deste Lote</h2>
          <button
            v-if="lot.status === 'OPEN'"
            class="btn btn--primary"
            @click="openSaleModal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Registrar Venda
          </button>
        </div>

        <div v-if="lot.sales.length === 0" class="empty-sales">
          <p>Nenhuma venda registrada neste lote.</p>
        </div>

        <div v-else class="sales-list">
          <div v-for="sale in lot.sales" :key="sale.id" class="sale-card">
            <div class="sale-card__header">
              <div class="sale-card__buyer-info">
                <span class="sale-card__buyer">{{ sale.buyerName }}</span>
                <span class="sale-card__date">{{ formatDate(sale.saleDate) }}</span>
              </div>
              <div class="sale-card__summary">
                <span class="sale-card__total-kg">{{ kg(saleTrucksTotal(sale.trucks)) }}</span>
                <span class="sale-card__revenue">{{ currency(sale.totalRevenue) }}</span>
              </div>
              <button
                class="btn-icon btn-icon--danger"
                title="Remover venda"
                @click="() => { deletingSaleId = sale.id; deletingSaleName = sale.buyerName }"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              </button>
            </div>

            <!-- Caminhões da venda -->
            <div class="sale-trucks">
              <div v-for="truck in sale.trucks" :key="truck.id" class="sale-truck-row">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                <span class="truck-plate">{{ truck.truckPlate }}</span>
                <span class="truck-qty">{{ kg(truck.quantityKg) }}</span>
                <span v-if="truck.notes" class="text-muted">{{ truck.notes }}</span>
              </div>
            </div>

            <div class="sale-card__price-info">
              {{ currency(sale.pricePerKg) }}/Kg
              <span v-if="sale.notes" class="text-muted"> · {{ sale.notes }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>

  <!-- Modal de nova venda -->
  <div v-if="showSaleModal" class="modal-overlay" @click.self="showSaleModal = false">
    <div class="modal">
      <div class="modal__header">
        <h2 class="modal__title">Registrar Venda</h2>
        <button class="modal__close" @click="showSaleModal = false">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="modal__body">
        <div v-if="saleError" class="error-banner">{{ saleError }}</div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Comprador *</label>
            <input v-model="saleForm.buyerName" type="text" class="form-input" placeholder="Nome do comprador" />
          </div>
          <div class="form-group">
            <label class="form-label">Data da venda *</label>
            <input v-model="saleForm.saleDate" type="date" class="form-input" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Preço por Kg (R$) *</label>
          <input v-model="saleForm.pricePerKg" type="number" step="0.0001" min="0" class="form-input" placeholder="0,0000" />
        </div>

        <!-- Caminhões da venda -->
        <div class="sale-trucks-section">
          <div class="section-header">
            <span class="form-label">Caminhões de entrega *</span>
            <button class="btn btn--secondary btn--sm" @click="addSaleTruck">+ Caminhão</button>
          </div>

          <div v-for="(truck, index) in saleForm.trucks" :key="truck._key" class="truck-modal-row">
            <span class="truck-number">{{ index + 1 }}</span>
            <input
              v-model="truck.truckPlate"
              type="text"
              class="form-input form-input--plate"
              placeholder="Placa"
              maxlength="10"
              @input="truck.truckPlate = truck.truckPlate.toUpperCase()"
            />
            <input v-model="truck.quantityKg" type="number" step="0.01" min="0" class="form-input" placeholder="Kg" />
            <button
              v-if="saleForm.trucks.length > 1"
              class="btn-icon btn-icon--danger btn-icon--sm"
              @click="removeSaleTruck(index)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Observações</label>
          <input v-model="saleForm.notes" type="text" class="form-input" placeholder="Opcional" />
        </div>
      </div>

      <div class="modal__footer">
        <button class="btn btn--secondary" @click="showSaleModal = false">Cancelar</button>
        <button class="btn btn--primary" :disabled="savingSale" @click="submitSale">
          {{ savingSale ? 'Salvando...' : 'Registrar venda' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Modal exclusão de venda -->
  <div v-if="deletingSaleId" class="modal-overlay" @click.self="deletingSaleId = null">
    <div class="modal modal--sm">
      <div class="modal__header">
        <h2 class="modal__title">Remover Venda</h2>
      </div>
      <div class="modal__body">
        <p>Remover a venda para <strong>{{ deletingSaleName }}</strong>? O estoque do lote será atualizado automaticamente.</p>
      </div>
      <div class="modal__footer">
        <button class="btn btn--secondary" @click="deletingSaleId = null">Cancelar</button>
        <button class="btn btn--danger" @click="confirmDeleteSale">Remover</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container { padding: 2rem 1.5rem; max-width: 860px; margin: 0 auto; }

.page-header { margin-bottom: 1rem; }

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

.lot-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.page-title { font-size: 1.75rem; font-weight: 700; color: var(--color-text); letter-spacing: -0.02em; line-height: 1.2; margin: 0 0 0.25rem; }
.page-subtitle { font-size: 0.875rem; color: var(--color-text-muted); margin: 0; }

.header-actions { display: flex; align-items: center; gap: 0.625rem; }

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

/* KPIs */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.875rem;
  margin-bottom: 1.25rem;
}

.kpi-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem 1.125rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  box-shadow: var(--shadow-card);
}

.kpi-card--highlight.kpi-card--positive { background: var(--color-primary-light); border-color: var(--color-primary); }
.kpi-card--highlight.kpi-card--negative { background: var(--color-error-light); border-color: var(--color-error); }

.kpi-card__label { font-size: 0.72rem; font-weight: 500; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
.kpi-card__value { font-size: 1.25rem; font-weight: 700; color: var(--color-text); letter-spacing: -0.01em; }
.kpi-card__value--positive { color: var(--color-primary); }
.kpi-card__value--negative { color: var(--color-error); }
.kpi-card__value--warn { color: var(--color-warning, #b45309); }
.kpi-card__sub { font-size: 0.72rem; color: var(--color-text-muted); }

/* Progresso */
.progress-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.progress-bar { flex: 1; height: 8px; background: var(--color-border); border-radius: 4px; overflow: hidden; }
.progress-bar__fill { height: 100%; background: var(--color-primary); border-radius: 4px; transition: width 0.4s; }
.progress-label { font-size: 0.8rem; color: var(--color-text-muted); white-space: nowrap; }

/* Seções */
.section-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  margin-bottom: 1.25rem;
  box-shadow: var(--shadow-card);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.section-title { font-size: 1rem; font-weight: 700; color: var(--color-text); letter-spacing: -0.01em; margin: 0; }

/* Tabela caminhões compra */
.trucks-table { border: 1px solid var(--color-border); border-radius: var(--radius-sm); overflow: hidden; }

.trucks-table__header {
  display: grid;
  grid-template-columns: 120px 1fr 1fr;
  padding: 0.5rem 0.875rem;
  background: var(--color-surface);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.trucks-table__row {
  display: grid;
  grid-template-columns: 120px 1fr 1fr;
  padding: 0.625rem 0.875rem;
  border-top: 1px solid var(--color-border);
  font-size: 0.875rem;
  color: var(--color-text);
}

.truck-plate { font-weight: 700; letter-spacing: 0.04em; font-family: monospace; }
.text-muted { color: var(--color-text-muted); }

/* Vendas */
.empty-sales { color: var(--color-text-muted); font-size: 0.875rem; text-align: center; padding: 1.5rem; }

.sales-list { display: flex; flex-direction: column; gap: 0.875rem; }

.sale-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 1rem 1.125rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.sale-card__header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.sale-card__buyer-info { flex: 1; display: flex; flex-direction: column; gap: 0.125rem; }
.sale-card__buyer { font-weight: 700; font-size: 0.95rem; color: var(--color-text); }
.sale-card__date { font-size: 0.78rem; color: var(--color-text-muted); }

.sale-card__summary { display: flex; flex-direction: column; align-items: flex-end; gap: 0.125rem; }
.sale-card__total-kg { font-size: 0.875rem; font-weight: 600; color: var(--color-text); }
.sale-card__revenue { font-size: 1rem; font-weight: 700; color: var(--color-primary); }

.sale-trucks { display: flex; flex-direction: column; gap: 0.3rem; padding-left: 0.5rem; border-left: 2px solid var(--color-border); }

.sale-truck-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.truck-qty { font-weight: 600; color: var(--color-text); }

.sale-card__price-info { font-size: 0.8rem; color: var(--color-text-muted); }

/* Modal de nova venda */
.sale-trucks-section { display: flex; flex-direction: column; gap: 0.625rem; }

.truck-modal-row {
  display: grid;
  grid-template-columns: 24px 120px 1fr auto;
  align-items: center;
  gap: 0.5rem;
}

.truck-number {
  width: 24px;
  height: 24px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: 50%;
  font-size: 0.72rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Utilitários comuns */
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

.btn-icon--sm { width: 26px; height: 26px; }
.btn-icon--danger:hover { background: var(--color-error-light); color: var(--color-error); border-color: var(--color-error); }

.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
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
.form-input--plate { text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 500; padding: 1rem; }

.modal {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal--sm { max-width: 380px; }

.modal__header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--color-border); }
.modal__title { font-size: 1rem; font-weight: 700; color: var(--color-text); margin: 0; }
.modal__close { background: none; border: none; cursor: pointer; color: var(--color-text-muted); padding: 0.25rem; display: flex; align-items: center; }
.modal__body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.modal__footer { padding: 1rem 1.5rem; border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; gap: 0.75rem; }

.error-banner { background: var(--color-error-light); color: var(--color-error); border: 1px solid var(--color-error); border-radius: var(--radius-sm); padding: 0.625rem 0.875rem; font-size: 0.85rem; }

.loading-state { display: flex; justify-content: center; padding: 4rem; }
.spinner { width: 32px; height: 32px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state { text-align: center; padding: 4rem; color: var(--color-text-muted); }

/* Responsivo */
@media (max-width: 900px) {
  .kpi-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 768px) {
  .page-container { padding: 1.25rem 1rem; }
  .lot-header { flex-direction: column; }
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .trucks-table__header, .trucks-table__row { grid-template-columns: 100px 1fr; }
  .trucks-table__header span:last-child, .trucks-table__row span:last-child { display: none; }
  .form-row { grid-template-columns: 1fr; }
  .truck-modal-row { grid-template-columns: 24px 1fr 1fr auto; }
  .sale-card__header { flex-wrap: wrap; }
}

@media (max-width: 480px) {
  .kpi-grid { grid-template-columns: 1fr 1fr; }
}
</style>
