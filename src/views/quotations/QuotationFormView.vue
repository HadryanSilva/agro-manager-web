<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAccountStore } from '@/stores/accountStore'
import quotationService from '@/services/quotationService'
import farmService from '@/services/farmService'
import type { QuotationRequest } from '@/services/quotationService'
import type { FarmResponse } from '@/services/farmService'

const router       = useRouter()
const route        = useRoute()
const accountStore = useAccountStore()

const quotationId = route.params.quotationId as string | undefined
const isEditing   = computed(() => !!quotationId)
const accountId   = computed(() => accountStore.selectedAccount?.id)

// Quando vindo do botão "+ Fornecedor" do card, o productName chega via query param
// e o campo deve ser bloqueado para evitar alteração acidental
const prefilledProductName = route.query.productName as string | undefined
const isProductNameLocked  = computed(() => !!prefilledProductName && !isEditing.value)

// Campos do formulário
const productName   = ref(prefilledProductName ?? '')
const supplier      = ref('')
const unitPrice     = ref<number | ''>('')
const quantity      = ref<number | ''>('')
const unit          = ref('')
const quotationDate = ref('')
const notes         = ref('')
const farmId        = ref('')

// Estado
const farms           = ref<FarmResponse[]>([])
const suggestions     = ref<string[]>([])
const showSuggestions = ref(false)
const loading         = ref(false)
const loadingData     = ref(false)
const error           = ref('')

// Título dinâmico de acordo com o contexto
const pageTitle = computed(() => {
  if (isEditing.value) return 'Editar cotação'
  if (prefilledProductName) return `Novo fornecedor — ${prefilledProductName}`
  return 'Nova cotação'
})

onMounted(async () => {
  if (!accountId.value) return

  const [farmsRes, suggestionsRes] = await Promise.all([
    farmService.findAll(accountId.value).catch(() => ({ data: { data: [] } })),
    quotationService.getProductSuggestions(accountId.value).catch(() => ({ data: { data: [] } })),
  ])
  farms.value       = farmsRes.data.data
  suggestions.value = suggestionsRes.data.data

  // Em modo edição, carrega dados da cotação existente
  if (isEditing.value && quotationId) {
    loadingData.value = true
    try {
      const { data } = await quotationService.listGrouped(accountId.value)
      for (const group of data.data) {
        const found = group.quotations.find(q => q.id === quotationId)
        if (found) {
          productName.value   = found.productName
          supplier.value      = found.supplier
          unitPrice.value     = found.unitPrice
          quantity.value      = found.quantity
          unit.value          = found.unit ?? ''
          quotationDate.value = found.quotationDate
          notes.value         = found.notes ?? ''
          farmId.value        = found.farmId ?? ''
          break
        }
      }
    } catch {
      error.value = 'Erro ao carregar cotação.'
    } finally {
      loadingData.value = false
    }
  }
})

const filteredSuggestions = computed(() =>
  suggestions.value.filter(s =>
    s.toLowerCase().includes(productName.value.toLowerCase()) &&
    s.toLowerCase() !== productName.value.toLowerCase()
  ).slice(0, 6)
)

function selectSuggestion(s: string) {
  productName.value     = s
  showSuggestions.value = false
}

function hideSuggestions() {
  setTimeout(() => { showSuggestions.value = false }, 150)
}

