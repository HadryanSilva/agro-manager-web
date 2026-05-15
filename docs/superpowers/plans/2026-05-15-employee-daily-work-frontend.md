# Employee Daily Work Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the producer-mode UI for employee daily work: employee management, daily work entries, pending totals, and employee-period payments that generate backend expenses.

**Architecture:** Add one producer navigation item, `Mao de obra`, backed by a focused `laborService.ts`. The first frontend cut uses a single routed page, `LaborView.vue`, with dense operational tabs for Funcionarios, Diarias, and Pagamentos so the workflow stays in one place and does not become a marketing-style page. The page talks to the backend endpoints added in `codex/employee-daily-work` and relies on existing farm/transaction/report behavior for financial visibility after payment.

**Tech Stack:** Vue 3, TypeScript, Vue Router, Pinia account store, Axios service layer, CSS variables, Vite, vue-tsc. Verification uses `npm run type-check`, `npm run test:services`, and `npm run build`.

---

## File Map

**Create:**
- `src/services/laborService.ts` — typed API client for employees, work entries, and payments.
- `src/views/labor/LaborView.vue` — producer-mode labor workspace with tabs, forms, lists, filters, and payment action.

**Modify:**
- `src/router/index.ts` — add route `/app/labor` as child route named `labor`.
- `src/layouts/AppLayout.vue` — add `Mao de obra` nav item and active-route handling.
- `src/components/SvgIcon.vue` — reuse existing `users` icon in nav; no icon change required unless the type union already blocks it.

**Backend dependency:**
- The frontend assumes these backend endpoints are available:
  - `/accounts/{accountId}/employees`
  - `/accounts/{accountId}/employee-work-entries`
  - `/accounts/{accountId}/employee-payments`

---

## Task 1: Add Labor Service

**Files:**
- Create: `src/services/laborService.ts`

- [ ] **Step 1: Create service types**

Create `src/services/laborService.ts` with:

```typescript
import api from './api'
import {
  normalizeListResponse,
  normalizeObjectResponse,
  normalizePagePayload,
  type ListPayload,
  type ObjectPayload,
} from './responseUtils'
import type { PageResponse } from './transactionService'

export interface EmployeeResponse {
  id: string
  name: string
  dailyRate: number
  active: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface EmployeeRequest {
  name: string
  dailyRate: number
  notes?: string
}

export interface EmployeeWorkEntryResponse {
  id: string
  employeeId: string
  employeeName: string
  farmId: string | null
  farmName: string | null
  workDate: string
  dailyRate: number
  paid: boolean
  paymentId: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface EmployeeWorkEntryRequest {
  employeeId: string
  farmId?: string | null
  workDate: string
  dailyRate?: number
  notes?: string
}

export interface WorkEntryFilters {
  employeeId?: string
  farmId?: string
  paid?: boolean
  startDate?: string
  endDate?: string
  page?: number
  size?: number
}

export interface GeneratedExpenseResponse {
  expenseId: string
  farmId: string | null
  farmName: string | null
  amount: number
}

export interface EmployeePaymentResponse {
  id: string
  employeeId: string
  employeeName: string
  periodStart: string
  periodEnd: string
  paymentDate: string
  totalAmount: number
  paidEntriesCount: number
  notes: string | null
  generatedExpenses: GeneratedExpenseResponse[]
  createdAt: string
  updatedAt: string
}

export interface EmployeePaymentRequest {
  employeeId: string
  periodStart: string
  periodEnd: string
  paymentDate: string
  notes?: string
}

export interface PaymentFilters {
  employeeId?: string
  startDate?: string
  endDate?: string
  page?: number
  size?: number
}
```

- [ ] **Step 2: Add query param helper**

Below the types, add:

```typescript
function cleanParams<T extends Record<string, unknown>>(filters: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
  ) as Partial<T>
}
```

- [ ] **Step 3: Add employee methods**

Add:

