<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/accountStore'
import quotationService from '@/services/quotationService'
import type { QuotationGroupResponse, QuotationResponse } from '@/services/quotationService'
import ConfirmModal from '@/components/ConfirmModal.vue'

const router       = useRouter()
const accountStore = useAccountStore()
const accountId    = computed(() => accountStore.selectedAccount?.id)

const groups   = ref<QuotationGroupResponse[]>([])
const loading  = ref(true)
const error    = ref('')

const expandedProduct = ref<string | null>(null)

const confirmModal = ref({
  open: false, title: '', message: '', confirmLabel: 'Remover',
  action: null as (() => Promise<void>) | null, loading: false,
})

const totalSavings = computed(() =>
  groups.value.reduce((sum, g) => sum + Number(g.potentialSavings), 0)
)

onMounted(async () => {
  await loadGroups()
})

async function loadGroups() {
  if (!accountId.value) return
  loading.value = true
  error.value   = ''
  try {
    const { data } = await quotationService.listGrouped(accountId.value)
    groups.value = data.data
  } catch {
    error.value = 'Erro ao carregar cotações.'
  } finally {
    loading.value = false
  }
}

function toggleExpand(productName: string) {
  expandedProduct.value = expandedProduct.value === productName ? null : productName
}

// Navega para o formulário de criação com o nome do produto pré-definido
// O evento é parado para não acionar o toggleExpand do header pai
function addSupplier(event: MouseEvent, productName: string) {
  event.stopPropagation()
  router.push({ name: 'quotation-create', query: { productName } })
}

function openConfirm(title: string, message: string, action: () => Promise<void>) {
  confirmModal.value = { open: true, title, message, confirmLabel: 'Remover', action, loading: false }
}

async function handleConfirm() {
  if (!confirmModal.value.action) return
  confirmModal.value.loading = true
  try {
    await confirmModal.value.action()
  } finally {
    confirmModal.value.open    = false
    confirmModal.value.loading = false
    confirmModal.value.action  = null
  }
}

async function handleDelete(quotation: QuotationResponse) {
  if (!accountId.value) return
  openConfirm(
    'Remover cotação',
    `Deseja remover a cotação de "${quotation.productName}" do fornecedor ${quotation.supplier}?`,
    async () => {
      await quotationService.delete(accountId.value!, quotation.id)
      await loadGroups()
    }
  )
}

function formatCurrency(value: number): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
}

function savingsPercent(group: QuotationGroupResponse): number {
  if (group.maxUnitPrice === 0) return 0
  return Math.round(((group.maxUnitPrice - group.minUnitPrice) / group.maxUnitPrice) * 100)
}
</script>

