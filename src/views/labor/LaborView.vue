<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import farmService from '@/services/farmService'
import laborService from '@/services/laborService'
import type { FarmResponse } from '@/services/farmService'
import type {
  EmployeePaymentResponse,
  EmployeeResponse,
  EmployeeWorkEntryResponse,
} from '@/services/laborService'
import type { PageResponse } from '@/services/transactionService'

type TabKey = 'entries' | 'employees' | 'payments'

const accountStore = useAccountStore()
const accountId = computed(() => accountStore.selectedAccount?.id)

const activeTab = ref<TabKey>('entries')
const employees = ref<EmployeeResponse[]>([])
const farms = ref<FarmResponse[]>([])
const entries = ref<PageResponse<EmployeeWorkEntryResponse> | null>(null)
const payments = ref<PageResponse<EmployeePaymentResponse> | null>(null)

const loading = ref(true)
const entriesLoading = ref(false)
const paymentsLoading = ref(false)
const savingEmployee = ref(false)
const savingEntry = ref(false)
const payingEmployee = ref(false)
const error = ref('')
const notice = ref('')

const globalPendingCount = ref(0)

const entryPage = ref(0)
const paymentPage = ref(0)
const pageSize = 10

const employeeForm = ref({
  id: '',
  name: '',
  dailyRate: '',
  notes: '',
})

const entryForm = ref({
  id: '',
  employeeId: '',
  farmId: '',
  workDate: today(),
  dailyRate: '',
  notes: '',
})

const entryFilters = ref({
  employeeId: '',
  farmId: '',
  status: 'pending' as 'pending' | 'paid' | 'all',
  startDate: startOfWeek(),
  endDate: endOfWeek(),
})

const paymentForm = ref({
  employeeId: '',
  periodStart: startOfWeek(),
  periodEnd: endOfWeek(),
  paymentDate: today(),
  notes: '',
})

const paymentFilters = ref({
  employeeId: '',
  startDate: '',
  endDate: '',
})

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'entries', label: 'Diárias' },
  { key: 'employees', label: 'Funcionários' },
  { key: 'payments', label: 'Pagamentos' },
]

const activeEmployees = computed(() => employees.value.filter((employee) => employee.active))
const selectedEntryEmployee = computed(() =>
  employees.value.find((employee) => employee.id === entryForm.value.employeeId)
)
const selectedPaymentEmployee = computed(() =>
  employees.value.find((employee) => employee.id === paymentForm.value.employeeId)
)

watch(() => entryForm.value.employeeId, () => {
  if (!entryForm.value.id && selectedEntryEmployee.value) {
    entryForm.value.dailyRate = String(Number(selectedEntryEmployee.value.dailyRate))
  }
})

onMounted(() => {
  loadInitialData()
})

async function loadInitialData() {
  if (!accountId.value) return
  loading.value = true
  error.value = ''
  try {
    await Promise.all([loadEmployees(), loadFarms()])
    await Promise.all([loadEntries(), loadPayments(), loadGlobalPendingCount()])
  } catch {
    error.value = 'Não foi possível carregar a mão de obra.'
  } finally {
    loading.value = false
  }
}

async function loadEmployees() {
  if (!accountId.value) return
  const { data } = await laborService.findEmployees(accountId.value)
  employees.value = data.data
}

async function loadFarms() {
  if (!accountId.value) return
  const { data } = await farmService.findAll(accountId.value)
  farms.value = data.data
}

async function loadGlobalPendingCount() {
  if (!accountId.value) return
  try {
    const { data } = await laborService.findWorkEntries(accountId.value, { paid: false, size: 1 })
    globalPendingCount.value = data.data.totalElements
  } catch {
    // non-critical — pill shows last known value
  }
}