```typescript
const laborService = {
  createEmployee: (accountId: string, payload: EmployeeRequest) =>
    api
      .post<{ data: ObjectPayload<EmployeeResponse> }>(`/accounts/${accountId}/employees`, payload)
      .then(normalizeObjectResponse<EmployeeResponse>),

  listEmployees: (accountId: string, active?: boolean) =>
    api
      .get<{ data: ListPayload<EmployeeResponse> }>(`/accounts/${accountId}/employees`, {
        params: active === undefined ? undefined : { active },
      })
      .then(normalizeListResponse<EmployeeResponse>),

  getEmployee: (accountId: string, employeeId: string) =>
    api
      .get<{ data: ObjectPayload<EmployeeResponse> }>(`/accounts/${accountId}/employees/${employeeId}`)
      .then(normalizeObjectResponse<EmployeeResponse>),

  updateEmployee: (accountId: string, employeeId: string, payload: EmployeeRequest) =>
    api
      .put<{ data: ObjectPayload<EmployeeResponse> }>(`/accounts/${accountId}/employees/${employeeId}`, payload)
      .then(normalizeObjectResponse<EmployeeResponse>),

  activateEmployee: (accountId: string, employeeId: string) =>
    api
      .patch<{ data: ObjectPayload<EmployeeResponse> }>(`/accounts/${accountId}/employees/${employeeId}/activate`)
      .then(normalizeObjectResponse<EmployeeResponse>),

  deactivateEmployee: (accountId: string, employeeId: string) =>
    api
      .patch<{ data: ObjectPayload<EmployeeResponse> }>(`/accounts/${accountId}/employees/${employeeId}/deactivate`)
      .then(normalizeObjectResponse<EmployeeResponse>),
}
```

- [ ] **Step 4: Add work-entry and payment methods**

Extend the same `laborService` object with:

```typescript
  createWorkEntry: (accountId: string, payload: EmployeeWorkEntryRequest) =>
    api
      .post<{ data: ObjectPayload<EmployeeWorkEntryResponse> }>(`/accounts/${accountId}/employee-work-entries`, payload)
      .then(normalizeObjectResponse<EmployeeWorkEntryResponse>),

  listWorkEntries: (accountId: string, filters: WorkEntryFilters = {}) =>
    api
      .get<{ data: unknown }>(`/accounts/${accountId}/employee-work-entries`, {
        params: cleanParams(filters),
      })
      .then((response) => ({
        ...response,
        data: {
          data: normalizePagePayload<EmployeeWorkEntryResponse>(response.data?.data) as PageResponse<EmployeeWorkEntryResponse>,
        },
      })),

  updateWorkEntry: (accountId: string, entryId: string, payload: EmployeeWorkEntryRequest) =>
    api
      .put<{ data: ObjectPayload<EmployeeWorkEntryResponse> }>(`/accounts/${accountId}/employee-work-entries/${entryId}`, payload)
      .then(normalizeObjectResponse<EmployeeWorkEntryResponse>),

  deleteWorkEntry: (accountId: string, entryId: string) =>
    api.delete(`/accounts/${accountId}/employee-work-entries/${entryId}`),

  payEmployee: (accountId: string, payload: EmployeePaymentRequest) =>
    api
      .post<{ data: ObjectPayload<EmployeePaymentResponse> }>(`/accounts/${accountId}/employee-payments`, payload)
      .then(normalizeObjectResponse<EmployeePaymentResponse>),

  listPayments: (accountId: string, filters: PaymentFilters = {}) =>
    api
      .get<{ data: unknown }>(`/accounts/${accountId}/employee-payments`, {
        params: cleanParams(filters),
      })
      .then((response) => ({
        ...response,
        data: {
          data: normalizePagePayload<EmployeePaymentResponse>(response.data?.data) as PageResponse<EmployeePaymentResponse>,
        },
      })),
```

Finish with:

```typescript
export default laborService
```

- [ ] **Step 5: Verify types**

Run:

```powershell
npm run type-check
```

Expected: `vue-tsc --build` completes with exit code 0.

