<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAccountStore } from '@/stores/accountStore'
import { useTraderFormatters } from '@/composables/useTraderFormatters'
import tradingService from '@/services/tradingService'
import type { TradingSupplierResponse, PurchaseTruckRequest } from '@/services/tradingService'

const router       = useRouter()
const route        = useRoute()
const accountStore = useAccountStore()
const { currency, kg } = useTraderFormatters()

// Conta ativa — computed para reagir a mudanças de conta durante a sessão
const accountId = computed(() => accountStore.selectedAccount?.id)

const lotId     = computed(() => route.params.lotId as string | undefined)
const isEditing = computed(() => !!lotId.value)

// ── Tipo local com chave estável para cada linha de caminhão ──────────────────
// Usar índice como :key em lista mutável causa bugs de DOM quando itens são removidos
interface TruckRow extends PurchaseTruckRequest { _key: number }
let _truckKeyCounter = 0
const makeTruckRow = (): TruckRow => ({ truckPlate: '', quantityKg: 0, notes: '', _key: ++_truckKeyCounter })

// Estado do formulário
const supplierId   = ref('')
const purchaseDate = ref('')
const pricePerKg   = ref<number | ''>('')
const notes        = ref('')
const trucks       = ref<TruckRow[]>([makeTruckRow()])

// Dados auxiliares
const suppliers   = ref<TradingSupplierResponse[]>([])
const loading     = ref(false)
const loadingData = ref(true)
const error       = ref('')

// finally garante que loadingData sempre encerra, mesmo se loadSuppliers() lançar erro
onMounted(async () => {
  try {
    await loadSuppliers()
    if (isEditing.value) await loadLot()
  } finally {
    loadingData.value = false
  }
})

async function loadSuppliers() {
  if (!accountId.value) return
  const { data } = await tradingService.listSuppliers(accountId.value)
  suppliers.value = data.data
}

async function loadLot() {
  if (!accountId.value || !lotId.value) return
  try {
    const { data } = await tradingService.getLot(accountId.value, lotId.value)
    const lot = data.data
    supplierId.value   = lot.supplierId
    purchaseDate.value = lot.purchaseDate
    pricePerKg.value   = lot.pricePerKg
    notes.value        = lot.notes ?? ''
    // Reconstrói com chave estável para cada caminhão existente
    trucks.value = lot.purchaseTrucks.map(t => ({
      truckPlate: t.truckPlate,
      quantityKg: t.quantityKg,
      notes: t.notes ?? '',
      _key: ++_truckKeyCounter,
    }))
  } catch {
    error.value = 'Erro ao carregar lote para edição.'
  }
}

// Gerenciamento de caminhões
function addTruck() {
  trucks.value.push(makeTruckRow())
}

function removeTruck(index: number) {
  if (trucks.value.length === 1) return
  trucks.value.splice(index, 1)
}

// Totais derivados reativamente — não duplicam estado
const totalKg   = computed(() => trucks.value.reduce((sum, t) => sum + (Number(t.quantityKg) || 0), 0))
const totalCost = computed(() => totalKg.value * (Number(pricePerKg.value) || 0))

