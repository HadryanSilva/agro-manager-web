<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import farmService from '@/services/farmService'
import type { FarmRequest, AreaUnit } from '@/services/farmService'
import { useAccountStore } from '@/stores/accountStore'

const router = useRouter()
const route = useRoute()
const accountStore = useAccountStore()

const farmId = route.params.farmId as string | undefined
const isEditing = computed(() => !!farmId)
const accountId = computed(() => accountStore.accounts[0]?.id)

// ── Estado do formulário ──────────────────────────────────────────────────────

const name             = ref('')
const areaValue        = ref<number | ''>('')
const areaUnit         = ref<AreaUnit>('HECTARE')
const lessorName       = ref('')
const leaseStartDate   = ref('')
const leaseEndDate     = ref('')
const leaseValue       = ref<number | ''>('')
const plantingStartDate = ref('')
const plantingEndDate  = ref('')
const harvestStartDate = ref('')
const harvestEndDate   = ref('')
const cancelled        = ref(false)
const notes            = ref('')

const loading     = ref(false)
const loadingData = ref(false)
const error       = ref('')

// ── Carregamento para edição ──────────────────────────────────────────────────

onMounted(async () => {
  if (!isEditing.value || !accountId.value || !farmId) return
  loadingData.value = true
  try {
    const { data } = await farmService.findById(accountId.value, farmId)
    const f = data.data
    name.value             = f.name
    areaValue.value        = f.areaValue
    areaUnit.value         = f.areaUnit
    lessorName.value       = f.lessorName ?? ''
    leaseStartDate.value   = f.leaseStartDate ?? ''
    leaseEndDate.value     = f.leaseEndDate ?? ''
    leaseValue.value       = f.leaseValue ?? ''
    plantingStartDate.value = f.plantingStartDate ?? ''
    plantingEndDate.value  = f.plantingEndDate ?? ''
    harvestStartDate.value = f.harvestStartDate ?? ''
    harvestEndDate.value   = f.harvestEndDate ?? ''
    cancelled.value        = f.cancelled
    notes.value            = f.notes ?? ''
  } catch {
    error.value = 'Erro ao carregar lavoura.'
  } finally {
    loadingData.value = false
  }
})

// ── Submissão ─────────────────────────────────────────────────────────────────