- [ ] **Step 6: Commit**

```powershell
git add src/services/laborService.ts
git commit -m "feat(labor): add employee daily work service"
```

---

## Task 2: Add Route And Navigation

**Files:**
- Modify: `src/router/index.ts`
- Modify: `src/layouts/AppLayout.vue`
- Create: `src/views/labor/LaborView.vue`

- [ ] **Step 1: Create initial routed view**

Create `src/views/labor/LaborView.vue`:

```vue
<template>
  <main class="labor-page">
    <header class="labor-page__header">
      <div>
        <h1>Mao de obra</h1>
        <p>Controle diarias pendentes e pagamentos de funcionarios.</p>
      </div>
    </header>
  </main>
</template>

<style scoped>
.labor-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.labor-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}
</style>
```

- [ ] **Step 2: Add route**

In `src/router/index.ts`, inside the producer `AppLayout` children near Transactions and Farms, add:

```typescript
        {
          path: 'labor',
          name: 'labor',
          component: () => import('@/views/labor/LaborView.vue')
        },
```

- [ ] **Step 3: Add sidebar item**

In `src/layouts/AppLayout.vue`, add this item to `navItems` after Transacoes:

```typescript
  {
    name: 'labor',
    label: 'Mao de obra',
    icon: 'users'
  },
```

Update `isActive`:

```typescript
  if (routeName === 'labor') {
    return current === 'labor'
  }
```

- [ ] **Step 4: Verify**

Run:

```powershell
npm run type-check
```

Expected: route import compiles and `IconName` accepts `users`.

- [ ] **Step 5: Commit**

```powershell
git add src/router/index.ts src/layouts/AppLayout.vue src/views/labor/LaborView.vue
git commit -m "feat(labor): add producer labor route"
```

---

## Task 3: Build Labor Workspace State And Layout

**Files:**
- Modify: `src/views/labor/LaborView.vue`

- [ ] **Step 1: Replace initial script**

Use `<script setup lang="ts">` with state for:

```typescript
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import laborService from '@/services/laborService'
import farmService from '@/services/farmService'
import type {
  EmployeePaymentResponse,
  EmployeeResponse,
  EmployeeWorkEntryResponse,
} from '@/services/laborService'
import type { FarmResponse } from '@/services/farmService'
import type { PageResponse } from '@/services/transactionService'

type LaborTab = 'employees' | 'entries' | 'payments'

const accountStore = useAccountStore()
const accountId = computed(() => accountStore.currentAccountId)

const activeTab = ref<LaborTab>('entries')
const loading = ref(false)
const error = ref('')
const success = ref('')

const employees = ref<EmployeeResponse[]>([])
const farms = ref<FarmResponse[]>([])
const entriesPage = ref<PageResponse<EmployeeWorkEntryResponse> | null>(null)
const paymentsPage = ref<PageResponse<EmployeePaymentResponse> | null>(null)

const entryFilters = reactive({
  employeeId: '',
  farmId: '',
  paid: 'false',
  startDate: '',
  endDate: '',
})

const paymentFilters = reactive({
  employeeId: '',
  startDate: '',
  endDate: '',
})
```

- [ ] **Step 2: Add formatters and totals**

Add:

```typescript
const pendingEntries = computed(() => entriesPage.value?.content.filter(entry => !entry.paid) ?? [])
const pendingTotal = computed(() => pendingEntries.value.reduce((sum, entry) => sum + entry.dailyRate, 0))

function formatCurrency(value: number | null | undefined): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0)
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '-'
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR')
}
```

- [ ] **Step 3: Add loaders**

Add:

```typescript
async function loadEmployees() {
  if (!accountId.value) return
  const { data } = await laborService.listEmployees(accountId.value)
  employees.value = data.data
}

async function loadFarms() {
  if (!accountId.value) return
  const { data } = await farmService.findAll(accountId.value)
  farms.value = data.data
}

async function loadEntries(page = 0) {
  if (!accountId.value) return
  const paid = entryFilters.paid === '' ? undefined : entryFilters.paid === 'true'
  const { data } = await laborService.listWorkEntries(accountId.value, {
    employeeId: entryFilters.employeeId || undefined,
    farmId: entryFilters.farmId || undefined,
    paid,
    startDate: entryFilters.startDate || undefined,
    endDate: entryFilters.endDate || undefined,
    page,
    size: 20,
  })
  entriesPage.value = data.data
}

async function loadPayments(page = 0) {
  if (!accountId.value) return
  const { data } = await laborService.listPayments(accountId.value, {
    employeeId: paymentFilters.employeeId || undefined,
    startDate: paymentFilters.startDate || undefined,
    endDate: paymentFilters.endDate || undefined,
    page,
    size: 20,
  })
  paymentsPage.value = data.data
}

async function loadAll() {
  if (!accountId.value) return
  loading.value = true
  error.value = ''
  try {
    await Promise.all([loadEmployees(), loadFarms(), loadEntries(), loadPayments()])
  } catch {
    error.value = 'Erro ao carregar dados de mao de obra.'
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
watch(accountId, loadAll)
```

- [ ] **Step 4: Replace template with workspace shell**

Use a dense operational layout:

```vue
<template>
  <main class="labor-page">
    <header class="labor-page__header">
      <div>
        <h1>Mao de obra</h1>
        <p>Controle diarias pendentes e pagamentos de funcionarios.</p>
      </div>
    </header>

    <div class="labor-summary">
      <div class="summary-tile">
        <span>Funcionarios ativos</span>
        <strong>{{ employees.filter(employee => employee.active).length }}</strong>
      </div>
      <div class="summary-tile">
        <span>Diarias pendentes filtradas</span>
        <strong>{{ pendingEntries.length }}</strong>
      </div>
      <div class="summary-tile">
        <span>Total pendente filtrado</span>
        <strong>{{ formatCurrency(pendingTotal) }}</strong>
      </div>
    </div>

    <p v-if="error" class="alert alert--error">{{ error }}</p>
    <p v-if="success" class="alert alert--success">{{ success }}</p>

    <div class="labor-tabs" role="tablist" aria-label="Mao de obra">
      <button :class="{ active: activeTab === 'entries' }" @click="activeTab = 'entries'">Diarias</button>
      <button :class="{ active: activeTab === 'employees' }" @click="activeTab = 'employees'">Funcionarios</button>
      <button :class="{ active: activeTab === 'payments' }" @click="activeTab = 'payments'">Pagamentos</button>
    </div>

    <section v-if="activeTab === 'entries'" class="labor-section">
      <h2>Diarias</h2>
    </section>
    <section v-else-if="activeTab === 'employees'" class="labor-section">
      <h2>Funcionarios</h2>
    </section>
    <section v-else class="labor-section">
      <h2>Pagamentos</h2>
    </section>
  </main>
</template>
```

- [ ] **Step 5: Add base CSS**

Use restrained SaaS styling: full-width page, small-radius panels, compact table styles, no nested cards. Add CSS classes used above.

- [ ] **Step 6: Verify**

Run:

```powershell
npm run type-check
```

Expected: no TypeScript errors.

- [ ] **Step 7: Commit**

```powershell
git add src/views/labor/LaborView.vue
git commit -m "feat(labor): build labor workspace shell"
```

---

## Task 4: Implement Employee Management Tab

**Files:**
- Modify: `src/views/labor/LaborView.vue`

- [ ] **Step 1: Add employee form state**

Add:

```typescript
const employeeForm = reactive({
  id: '',
  name: '',
  dailyRate: '',
  notes: '',
})

const editingEmployee = computed(() => Boolean(employeeForm.id))

function resetEmployeeForm() {
  employeeForm.id = ''
  employeeForm.name = ''
  employeeForm.dailyRate = ''
  employeeForm.notes = ''
}

function editEmployee(employee: EmployeeResponse) {
  activeTab.value = 'employees'
  employeeForm.id = employee.id
  employeeForm.name = employee.name
  employeeForm.dailyRate = String(employee.dailyRate)
  employeeForm.notes = employee.notes ?? ''
}
```