async function loadEntries() {
  if (!accountId.value) return
  entriesLoading.value = true
  try {
    const { data } = await laborService.findWorkEntries(accountId.value, {
      employeeId: entryFilters.value.employeeId || undefined,
      farmId: entryFilters.value.farmId || undefined,
      paid: entryFilters.value.status === 'all' ? undefined : entryFilters.value.status === 'paid',
      startDate: entryFilters.value.startDate || undefined,
      endDate: entryFilters.value.endDate || undefined,
      page: entryPage.value,
      size: pageSize,
    })
    entries.value = data.data
  } catch {
    error.value = 'Erro ao carregar diárias.'
  } finally {
    entriesLoading.value = false
  }
}

async function loadPayments() {
  if (!accountId.value) return
  paymentsLoading.value = true
  try {
    const { data } = await laborService.findPayments(accountId.value, {
      employeeId: paymentFilters.value.employeeId || undefined,
      startDate: paymentFilters.value.startDate || undefined,
      endDate: paymentFilters.value.endDate || undefined,
      page: paymentPage.value,
      size: pageSize,
    })
    payments.value = data.data
  } catch {
    error.value = 'Erro ao carregar pagamentos.'
  } finally {
    paymentsLoading.value = false
  }
}

async function saveEmployee() {
  if (!accountId.value || !employeeForm.value.name.trim() || !employeeForm.value.dailyRate) return
  savingEmployee.value = true
  clearMessages()
  try {
    const payload = {
      name: employeeForm.value.name.trim(),
      dailyRate: Number(employeeForm.value.dailyRate),
      notes: emptyToNull(employeeForm.value.notes),
    }
    if (employeeForm.value.id) {
      await laborService.updateEmployee(accountId.value, employeeForm.value.id, payload)
      notice.value = 'Funcionário atualizado.'
    } else {
      await laborService.createEmployee(accountId.value, payload)
      notice.value = 'Funcionário cadastrado.'
    }
    resetEmployeeForm()
    await loadEmployees()
  } catch {
    error.value = 'Não foi possível salvar o funcionário.'
  } finally {
    savingEmployee.value = false
  }
}

async function toggleEmployee(employee: EmployeeResponse) {
  if (!accountId.value) return
  clearMessages()
  try {
    if (employee.active) {
      await laborService.deactivateEmployee(accountId.value, employee.id)
      notice.value = 'Funcionário inativado.'
    } else {
      await laborService.activateEmployee(accountId.value, employee.id)
      notice.value = 'Funcionário ativado.'
    }
    await loadEmployees()
  } catch {
    error.value = 'Não foi possível alterar o status do funcionário.'
  }
}

function editEmployee(employee: EmployeeResponse) {
  activeTab.value = 'employees'
  employeeForm.value = {
    id: employee.id,
    name: employee.name,
    dailyRate: String(Number(employee.dailyRate)),
    notes: employee.notes ?? '',
  }
}

async function saveEntry() {
  if (!accountId.value || !entryForm.value.employeeId || !entryForm.value.workDate) return
  savingEntry.value = true
  clearMessages()
  try {
    const payload = {
      employeeId: entryForm.value.employeeId,
      farmId: entryForm.value.farmId || null,
      workDate: entryForm.value.workDate,
      dailyRate: entryForm.value.dailyRate ? Number(entryForm.value.dailyRate) : null,
      notes: emptyToNull(entryForm.value.notes),
    }
    if (entryForm.value.id) {
      await laborService.updateWorkEntry(accountId.value, entryForm.value.id, payload)
      notice.value = 'Diária atualizada.'
    } else {
      await laborService.createWorkEntry(accountId.value, payload)
      notice.value = 'Diária registrada como pendente.'
    }
    resetEntryForm()
    await Promise.all([loadEntries(), loadGlobalPendingCount()])
  } catch {
    error.value = 'Não foi possível salvar a diária. Verifique se já existe diária para este funcionário na data.'
  } finally {
    savingEntry.value = false
  }
}

function editEntry(entry: EmployeeWorkEntryResponse) {
  activeTab.value = 'entries'
  entryForm.value = {
    id: entry.id,
    employeeId: entry.employeeId,
    farmId: entry.farmId ?? '',
    workDate: entry.workDate,
    dailyRate: String(Number(entry.dailyRate)),
    notes: entry.notes ?? '',
  }
}