// Validação e envio
async function submit() {
  error.value = ''

  if (!supplierId.value)   { error.value = 'Selecione o fornecedor.'; return }
  if (!purchaseDate.value) { error.value = 'Informe a data da compra.'; return }
  if (!pricePerKg.value || Number(pricePerKg.value) <= 0) { error.value = 'Informe o preço por Kg.'; return }

  for (const [i, t] of trucks.value.entries()) {
    if (!t.truckPlate.trim())                             { error.value = `Informe a placa do caminhão ${i + 1}.`; return }
    if (!t.quantityKg || Number(t.quantityKg) <= 0)      { error.value = `Informe o peso do caminhão ${i + 1}.`; return }
  }

  if (!accountId.value) return

  loading.value = true
  const payload = {
    supplierId: supplierId.value,
    purchaseDate: purchaseDate.value,
    pricePerKg: Number(pricePerKg.value),
    notes: notes.value || undefined,
    trucks: trucks.value.map(t => ({
      truckPlate: t.truckPlate.toUpperCase().trim(),
      quantityKg: Number(t.quantityKg),
      notes: t.notes || undefined,
    }))
  }

  try {
    if (isEditing.value && lotId.value) {
      const { data } = await tradingService.updateLot(accountId.value, lotId.value, payload)
      router.push({ name: 'trader-lot-detail', params: { lotId: data.data.id } })
    } else {
      const { data } = await tradingService.createLot(accountId.value, payload)
      router.push({ name: 'trader-lot-detail', params: { lotId: data.data.id } })
    }
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Erro ao salvar lote.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <!-- Cabeçalho -->
    <div class="page-header">
      <button class="back-btn" @click="router.push({ name: 'trader-lots' })">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Lotes de Compra
      </button>
      <h1 class="page-title">{{ isEditing ? 'Editar Lote' : 'Registrar Lote de Compra' }}</h1>
    </div>

    <div v-if="loadingData" class="loading-state"><div class="spinner" /></div>

    <div v-else class="form-layout">
      <!-- Formulário principal -->
      <div class="form-card">
        <h2 class="form-section-title">Dados da Compra</h2>

        <div v-if="error" class="error-banner">{{ error }}</div>

        <div class="form-group">
          <label class="form-label">Fornecedor *</label>
          <select v-model="supplierId" class="form-input form-select">
            <option value="">Selecione um fornecedor...</option>
            <option v-for="s in suppliers" :key="s.id" :value="s.id">
              {{ s.name }}{{ s.city ? ` — ${s.city}` : '' }}
            </option>
          </select>
          <span class="form-hint">
            Não encontrou?
            <button class="link-btn" @click="router.push({ name: 'trader-suppliers' })">Cadastrar fornecedor</button>
          </span>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Data da compra *</label>
            <input v-model="purchaseDate" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Preço por Kg (R$) *</label>
            <input v-model="pricePerKg" type="number" step="0.0001" min="0" class="form-input" placeholder="0,0000" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Observações</label>
          <textarea v-model="notes" class="form-input form-textarea" placeholder="Qualidade da produção, condições de entrega..." />
        </div>
      </div>

      <!-- Caminhões -->
      <div class="form-card">
        <div class="section-header">
          <h2 class="form-section-title">Caminhões de Entrega</h2>
          <button class="btn btn--secondary btn--sm" @click="addTruck">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Adicionar caminhão
          </button>
        </div>

        <div class="trucks-list">
          <div v-for="(truck, index) in trucks" :key="truck._key" class="truck-row">
            <div class="truck-row__number">{{ index + 1 }}</div>
            <div class="truck-row__fields">
              <div class="form-group">
                <label class="form-label">Placa *</label>
                <input
                  v-model="truck.truckPlate"
                  type="text"
                  class="form-input form-input--plate"
                  placeholder="ABC1D23"
                  maxlength="10"
                  @input="truck.truckPlate = truck.truckPlate.toUpperCase()"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Peso (Kg) *</label>
                <input v-model="truck.quantityKg" type="number" step="0.01" min="0" class="form-input" placeholder="0,00" />
              </div>
              <div class="form-group form-group--notes">
                <label class="form-label">Obs.</label>
                <input v-model="truck.notes" type="text" class="form-input" placeholder="Opcional" />
              </div>
            </div>
            <button
              v-if="trucks.length > 1"
              class="btn-icon btn-icon--danger truck-remove-btn"
              title="Remover caminhão"
              @click="removeTruck(index)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Resumo em tempo real -->
      <div class="summary-card">
        <div class="summary-item">
          <span class="summary-label">Total de caminhões</span>
          <span class="summary-value">{{ trucks.length }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Total em Kg</span>
          <span class="summary-value">{{ kg(totalKg) }}</span>
        </div>
        <div class="summary-item summary-item--highlight">
          <span class="summary-label">Custo total estimado</span>
          <span class="summary-value summary-value--cost">{{ currency(totalCost) }}</span>
        </div>
      </div>

      <!-- Botões de ação -->
      <div class="form-actions">
        <button class="btn btn--secondary" @click="router.back()">Cancelar</button>
        <button class="btn btn--primary" :disabled="loading" @click="submit">
          {{ loading ? 'Salvando...' : (isEditing ? 'Salvar alterações' : 'Registrar lote') }}
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

.page-title { font-size: 1.75rem; font-weight: 700; color: var(--color-text); letter-spacing: -0.02em; line-height: 1.2; margin: 0; }

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

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

/* Formulário */
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
.form-select { cursor: pointer; }
.form-textarea { resize: vertical; min-height: 80px; }
.form-input--plate { text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em; }

.form-hint { font-size: 0.78rem; color: var(--color-text-muted); }

.link-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: inherit;
  font-family: inherit;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

/* Caminhões */
.trucks-list { display: flex; flex-direction: column; gap: 0.875rem; }

.truck-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.truck-row__number {
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
  flex-shrink: 0;
  margin-top: 1.75rem;
}

.truck-row__fields {
  flex: 1;
  display: grid;
  grid-template-columns: 120px 1fr 1fr;
  gap: 0.75rem;
}

.form-group--notes { grid-column: span 1; }

.truck-remove-btn { margin-top: 1.75rem; flex-shrink: 0; }

/* Resumo */
.summary-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.25rem 1.5rem;
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.summary-item { display: flex; flex-direction: column; gap: 0.25rem; }
.summary-item--highlight { margin-left: auto; }

.summary-label { font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 500; }
.summary-value { font-size: 1.1rem; font-weight: 700; color: var(--color-text); }
.summary-value--cost { color: var(--color-error); }

/* Ações */
.form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }

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

.btn-icon--danger:hover { background: var(--color-error-light); color: var(--color-error); border-color: var(--color-error); }

.error-banner { background: var(--color-error-light); color: var(--color-error); border: 1px solid var(--color-error); border-radius: var(--radius-sm); padding: 0.625rem 0.875rem; font-size: 0.85rem; }

.loading-state { display: flex; justify-content: center; padding: 4rem; }
.spinner { width: 32px; height: 32px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Responsivo */
@media (max-width: 768px) {
  .page-container { padding: 1.25rem 1rem; }
  .form-row { grid-template-columns: 1fr; }
  .truck-row__fields { grid-template-columns: 1fr 1fr; }
  .form-group--notes { grid-column: span 2; }
  .summary-card { flex-direction: column; gap: 0.875rem; }
  .summary-item--highlight { margin-left: 0; }
  .form-actions { flex-direction: column-reverse; }
  .form-actions .btn { width: 100%; justify-content: center; }
}

@media (max-width: 480px) {
  .truck-row__fields { grid-template-columns: 1fr; }
  .form-group--notes { grid-column: span 1; }
}
</style>
