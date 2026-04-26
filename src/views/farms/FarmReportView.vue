<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAccountStore } from '@/stores/accountStore'
import reportService from '@/services/reportService'
import type { FarmReportResponse } from '@/services/reportService'
import type { FarmStatus } from '@/services/farmService'
import * as XLSX from 'xlsx'

const router       = useRouter()
const route        = useRoute()
const accountStore = useAccountStore()

const farmId    = route.params.farmId as string
const accountId = computed(() => accountStore.selectedAccount?.id)

const report   = ref<FarmReportResponse | null>(null)
const loading  = ref(true)
const error    = ref('')
const exporting = ref(false)

// Filtro de categoria na lista de despesas
type CategoryFilter = 'ALL' | 'INSUMO' | 'SERVICO'
const categoryFilter = ref<CategoryFilter>('ALL')

const statusConfig: Record<FarmStatus, { label: string; color: string; bg: string }> = {
  EM_PREPARACAO: { label: 'Em preparação', color: '#d97706', bg: '#fef3c7' },
  EM_ANDAMENTO:  { label: 'Em andamento',  color: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
  COLHIDA:       { label: 'Colhida',       color: '#2563eb', bg: '#dbeafe' },
  CANCELADA:     { label: 'Cancelada',     color: '#dc2626', bg: '#fee2e2' },
}

const categoryConfig = {
  INSUMO:  { label: 'Insumo',  color: '#059669', bg: '#d1fae5' },
  SERVICO: { label: 'Serviço', color: '#2563eb', bg: '#dbeafe' },
}

onMounted(async () => {
  if (!accountId.value) return
  try {
    const { data } = await reportService.getFarmReport(accountId.value, farmId)
    report.value = data.data
  } catch {
    error.value = 'Erro ao carregar relatório.'
  } finally {
    loading.value = false
  }
})

// Despesas filtradas por categoria
const filteredExpenses = computed(() => {
  if (!report.value) return []
  if (categoryFilter.value === 'ALL') return report.value.expenses
  return report.value.expenses.filter(e => e.category === categoryFilter.value)
})

// Percentual de insumos/serviços sobre o total
const insumosPercent = computed(() => {
  if (!report.value || report.value.totalExpenses === 0) return 0
  return Math.round((report.value.totalInsumos / report.value.totalExpenses) * 100)
})

const servicosPercent = computed(() => {
  if (!report.value || report.value.totalExpenses === 0) return 0
  return Math.round((report.value.totalServicos / report.value.totalExpenses) * 100)
})

const paidPercent = computed(() => {
  if (!report.value || report.value.totalExpenses === 0) return 0
  return Math.round((report.value.totalPaid / report.value.totalExpenses) * 100)
})

// Formata moeda BRL
function formatCurrency(value: number): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Formata data pt-BR
function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
}

// Formata área
function formatArea(value: number, unit: string): string {
  return `${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${unit === 'HECTARE' ? 'ha' : 'alq'}`
}