async function handleSubmit() {
  if (!accountId.value || loading.value) return
  loading.value = true
  error.value   = ''

  const payload: QuotationRequest = {
    productName:   productName.value.trim(),
    supplier:      supplier.value.trim(),
    unitPrice:     Number(unitPrice.value),
    quantity:      Number(quantity.value),
    unit:          unit.value.trim() || undefined,
    quotationDate: quotationDate.value,
    notes:         notes.value.trim() || undefined,
    farmId:        farmId.value || null,
  }

  try {
    if (isEditing.value && quotationId) {
      await quotationService.update(accountId.value, quotationId, payload)
    } else {
      await quotationService.create(accountId.value, payload)
    }
    router.push({ name: 'quotations' })
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Erro ao salvar cotação.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="quotation-form">

    <button class="back-btn" @click="router.push({ name: 'quotations' })">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2">
        <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
      </svg>
      Cotações
    </button>

    <h1 class="quotation-form__title">{{ pageTitle }}</h1>

    <div v-if="loadingData" class="loading-state"><span class="spinner" /></div>

    <form v-else @submit.prevent="handleSubmit" novalidate>

      <div v-if="error" class="error-banner">{{ error }}</div>

      <!-- Produto -->
      <div class="form-section">
        <h2 class="form-section__title">Insumo</h2>

        <div class="form-field" style="position: relative">
          <label class="form-label">
            Nome do produto *
            <!-- Indicação visual quando o campo está bloqueado -->
            <span v-if="isProductNameLocked" class="locked-badge">fixado</span>
          </label>

          <!-- Campo bloqueado: exibe como leitura, não como input editável -->
          <div v-if="isProductNameLocked" class="form-input form-input--locked">
            {{ productName }}
          </div>

          <!-- Campo editável: modo criação livre ou edição -->
          <div v-else style="position: relative">
            <input
              v-model="productName"
              type="text"
              class="form-input"
              placeholder="Ex: Semente de melancia, Fertilizante NPK..."
              required
              autocomplete="off"
              @focus="showSuggestions = true"
              @blur="hideSuggestions"
            />
            <div v-if="showSuggestions && filteredSuggestions.length > 0" class="suggestions">
              <button
                v-for="s in filteredSuggestions"
                :key="s"
                type="button"
                class="suggestion-item"
                @mousedown.prevent="selectSuggestion(s)"
              >
                {{ s }}
              </button>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field form-field--grow">
            <label class="form-label">Lavoura (opcional)</label>
            <select v-model="farmId" class="form-input">
              <option value="">Cotação geral da conta</option>
              <option v-for="farm in farms" :key="farm.id" :value="farm.id">
                {{ farm.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Fornecedor e preço -->
      <div class="form-section">
        <h2 class="form-section__title">Fornecedor e valores</h2>

        <div class="form-field">
          <label class="form-label">Fornecedor *</label>
          <input
            v-model="supplier"
            type="text"
            class="form-input"
            placeholder="Nome do fornecedor ou loja"
            required
          />
        </div>

        <div class="form-row">
          <div class="form-field form-field--grow">
            <label class="form-label">Preço unitário (R$) *</label>
            <input
              v-model="unitPrice"
              type="number"
              class="form-input"
              placeholder="0,00"
              step="0.01"
              min="0.01"
              required
            />
          </div>
          <div class="form-field form-field--grow">
            <label class="form-label">Quantidade *</label>
            <input
              v-model="quantity"
              type="number"
              class="form-input"
              placeholder="0"
              step="0.001"
              min="0.001"
              required
            />
          </div>
          <div class="form-field" style="min-width: 100px">
            <label class="form-label">Unidade</label>
            <input
              v-model="unit"
              type="text"
              class="form-input"
              placeholder="kg, L, sc..."
            />
          </div>
        </div>

        <div v-if="unitPrice && quantity" class="total-preview">
          <span>Total estimado:</span>
          <strong>
            {{ Number(Number(unitPrice) * Number(quantity)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
          </strong>
        </div>
      </div>

      <!-- Data e observações -->
      <div class="form-section">
        <h2 class="form-section__title">Detalhes</h2>

        <div class="form-field">
          <label class="form-label">Data da cotação *</label>
          <input
            v-model="quotationDate"
            type="date"
            class="form-input"
            required
          />
        </div>

        <div class="form-field">
          <label class="form-label">Observações</label>
          <textarea
            v-model="notes"
            class="form-input form-input--textarea"
            placeholder="Condições de pagamento, prazo de entrega, etc."
            rows="3"
          />
        </div>
      </div>

      <div class="form-actions">
        <button
          type="button"
          class="btn-secondary"
          :disabled="loading"
          @click="router.push({ name: 'quotations' })"
        >Cancelar</button>
        <button
          type="submit"
          class="btn-primary"
          :disabled="loading || !productName || !supplier || !unitPrice || !quantity || !quotationDate"
        >
          <span v-if="loading" class="spinner spinner--sm" />
          {{ isEditing ? 'Salvar alterações' : 'Registrar cotação' }}
        </button>
      </div>

    </form>
  </div>
</template>

<style scoped>
.quotation-form { padding: 2rem 1.5rem; max-width: 700px; margin: 0 auto; }

.back-btn {
  display: inline-flex; align-items: center; gap: 0.375rem; background: none; border: none;
  font-family: inherit; font-size: 0.85rem; font-weight: 500; color: var(--color-text-muted);
  cursor: pointer; padding: 0; margin-bottom: 0.75rem; transition: color 0.15s;
}
.back-btn:hover { color: var(--color-primary); }

.quotation-form__title {
  font-family: 'DM Serif Display', serif; font-size: 1.75rem; font-weight: 400; color: var(--color-text);
  letter-spacing: -0.02em; margin-bottom: 1.75rem;
}

.loading-state { display: flex; justify-content: center; padding: 4rem 0; }
.spinner {
  display: inline-block; width: 28px; height: 28px;
  border: 2.5px solid var(--color-border); border-top-color: var(--color-primary);
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
.spinner--sm { width: 16px; height: 16px; border-width: 2px; }
@keyframes spin { to { transform: rotate(360deg); } }

.error-banner {
  background: var(--color-error-light); color: var(--color-error);
  border: 1px solid #fecaca; border-radius: var(--radius-sm);
  padding: 0.75rem 1rem; font-size: 0.875rem; margin-bottom: 1rem;
}

.form-section {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-md); padding: 1.375rem; margin-bottom: 1rem;
  display: flex; flex-direction: column; gap: 1rem;
}

.form-section__title {
  font-size: 0.8125rem; font-weight: 600; color: var(--color-text-muted);
  text-transform: uppercase; letter-spacing: 0.04em;
}

.form-row { display: flex; gap: 1rem; flex-wrap: wrap; }
.form-field { display: flex; flex-direction: column; gap: 0.375rem; }
.form-field--grow { flex: 1; min-width: 150px; }
.form-label {
  font-size: 0.8125rem; font-weight: 600; color: var(--color-text);
  display: flex; align-items: center; gap: 0.5rem;
}

.form-input {
  padding: 0.625rem 0.875rem; background: var(--color-surface);
  border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  font-family: inherit; font-size: 0.9rem; color: var(--color-text);
  width: 100%; box-sizing: border-box; transition: border-color 0.15s, box-shadow 0.15s;
}
.form-input:focus { outline: none; border-color: var(--color-border-focus); box-shadow: 0 0 0 3px rgba(27, 58, 45, 0.1); background: var(--color-card); }
.form-input--textarea { resize: vertical; min-height: 80px; }

/* Campo bloqueado — produto vindo do query param */
.form-input--locked {
  background: var(--color-background);
  border-style: dashed;
  color: var(--color-text);
  font-weight: 600;
  cursor: not-allowed;
  opacity: 0.85;
}

/* Badge "fixado" ao lado do label */
.locked-badge {
  display: inline-block; font-size: 0.7rem; font-weight: 600;
  padding: 0.1rem 0.45rem; border-radius: 999px;
  background: var(--color-primary-light); color: var(--color-primary);
}

/* Autocomplete */
.suggestions {
  position: absolute; top: calc(100% + 2px); left: 0; right: 0;
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  z-index: 20; overflow: hidden;
}
.suggestion-item {
  display: block; width: 100%; padding: 0.5rem 0.875rem; background: none; border: none;
  font-family: inherit; font-size: 0.875rem; color: var(--color-text);
  text-align: left; cursor: pointer; transition: background 0.12s;
}
.suggestion-item:hover { background: var(--color-primary-light); color: var(--color-primary); }

/* Preview de total */
.total-preview {
  display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem;
  color: var(--color-text-muted); padding: 0.625rem 0.875rem;
  background: var(--color-background); border-radius: var(--radius-sm);
  border: 1px dashed var(--color-border);
}
.total-preview strong { font-size: 1rem; color: var(--color-text); }

/* Ações */
.form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }

.btn-primary {
  display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1.5rem;
  background: var(--color-primary); color: #fff; border: none;
  border-radius: var(--radius-sm); font-family: inherit; font-size: 0.9rem;
  font-weight: 600; cursor: pointer; transition: opacity 0.15s;
}
.btn-primary:disabled { opacity: 0.5; cursor: default; }
.btn-primary:not(:disabled):hover { opacity: 0.85; }

.btn-secondary {
  padding: 0.65rem 1.25rem; border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); background: var(--color-card); font-family: inherit;
  font-size: 0.9rem; font-weight: 500; color: var(--color-text-muted); cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.btn-secondary:not(:disabled):hover { border-color: var(--color-primary); color: var(--color-primary); }

@media (max-width: 640px) {
  .quotation-form { padding: 1.25rem 1rem; }
  .form-row { flex-direction: column; }
  .form-actions { flex-direction: column-reverse; }
  .btn-primary, .btn-secondary { width: 100%; justify-content: center; }
}
</style>