- [ ] **Step 2: Add employee save and toggle actions**

Add:

```typescript
async function saveEmployee() {
  if (!accountId.value) return
  error.value = ''
  success.value = ''
  const payload = {
    name: employeeForm.name.trim(),
    dailyRate: Number(employeeForm.dailyRate),
    notes: employeeForm.notes.trim() || undefined,
  }
  try {
    if (employeeForm.id) {
      await laborService.updateEmployee(accountId.value, employeeForm.id, payload)
      success.value = 'Funcionario atualizado.'
    } else {
      await laborService.createEmployee(accountId.value, payload)
      success.value = 'Funcionario cadastrado.'
    }
    resetEmployeeForm()
    await loadEmployees()
  } catch {
    error.value = 'Erro ao salvar funcionario.'
  }
}

async function toggleEmployee(employee: EmployeeResponse) {
  if (!accountId.value) return
  error.value = ''
  try {
    if (employee.active) {
      await laborService.deactivateEmployee(accountId.value, employee.id)
    } else {
      await laborService.activateEmployee(accountId.value, employee.id)
    }
    await loadEmployees()
  } catch {
    error.value = 'Erro ao alterar status do funcionario.'
  }
}
```

- [ ] **Step 3: Fill employees tab template**

Replace the initial employees section with:

```vue
<section v-else-if="activeTab === 'employees'" class="labor-section">
  <div class="section-header">
    <h2>Funcionarios</h2>
  </div>

  <form class="labor-form" @submit.prevent="saveEmployee">
    <label>
      Nome
      <input v-model="employeeForm.name" required maxlength="150" />
    </label>
    <label>
      Diaria padrao
      <input v-model="employeeForm.dailyRate" type="number" min="0.01" step="0.01" required />
    </label>
    <label class="form-span">
      Observacoes
      <textarea v-model="employeeForm.notes" rows="2" />
    </label>
    <div class="form-actions">
      <button type="submit" class="btn-primary">{{ editingEmployee ? 'Salvar funcionario' : 'Cadastrar funcionario' }}</button>
      <button v-if="editingEmployee" type="button" class="btn-secondary" @click="resetEmployeeForm">Cancelar</button>
    </div>
  </form>

  <div class="table-wrap">
    <table class="data-table">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Diaria</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="employee in employees" :key="employee.id">
          <td>{{ employee.name }}</td>
          <td>{{ formatCurrency(employee.dailyRate) }}</td>
          <td><span class="status-pill" :class="{ muted: !employee.active }">{{ employee.active ? 'Ativo' : 'Inativo' }}</span></td>
          <td class="actions-cell">
            <button class="btn-text" @click="editEmployee(employee)">Editar</button>
            <button class="btn-text" @click="toggleEmployee(employee)">{{ employee.active ? 'Desativar' : 'Ativar' }}</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</section>
```

- [ ] **Step 4: Verify**

Run:

```powershell
npm run type-check
```

Expected: no errors.

- [ ] **Step 5: Commit**

```powershell
git add src/views/labor/LaborView.vue
git commit -m "feat(labor): manage employees in frontend"
```

---

## Task 5: Implement Work Entries Tab

**Files:**
- Modify: `src/views/labor/LaborView.vue`

- [ ] **Step 1: Add work-entry form state**

Add:

```typescript
const entryForm = reactive({
  id: '',
  employeeId: '',
  farmId: '',
  workDate: '',
  dailyRate: '',
  notes: '',
})

function resetEntryForm() {
  entryForm.id = ''
  entryForm.employeeId = ''
  entryForm.farmId = ''
  entryForm.workDate = ''
  entryForm.dailyRate = ''
  entryForm.notes = ''
}

function editEntry(entry: EmployeeWorkEntryResponse) {
  if (entry.paid) return
  activeTab.value = 'entries'
  entryForm.id = entry.id
  entryForm.employeeId = entry.employeeId
  entryForm.farmId = entry.farmId ?? ''
  entryForm.workDate = entry.workDate
  entryForm.dailyRate = String(entry.dailyRate)
  entryForm.notes = entry.notes ?? ''
}
```