async function deleteEntry(entry: EmployeeWorkEntryResponse) {
  if (!accountId.value || entry.paid) return
  clearMessages()
  try {
    await laborService.deleteWorkEntry(accountId.value, entry.id)
    notice.value = 'Diária removida.'
    await Promise.all([loadEntries(), loadGlobalPendingCount()])
  } catch {
    error.value = 'Não foi possível remover a diária.'
  }
}

async function payEmployee() {
  if (!accountId.value || !paymentForm.value.employeeId) return
  payingEmployee.value = true
  clearMessages()
  try {
    const { data } = await laborService.payEmployee(accountId.value, {
      employeeId: paymentForm.value.employeeId,
      periodStart: paymentForm.value.periodStart,
      periodEnd: paymentForm.value.periodEnd,
      paymentDate: paymentForm.value.paymentDate,
      notes: emptyToNull(paymentForm.value.notes),
    })
    notice.value = `Pagamento efetivado: ${formatCurrency(Number(data.data.totalAmount))} em ${data.data.paidEntriesCount} diária(s).`
    resetPaymentForm()
    await Promise.all([loadEntries(), loadPayments(), loadGlobalPendingCount()])
  } catch {
    error.value = 'Não foi possível efetivar o pagamento. Confira se há diárias pendentes no período.'
  } finally {
    payingEmployee.value = false
  }
}

function applyEntryFilters() {
  entryPage.value = 0
  loadEntries()
}

function clearEntryFilters() {
  entryFilters.value = {
    employeeId: '',
    farmId: '',
    status: 'pending',
    startDate: startOfWeek(),
    endDate: endOfWeek(),
  }
  applyEntryFilters()
}

function applyPaymentFilters() {
  paymentPage.value = 0
  loadPayments()
}

function clearPaymentFilters() {
  paymentFilters.value = { employeeId: '', startDate: '', endDate: '' }
  applyPaymentFilters()
}

function goToEntryPage(page: number) {
  entryPage.value = page
  loadEntries()
}

function goToPaymentPage(page: number) {
  paymentPage.value = page
  loadPayments()
}

function resetEmployeeForm() {
  employeeForm.value = { id: '', name: '', dailyRate: '', notes: '' }
}

function resetEntryForm() {
  entryForm.value = {
    id: '',
    employeeId: '',
    farmId: '',
    workDate: today(),
    dailyRate: '',
    notes: '',
  }
}

function resetPaymentForm() {
  paymentForm.value = {
    employeeId: '',
    periodStart: startOfWeek(),
    periodEnd: endOfWeek(),
    paymentDate: today(),
    notes: '',
  }
}

