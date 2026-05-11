<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAccountStore } from '@/stores/accountStore'
import expenseService from '@/services/expenseService'
import type { ExpenseRequest, ExpenseCategory } from '@/services/expenseService'

const router       = useRouter()
const route        = useRoute()
const accountStore = useAccountStore()

const expenseId = route.params.expenseId as string | undefined
const isEditing = computed(() => !!expenseId)
const accountId = computed(() => accountStore.selectedAccount?.id)

// ── Estado do formulário ────────────────────────────────────────
const description    = ref('')
const category       = ref<ExpenseCategory>('INSUMO')
const value          = ref<number | ''>('')
const competenceDate = ref('')
const paymentDate    = ref('')
const notes          = ref('')

const loading     = ref(false)
const loadingData = ref(false)
const error       = ref('')

const isPaid = computed(() => !!paymentDate.value)

onMounted(async () => {
  if (isEditing.value && accountId.value && expenseId) {
    loadingData.value = true
    try {
      const { data } = await expenseService.findGeneralById(accountId.value, expenseId)
      const e = data.data
      description.value    = e.description
      category.value       = e.category
      value.value          = e.value
      competenceDate.value = e.competenceDate
      paymentDate.value    = e.paymentDate ?? ''
      notes.value          = e.notes ?? ''
    } catch {
      error.value = 'Erro ao carregar despesa.'
    } finally {
      loadingData.value = false
    }
  }
})