async function handleSubmit() {
  if (!accountId.value || loading.value) return
  loading.value = true
  error.value = ''

  const payload: FarmRequest = {
    name:              name.value,
    areaValue:         Number(areaValue.value),
    areaUnit:          areaUnit.value,
    lessorName:        lessorName.value || undefined,
    leaseStartDate:    leaseStartDate.value || undefined,
    leaseEndDate:      leaseEndDate.value || undefined,
    leaseValue:        leaseValue.value !== '' ? Number(leaseValue.value) : undefined,
    plantingStartDate: plantingStartDate.value || undefined,
    plantingEndDate:   plantingEndDate.value || undefined,
    harvestStartDate:  harvestStartDate.value || undefined,
    harvestEndDate:    harvestEndDate.value || undefined,
    cancelled:         cancelled.value,
    notes:             notes.value || undefined
  }

  try {
    if (isEditing.value && farmId) {
      await farmService.update(accountId.value, farmId, payload)
    } else {
      await farmService.create(accountId.value, payload)
    }
    router.push({ name: 'farms' })
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Erro ao salvar lavoura.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="farm-form">
    <!-- Cabeçalho -->
    <div class="farm-form__header">
      <button class="back-btn" @click="router.push({ name: 'farms' })">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        Lavouras
      </button>
      <h1 class="farm-form__title">
        {{ isEditing ? 'Editar lavoura' : 'Nova lavoura' }}
      </h1>
    </div>

    <div v-if="loadingData" class="loading-state">
      <span class="spinner" />
    </div>

    <form v-else @submit.prevent="handleSubmit" novalidate>
      <div v-if="error" class="error-banner">{{ error }}</div>

      <!-- Seção: Identificação -->
      <div class="form-section">
        <h2 class="form-section__title">Identificação</h2>

        <div class="form-row">
          <div class="form-field form-field--grow">
            <label class="form-label">Nome da lavoura *</label>
            <input v-model="name" type="text" class="form-input"
                   placeholder="Ex: Lavoura São João 2025" maxlength="150" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-field form-field--grow">
            <label class="form-label">Área *</label>
            <input v-model="areaValue" type="number" class="form-input"
                   placeholder="0,00" step="0.01" min="0.01" required />
          </div>
          <div class="form-field">
            <label class="form-label">Unidade *</label>
            <select v-model="areaUnit" class="form-input">
              <option value="HECTARE">Hectares (ha)</option>
              <option value="ALQUEIRE">Alqueires (alq)</option>
            </select>
          </div>
        </div>

        <div class="form-field">
          <label class="form-label">Observações</label>
          <textarea v-model="notes" class="form-input form-input--textarea"
                    placeholder="Informações adicionais sobre a lavoura..." rows="3" />
        </div>
      </div>

      <!-- Seção: Arrendamento -->
      <div class="form-section">
        <h2 class="form-section__title">Arrendamento</h2>

        <div class="form-field">
          <label class="form-label">Nome do arrendante</label>
          <input v-model="lessorName" type="text" class="form-input"
                 placeholder="Nome do proprietário da terra" maxlength="150" />
        </div>

        <div class="form-row">
          <div class="form-field form-field--grow">
            <label class="form-label">Início do arrendamento</label>
            <input v-model="leaseStartDate" type="date" class="form-input" />
          </div>
          <div class="form-field form-field--grow">
            <label class="form-label">Fim do arrendamento</label>
            <input v-model="leaseEndDate" type="date" class="form-input" />
          </div>
        </div>

        <div class="form-field">
          <label class="form-label">Valor do arrendamento (R$)</label>
          <input v-model="leaseValue" type="number" class="form-input"
                 placeholder="0,00" step="0.01" min="0" />
        </div>
      </div>

      <!-- Seção: Período de plantio -->
      <div class="form-section">
        <h2 class="form-section__title">Plantio</h2>

        <div class="form-row">
          <div class="form-field form-field--grow">
            <label class="form-label">Início do plantio</label>
            <input v-model="plantingStartDate" type="date" class="form-input" />
          </div>
          <div class="form-field form-field--grow">
            <label class="form-label">Fim do plantio</label>
            <input v-model="plantingEndDate" type="date" class="form-input" />
          </div>
        </div>
      </div>

      <!-- Seção: Período de colheita -->
      <div class="form-section">
        <h2 class="form-section__title">Colheita</h2>

        <div class="form-row">
          <div class="form-field form-field--grow">
            <label class="form-label">Início da colheita</label>
            <input v-model="harvestStartDate" type="date" class="form-input" />
          </div>
          <div class="form-field form-field--grow">
            <label class="form-label">Fim da colheita</label>
            <input v-model="harvestEndDate" type="date" class="form-input" />
          </div>
        </div>
      </div>

      <!-- Cancelamento -->
      <div class="form-section">
        <label class="checkbox-label">
          <input v-model="cancelled" type="checkbox" class="checkbox-input" />
          <span>Marcar lavoura como cancelada</span>
        </label>
      </div>

      <!-- Ações -->
      <div class="form-actions">
        <button type="button" class="btn-secondary" @click="router.push({ name: 'farms' })">
          Cancelar
        </button>
        <button type="submit" class="btn-primary" :disabled="!name || !areaValue || loading">
          <span v-if="loading" class="btn-spinner" />
          <span v-else>{{ isEditing ? 'Salvar alterações' : 'Criar lavoura' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.farm-form {
  padding: 2rem 1.5rem;
  max-width: 720px;
  margin: 0 auto;
}

.farm-form__header {
  margin-bottom: 2rem;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0;
  margin-bottom: 0.75rem;
  transition: color 0.15s;
}

.back-btn:hover { color: var(--color-text); }

.farm-form__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 3rem;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 2.5px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

@keyframes spin { to { transform: rotate(360deg); } }

.error-banner {
  background: var(--color-error-light);
  color: var(--color-error);
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.form-section {
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: var(--shadow-card);
}

.form-section__title {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-field--grow { flex: 1; }

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.form-input {
  padding: 0.625rem 0.875rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.9375rem;
  color: var(--color-text);
  background: var(--color-card);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  width: 100%;
}

.form-input:focus {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(0, 189, 126, 0.12);
}

.form-input--textarea { resize: vertical; min-height: 80px; }

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 0.9rem;
  color: var(--color-text);
  cursor: pointer;
}

.checkbox-input {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.15s;
}

.btn-primary:hover:not(:disabled) { background: var(--color-primary-dark); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: var(--color-card);
  color: var(--color-text);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-secondary:hover { background: var(--color-background); }

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@media (max-width: 480px) {
  .farm-form { padding: 1.5rem 1rem; }
  .form-row { flex-direction: column; gap: 0; }
}
</style>