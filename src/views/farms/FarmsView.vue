<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import farmService from '@/services/farmService'
import type { FarmResponse, FarmStatus } from '@/services/farmService'
import { useAccountStore } from '@/stores/accountStore'

const router = useRouter()
const accountStore = useAccountStore()

const farms = ref<FarmResponse[]>([])
const loading = ref(true)
const error = ref('')
const activeFilter = ref<FarmStatus | null>(null)

const accountId = computed(() => accountStore.accounts[0]?.id)

const statusConfig: Record<FarmStatus, { label: string; color: string }> = {
  EM_PREPARACAO: { label: 'Em preparação', color: '#f59e0b' },
  EM_ANDAMENTO:  { label: 'Em andamento',  color: '#00bd7e' },
  COLHIDA:       { label: 'Colhida',        color: '#3b82f6' },
  CANCELADA:     { label: 'Cancelada',      color: '#ef4444' }
}

const filters: Array<{ value: FarmStatus | null; label: string }> = [
  { value: null,           label: 'Todas'         },
  { value: 'EM_PREPARACAO', label: 'Em preparação' },
  { value: 'EM_ANDAMENTO',  label: 'Em andamento'  },
  { value: 'COLHIDA',       label: 'Colhida'       },
  { value: 'CANCELADA',     label: 'Cancelada'     }
]

onMounted(() => fetchFarms())

async function fetchFarms() {
  if (!accountId.value) return
  loading.value = true
  error.value = ''
  try {
    const { data } = await farmService.findAll(accountId.value, activeFilter.value ?? undefined)
    farms.value = data.data
  } catch {
    error.value = 'Erro ao carregar lavouras.'
  } finally {
    loading.value = false
  }
}

async function applyFilter(filter: FarmStatus | null) {
  activeFilter.value = filter
  await fetchFarms()
}

async function handleDelete(farmId: string) {
  if (!accountId.value) return
  if (!confirm('Tem certeza que deseja remover esta lavoura?')) return
  try {
    await farmService.delete(accountId.value, farmId)
    farms.value = farms.value.filter(f => f.id !== farmId)
  } catch {
    error.value = 'Erro ao remover lavoura.'
  }
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
}

function formatArea(value: number, unit: string) {
  const label = unit === 'HECTARE' ? 'ha' : 'alq'
  return `${value.toLocaleString('pt-BR')} ${label}`
}
</script>

<template>
  <div class="farms">
    <!-- Cabeçalho -->
    <div class="farms__header">
      <div>
        <h1 class="farms__title">Lavouras</h1>
        <p class="farms__subtitle">Gerencie os ciclos de plantio da sua conta.</p>
      </div>
      <button class="btn-primary" @click="router.push({ name: 'farm-create' })">
        + Nova lavoura
      </button>
    </div>

    <!-- Filtros de status -->
    <div class="farms__filters">
      <button
        v-for="f in filters"
        :key="String(f.value)"
        class="filter-btn"
        :class="{ 'filter-btn--active': activeFilter === f.value }"
        @click="applyFilter(f.value)"
      >
        {{ f.label }}
      </button>
    </div>

    <div v-if="error" class="error-banner">{{ error }}</div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <span class="spinner" />
    </div>

    <!-- Lista vazia -->
    <div v-else-if="farms.length === 0" class="empty-state">
      <p class="empty-state__title">Nenhuma lavoura encontrada</p>
      <p class="empty-state__subtitle">
        {{ activeFilter ? 'Tente outro filtro ou ' : '' }}crie sua primeira lavoura.
      </p>
      <button class="btn-primary" @click="router.push({ name: 'farm-create' })">
        + Nova lavoura
      </button>
    </div>

    <!-- Grid de cards -->
    <div v-else class="farms__grid">
      <div v-for="farm in farms" :key="farm.id" class="farm-card">
        <!-- Topo do card -->
        <div class="farm-card__top">
          <div>
            <h2 class="farm-card__name">{{ farm.name }}</h2>
            <span class="farm-card__area">{{ formatArea(farm.areaValue, farm.areaUnit) }}</span>
          </div>
          <span
            class="farm-card__badge"
            :style="{ background: statusConfig[farm.status].color + '20', color: statusConfig[farm.status].color }"
          >
            {{ statusConfig[farm.status].label }}
          </span>
        </div>

        <!-- Dados do arrendamento -->
        <div v-if="farm.lessorName" class="farm-card__info">
          <span class="farm-card__info-label">Arrendante</span>
          <span class="farm-card__info-value">{{ farm.lessorName }}</span>
        </div>

        <!-- Período de plantio -->
        <div class="farm-card__dates">
          <div class="farm-card__date-item">
            <span class="farm-card__date-label">Plantio</span>
            <span class="farm-card__date-value">
              {{ formatDate(farm.plantingStartDate) }}
              <template v-if="farm.plantingEndDate"> → {{ formatDate(farm.plantingEndDate) }}</template>
            </span>
          </div>
          <div class="farm-card__date-item">
            <span class="farm-card__date-label">Colheita</span>
            <span class="farm-card__date-value">
              {{ formatDate(farm.harvestStartDate) }}
              <template v-if="farm.harvestEndDate"> → {{ formatDate(farm.harvestEndDate) }}</template>
            </span>
          </div>
        </div>

        <!-- Ações -->
        <div class="farm-card__actions">
          <button class="btn-action btn-action--expenses" @click="router.push({ name: 'farm-expenses', params: { farmId: farm.id } })">
            Despesas
          </button>
          <button class="btn-action" @click="router.push({ name: 'farm-edit', params: { farmId: farm.id } })">
            Editar
          </button>
          <button class="btn-action btn-action--danger" @click="handleDelete(farm.id)">
            Remover
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.farms {
  padding: 2rem 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
}

.farms__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
}

.farms__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.farms__subtitle {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.farms__filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.filter-btn {
  padding: 0.4rem 0.875rem;
  border: 1.5px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-card);
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.filter-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.filter-btn--active {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.error-banner {
  background: var(--color-error-light);
  color: var(--color-error);
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  margin-bottom: 1.25rem;
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

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.empty-state__title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.empty-state__subtitle {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}

.farms__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}

.farm-card {
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: box-shadow 0.15s, transform 0.1s;
}

.farm-card:hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-1px);
}

.farm-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.farm-card__name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.farm-card__area {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin-top: 0.125rem;
  display: block;
}

.farm-card__badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.625rem;
  border-radius: 20px;
  white-space: nowrap;
  flex-shrink: 0;
}

.farm-card__info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.farm-card__info-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.farm-card__info-value {
  font-size: 0.875rem;
  color: var(--color-text);
}

.farm-card__dates {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.farm-card__date-item {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.farm-card__date-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.farm-card__date-value {
  font-size: 0.8125rem;
  color: var(--color-text);
}

.farm-card__actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.btn-action {
  padding: 0.375rem 0.75rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: none;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.btn-action:hover {
  background: var(--color-background);
  color: var(--color-text);
}

.btn-action--danger:hover {
  background: var(--color-error-light);
  border-color: var(--color-error);
  color: var(--color-error);
}

.btn-action--expenses:hover {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.btn-primary {
  padding: 0.625rem 1.25rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

@media (max-width: 480px) {
  .farms {
    padding: 1.5rem 1rem;
  }

  .farms__grid {
    grid-template-columns: 1fr;
  }
}
</style>