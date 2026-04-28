<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/accountStore'
import dashboardService from '@/services/dashboardService'
import type { DashboardSummary } from '@/services/dashboardService'
import type { FarmStatus } from '@/services/farmService'
import WeatherCard from '@/components/WeatherCard.vue'

const router       = useRouter()
const accountStore = useAccountStore()

const summary  = ref<DashboardSummary | null>(null)
const loading  = ref(true)
const error    = ref('')

const accountId = computed(() => accountStore.selectedAccount?.id)

// Tipo auxiliar que mapeia cada FarmStatus para a chave camelCase equivalente no DashboardSummary
type StatusSummaryKey = 'emPreparacao' | 'emAndamento' | 'colhida' | 'cancelada'

// Configuração visual de cada status com o summaryKey tipado para acesso seguro ao DashboardSummary
const statusConfig: Record<FarmStatus, { label: string; color: string; bg: string; summaryKey: StatusSummaryKey }> = {
  EM_PREPARACAO: { label: 'Em preparação', color: 'var(--color-warning)',  bg: 'var(--color-warning-light)',  summaryKey: 'emPreparacao' },
  EM_ANDAMENTO:  { label: 'Em andamento',  color: 'var(--color-primary)',  bg: 'var(--color-primary-light)',  summaryKey: 'emAndamento'  },
  COLHIDA:       { label: 'Colhida',       color: 'var(--color-info)',     bg: 'var(--color-info-light)',     summaryKey: 'colhida'      },
  CANCELADA:     { label: 'Cancelada',     color: 'var(--color-error)',    bg: 'var(--color-error-light)',    summaryKey: 'cancelada'    },
}

onMounted(fetchDashboard)

async function fetchDashboard() {
  if (!accountId.value) return
  loading.value = true
  error.value   = ''
  try {
    const { data } = await dashboardService.getSummary(accountId.value)
    summary.value = data.data
  } catch {
    error.value = 'Erro ao carregar dados do dashboard.'
  } finally {
    loading.value = false
  }
}

// Percentual de cada status em relação ao total (para as barras de progresso)
function statusPercent(count: number): number {
  if (!summary.value || summary.value.totalFarms === 0) return 0
  return Math.round((count / summary.value.totalFarms) * 100)
}

// Formata área com a unidade correta
function formatArea(value: number, unit: string): string {
  const label = unit === 'HECTARE' ? 'ha' : 'alq'
  return `${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${label}`
}

// Formata moeda em BRL
function formatCurrency(value: number): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Formata data no padrão pt-BR
function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR')
}

// Texto da área total para exibição nos cards
const totalAreaText = computed(() => {
  if (!summary.value) return '—'
  const parts: string[] = []
  if (summary.value.totalAreaHectares > 0)
    parts.push(`${Number(summary.value.totalAreaHectares).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ha`)
  if (summary.value.totalAreaAlqueires > 0)
    parts.push(`${Number(summary.value.totalAreaAlqueires).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} alq`)
  return parts.length ? parts.join(' + ') : '—'
})

// Percentual pago em relação ao total (para a barra de progresso financeira)
const paidPercent = computed(() => {
  if (!summary.value || summary.value.totalExpenses === 0) return 0
  return Math.round((summary.value.totalExpensesPaid / summary.value.totalExpenses) * 100)
})
</script>