function clearMessages() {
  error.value = ''
  notice.value = ''
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function startOfWeek() {
  const date = new Date()
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return date.toISOString().slice(0, 10)
}

function endOfWeek() {
  const date = new Date(startOfWeek() + 'T00:00:00')
  date.setDate(date.getDate() + 6)
  return date.toISOString().slice(0, 10)
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
}

function formatCurrency(value: number) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
</script>

<template>
  <div class="labor">
    <div class="labor__header">
      <div>
        <h1 class="labor__title">Mão de obra</h1>
        <p class="labor__subtitle">
          Diárias pendentes e pagamentos da conta <strong>{{ accountStore.selectedAccount?.name }}</strong>
        </p>
      </div>
      <div class="labor__summary">
        <div class="summary-pill">
          <span class="summary-pill__label">Diárias pendentes</span>
          <strong>{{ globalPendingCount }}</strong>
        </div>
      </div>
    </div>

    <div class="tabs" role="tablist" aria-label="Mão de obra">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === tab.key }"
        type="button"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="error" class="alert alert--error">{{ error }}</div>
    <div v-if="notice" class="alert alert--success">{{ notice }}</div>

    <div v-if="loading" class="loading-state"><span class="spinner" /></div>

    <template v-else>
      <section v-if="activeTab === 'entries'" class="labor-grid">
        <form class="panel panel--form" @submit.prevent="saveEntry">
          <div class="panel__header">
            <h2>{{ entryForm.id ? 'Editar diária' : 'Registrar diária' }}</h2>
            <button v-if="entryForm.id" class="btn-ghost" type="button" @click="resetEntryForm">
              Cancelar
            </button>
          </div>

          <label class="field">
            <span>Funcionário</span>
            <select v-model="entryForm.employeeId" required>
              <option value="">Selecione</option>
              <option v-for="employee in activeEmployees" :key="employee.id" :value="employee.id">
                {{ employee.name }}
              </option>
            </select>
          </label>

          <div class="form-row">
            <label class="field">
              <span>Data</span>
              <input v-model="entryForm.workDate" type="date" required />
            </label>
            <label class="field">
              <span>Valor</span>
              <input v-model="entryForm.dailyRate" type="number" min="0.01" step="0.01" />
            </label>
          </div>

          <label class="field">
            <span>Lavoura</span>
            <select v-model="entryForm.farmId">
              <option value="">Conta geral</option>
              <option v-for="farm in farms" :key="farm.id" :value="farm.id">
                {{ farm.name }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>Observações</span>
            <textarea v-model="entryForm.notes" rows="3" />
          </label>

          <button class="btn-primary" type="submit" :disabled="savingEntry">
            {{ savingEntry ? 'Registrando...' : entryForm.id ? 'Atualizar diária' : 'Registrar diária' }}
          </button>
        </form>

        <div class="panel panel--list">
          <div class="panel__header">
            <h2>Diárias registradas</h2>
          </div>

          <div class="filters-bar">
            <select v-model="entryFilters.employeeId" class="filter-control filter-control--wide" @change="applyEntryFilters">
              <option value="">Todos funcionários</option>
              <option v-for="employee in employees" :key="employee.id" :value="employee.id">
                {{ employee.name }}
              </option>
            </select>
            <select v-model="entryFilters.farmId" class="filter-control" @change="applyEntryFilters">
              <option value="">Todas lavouras</option>
              <option v-for="farm in farms" :key="farm.id" :value="farm.id">{{ farm.name }}</option>
            </select>
            <select v-model="entryFilters.status" class="filter-control" @change="applyEntryFilters">
              <option value="pending">Pendentes</option>
              <option value="paid">Pagas</option>
              <option value="all">Todas</option>
            </select>
            <input v-model="entryFilters.startDate" class="filter-control" type="date" @change="applyEntryFilters" />
            <input v-model="entryFilters.endDate" class="filter-control" type="date" @change="applyEntryFilters" />
            <button class="btn-ghost" type="button" @click="clearEntryFilters">Limpar</button>
          </div>

          <div v-if="entriesLoading" class="inline-loading"><span class="spinner" /></div>
          <div v-else-if="!entries || entries.content.length === 0" class="empty-state">
            Nenhuma diária encontrada.
          </div>
          <template v-else>
            <div class="table-wrapper">
              <table class="labor-table">
                <thead>
                  <tr>
                    <th>Funcionário</th>
                    <th>Data</th>
                    <th>Lavoura</th>
                    <th>Status</th>
                    <th class="col-right">Valor</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="entry in entries.content" :key="entry.id">
                    <td>
                      <strong>{{ entry.employeeName }}</strong>
                      <span v-if="entry.notes" class="muted-line">{{ entry.notes }}</span>
                    </td>
                    <td>{{ formatDate(entry.workDate) }}</td>
                    <td>{{ entry.farmName ?? 'Conta geral' }}</td>
                    <td>
                      <span class="badge" :class="entry.paid ? 'badge--paid' : 'badge--pending'">
                        {{ entry.paid ? 'Pago' : 'Pendente' }}
                      </span>
                    </td>
                    <td class="col-right value-cell">{{ formatCurrency(Number(entry.dailyRate)) }}</td>
                    <td class="actions-cell">
                      <div class="actions-inner" role="group" aria-label="Ações da diária">
                        <button class="btn-action" type="button" :disabled="entry.paid" @click="editEntry(entry)">
                          Editar
                        </button>
                        <button class="btn-action btn-action--danger" type="button" :disabled="entry.paid" @click="deleteEntry(entry)">
                          Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="pagination" v-if="entries.totalPages > 1">
              <button class="page-btn" type="button" :disabled="entries.page === 0" @click="goToEntryPage(entries.page - 1)">‹</button>
              <span>Página {{ entries.page + 1 }} de {{ entries.totalPages }}</span>
              <button class="page-btn" type="button" :disabled="entries.last" @click="goToEntryPage(entries.page + 1)">›</button>
            </div>
          </template>
        </div>
      </section>

      <section v-else-if="activeTab === 'employees'" class="labor-grid">
        <form class="panel panel--form" @submit.prevent="saveEmployee">
          <div class="panel__header">
            <h2>{{ employeeForm.id ? 'Editar funcionário' : 'Novo funcionário' }}</h2>
            <button v-if="employeeForm.id" class="btn-ghost" type="button" @click="resetEmployeeForm">
              Cancelar
            </button>
          </div>

          <label class="field">
            <span>Nome</span>
            <input v-model.trim="employeeForm.name" maxlength="150" required />
          </label>
          <label class="field">
            <span>Valor da diária</span>
            <input v-model="employeeForm.dailyRate" type="number" min="0.01" step="0.01" required />
          </label>
          <label class="field">
            <span>Observações</span>
            <textarea v-model="employeeForm.notes" rows="3" />
          </label>
          <button class="btn-primary" type="submit" :disabled="savingEmployee">
            {{ savingEmployee ? 'Salvando...' : employeeForm.id ? 'Atualizar' : 'Cadastrar' }}
          </button>
        </form>

        <div class="panel panel--list">
          <div class="panel__header">
            <h2>Funcionários</h2>
          </div>
          <div v-if="employees.length === 0" class="empty-state">Nenhum funcionário cadastrado.</div>
          <div v-else class="employee-list">
            <article v-for="employee in employees" :key="employee.id" class="employee-row">
              <div>
                <strong>{{ employee.name }}</strong>
                <span class="muted-line">{{ formatCurrency(Number(employee.dailyRate)) }} por diária</span>
                <span v-if="employee.notes" class="muted-line">{{ employee.notes }}</span>
              </div>
              <div class="row-actions">
                <span class="badge" :class="employee.active ? 'badge--active' : 'badge--inactive'">
                  {{ employee.active ? 'Ativo' : 'Inativo' }}
                </span>
                <button class="btn-action" type="button" @click="editEmployee(employee)">Editar</button>
                <button class="btn-action" type="button" @click="toggleEmployee(employee)">
                  {{ employee.active ? 'Inativar' : 'Ativar' }}
                </button>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section v-else class="labor-grid">
        <form class="panel panel--form" @submit.prevent="payEmployee">
          <div class="panel__header">
            <h2>Efetivar pagamento</h2>
          </div>

          <label class="field">
            <span>Funcionário</span>
            <select v-model="paymentForm.employeeId" required>
              <option value="">Selecione</option>
              <option v-for="employee in activeEmployees" :key="employee.id" :value="employee.id">
                {{ employee.name }}
              </option>
            </select>
          </label>

          <div class="form-row">
            <label class="field">
              <span>Início</span>
              <input v-model="paymentForm.periodStart" type="date" required />
            </label>
            <label class="field">
              <span>Fim</span>
              <input v-model="paymentForm.periodEnd" type="date" required />
            </label>
          </div>

          <label class="field">
            <span>Data do pagamento</span>
            <input v-model="paymentForm.paymentDate" type="date" required />
          </label>

          <label class="field">
            <span>Observações</span>
            <textarea v-model="paymentForm.notes" rows="3" />
          </label>

          <div v-if="selectedPaymentEmployee" class="payment-hint">
            Diária atual: <strong>{{ formatCurrency(Number(selectedPaymentEmployee.dailyRate)) }}</strong>
          </div>

          <button class="btn-primary" type="submit" :disabled="payingEmployee">
            {{ payingEmployee ? 'Registrando...' : 'Registrar pagamento' }}
          </button>
        </form>

        <div class="panel panel--list">
          <div class="panel__header">
            <h2>Histórico de pagamentos</h2>
          </div>

          <div class="filters-bar">
            <select v-model="paymentFilters.employeeId" class="filter-control filter-control--wide" @change="applyPaymentFilters">
              <option value="">Todos funcionários</option>
              <option v-for="employee in employees" :key="employee.id" :value="employee.id">
                {{ employee.name }}
              </option>
            </select>
            <input v-model="paymentFilters.startDate" class="filter-control" type="date" @change="applyPaymentFilters" />
            <input v-model="paymentFilters.endDate" class="filter-control" type="date" @change="applyPaymentFilters" />
            <button class="btn-ghost" type="button" @click="clearPaymentFilters">Limpar</button>
          </div>

          <div v-if="paymentsLoading" class="inline-loading"><span class="spinner" /></div>
          <div v-else-if="!payments || payments.content.length === 0" class="empty-state">
            Nenhum pagamento encontrado.
          </div>
          <template v-else>
            <div class="payment-list">
              <article v-for="payment in payments.content" :key="payment.id" class="payment-row">
                <div>
                  <strong>{{ payment.employeeName }}</strong>
                  <span class="muted-line">
                    {{ formatDate(payment.periodStart) }} até {{ formatDate(payment.periodEnd) }}
                  </span>
                  <span class="muted-line">
                    {{ payment.paidEntriesCount }} diária(s) · pagamento em {{ formatDate(payment.paymentDate) }}
                  </span>
                </div>
                <div class="payment-row__amount">
                  {{ formatCurrency(Number(payment.totalAmount)) }}
                  <span>{{ payment.generatedExpenses.length }} despesa(s)</span>
                </div>
              </article>
            </div>
            <div class="pagination" v-if="payments.totalPages > 1">
              <button class="page-btn" type="button" :disabled="payments.page === 0" @click="goToPaymentPage(payments.page - 1)">‹</button>
              <span>Página {{ payments.page + 1 }} de {{ payments.totalPages }}</span>
              <button class="page-btn" type="button" :disabled="payments.last" @click="goToPaymentPage(payments.page + 1)">›</button>
            </div>
          </template>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.labor {
  max-width: 1180px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.labor__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.labor__title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text);
}