- [ ] **Step 2: Add save/delete actions**

Add:

```typescript
async function saveEntry() {
  if (!accountId.value) return
  error.value = ''
  success.value = ''
  const payload = {
    employeeId: entryForm.employeeId,
    farmId: entryForm.farmId || null,
    workDate: entryForm.workDate,
    dailyRate: entryForm.dailyRate === '' ? undefined : Number(entryForm.dailyRate),
    notes: entryForm.notes.trim() || undefined,
  }
  try {
    if (entryForm.id) {
      await laborService.updateWorkEntry(accountId.value, entryForm.id, payload)
      success.value = 'Diaria atualizada.'
    } else {
      await laborService.createWorkEntry(accountId.value, payload)
      success.value = 'Diaria registrada.'
    }
    resetEntryForm()
    await loadEntries()
  } catch {
    error.value = 'Erro ao salvar diaria.'
  }
}

async function deleteEntry(entry: EmployeeWorkEntryResponse) {
  if (!accountId.value || entry.paid) return
  if (!confirm('Remover esta diaria?')) return
  await laborService.deleteWorkEntry(accountId.value, entry.id)
  await loadEntries()
}
```

- [ ] **Step 3: Fill entries tab template**

Replace the entries section with filters, form, table:

```vue
<section v-if="activeTab === 'entries'" class="labor-section">
  <div class="section-header">
    <h2>Diarias</h2>
  </div>

  <div class="filter-row">
    <select v-model="entryFilters.employeeId" @change="loadEntries()">
      <option value="">Todos os funcionarios</option>
      <option v-for="employee in employees" :key="employee.id" :value="employee.id">{{ employee.name }}</option>
    </select>
    <select v-model="entryFilters.farmId" @change="loadEntries()">
      <option value="">Todas as origens</option>
      <option value="">Geral da conta</option>
      <option v-for="farm in farms" :key="farm.id" :value="farm.id">{{ farm.name }}</option>
    </select>
    <select v-model="entryFilters.paid" @change="loadEntries()">
      <option value="">Todas</option>
      <option value="false">Pendentes</option>
      <option value="true">Pagas</option>
    </select>
    <input v-model="entryFilters.startDate" type="date" @change="loadEntries()" />
    <input v-model="entryFilters.endDate" type="date" @change="loadEntries()" />
  </div>

  <form class="labor-form" @submit.prevent="saveEntry">
    <label>
      Funcionario
      <select v-model="entryForm.employeeId" required>
        <option value="" disabled>Selecione</option>
        <option v-for="employee in employees.filter(item => item.active)" :key="employee.id" :value="employee.id">{{ employee.name }}</option>
      </select>
    </label>
    <label>
      Origem
      <select v-model="entryForm.farmId">
        <option value="">Geral da conta</option>
        <option v-for="farm in farms" :key="farm.id" :value="farm.id">{{ farm.name }}</option>
      </select>
    </label>
    <label>
      Data
      <input v-model="entryForm.workDate" type="date" required />
    </label>
    <label>
      Diaria
      <input v-model="entryForm.dailyRate" type="number" min="0.01" step="0.01" placeholder="Valor padrao" />
    </label>
    <label class="form-span">
      Observacoes
      <textarea v-model="entryForm.notes" rows="2" />
    </label>
    <div class="form-actions">
      <button type="submit" class="btn-primary">{{ entryForm.id ? 'Salvar diaria' : 'Registrar diaria' }}</button>
      <button v-if="entryForm.id" type="button" class="btn-secondary" @click="resetEntryForm">Cancelar</button>
    </div>
  </form>

  <div class="table-wrap">
    <table class="data-table">
      <thead>
        <tr>
          <th>Data</th>
          <th>Funcionario</th>
          <th>Origem</th>
          <th>Valor</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in entriesPage?.content ?? []" :key="entry.id">
          <td>{{ formatDate(entry.workDate) }}</td>
          <td>{{ entry.employeeName }}</td>
          <td>{{ entry.farmName ?? 'Geral da conta' }}</td>
          <td>{{ formatCurrency(entry.dailyRate) }}</td>
          <td><span class="status-pill" :class="{ paid: entry.paid }">{{ entry.paid ? 'Pago' : 'Pendente' }}</span></td>
          <td class="actions-cell">
            <button v-if="!entry.paid" class="btn-text" @click="editEntry(entry)">Editar</button>
            <button v-if="!entry.paid" class="btn-text" @click="deleteEntry(entry)">Remover</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</section>
```