<template>
  <div class="dashboard">

    <!-- Cabeçalho -->
    <div class="dashboard__header">
      <div>
        <h1 class="dashboard__title">Dashboard</h1>
        <p class="dashboard__subtitle">
          Resumo da conta <strong>{{ accountStore.selectedAccount?.name }}</strong>
        </p>
      </div>
      <button class="btn-refresh" @click="fetchDashboard" :disabled="loading" title="Atualizar">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2"
             :class="{ 'spinning': loading }">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
      </button>
    </div>

    <!-- Previsão do tempo -->
    <WeatherCard />

    <!-- Erro -->
    <div v-if="error" class="error-banner">{{ error }}</div>

    <!-- Loading skeleton -->
    <template v-if="loading">
      <div class="metrics-grid">
        <div v-for="i in 4" :key="i" class="metric-card metric-card--skeleton" />
      </div>
      <div class="skeleton-block" style="height: 120px; margin-top: 1.5rem;" />
      <div class="skeleton-block" style="height: 280px; margin-top: 1rem;" />
    </template>

    <template v-else-if="summary">

      <!-- ── Métricas principais ───────────────────────────────────── -->
      <div class="metrics-grid">

        <!-- Total de lavouras -->
        <div class="metric-card">
          <div class="metric-card__icon metric-card__icon--green">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            </svg>
          </div>
          <div class="metric-card__body">
            <span class="metric-card__value">{{ summary.totalFarms }}</span>
            <span class="metric-card__label">Total de lavouras</span>
          </div>
        </div>

        <!-- Área total -->
        <div class="metric-card">
          <div class="metric-card__icon metric-card__icon--blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 21V9"/>
            </svg>
          </div>
          <div class="metric-card__body">
            <span class="metric-card__value metric-card__value--sm">{{ totalAreaText }}</span>
            <span class="metric-card__label">Área total arrendada</span>
          </div>
        </div>

        <!-- Em andamento -->
        <div class="metric-card">
          <div class="metric-card__icon metric-card__icon--primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="metric-card__body">
            <span class="metric-card__value">{{ summary.emAndamento }}</span>
            <span class="metric-card__label">Em andamento</span>
          </div>
        </div>

        <!-- Arrendamentos vencendo -->
        <div class="metric-card" :class="{ 'metric-card--alert': summary.leasesExpiringIn30Days > 0 }">
          <div class="metric-card__icon metric-card__icon--warning">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <circle cx="12" cy="17.5" r="0.8" fill="currentColor" stroke="none"/>
            </svg>
          </div>
          <div class="metric-card__body">
            <span class="metric-card__value">{{ summary.leasesExpiringIn30Days }}</span>
            <span class="metric-card__label">Arrendamentos vencendo (30d)</span>
          </div>
        </div>

      </div>

      <!-- ── Resumo financeiro ──────────────────────────────────────── -->
      <div class="section">
        <h2 class="section__title">Resumo financeiro</h2>
        <div class="finance-card">
          <!-- Três totais -->
          <div class="finance-card__totals">
            <div class="finance-total">
              <span class="finance-total__label">Total de despesas</span>
              <span class="finance-total__value">{{ formatCurrency(summary.totalExpenses) }}</span>
            </div>
            <div class="finance-total finance-total--paid">
              <span class="finance-total__label">Total pago</span>
              <span class="finance-total__value">{{ formatCurrency(summary.totalExpensesPaid) }}</span>
            </div>
            <div class="finance-total" :class="{ 'finance-total--pending': summary.totalExpensesPending > 0 }">
              <span class="finance-total__label">A pagar</span>
              <span class="finance-total__value">{{ formatCurrency(summary.totalExpensesPending) }}</span>
            </div>
          </div>

          <!-- Barra de progresso: pago vs total -->
          <div v-if="summary.totalExpenses > 0" class="finance-card__progress">
            <div class="finance-bar-track">
              <div class="finance-bar-fill" :style="{ width: paidPercent + '%' }" />
            </div>
            <span class="finance-bar-label">{{ paidPercent }}% pago</span>
          </div>
          <p v-else class="finance-card__empty">Nenhuma despesa registrada ainda.</p>
        </div>
      </div>

      <!-- ── Distribuição por status ────────────────────────────────── -->
      <div class="section">
        <h2 class="section__title">Distribuição por status</h2>
        <div class="status-grid">
          <div
            v-for="(cfg, key) in statusConfig"
            :key="key"
            class="status-card"
            :style="{ '--status-color': cfg.color, '--status-bg': cfg.bg }"
          >
            <div class="status-card__header">
              <span class="status-badge" :style="{ background: cfg.bg, color: cfg.color }">
                {{ cfg.label }}
              </span>
              <span class="status-card__count">
                {{ summary[cfg.summaryKey] }}
              </span>
            </div>
            <div class="status-card__bar-track">
              <div
                class="status-card__bar-fill"
                :style="{ width: statusPercent(summary[cfg.summaryKey]) + '%' }"
              />
            </div>
            <span class="status-card__pct">
              {{ statusPercent(summary[cfg.summaryKey]) }}% do total
            </span>
          </div>
        </div>
      </div>

      <!-- ── Lavouras recentes ──────────────────────────────────────── -->
      <div class="section">
        <div class="section__row">
          <h2 class="section__title">Lavouras recentes</h2>
          <button class="link-btn" @click="router.push({ name: 'farms' })">
            Ver todas →
          </button>
        </div>

        <!-- Estado vazio -->
        <div v-if="summary.recentFarms.length === 0" class="empty-state">
          <span class="empty-state__icon">🌱</span>
          <p>Nenhuma lavoura cadastrada ainda.</p>
          <button class="btn-primary" @click="router.push({ name: 'farm-create' })">
            Cadastrar primeira lavoura
          </button>
        </div>

        <template v-else>
          <!-- Tabela desktop -->
          <div class="table-wrapper">
            <table class="farms-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Área</th>
                  <th>Status</th>
                  <th>Plantio</th>
                  <th class="col-right">Despesas</th>
                  <th class="col-right">A pagar</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="farm in summary.recentFarms"
                  :key="farm.id"
                  class="farms-table__row"
                  @click="router.push({ name: 'farm-edit', params: { farmId: farm.id } })"
                >
                  <td class="farms-table__name">{{ farm.name }}</td>
                  <td>{{ formatArea(farm.areaValue, farm.areaUnit) }}</td>
                  <td>
                    <span
                      class="status-badge"
                      :style="{
                        background: statusConfig[farm.status].bg,
                        color: statusConfig[farm.status].color
                      }"
                    >
                      {{ statusConfig[farm.status].label }}
                    </span>
                  </td>
                  <td>{{ formatDate(farm.plantingStartDate) }}</td>
                  <td class="col-right col-currency">
                    {{ formatCurrency(farm.totalExpenses) }}
                  </td>
                  <td class="col-right">
                    <span
                      v-if="farm.totalExpenses - farm.totalExpensesPaid > 0"
                      class="pending-badge"
                    >
                      {{ formatCurrency(farm.totalExpenses - farm.totalExpensesPaid) }}
                    </span>
                    <span v-else class="paid-badge">Quitado</span>
                  </td>
                  <td class="farms-table__action">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Cards mobile -->
          <div class="farm-cards">
            <div
              v-for="farm in summary.recentFarms"
              :key="farm.id"
              class="farm-card-mini"
              @click="router.push({ name: 'farm-edit', params: { farmId: farm.id } })"
            >
              <div class="farm-card-mini__top">
                <span class="farm-card-mini__name">{{ farm.name }}</span>
                <span
                  class="status-badge"
                  :style="{
                    background: statusConfig[farm.status].bg,
                    color: statusConfig[farm.status].color
                  }"
                >
                  {{ statusConfig[farm.status].label }}
                </span>
              </div>
              <div class="farm-card-mini__meta">
                <span>{{ formatArea(farm.areaValue, farm.areaUnit) }}</span>
                <span v-if="farm.plantingStartDate">Plantio: {{ formatDate(farm.plantingStartDate) }}</span>
              </div>
              <div class="farm-card-mini__finance">
                <span class="finance-label">Despesas: <strong>{{ formatCurrency(farm.totalExpenses) }}</strong></span>
                <span
                  v-if="farm.totalExpenses - farm.totalExpensesPaid > 0"
                  class="pending-badge"
                >
                  {{ formatCurrency(farm.totalExpenses - farm.totalExpensesPaid) }} a pagar
                </span>
                <span v-else-if="farm.totalExpenses > 0" class="paid-badge">Quitado</span>
              </div>
            </div>
          </div>
        </template>
      </div>

    </template>
  </div>