// ── Exportação para Excel ─────────────────────────────────────────
async function exportToExcel() {
  if (!report.value) return
  exporting.value = true

  try {
    const r = report.value
    const wb = XLSX.utils.book_new()

    // ── Aba 1: Resumo ─────────────────────────────────────────────
    const resumo = [
      [`RELATÓRIO FINANCEIRO — ${r.farmName}`],
      [],
      ['DADOS DA LAVOURA'],
      ['Lavoura',       r.farmName],
      ['Área',          formatArea(r.areaValue, r.areaUnit)],
      ['Status',        statusConfig[r.status].label],
      ['Arrendatário',  r.lessorName ?? '—'],
      ['Início arrendamento', formatDate(r.leaseStartDate)],
      ['Fim arrendamento',    formatDate(r.leaseEndDate)],
      ['Valor arrendamento',  r.leaseValue ?? 0],
      [],
      ['RESUMO FINANCEIRO'],
      ['Total de despesas', r.totalExpenses],
      ['Insumos',           r.totalInsumos],
      ['Serviços',          r.totalServicos],
      ['Total pago',        r.totalPaid],
      ['A pagar',           r.totalPending],
      [],
      ['COMPARATIVO'],
      ['Custo arrendamento',     r.leaseValue ?? 0],
      ['Total despesas',         r.totalExpenses],
      ['Custo total',            r.totalCost],
    ]
    const ws1 = XLSX.utils.aoa_to_sheet(resumo)
    ws1['!cols'] = [{ wch: 28 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, ws1, 'Resumo')

    // ── Aba 2: Evolução Mensal ────────────────────────────────────
    const monthlyHeader = ['Mês', 'Total (R$)', 'Insumos (R$)', 'Serviços (R$)', 'Pago (R$)', 'A Pagar (R$)']
    const monthlyRows = r.monthlyBreakdown.map(m => [
      m.monthLabel,
      m.total,
      m.insumos,
      m.servicos,
      m.paid,
      m.pending,
    ])
    const ws2 = XLSX.utils.aoa_to_sheet([monthlyHeader, ...monthlyRows])
    ws2['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, ws2, 'Evolução Mensal')

    // ── Aba 3: Despesas ───────────────────────────────────────────
    const expHeader = ['Descrição', 'Categoria', 'Valor (R$)', 'Competência', 'Data Pagamento', 'Status', 'Observações']
    const expRows = r.expenses.map(e => [
      e.description,
      e.category === 'INSUMO' ? 'Insumo' : 'Serviço',
      e.value,
      formatDate(e.competenceDate),
      formatDate(e.paymentDate),
      e.paid ? 'Pago' : 'A pagar',
      e.notes ?? '',
    ])
    const ws3 = XLSX.utils.aoa_to_sheet([expHeader, ...expRows])
    ws3['!cols'] = [{ wch: 32 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 28 }]
    XLSX.utils.book_append_sheet(wb, ws3, 'Despesas')

    // Gera e baixa o arquivo
    const fileName = `relatorio-${r.farmName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.xlsx`
    XLSX.writeFile(wb, fileName)
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div class="report">

    <!-- Cabeçalho -->
    <div class="report__header">
      <div class="report__back-row">
        <button class="back-btn" @click="router.push({ name: 'farm-expenses', params: { farmId } })">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Despesas
        </button>
      </div>

      <div class="report__title-row">
        <div>
          <h1 class="report__title">Relatório financeiro</h1>
          <div class="report__farm-info" v-if="report">
            <span class="report__farm-name">{{ report.farmName }}</span>
            <span
              class="status-badge"
              :style="{ background: statusConfig[report.status].bg, color: statusConfig[report.status].color }"
            >
              {{ statusConfig[report.status].label }}
            </span>
            <span class="report__area">{{ formatArea(report.areaValue, report.areaUnit) }}</span>
          </div>
        </div>
        <button
          class="btn-export"
          :disabled="!report || exporting"
          @click="exportToExcel"
        >
          <svg v-if="!exporting" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
               viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span v-if="exporting" class="spinner spinner--sm" />
          {{ exporting ? 'Gerando...' : 'Exportar Excel' }}
        </button>
      </div>
    </div>

    <!-- Erro -->
    <div v-if="error" class="error-banner">{{ error }}</div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state"><span class="spinner" /></div>

    <template v-else-if="report">

      <!-- ── KPI Cards ──────────────────────────────────────────────── -->
      <div class="kpi-grid">

        <div class="kpi-card">
          <span class="kpi-card__label">Total de despesas</span>
          <span class="kpi-card__value">{{ formatCurrency(report.totalExpenses) }}</span>
          <span class="kpi-card__sub">{{ report.expenses.length }} lançamento{{ report.expenses.length !== 1 ? 's' : '' }}</span>
        </div>

        <div class="kpi-card kpi-card--insumo">
          <span class="kpi-card__label">Insumos</span>
          <span class="kpi-card__value">{{ formatCurrency(report.totalInsumos) }}</span>
          <div class="kpi-card__bar">
            <div class="kpi-card__bar-fill kpi-card__bar-fill--insumo" :style="{ width: insumosPercent + '%' }" />
          </div>
          <span class="kpi-card__sub">{{ insumosPercent }}% do total</span>
        </div>

        <div class="kpi-card kpi-card--servico">
          <span class="kpi-card__label">Serviços</span>
          <span class="kpi-card__value">{{ formatCurrency(report.totalServicos) }}</span>
          <div class="kpi-card__bar">
            <div class="kpi-card__bar-fill kpi-card__bar-fill--servico" :style="{ width: servicosPercent + '%' }" />
          </div>
          <span class="kpi-card__sub">{{ servicosPercent }}% do total</span>
        </div>

        <div class="kpi-card" :class="{ 'kpi-card--alert': report.totalPending > 0 }">
          <span class="kpi-card__label">A pagar</span>
          <span class="kpi-card__value">{{ formatCurrency(report.totalPending) }}</span>
          <div class="kpi-card__bar">
            <div class="kpi-card__bar-fill kpi-card__bar-fill--paid" :style="{ width: paidPercent + '%' }" />
          </div>
          <span class="kpi-card__sub">{{ paidPercent }}% pago</span>
        </div>

      </div>

      <!-- ── Comparativo: Arrendamento vs Despesas ──────────────────── -->
      <div class="section" v-if="report.leaseValue">
        <h2 class="section__title">Comparativo de custos</h2>
        <div class="compare-card">
          <div class="compare-item">
            <span class="compare-item__label">Arrendamento</span>
            <span class="compare-item__value compare-item__value--lease">
              {{ formatCurrency(report.leaseValue) }}
            </span>
            <span class="compare-item__period" v-if="report.leaseStartDate">
              {{ formatDate(report.leaseStartDate) }} — {{ formatDate(report.leaseEndDate) }}
            </span>
          </div>
          <div class="compare-divider">+</div>
          <div class="compare-item">
            <span class="compare-item__label">Despesas</span>
            <span class="compare-item__value compare-item__value--expenses">
              {{ formatCurrency(report.totalExpenses) }}
            </span>
            <span class="compare-item__period">Insumos + Serviços</span>
          </div>
          <div class="compare-divider">=</div>
          <div class="compare-item compare-item--total">
            <span class="compare-item__label">Custo total</span>
            <span class="compare-item__value compare-item__value--total">
              {{ formatCurrency(report.totalCost) }}
            </span>
            <span class="compare-item__period">Investimento total na lavoura</span>
          </div>
        </div>
      </div>

      <!-- ── Evolução mensal ────────────────────────────────────────── -->
      <div class="section">
        <h2 class="section__title">Evolução mensal</h2>

        <div v-if="report.monthlyBreakdown.length === 0" class="empty-state">
          Nenhuma despesa registrada para gerar evolução mensal.
        </div>

        <template v-else>
          <!-- Tabela desktop -->
          <div class="table-wrapper">
            <table class="report-table">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th class="col-right">Insumos</th>
                  <th class="col-right">Serviços</th>
                  <th class="col-right">Total</th>
                  <th class="col-right">Pago</th>
                  <th class="col-right">A pagar</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in report.monthlyBreakdown" :key="`${m.year}-${m.month}`">
                  <td class="col-month">{{ m.monthLabel }}</td>
                  <td class="col-right">{{ formatCurrency(m.insumos) }}</td>
                  <td class="col-right">{{ formatCurrency(m.servicos) }}</td>
                  <td class="col-right col-bold">{{ formatCurrency(m.total) }}</td>
                  <td class="col-right col-paid">{{ formatCurrency(m.paid) }}</td>
                  <td class="col-right">
                    <span v-if="m.pending > 0" class="pending-badge">{{ formatCurrency(m.pending) }}</span>
                    <span v-else class="paid-badge">—</span>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="report-table__total">
                  <td>Total</td>
                  <td class="col-right">{{ formatCurrency(report.totalInsumos) }}</td>
                  <td class="col-right">{{ formatCurrency(report.totalServicos) }}</td>
                  <td class="col-right col-bold">{{ formatCurrency(report.totalExpenses) }}</td>
                  <td class="col-right col-paid">{{ formatCurrency(report.totalPaid) }}</td>
                  <td class="col-right">
                    <span v-if="report.totalPending > 0" class="pending-badge">{{ formatCurrency(report.totalPending) }}</span>
                    <span v-else class="paid-badge">Quitado</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Cards mobile -->
          <div class="monthly-cards">
            <div v-for="m in report.monthlyBreakdown" :key="`mob-${m.year}-${m.month}`" class="monthly-card">
              <div class="monthly-card__header">
                <span class="monthly-card__label">{{ m.monthLabel }}</span>
                <span class="monthly-card__total">{{ formatCurrency(m.total) }}</span>
              </div>
              <div class="monthly-card__row">
                <span>Insumos: {{ formatCurrency(m.insumos) }}</span>
                <span>Serviços: {{ formatCurrency(m.servicos) }}</span>
              </div>
              <div class="monthly-card__row">
                <span class="col-paid">Pago: {{ formatCurrency(m.paid) }}</span>
                <span v-if="m.pending > 0" class="col-pending">A pagar: {{ formatCurrency(m.pending) }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- ── Lista de despesas ──────────────────────────────────────── -->
      <div class="section">
        <div class="section__row">
          <h2 class="section__title">Todas as despesas</h2>
          <div class="filters">
            <button class="filter-btn" :class="{ 'filter-btn--active': categoryFilter === 'ALL' }"    @click="categoryFilter = 'ALL'">Todas</button>
            <button class="filter-btn" :class="{ 'filter-btn--active': categoryFilter === 'INSUMO' }" @click="categoryFilter = 'INSUMO'">Insumos</button>
            <button class="filter-btn" :class="{ 'filter-btn--active': categoryFilter === 'SERVICO' }" @click="categoryFilter = 'SERVICO'">Serviços</button>
          </div>
        </div>

        <div v-if="filteredExpenses.length === 0" class="empty-state">
          Nenhuma despesa encontrada.
        </div>

        <template v-else>
          <!-- Tabela desktop -->
          <div class="table-wrapper">
            <table class="report-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Competência</th>
                  <th>Pagamento</th>
                  <th>Status</th>
                  <th class="col-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="e in filteredExpenses" :key="e.id">
                  <td class="col-desc">{{ e.description }}</td>
                  <td>
                    <span class="cat-badge"
                      :style="{ background: categoryConfig[e.category].bg, color: categoryConfig[e.category].color }">
                      {{ categoryConfig[e.category].label }}
                    </span>
                  </td>
                  <td>{{ formatDate(e.competenceDate) }}</td>
                  <td>{{ formatDate(e.paymentDate) }}</td>
                  <td>
                    <span class="paid-badge" v-if="e.paid">Pago</span>
                    <span class="pending-badge" v-else>A pagar</span>
                  </td>
                  <td class="col-right col-bold">{{ formatCurrency(Number(e.value)) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Cards mobile -->
          <div class="expense-cards">
            <div v-for="e in filteredExpenses" :key="`mob-exp-${e.id}`" class="expense-card-mini">
              <div class="expense-card-mini__top">
                <span class="expense-card-mini__desc">{{ e.description }}</span>
                <span class="expense-card-mini__value">{{ formatCurrency(Number(e.value)) }}</span>
              </div>
              <div class="expense-card-mini__meta">
                <span class="cat-badge"
                  :style="{ background: categoryConfig[e.category].bg, color: categoryConfig[e.category].color }">
                  {{ categoryConfig[e.category].label }}
                </span>
                <span class="paid-badge" v-if="e.paid">Pago</span>
                <span class="pending-badge" v-else>A pagar</span>
                <span class="expense-card-mini__date">{{ formatDate(e.competenceDate) }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>

    </template>
  </div>
</template>

<style scoped>
.report {
  padding: 2rem 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
}

/* ── Cabeçalho ──────────────────────────────────────────────────── */
.report__back-row { margin-bottom: 0.75rem; }

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;
}
.back-btn:hover { color: var(--color-primary); }

.report__title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.75rem;
}

.report__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.report__farm-info {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-top: 0.375rem;
  flex-wrap: wrap;
}

.report__farm-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
}

.report__area {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.btn-export {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  background: #059669;
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.15s;
  flex-shrink: 0;
}
.btn-export:disabled { opacity: 0.6; cursor: default; }
.btn-export:not(:disabled):hover { opacity: 0.85; }

/* ── Utilitários ────────────────────────────────────────────────── */
.loading-state { display: flex; justify-content: center; padding: 4rem 0; }

.spinner {
  display: inline-block;
  width: 28px; height: 28px;
  border: 2.5px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
.spinner--sm { width: 16px; height: 16px; border-width: 2px; }
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

.empty-state {
  padding: 2rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  background: var(--color-card);
  border: 1.5px dashed var(--color-border);
  border-radius: var(--radius-md);
}

/* ── KPI Cards ──────────────────────────────────────────────────── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 1.25rem;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
}

.kpi-card--alert   { border-color: #f59e0b; background: #fffbeb; }
.kpi-card--insumo  { border-left: 3px solid #059669; }
.kpi-card--servico { border-left: 3px solid #2563eb; }

.kpi-card__label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.kpi-card__value {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.kpi-card__bar {
  height: 4px;
  background: var(--color-background);
  border-radius: 2px;
  overflow: hidden;
  margin: 0.2rem 0;
}
.kpi-card__bar-fill { height: 100%; border-radius: 2px; transition: width 0.6s ease; }
.kpi-card__bar-fill--insumo  { background: #059669; }
.kpi-card__bar-fill--servico { background: #2563eb; }
.kpi-card__bar-fill--paid    { background: #059669; }

.kpi-card__sub { font-size: 0.75rem; color: var(--color-text-muted); }

/* ── Comparativo ────────────────────────────────────────────────── */
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
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.section__row .section__title { margin-bottom: 0; }

.compare-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  flex-wrap: wrap;
}

.compare-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 140px;
}

.compare-item--total {
  background: var(--color-background);
  padding: 0.875rem;
  border-radius: var(--radius-sm);
}

.compare-item__label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.compare-item__value {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.compare-item__value--lease    { color: #7c3aed; }
.compare-item__value--expenses { color: #2563eb; }
.compare-item__value--total    { color: var(--color-text); font-size: 1.375rem; }

.compare-item__period { font-size: 0.75rem; color: var(--color-text-muted); }

.compare-divider {
  font-size: 1.5rem;
  font-weight: 300;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

/* ── Filtros ────────────────────────────────────────────────────── */
.filters { display: flex; gap: 0.375rem; flex-wrap: wrap; }

.filter-btn {
  padding: 0.3rem 0.75rem;
  border: 1.5px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-card);
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s;
}
.filter-btn:hover        { border-color: var(--color-primary); color: var(--color-primary); }
.filter-btn--active      { background: var(--color-primary-light); border-color: var(--color-primary); color: var(--color-primary); }

/* ── Tabelas ────────────────────────────────────────────────────── */
.table-wrapper {
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.report-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }

.report-table thead { background: var(--color-background); }

.report-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border-bottom: 1.5px solid var(--color-border);
}

.report-table td {
  padding: 0.8rem 1rem;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.report-table tbody tr:last-child td { border-bottom: none; }

.report-table__total td {
  font-weight: 700;
  background: var(--color-background);
  border-top: 1.5px solid var(--color-border);
  border-bottom: none;
}

.col-right   { text-align: right; }
.col-bold    { font-weight: 600; }
.col-paid    { color: #059669; font-weight: 600; }
.col-pending { color: #d97706; }
.col-month   { font-weight: 600; }
.col-desc    { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }

/* ── Badges ─────────────────────────────────────────────────────── */
.status-badge, .cat-badge, .paid-badge, .pending-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.625rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}
.paid-badge    { background: #d1fae5; color: #059669; }
.pending-badge { background: #fef3c7; color: #d97706; }

/* ── Cards mobile ───────────────────────────────────────────────── */
.monthly-cards, .expense-cards { display: none; }

/* ── Responsividade ─────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .table-wrapper  { display: none; }
  .monthly-cards, .expense-cards { display: flex; flex-direction: column; gap: 0.625rem; }
  .compare-card   { flex-direction: column; }
  .compare-divider { display: none; }
}

@media (max-width: 640px) {
  .report        { padding: 1.25rem 1rem; }
  .kpi-grid      { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
  .kpi-card__value { font-size: 1.1rem; }
  .report__title-row { flex-direction: column; }
  .btn-export    { width: 100%; justify-content: center; }
}

.monthly-card {
  padding: 1rem;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
}
.monthly-card__header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.monthly-card__label { font-weight: 700; font-size: 0.9rem; color: var(--color-text); }
.monthly-card__total { font-weight: 700; font-size: 0.9rem; color: var(--color-text); }
.monthly-card__row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-bottom: 0.25rem;
}

.expense-card-mini {
  padding: 0.875rem 1rem;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
}
.expense-card-mini__top { display: flex; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.5rem; }
.expense-card-mini__desc { font-weight: 600; font-size: 0.875rem; color: var(--color-text); }
.expense-card-mini__value { font-weight: 700; font-size: 0.875rem; white-space: nowrap; }
.expense-card-mini__meta { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
.expense-card-mini__date { font-size: 0.75rem; color: var(--color-text-muted); }
</style>