- [ ] **Step 4: Verify**

Run:

```powershell
npm run type-check
```

Expected: no errors.

- [ ] **Step 5: Commit**

```powershell
git add src/views/labor/LaborView.vue
git commit -m "feat(labor): manage daily work entries"
```

---

## Task 6: Implement Payments Tab

**Files:**
- Modify: `src/views/labor/LaborView.vue`

- [ ] **Step 1: Add payment form state**

Add:

```typescript
const paymentForm = reactive({
  employeeId: '',
  periodStart: '',
  periodEnd: '',
  paymentDate: '',
  notes: '',
})

function resetPaymentForm() {
  paymentForm.employeeId = ''
  paymentForm.periodStart = ''
  paymentForm.periodEnd = ''
  paymentForm.paymentDate = ''
  paymentForm.notes = ''
}
```

- [ ] **Step 2: Add pay action**

Add:

```typescript
async function payEmployee() {
  if (!accountId.value) return
  error.value = ''
  success.value = ''
  try {
    const { data } = await laborService.payEmployee(accountId.value, {
      employeeId: paymentForm.employeeId,
      periodStart: paymentForm.periodStart,
      periodEnd: paymentForm.periodEnd,
      paymentDate: paymentForm.paymentDate,
      notes: paymentForm.notes.trim() || undefined,
    })
    success.value = `Pagamento registrado: ${formatCurrency(data.data.totalAmount)} em ${data.data.generatedExpenses.length} despesa(s).`
    resetPaymentForm()
    await Promise.all([loadEntries(), loadPayments()])
  } catch {
    error.value = 'Erro ao registrar pagamento. Verifique se existem diarias pendentes no periodo.'
  }
}
```

- [ ] **Step 3: Fill payments tab template**

Replace the payments section with:

```vue
<section v-else class="labor-section">
  <div class="section-header">
    <h2>Pagamentos</h2>
  </div>

  <form class="labor-form" @submit.prevent="payEmployee">
    <label>
      Funcionario
      <select v-model="paymentForm.employeeId" required>
        <option value="" disabled>Selecione</option>
        <option v-for="employee in employees" :key="employee.id" :value="employee.id">{{ employee.name }}</option>
      </select>
    </label>
    <label>
      Inicio
      <input v-model="paymentForm.periodStart" type="date" required />
    </label>
    <label>
      Fim
      <input v-model="paymentForm.periodEnd" type="date" required />
    </label>
    <label>
      Data do pagamento
      <input v-model="paymentForm.paymentDate" type="date" required />
    </label>
    <label class="form-span">
      Observacoes
      <textarea v-model="paymentForm.notes" rows="2" />
    </label>
    <div class="form-actions">
      <button type="submit" class="btn-primary">Registrar pagamento</button>
    </div>
  </form>

  <div class="filter-row">
    <select v-model="paymentFilters.employeeId" @change="loadPayments()">
      <option value="">Todos os funcionarios</option>
      <option v-for="employee in employees" :key="employee.id" :value="employee.id">{{ employee.name }}</option>
    </select>
    <input v-model="paymentFilters.startDate" type="date" @change="loadPayments()" />
    <input v-model="paymentFilters.endDate" type="date" @change="loadPayments()" />
  </div>

  <div class="table-wrap">
    <table class="data-table">
      <thead>
        <tr>
          <th>Pagamento</th>
          <th>Funcionario</th>
          <th>Periodo</th>
          <th>Diarias</th>
          <th>Total</th>
          <th>Despesas</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="payment in paymentsPage?.content ?? []" :key="payment.id">
          <td>{{ formatDate(payment.paymentDate) }}</td>
          <td>{{ payment.employeeName }}</td>
          <td>{{ formatDate(payment.periodStart) }} - {{ formatDate(payment.periodEnd) }}</td>
          <td>{{ payment.paidEntriesCount }}</td>
          <td>{{ formatCurrency(payment.totalAmount) }}</td>
          <td>{{ payment.generatedExpenses.length }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</section>
```