<template>
  <div class="quotations">

    <!-- Cabeçalho -->
    <div class="quotations__header">
      <div>
        <h1 class="quotations__title">Cotações</h1>
        <p class="quotations__subtitle">Compare preços de insumos e visualize sua economia</p>
      </div>
      <button class="btn-primary" @click="router.push({ name: 'quotation-create' })">
        + Nova cotação
      </button>
    </div>

    <!-- Card de economia total -->
    <div class="savings-banner" v-if="totalSavings > 0 && !loading">
      <div class="savings-banner__icon">💰</div>
      <div class="savings-banner__text">
        <span class="savings-banner__value">{{ formatCurrency(totalSavings) }}</span>
        <span class="savings-banner__label">de economia potencial escolhendo os fornecedores mais baratos</span>
      </div>
    </div>

    <div v-if="error" class="error-banner">{{ error }}</div>
    <div v-if="loading" class="loading-state"><span class="spinner" /></div>

    <div v-else-if="groups.length === 0" class="empty-state">
      <span class="empty-state__icon">📋</span>
      <p>Nenhuma cotação registrada ainda.</p>
      <button class="btn-primary" @click="router.push({ name: 'quotation-create' })">
        Registrar primeira cotação
      </button>
    </div>

    <!-- Grupos de produtos -->
    <div v-else class="groups-list">
      <div
        v-for="group in groups"
        :key="group.productName"
        class="group-card"
      >
        <!-- Cabeçalho do grupo -->
        <div class="group-card__header" @click="toggleExpand(group.productName)">
          <div class="group-card__info">
            <span class="group-card__name">{{ group.productName }}</span>
            <span class="group-card__count">
              {{ group.quotationCount }} cotação{{ group.quotationCount !== 1 ? 'ões' : '' }}
            </span>
          </div>

          <div class="group-card__metrics">
            <div class="metric">
              <span class="metric__label">Menor preço</span>
              <span class="metric__value metric__value--green">{{ formatCurrency(group.minUnitPrice) }}</span>
              <span class="metric__supplier">{{ group.cheapestSupplier }}</span>
            </div>
            <div class="metric">
              <span class="metric__label">Maior preço</span>
              <span class="metric__value metric__value--red">{{ formatCurrency(group.maxUnitPrice) }}</span>
            </div>
            <div class="metric" v-if="group.potentialSavings > 0">
              <span class="metric__label">Economia potencial</span>
              <span class="metric__value metric__value--savings">{{ formatCurrency(group.potentialSavings) }}</span>
              <span class="savings-pct">{{ savingsPercent(group) }}% mais barato</span>
            </div>
          </div>

          <!-- Botão "+ Fornecedor" — stopPropagation para não acionar o expand -->
          <button
            class="btn-add-supplier"
            :title="`Adicionar outro fornecedor para ${group.productName}`"
            @click="addSupplier($event, group.productName)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Fornecedor
          </button>

          <svg
            class="group-card__chevron"
            :class="{ 'group-card__chevron--open': expandedProduct === group.productName }"
            xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>

        <!-- Barra de economia visual -->
        <div v-if="group.quotationCount > 1 && group.potentialSavings > 0" class="group-card__bar">
          <div class="savings-bar">
            <div class="savings-bar__min" :style="{ width: (100 - savingsPercent(group)) + '%' }">
              <span>{{ formatCurrency(group.minUnitPrice) }}</span>
            </div>
            <div class="savings-bar__savings" :style="{ width: savingsPercent(group) + '%' }">
              <span v-if="savingsPercent(group) > 15">{{ savingsPercent(group) }}% economia</span>
            </div>
          </div>
        </div>

        <!-- Lista de cotações expandida -->
        <Transition name="expand">
          <div v-if="expandedProduct === group.productName" class="group-card__quotations">
            <div
              v-for="(q, index) in group.quotations"
              :key="q.id"
              class="quotation-row"
              :class="{ 'quotation-row--cheapest': index === 0 && group.quotationCount > 1 }"
            >
              <div class="quotation-row__info">
                <span class="quotation-row__supplier">
                  {{ q.supplier }}
                  <span v-if="index === 0 && group.quotationCount > 1" class="best-badge">✓ Melhor preço</span>
                </span>
                <span class="quotation-row__meta">
                  {{ formatDate(q.quotationDate) }}
                  <template v-if="q.farmName"> · {{ q.farmName }}</template>
                  <template v-if="q.notes"> · {{ q.notes }}</template>
                </span>
              </div>

              <div class="quotation-row__prices">
                <div class="quotation-row__price-block">
                  <span class="quotation-row__unit-price">{{ formatCurrency(q.unitPrice) }}</span>
                  <span class="quotation-row__unit-label">por {{ q.unit ?? 'unidade' }}</span>
                </div>
                <div class="quotation-row__price-block">
                  <span class="quotation-row__qty">{{ q.quantity }} {{ q.unit ?? 'un' }}</span>
                  <span class="quotation-row__total">{{ formatCurrency(q.totalPrice) }}</span>
                </div>
              </div>

              <div class="quotation-row__actions">
                <button
                  class="icon-btn"
                  title="Editar"
                  @click="router.push({ name: 'quotation-edit', params: { quotationId: q.id } })"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                       fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button class="icon-btn icon-btn--danger" title="Remover" @click="handleDelete(q)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                       fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14H6L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/>
                    <path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </Transition>

      </div>
    </div>

    <ConfirmModal
      :open="confirmModal.open"
      :title="confirmModal.title"
      :message="confirmModal.message"
      :confirm-label="confirmModal.confirmLabel"
      :loading="confirmModal.loading"
      variant="danger"
      @confirm="handleConfirm"
      @cancel="confirmModal.open = false"
    />
  </div>
