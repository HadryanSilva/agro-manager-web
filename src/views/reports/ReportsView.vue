<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/accountStore'
import farmService from '@/services/farmService'
import type { FarmResponse } from '@/services/farmService'

const router       = useRouter()
const accountStore = useAccountStore()
const accountId    = computed(() => accountStore.accounts[0]?.id)

const farms   = ref<FarmResponse[]>([])
const loading = ref(true)
const error   = ref('')

onMounted(async () => {
  if (!accountId.value) return
  try {
    const { data } = await farmService.findAll(accountId.value)
    farms.value = data.data
  } catch {
    error.value = 'Erro ao carregar lavouras.'
  } finally {
    loading.value = false
  }
})

const statusConfig = {
  EM_PREPARACAO: { label: 'Em preparação', color: '#d97706', bg: '#fef3c7' },
  EM_ANDAMENTO:  { label: 'Em andamento',  color: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
  COLHIDA:       { label: 'Colhida',       color: '#2563eb', bg: '#dbeafe' },
  CANCELADA:     { label: 'Cancelada',     color: '#dc2626', bg: '#fee2e2' },
}

function formatArea(value: number, unit: string): string {
  return `${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${unit === 'HECTARE' ? 'ha' : 'alq'}`
}
</script>

<template>
  <div class="reports">

    <!-- Cabeçalho -->
    <div class="reports__header">
      <h1 class="reports__title">Relatórios</h1>
      <p class="reports__subtitle">Selecione o relatório que deseja visualizar</p>
    </div>

    <!-- ── Catálogo de relatórios disponíveis ─────────────────────── -->
    <div class="catalog">

      <!-- Card do relatório: Financeiro por Lavoura -->
      <div class="report-type-card">
        <div class="report-type-card__icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="1.75">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
            <line x1="2" y1="20" x2="22" y2="20"/>
          </svg>
        </div>
        <div class="report-type-card__body">
          <h2 class="report-type-card__title">Relatório financeiro por lavoura</h2>
          <p class="report-type-card__desc">
            Despesas por categoria, evolução mensal, status de pagamento e comparativo de custo com o arrendamento. Exportável para Excel.
          </p>

          <!-- Erro ao carregar lavouras -->
          <div v-if="error" class="error-inline">{{ error }}</div>

          <!-- Loading -->
          <div v-else-if="loading" class="loading-inline">
            <span class="spinner spinner--sm" /> Carregando lavouras...
          </div>

          <!-- Sem lavouras -->
          <div v-else-if="farms.length === 0" class="empty-inline">
            Nenhuma lavoura cadastrada. Cadastre uma lavoura para gerar relatórios.
          </div>

          <!-- Seletor de lavoura -->
          <template v-else>
            <p class="report-type-card__select-label">Selecione a lavoura:</p>
            <div class="farm-list">
              <button
                v-for="farm in farms"
                :key="farm.id"
                class="farm-item"
                @click="router.push({ name: 'farm-report', params: { farmId: farm.id } })"
              >
                <div class="farm-item__info">
                  <span class="farm-item__name">{{ farm.name }}</span>
                  <span class="farm-item__area">{{ formatArea(farm.areaValue, farm.areaUnit) }}</span>
                </div>
                <span
                  class="farm-item__status"
                  :style="{
                    background: statusConfig[farm.status].bg,
                    color: statusConfig[farm.status].color
                  }"
                >
                  {{ statusConfig[farm.status].label }}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2" class="farm-item__arrow">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          </template>
        </div>
      </div>

      <!-- Placeholder para relatórios futuros -->
      <div class="report-type-card report-type-card--soon">
        <div class="report-type-card__icon report-type-card__icon--muted">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="1.75">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div class="report-type-card__body">
          <div class="report-type-card__title-row">
            <h2 class="report-type-card__title">Relatório de vendas por lavoura</h2>
            <span class="soon-badge">Em breve</span>
          </div>
          <p class="report-type-card__desc">
            Resultado financeiro completo cruzando o custo de produção com a receita das vendas.
          </p>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.reports {
  padding: 2rem 1.5rem;
  max-width: 860px;
  margin: 0 auto;
}

/* ── Cabeçalho ──────────────────────────────────────────────────── */
.reports__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.reports__subtitle {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-bottom: 1.75rem;
}

/* ── Catálogo ───────────────────────────────────────────────────── */
.catalog {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.report-type-card {
  display: flex;
  gap: 1.25rem;
  padding: 1.5rem;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
}

.report-type-card--soon {
  opacity: 0.6;
}

.report-type-card__icon {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-sm);
  background: var(--color-primary-light);
  color: var(--color-primary);
  flex-shrink: 0;
  padding: 0.75rem;
  box-sizing: border-box;
}

.report-type-card__icon--muted {
  background: var(--color-background);
  color: var(--color-text-muted);
}

.report-type-card__body {
  flex: 1;
  min-width: 0;
}

.report-type-card__title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.375rem;
}

.report-type-card__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 0.375rem;
}

.report-type-card__title-row .report-type-card__title {
  margin-bottom: 0;
}

.report-type-card__desc {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.5;
  margin-bottom: 1.25rem;
}

.report-type-card--soon .report-type-card__desc {
  margin-bottom: 0;
}

.report-type-card__select-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.625rem;
}

/* ── Badge "Em breve" ───────────────────────────────────────────── */
.soon-badge {
  display: inline-flex;
  padding: 0.15rem 0.625rem;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 600;
  background: var(--color-background);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  white-space: nowrap;
}

/* ── Lista de lavouras ──────────────────────────────────────────── */
.farm-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.farm-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--color-background);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: border-color 0.15s, background 0.15s;
  width: 100%;
}

.farm-item:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.farm-item__info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  flex: 1;
  min-width: 0;
}

.farm-item__name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.farm-item__area {
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.farm-item__status {
  display: inline-flex;
  padding: 0.2rem 0.625rem;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.farm-item__arrow {
  color: var(--color-text-muted);
  flex-shrink: 0;
  transition: color 0.15s;
}

.farm-item:hover .farm-item__arrow {
  color: var(--color-primary);
}

/* ── Estados inline ─────────────────────────────────────────────── */
.error-inline {
  font-size: 0.875rem;
  color: var(--color-error);
  padding: 0.5rem 0;
}

.loading-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.empty-inline {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  padding: 0.5rem 0;
}

.spinner {
  display: inline-block;
  width: 28px;
  height: 28px;
  border: 2.5px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.spinner--sm {
  width: 14px;
  height: 14px;
  border-width: 2px;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── Responsividade ─────────────────────────────────────────────── */
@media (max-width: 600px) {
  .reports { padding: 1.25rem 1rem; }

  .report-type-card {
    flex-direction: column;
    gap: 1rem;
  }

  .report-type-card__icon {
    width: 40px;
    height: 40px;
    padding: 0.625rem;
  }
}
</style>