.labor__subtitle {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.labor__summary {
  display: flex;
  gap: 0.625rem;
  flex-wrap: wrap;
}

.summary-pill {
  min-width: 150px;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-card);
  box-shadow: var(--shadow-card);
}

.summary-pill__label {
  display: block;
  margin-bottom: 0.125rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.summary-pill strong {
  color: var(--color-text);
  font-size: 1rem;
}

.tabs {
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.25rem;
  margin-bottom: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-card);
}

.tab-btn {
  height: 34px;
  padding: 0 0.875rem;
  border: none;
  border-radius: calc(var(--radius-sm) - 2px);
  background: transparent;
  color: var(--color-text-muted);
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

.tab-btn--active {
  background: var(--color-primary);
  color: #fff;
}

.alert {
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
}

.alert--error {
  border: 1px solid #fecaca;
  background: var(--color-error-light);
  color: var(--color-error);
}

.alert--success {
  border: 1px solid var(--color-success);
  background: var(--color-success-light);
  color: var(--color-success);
}

.labor-grid {
  display: grid;
  grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

.panel {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-card);
  box-shadow: var(--shadow-card);
}

.panel--form {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  position: sticky;
  top: 1rem;
}

.panel--list {
  min-width: 0;
  overflow: hidden;
}

.panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.panel--list .panel__header {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.panel__header h2 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.field span {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.field input,
.field select,
.field textarea,
.filter-control {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-background);
  color: var(--color-text);
  font-family: inherit;
  font-size: 0.875rem;
}

.field input,
.field select,
.filter-control {
  height: 38px;
  padding: 0 0.75rem;
}

.field textarea {
  resize: vertical;
  padding: 0.625rem 0.75rem;
}

.field input:focus,
.field select:focus,
.field textarea:focus,
.filter-control:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.625rem;
}

.filters-bar {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(138px, 1fr));
  gap: 0.5rem;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.filter-control--wide {
  grid-column: span 2;
}

.btn-primary,
.btn-ghost,
.btn-action,
.page-btn {
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s, border-color 0.15s, color 0.15s, background 0.15s;
}

.btn-primary {
  height: 40px;
  border: none;
  background: var(--color-primary);
  color: #fff;
  font-size: 0.875rem;
}

.btn-primary:hover,
.btn-ghost:hover,
.btn-action:hover,
.page-btn:hover:not(:disabled) {
  opacity: 0.85;
}

.btn-primary:disabled,
.btn-action:disabled,
.page-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-ghost {
  min-height: 34px;
  padding: 0 0.75rem;
  border: 1px solid var(--color-border);
  background: var(--color-card);
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}

.btn-action {
  min-height: 32px;
  padding: 0 0.625rem;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}

.btn-action--danger:hover {
  border-color: var(--color-error);
  background: var(--color-error-light);
  color: var(--color-error);
}

.loading-state,
.inline-loading,
.empty-state {
  display: flex;
  justify-content: center;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.inline-loading {
  padding: 2rem 1rem;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 2.5px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.table-wrapper {
  overflow-x: auto;
}

.labor-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.labor-table thead {
  background: var(--color-surface);
}

.labor-table th {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 700;
  text-align: left;
  text-transform: uppercase;
}

.labor-table td {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
  vertical-align: middle;
}

.labor-table tbody tr:last-child td {
  border-bottom: none;
}

.col-right {
  text-align: right;
}

.value-cell {
  font-weight: 700;
  white-space: nowrap;
}

.actions-cell {
  white-space: nowrap;
}

.actions-inner {
  display: flex;
  gap: 0.375rem;
  justify-content: flex-end;
}

.muted-line {
  display: block;
  margin-top: 0.125rem;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.625rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}

.badge--paid {
  background: var(--color-success-light);
  color: var(--color-success);
}

.badge--pending {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.badge--active {
  background: var(--color-success-light);
  color: var(--color-success);
}

.badge--inactive {
  background: var(--color-surface);
  color: var(--color-text-muted);
}

.employee-list,
.payment-list {
  display: flex;
  flex-direction: column;
}

.employee-row,
.payment-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.employee-row:last-child,
.payment-row:last-child {
  border-bottom: none;
}

.row-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.payment-hint {
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.payment-row__amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.125rem;
  color: var(--color-primary);
  font-weight: 800;
  white-space: nowrap;
}

.payment-row__amount span {
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.625rem;
  padding: 0.875rem 1rem;
  border-top: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.page-btn {
  width: 34px;
  height: 34px;
  border: 1px solid var(--color-border);
  background: var(--color-card);
  color: var(--color-text);
  font-size: 1.125rem;
}

@media (max-width: 920px) {
  .labor-grid {
    grid-template-columns: 1fr;
  }

  .panel--form {
    position: static;
  }
}

@media (max-width: 640px) {
  .labor {
    padding: 1.25rem 1rem;
  }

  .tabs {
    width: 100%;
  }

  .tab-btn {
    flex: 1;
  }

  .labor__summary,
  .summary-pill,
  .btn-primary {
    width: 100%;
  }

  .form-row,
  .filters-bar {
    grid-template-columns: 1fr;
  }

  .employee-row,
  .payment-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .row-actions,
  .payment-row__amount {
    align-items: flex-start;
  }
}
</style>