- [ ] **Step 4: Verify**

Run:

```powershell
npm run type-check
```

Expected: no errors.

- [ ] **Step 5: Commit**

```powershell
git add src/views/labor/LaborView.vue
git commit -m "feat(labor): register employee payments"
```

---

## Task 7: Polish Responsive UX And Verify

**Files:**
- Modify: `src/views/labor/LaborView.vue`

- [ ] **Step 1: Complete CSS**

Ensure `LaborView.vue` has CSS for:

- `.labor-summary` responsive grid.
- `.summary-tile` with small radius, subdued border, no nested cards.
- `.labor-tabs` as segmented control.
- `.labor-section` as unframed full-width panel surface.
- `.labor-form` compact grid with stable inputs.
- `.filter-row` wrapping controls without overlap.
- `.table-wrap` horizontal overflow on small screens.
- `.data-table`, `.status-pill`, `.actions-cell`, `.alert`.
- Mobile breakpoint below `720px` where forms become single-column and header stacks.

- [ ] **Step 2: Empty/loading states**

Add text-only empty states inside each table area:

```vue
<p v-if="!loading && (entriesPage?.content.length ?? 0) === 0" class="empty-state">Nenhuma diaria encontrada.</p>
```

Use equivalent messages for employees and payments.

- [ ] **Step 3: Build verification**

Run:

```powershell
npm run type-check
npm run test:services
npm run build
```

Expected:
- `vue-tsc --build` passes.
- service tests pass.
- Vite production build completes.

- [ ] **Step 4: Manual browser smoke**

Start dev server:

```powershell
npm run dev -- --host 127.0.0.1
```

Open the local URL in the in-app browser and verify:

- Sidebar shows `Mao de obra`.
- `/app/labor` renders without blank screen.
- Desktop viewport has no overlapping text.
- Mobile viewport keeps filters/forms usable.
- Tabs switch without layout jumps.

- [ ] **Step 5: Commit**

```powershell
git add src/views/labor/LaborView.vue
git commit -m "feat(labor): polish labor workspace"
```

## Self-Review

- Spec coverage:
  - Employee CRUD and active/inactive status are covered in Tasks 1, 4.
  - Work entries with optional farm/general origin and pending/paid filters are covered in Tasks 1, 5.
  - Employee-period payment and generated-expense visibility are covered in Tasks 1, 6.
  - Producer navigation and route integration are covered in Task 2.
  - Responsive, dense operational UI is covered in Task 7.
- Scope:
  - This plan does not add dashboard labor cards or alter farm reports because generated expenses already flow into existing financial pages after payment.
  - This plan does not implement payment cancellation, batch payroll, employee documents, or payment method fields.
- Verification:
  - Uses existing frontend commands from `package.json`: `type-check`, `test:services`, and `build`.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-15-employee-daily-work-frontend.md`. Two execution options:

1. Subagent-Driven (recommended) - dispatch a fresh subagent per task, review between tasks, fast iteration.

2. Inline Execution - execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