</template>

<style scoped>
.quotations {
  padding: 2rem 1.5rem;
  max-width: 1000px;
  margin: 0 auto;
}

.quotations__header {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;
}
.quotations__title { font-size: 1.5rem; font-weight: 700; color: var(--color-text); margin: 0 0 0.25rem; }
.quotations__subtitle { font-size: 0.875rem; color: var(--color-text-muted); margin: 0; }

/* ── Banner de economia ─────────────────────────────────────────── */
.savings-banner {
  display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1.25rem;
  background: #f0fdf4;
  border: 1.5px solid #6ee7b7;
  border-radius: var(--radius-md); margin-bottom: 1.25rem; flex-wrap: wrap;
}
.savings-banner__icon { font-size: 1.25rem; }
.savings-banner__text { display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; }
.savings-banner__value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #059669;
  letter-spacing: -0.02em;
}
.savings-banner__label { font-size: 0.875rem; color: #065f46; }

.error-banner {
  padding: 0.75rem 1rem; background: var(--color-error-light);
  border: 1px solid #fecaca; border-radius: var(--radius-sm);
  color: var(--color-error); font-size: 0.875rem; margin-bottom: 1rem;
}
.loading-state { display: flex; justify-content: center; padding: 4rem 0; }
.spinner {
  display: inline-block; width: 28px; height: 28px;
  border: 2.5px solid var(--color-border); border-top-color: var(--color-primary);
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
  padding: 3rem; background: var(--color-card); border: 1.5px dashed var(--color-border);
  border-radius: var(--radius-md); text-align: center; color: var(--color-text-muted);
}
.empty-state__icon { font-size: 2.5rem; }

/* ── Grupos ─────────────────────────────────────────────────────── */
.groups-list { display: flex; flex-direction: column; gap: 0.75rem; }
.group-card {
  background: var(--color-card); border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md); box-shadow: var(--shadow-card); overflow: hidden;
}

.group-card__header {
  display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem;
  cursor: pointer; transition: background 0.12s; flex-wrap: wrap;
}
.group-card__header:hover { background: var(--color-background); }

.group-card__info { display: flex; flex-direction: column; gap: 0.15rem; min-width: 140px; }
.group-card__name { font-size: 1rem; font-weight: 700; color: var(--color-text); }
.group-card__count { font-size: 0.78rem; color: var(--color-text-muted); }

.group-card__metrics { display: flex; gap: 1.5rem; flex: 1; flex-wrap: wrap; }

