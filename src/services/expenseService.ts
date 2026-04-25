import api from './api'

export type ExpenseCategory = 'INSUMO' | 'SERVICO'

export interface ExpenseResponse {
  id: string
  description: string
  category: ExpenseCategory
  value: number
  competenceDate: string
  paymentDate: string | null
  paid: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface ExpenseRequest {
  description: string
  category: ExpenseCategory
  value: number
  competenceDate: string
  paymentDate?: string | null
  notes?: string
}

const expenseService = {
  create: (accountId: string, farmId: string, payload: ExpenseRequest) =>
    api.post<{ data: ExpenseResponse }>(
      `/accounts/${accountId}/farms/${farmId}/expenses`,
      payload
    ),

  findAll: (accountId: string, farmId: string) =>
    api.get<{ data: ExpenseResponse[] }>(
      `/accounts/${accountId}/farms/${farmId}/expenses`
    ),

  findById: (accountId: string, farmId: string, expenseId: string) =>
    api.get<{ data: ExpenseResponse }>(
      `/accounts/${accountId}/farms/${farmId}/expenses/${expenseId}`
    ),

  update: (accountId: string, farmId: string, expenseId: string, payload: ExpenseRequest) =>
    api.put<{ data: ExpenseResponse }>(
      `/accounts/${accountId}/farms/${farmId}/expenses/${expenseId}`,
      payload
    ),

  delete: (accountId: string, farmId: string, expenseId: string) =>
    api.delete(`/accounts/${accountId}/farms/${farmId}/expenses/${expenseId}`),

  // Registra pagamento com a data atual via PATCH semântico
  markAsPaid: (accountId: string, farmId: string, expenseId: string) =>
    api.patch<{ data: ExpenseResponse }>(
      `/accounts/${accountId}/farms/${farmId}/expenses/${expenseId}/pay`
    ),
}

export default expenseService