async function handleSubmit() {
  if (!accountId.value || loading.value) return
  loading.value = true
  error.value   = ''

  const payload: ExpenseRequest = {
    description:    description.value,
    category:       category.value,
    value:          Number(value.value),
    competenceDate: competenceDate.value,
    paymentDate:    paymentDate.value || null,
    notes:          notes.value || undefined,
    farmId:         null,  // despesa geral — sem lavoura
  }

  try {
    if (isEditing.value && expenseId) {
      await expenseService.updateGeneral(accountId.value, expenseId, payload)
    } else {
      await expenseService.createGeneral(accountId.value, payload)
    }
    router.push({ name: 'transactions' })
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Erro ao salvar despesa.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="expense-form">

    <!-- Cabeçalho -->
    <button
      class="back-btn"
      @click="router.push({ name: 'transactions' })"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2">
        <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
      </svg>
      Transações
    </button>

    <h1 class="expense-form__title">
      {{ isEditing ? 'Editar despesa geral' : 'Nova despesa geral' }}
    </h1>
    <p class="expense-form__subtitle">Despesa da conta — não vinculada a uma lavoura específica</p>

    <div v-if="loadingData" class="loading-state"><span class="spinner" /></div>

    <form v-else @submit.prevent="handleSubmit" novalidate>
      <div v-if="error" class="error-banner">{{ error }}</div>

      <!-- Descrição -->
      <div class="form-section">
        <div class="form-field">
          <label class="form-label">Descrição *</label>
          <input
            v-model="description"
            type="text"
            class="form-input"
            placeholder="Ex: Manutenção de maquinário, Combustível..."
            maxlength="200"
            required
          />
        </div>
      </div>

      <!-- Categoria e Valor -->
      <div class="form-section">
        <h2 class="form-section__title">Classificação</h2>
        <div class="form-row">
          <div class="form-field">
            <label class="form-label">Categoria *</label>
            <div class="category-toggle">
              <button
                type="button"
                class="category-btn"
                :class="{ 'category-btn--active category-btn--insumo': category === 'INSUMO' }"
                @click="category = 'INSUMO'"
              >Insumo</button>
              <button
                type="button"
                class="category-btn"
                :class="{ 'category-btn--active category-btn--servico': category === 'SERVICO' }"
                @click="category = 'SERVICO'"
              >Serviço</button>
            </div>
          </div>

          <div class="form-field form-field--grow">
            <label class="form-label">Valor (R$) *</label>
            <input
              v-model="value"
              type="number"
              class="form-input"
              placeholder="0,00"
              step="0.01"
              min="0.01"
              required
            />
          </div>
        </div>
      </div>

      <!-- Datas -->
      <div class="form-section">
        <h2 class="form-section__title">Datas</h2>
        <div class="form-row">
          <div class="form-field form-field--grow">
            <label class="form-label">Data de competência *</label>
            <input v-model="competenceDate" type="date" class="form-input" required />
            <span class="form-hint">Quando a despesa foi incorrida</span>
          </div>

          <div class="form-field form-field--grow">
            <label class="form-label">
              Data de pagamento
              <span v-if="isPaid" class="label-badge label-badge--paid">Pago</span>
              <span v-else class="label-badge label-badge--pending">A pagar</span>
            </label>
            <input v-model="paymentDate" type="date" class="form-input" />
            <span class="form-hint">Deixe em branco se ainda não foi pago</span>
          </div>
        </div>
      </div>

      <!-- Observações -->
      <div class="form-section">
        <div class="form-field">
          <label class="form-label">Observações</label>
          <textarea
            v-model="notes"
            class="form-input form-input--textarea"
            placeholder="Informações adicionais..."
            rows="3"
          />
        </div>
      </div>

      <!-- Ações -->
      <div class="form-actions">
        <button
          type="button"
          class="btn-secondary"
          :disabled="loading"
          @click="router.push({ name: 'transactions' })"
        >Cancelar</button>
        <button
          type="submit"
          class="btn-primary"
          :disabled="loading || !description || !value || !competenceDate"
        >
          <span v-if="loading" class="spinner spinner--sm" />
          {{ isEditing ? 'Salvar alterações' : 'Registrar despesa' }}
        </button>
      </div>
    </form>

  </div>
</template>

<style scoped>
.expense-form { padding: 2rem 1.5rem; max-width: 720px; margin: 0 auto; }

.back-btn {
  display: inline-flex; align-items: center; gap: 0.375rem;
  background: none; border: none; font-family: inherit;
  font-size: 0.85rem; font-weight: 500; color: var(--color-text-muted);
  cursor: pointer; padding: 0; margin-bottom: 0.75rem; transition: color 0.15s;
}
.back-btn:hover { color: var(--color-primary); }

.expense-form__title {
  font-family: 'DM Serif Display', serif; font-size: 1.75rem; font-weight: 400; color: var(--color-text); letter-spacing: -0.02em;
}
.expense-form__subtitle {
  margin-top: 0.2rem; font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 1.75rem;
}

.error-banner {
  background: var(--color-error-light); color: var(--color-error);
  border: 1px solid #fecaca; border-radius: var(--radius-sm);
  padding: 0.75rem 1rem; font-size: 0.875rem; margin-bottom: 1.25rem;
}

.loading-state { display: flex; justify-content: center; padding: 4rem 0; }
.spinner {
  display: inline-block; width: 28px; height: 28px;
  border: 2.5px solid var(--color-border); border-top-color: var(--color-primary);
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
.spinner--sm { width: 16px; height: 16px; border-width: 2px; }
@keyframes spin { to { transform: rotate(360deg); } }

.form-section {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1rem;
  display: flex; flex-direction: column; gap: 1rem;
}
.form-section__title {
  font-size: 0.8125rem; font-weight: 600; color: var(--color-text-muted);
  letter-spacing: 0.04em; text-transform: uppercase;
}
.form-row { display: flex; gap: 1rem; flex-wrap: wrap; }
.form-field { display: flex; flex-direction: column; gap: 0.375rem; }
.form-field--grow { flex: 1; min-width: 180px; }
.form-label { font-size: 0.8125rem; font-weight: 600; color: var(--color-text); display: flex; align-items: center; gap: 0.5rem; }
.form-input {
  padding: 0.625rem 0.875rem; background: var(--color-surface);
  border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  font-family: inherit; font-size: 0.9rem; color: var(--color-text);
  transition: border-color 0.15s, box-shadow 0.15s; width: 100%; box-sizing: border-box;
}
.form-input:focus { outline: none; border-color: var(--color-border-focus); box-shadow: 0 0 0 3px rgba(27, 58, 45, 0.1); background: var(--color-card); }
.form-input--textarea { resize: vertical; min-height: 80px; }
.form-hint { font-size: 0.75rem; color: var(--color-text-muted); }

.category-toggle { display: flex; gap: 0.5rem; }
.category-btn {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.55rem 1rem; border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); background: var(--color-background);
  font-family: inherit; font-size: 0.875rem; font-weight: 500;
  color: var(--color-text-muted); cursor: pointer; transition: all 0.15s;
}
.category-btn--insumo  { border-color: var(--color-success); color: var(--color-success); background: var(--color-success-light); }
.category-btn--servico { border-color: var(--color-info);    color: var(--color-info);    background: var(--color-info-light); }

.label-badge { padding: 0.15rem 0.5rem; border-radius: 12px; font-size: 0.7rem; font-weight: 600; }
.label-badge--paid    { background: var(--color-success-light); color: var(--color-success); }
.label-badge--pending { background: var(--color-warning-light); color: var(--color-warning); }

.form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
.btn-primary {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.65rem 1.5rem; background: var(--color-primary); color: #fff;
  border: none; border-radius: var(--radius-sm); font-family: inherit;
  font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: opacity 0.15s;
}
.btn-primary:disabled { opacity: 0.5; cursor: default; }
.btn-primary:not(:disabled):hover { opacity: 0.85; }
.btn-secondary {
  padding: 0.65rem 1.25rem; border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); background: var(--color-card);
  font-family: inherit; font-size: 0.9rem; font-weight: 500;
  color: var(--color-text-muted); cursor: pointer; transition: border-color 0.15s, color 0.15s;
}
.btn-secondary:not(:disabled):hover { border-color: var(--color-primary); color: var(--color-primary); }

@media (max-width: 640px) {
  .expense-form { padding: 1.25rem 1rem; }
  .form-row { flex-direction: column; }
  .form-actions { flex-direction: column-reverse; }
  .btn-primary, .btn-secondary { width: 100%; justify-content: center; }
}
</style>