.metric { display: flex; flex-direction: column; gap: 0.1rem; }
.metric__label { font-size: 0.72rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
.metric__value { font-size: 1rem; font-weight: 700; color: var(--color-text); }
.metric__value--green   { color: #059669; }
.metric__value--red     { color: #dc2626; }
.metric__value--savings { color: #059669; }
.metric__supplier { font-size: 0.75rem; color: var(--color-text-muted); }

.savings-pct {
  font-size: 0.72rem; font-weight: 600; color: #059669;
  background: #d1fae5; padding: 0.1rem 0.4rem; border-radius: 10px; width: fit-content;
}

/* ── Botão "+ Fornecedor" ───────────────────────────────────────── */
.btn-add-supplier {
  display: inline-flex; align-items: center; gap: 0.3rem;
  padding: 0.35rem 0.75rem;
  border: 1.5px solid var(--color-primary);
  border-radius: var(--radius-sm);
  background: transparent;
  font-family: inherit; font-size: 0.78rem; font-weight: 600;
  color: var(--color-primary);
  cursor: pointer; white-space: nowrap;
  transition: background 0.15s, color 0.15s;
  /* Garante que não receba o cursor pointer do header pai */
  position: relative; z-index: 1;
}
.btn-add-supplier:hover {
  background: var(--color-primary-light);
}

.group-card__chevron {
  color: var(--color-text-muted); flex-shrink: 0;
  transition: transform 0.2s ease; margin-left: auto;
}
.group-card__chevron--open { transform: rotate(180deg); }

/* ── Barra de economia visual ───────────────────────────────────── */
.group-card__bar { padding: 0 1.25rem 0.875rem; }
.savings-bar {
  height: 24px; border-radius: var(--radius-sm); overflow: hidden;
  display: flex; font-size: 0.72rem; font-weight: 600;
}
.savings-bar__min {
  background: var(--color-primary); display: flex; align-items: center;
  padding: 0 0.5rem; color: #fff; white-space: nowrap; overflow: hidden;
  min-width: 0; transition: width 0.4s ease;
}
.savings-bar__savings {
  background: #d1fae5; display: flex; align-items: center;
  padding: 0 0.5rem; color: #059669; white-space: nowrap;
  overflow: hidden; transition: width 0.4s ease;
}

/* ── Cotações expandidas ─────────────────────────────────────────── */
.group-card__quotations { border-top: 1px solid var(--color-border); }

.quotation-row {
  display: flex; align-items: center; gap: 1rem; padding: 0.875rem 1.25rem;
  border-bottom: 1px solid var(--color-border); transition: background 0.12s; flex-wrap: wrap;
}
.quotation-row:last-child { border-bottom: none; }
.quotation-row:hover { background: var(--color-background); }

.quotation-row--cheapest { background: #f0fdf4; }
.quotation-row--cheapest .quotation-row__supplier,
.quotation-row--cheapest .quotation-row__meta,
.quotation-row--cheapest .quotation-row__unit-price,
.quotation-row--cheapest .quotation-row__unit-label,
.quotation-row--cheapest .quotation-row__qty,
.quotation-row--cheapest .quotation-row__total { color: #14532d; }
.quotation-row--cheapest .best-badge { background: #bbf7d0; color: #14532d; }
.quotation-row--cheapest .icon-btn { background: #dcfce7; border-color: #86efac; color: #15803d; }
.quotation-row--cheapest .icon-btn:hover { background: #bbf7d0; border-color: #4ade80; color: #14532d; }

.quotation-row__info { display: flex; flex-direction: column; gap: 0.2rem; flex: 1; min-width: 0; }
.quotation-row__supplier {
  font-size: 0.9rem; font-weight: 600; color: var(--color-text);
  display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
}
.best-badge {
  display: inline-flex; padding: 0.1rem 0.5rem; border-radius: 10px;
  font-size: 0.7rem; font-weight: 700; background: #d1fae5; color: #059669;
}
.quotation-row__meta {
  font-size: 0.78rem; color: var(--color-text-muted);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.quotation-row__prices { display: flex; gap: 1.5rem; flex-shrink: 0; align-items: center; }
.quotation-row__price-block { display: flex; flex-direction: column; gap: 0.1rem; text-align: right; }
.quotation-row__unit-price { font-size: 1rem; font-weight: 700; color: var(--color-text); }
.quotation-row__unit-label { font-size: 0.72rem; color: var(--color-text-muted); }
.quotation-row__qty { font-size: 0.8rem; color: var(--color-text-muted); }
.quotation-row__total { font-size: 0.875rem; font-weight: 600; color: var(--color-text); }
.quotation-row__actions { display: flex; gap: 0.375rem; flex-shrink: 0; }

.icon-btn {
  display: flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm); background: var(--color-card);
  color: var(--color-text-muted); cursor: pointer; font-family: inherit; transition: all 0.15s;
}
.icon-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.icon-btn--danger:hover { border-color: var(--color-error); color: var(--color-error); background: var(--color-error-light); }

.btn-primary {
  padding: 0.6rem 1.25rem; background: var(--color-primary); color: #fff;
  border: none; border-radius: var(--radius-sm); font-family: inherit;
  font-size: 0.875rem; font-weight: 600; cursor: pointer; white-space: nowrap; transition: opacity 0.15s;
}
.btn-primary:hover { opacity: 0.85; }

.expand-enter-active, .expand-leave-active { transition: opacity 0.2s ease; }
.expand-enter-from, .expand-leave-to { opacity: 0; }

@media (max-width: 640px) {
  .quotations { padding: 1.25rem 1rem; }
  .group-card__metrics { gap: 1rem; }
  .quotation-row__prices { gap: 0.75rem; }
  .quotations__header { flex-direction: column; }
  .btn-primary { width: 100%; text-align: center; }
  /* No mobile o botão fica abaixo das métricas */
  .btn-add-supplier { margin-left: 0; }
}
</style>