</template>

<style scoped>
/* ── Layout base ────────────────────────────────────────────────── */
.dashboard {
  padding: 2rem 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
}

/* ── Cabeçalho ──────────────────────────────────────────────────── */
.dashboard__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.75rem;
  gap: 1rem;
}

.dashboard__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.dashboard__subtitle {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.btn-refresh {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-card);
  color: var(--color-text-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.15s, border-color 0.15s;
}
.btn-refresh:hover:not(:disabled) { color: var(--color-primary); border-color: var(--color-primary); }
.btn-refresh:disabled { opacity: 0.5; cursor: default; }

.spinning { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Erro ───────────────────────────────────────────────────────── */
.error-banner {
  background: var(--color-error-light);
  color: var(--color-error);
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

/* ── Skeletons ──────────────────────────────────────────────────── */
.metric-card--skeleton {
  height: 96px;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  animation: pulse 1.5s ease-in-out infinite;
}
.skeleton-block {
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

/* ── Grid de métricas ───────────────────────────────────────────── */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
}

.metric-card--alert { border-color: var(--color-warning); background: var(--color-warning-light); }

.metric-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}
.metric-card__icon--green   { background: #d1fae5; color: #059669; }
.metric-card__icon--blue    { background: #dbeafe; color: #2563eb; }
.metric-card__icon--primary { background: var(--color-primary-light); color: var(--color-primary); }
.metric-card__icon--warning { background: var(--color-warning-light); color: var(--color-warning); }
.metric-card__icon--muted   { background: var(--color-background); color: var(--color-text-muted); }

.metric-card__body { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }

.metric-card__value {
  font-size: 1.625rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.03em;
  line-height: 1;
}
.metric-card__value--sm { font-size: 1.1rem; letter-spacing: -0.01em; }
.metric-card__label { font-size: 0.8rem; color: var(--color-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ── Seções ─────────────────────────────────────────────────────── */
.section { margin-bottom: 2rem; }

.section__title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 1rem;
  letter-spacing: -0.01em;
}

.section__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.section__row .section__title { margin-bottom: 0; }

.link-btn {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-primary);
  cursor: pointer;
  padding: 0;
  transition: opacity 0.15s;
}
.link-btn:hover { opacity: 0.7; }

/* ── Resumo financeiro ──────────────────────────────────────────── */
.finance-card {
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  padding: 1.25rem;
}

.finance-card__totals {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.finance-total {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.finance-total__label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.finance-total__value {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.finance-total--paid    .finance-total__value { color: #059669; }
.finance-total--pending .finance-total__value { color: var(--color-warning); }

.finance-card__progress { display: flex; align-items: center; gap: 0.875rem; }

.finance-bar-track {
  flex: 1;
  height: 8px;
  background: var(--color-background);
  border-radius: 4px;
  overflow: hidden;
}

.finance-bar-fill {
  height: 100%;
  background: #059669;
  border-radius: 4px;
  transition: width 0.6s ease;
}

.finance-bar-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #059669;
  white-space: nowrap;
}

.finance-card__empty {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  text-align: center;
  padding: 0.5rem 0;
}

/* ── Grid de status ─────────────────────────────────────────────── */
.status-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }

.status-card {
  padding: 1rem 1.25rem;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
}

.status-card__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.875rem; }

.status-card__count { font-size: 1.5rem; font-weight: 700; color: var(--color-text); letter-spacing: -0.03em; }

.status-card__bar-track { height: 6px; background: var(--color-background); border-radius: 3px; overflow: hidden; margin-bottom: 0.5rem; }

.status-card__bar-fill { height: 100%; background: var(--status-color); border-radius: 3px; transition: width 0.6s ease; }

.status-card__pct { font-size: 0.75rem; color: var(--color-text-muted); }

/* ── Badges ──────────────────────────────────────────────────────── */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.625rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.pending-badge {
  display: inline-flex;
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--color-warning-light);
  color: var(--color-warning);
  white-space: nowrap;
}

.paid-badge {
  display: inline-flex;
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  background: #d1fae5;
  color: #059669;
}

/* ── Tabela ─────────────────────────────────────────────────────── */
.table-wrapper {
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.farms-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }

.farms-table thead { background: var(--color-background); }

.farms-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border-bottom: 1.5px solid var(--color-border);
}

.farms-table__row { cursor: pointer; transition: background 0.12s; }
.farms-table__row:hover { background: var(--color-background); }

.farms-table td {
  padding: 0.875rem 1rem;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.farms-table__row:last-child td { border-bottom: none; }

.farms-table__name { font-weight: 600; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.farms-table__action { color: var(--color-text-muted); text-align: right; width: 32px; }

.col-right    { text-align: right; }
.col-currency { font-weight: 600; white-space: nowrap; }

/* ── Cards mobile ───────────────────────────────────────────────── */
.farm-cards { display: none; }

/* ── Estado vazio ───────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 2rem;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}
.empty-state__icon { font-size: 2.5rem; }

.btn-primary {
  padding: 0.6rem 1.25rem;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-primary:hover { opacity: 0.85; }

.metric-card__icon--warning {
  background: #fef3c7;
  color: #d97706;
}

/* ── Responsividade ─────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .metrics-grid { grid-template-columns: repeat(2, 1fr); }
  .status-grid  { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .dashboard { padding: 1.25rem 1rem; }

  .metrics-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
  .metric-card  { padding: 1rem; gap: 0.75rem; }
  .metric-card__icon  { width: 36px; height: 36px; }
  .metric-card__value { font-size: 1.375rem; }
  .metric-card__value--sm { font-size: 0.95rem; }

  .finance-card__totals { grid-template-columns: 1fr; gap: 0.75rem; margin-bottom: 1rem; }

  .status-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }

  /* Tabela oculta, cards visíveis no mobile */
  .table-wrapper { display: none; }
  .farm-cards    { display: flex; flex-direction: column; gap: 0.75rem; }

  .farm-card-mini {
    padding: 1rem;
    background: var(--color-card);
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background 0.12s;
  }
  .farm-card-mini:hover { background: var(--color-background); }

  .farm-card-mini__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .farm-card-mini__name {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .farm-card-mini__meta {
    display: flex;
    gap: 1rem;
    font-size: 0.8rem;
    color: var(--color-text-muted);
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
  }
  .farm-card-mini__finance {
    display: flex;
    gap: 0.625rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .finance-label { font-size: 0.8rem; color: var(--color-text-muted); }
}

@media (max-width: 400px) {
  .metrics-grid { grid-template-columns: 1fr; }
  .status-grid  { grid-template-columns: 1fr; }
}
</style>