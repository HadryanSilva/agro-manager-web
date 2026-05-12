<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/accountStore'
import { useTraderFormatters } from '@/composables/useTraderFormatters'
import tradingService from '@/services/tradingService'
import type { TradingDashboardResponse } from '@/services/tradingService'

const router       = useRouter()
const accountStore = useAccountStore()
const { currency, kg } = useTraderFormatters()

const costPercent = computed(() => {
  if (!dashboard.value || dashboard.value.totalRevenue <= 0) return 0
  return Math.min(100, Math.round((dashboard.value.totalCost / dashboard.value.totalRevenue) * 100))
})
const marginPercent = computed(() => {
  if (!dashboard.value || dashboard.value.totalRevenue <= 0) return 0
  return Math.max(0, Math.round((dashboard.value.grossMargin / dashboard.value.totalRevenue) * 100))
})

// Conta ativa — computed para reagir a mudanças de conta durante a sessão
const accountId = computed(() => accountStore.selectedAccount?.id)

const dashboard = ref<TradingDashboardResponse | null>(null)
const loading   = ref(true)
const error     = ref('')

onMounted(async () => {
  await loadDashboard()
})

async function loadDashboard() {
  if (!accountId.value) return

  loading.value = true
  error.value   = ''
  try {
    const { data } = await tradingService.getDashboard(accountId.value)
    dashboard.value = data.data
  } catch {
    error.value = 'Erro ao carregar o dashboard.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Visão geral das suas operações de compra e revenda</p>
      </div>
      <button class="btn btn--primary" @click="router.push({ name: 'trader-lots-new' })">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Registrar Lote
      </button>
    </div>

    <!-- Skeleton de carregamento -->
    <template v-if="loading">
      <div class="kpi-grid">
        <div v-for="i in 6" :key="i" class="skeleton-card" />
      </div>
      <div class="stats-row">
        <div v-for="i in 2" :key="i" class="skeleton-card skeleton-card--tall" />
      </div>
    </template>

    <!-- Erro -->
    <div v-else-if="error" class="empty-state">
      <p>{{ error }}</p>
      <button class="btn btn--secondary" @click="loadDashboard">Tentar novamente</button>
    </div>

    <template v-else-if="dashboard">
      <!-- KPIs financeiros -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-card__label">Receita Total</span>
          <span class="kpi-card__value kpi-card__value--positive">{{ currency(dashboard.totalRevenue) }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-card__label">Custo Total</span>
          <span class="kpi-card__value kpi-card__value--negative">{{ currency(dashboard.totalCost) }}</span>
        </div>
        <div class="kpi-card" :class="{ 'kpi-card--highlight': dashboard.grossMargin > 0 }">
          <span class="kpi-card__label">Margem Bruta</span>
          <span class="kpi-card__value" :class="dashboard.grossMargin >= 0 ? 'kpi-card__value--positive' : 'kpi-card__value--negative'">
            {{ currency(dashboard.grossMargin) }}
          </span>
        </div>
        <div class="kpi-card">
          <span class="kpi-card__label">Total Comprado</span>
          <span class="kpi-card__value">{{ kg(dashboard.totalPurchasedKg) }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-card__label">Total Vendido</span>
          <span class="kpi-card__value">{{ kg(dashboard.totalSoldKg) }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-card__label">Estoque Restante</span>
          <span class="kpi-card__value">{{ kg(dashboard.totalPurchasedKg - dashboard.totalSoldKg) }}</span>
        </div>
      </div>

      <!-- Lotes e Fornecedores -->
      <div class="stats-row">
        <div class="stat-card" @click="router.push({ name: 'trader-lots' })">
          <div class="stat-card__icon stat-card__icon--amber">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          </div>
          <div class="stat-card__content">
            <span class="stat-card__value">{{ dashboard.totalLots }}</span>
            <span class="stat-card__label">Lotes no total</span>
          </div>
          <div class="stat-card__badges">
            <span class="badge badge--green">{{ dashboard.openLots }} abertos</span>
            <span class="badge badge--gray">{{ dashboard.closedLots }} fechados</span>
          </div>
        </div>

        <div class="stat-card" @click="router.push({ name: 'trader-suppliers' })">
          <div class="stat-card__icon stat-card__icon--teal">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="stat-card__content">
            <span class="stat-card__value">{{ dashboard.totalSuppliers }}</span>
            <span class="stat-card__label">Fornecedores cadastrados</span>
          </div>
        </div>
      </div>

      <!-- Desempenho financeiro -->
      <div v-if="dashboard.totalRevenue > 0" class="section">
        <h2 class="section-title">Desempenho financeiro</h2>
        <div class="perf-card">
          <div class="perf-bar">
            <div
              class="perf-bar__cost"
              :style="{ width: costPercent + '%' }"
              :title="`Custo: ${costPercent}%`"
            />
            <div
              class="perf-bar__margin"
              :style="{ width: marginPercent + '%' }"
              :title="`Margem: ${marginPercent}%`"
            />
          </div>
          <div class="perf-legend">
            <span class="perf-legend__item perf-legend__item--cost">
              <span class="perf-legend__dot" />
              Custo {{ costPercent }}%
            </span>
            <span class="perf-legend__item perf-legend__item--margin">
              <span class="perf-legend__dot" />
              Margem {{ marginPercent }}%
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page-container {
  padding: 2rem 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
}

.page-title {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 400;
  color: var(--color-text);
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin: 0 0 0.25rem;
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0;
}

/* KPIs */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.kpi-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  box-shadow: var(--shadow-card);
}

.kpi-card--highlight {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.kpi-card__label {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.kpi-card__value {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 400;
  color: var(--color-text);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.kpi-card__value--positive { color: var(--color-primary); }
.kpi-card__value--negative { color: var(--color-error); }

/* Stats */
.stats-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.stat-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  box-shadow: var(--shadow-card);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.stat-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-card-hover);
}

.stat-card__icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card__icon--amber { background: var(--color-warning-light, #fff8e6); color: var(--color-warning, #b45309); }
.stat-card__icon--teal  { background: var(--color-primary-light); color: var(--color-primary); }

.stat-card__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.stat-card__value {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 400;
  color: var(--color-text);
  letter-spacing: -0.02em;
  line-height: 1;
}

.stat-card__label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.stat-card__badges {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 20px;
  white-space: nowrap;
}

.badge--green { background: var(--color-primary-light); color: var(--color-primary); }
.badge--gray  { background: var(--color-surface); color: var(--color-text-muted); }

/* Utilitários */
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

.btn--primary {
  background: var(--color-primary);
  color: #fff;
}

.btn--primary:not(:disabled):hover { opacity: 0.88; }

.btn--secondary {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* Skeletons */
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }

.skeleton-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  height: 88px;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-card--tall { height: 80px; }

/* Desempenho financeiro */
.section { margin-top: 1.5rem; }

.section-title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 400;
  color: var(--color-text);
  letter-spacing: -0.01em;
  margin-bottom: 0.875rem;
}

.perf-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-card);
}

.perf-bar {
  display: flex;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
  background: var(--color-surface);
  margin-bottom: 0.75rem;
  gap: 2px;
}

.perf-bar__cost {
  background: var(--color-error);
  border-radius: 5px;
  transition: width 0.6s ease;
  min-width: 2px;
}

.perf-bar__margin {
  background: var(--color-primary);
  border-radius: 5px;
  transition: width 0.6s ease;
  min-width: 2px;
}

.perf-legend {
  display: flex;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.perf-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.perf-legend__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.perf-legend__item--cost   .perf-legend__dot { background: var(--color-error); }
.perf-legend__item--margin .perf-legend__dot { background: var(--color-primary); }

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--color-text-muted);
}

/* Responsivo */
@media (max-width: 768px) {
  .page-container { padding: 1.25rem 1rem; }
  .page-header { flex-direction: column; }
  .kpi-grid { grid-template-columns: 1fr 1fr; }
  .stats-row { grid-template-columns: 1fr; }
}

@media (max-width: 480px) {
  .kpi-grid { grid-template-columns: 1fr; }
}
</style>
