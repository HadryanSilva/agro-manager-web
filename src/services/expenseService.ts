import api from './api'
import {
  normalizeListResponse,
  normalizeObjectResponse,
  type ListPayload,
  type ObjectPayload,
} from './responseUtils'

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
  farmId: string | null
  farmName: string | null
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
  farmId?: string | null
}

const expenseService = {
  // ── Despesas de lavoura ──────────────────────────────────────────
  create: (accountId: string, farmId: string, payload: ExpenseRequest) =>
    api
      .post<{ data: ObjectPayload<ExpenseResponse> }>(
        `/accounts/${accountId}/farms/${farmId}/expenses`,
        payload
      )
      .then(normalizeObjectResponse<ExpenseResponse>),

  findAll: (accountId: string, farmId: string) =>
    api
      .get<{ data: ListPayload<ExpenseResponse> }>(
        `/accounts/${accountId}/farms/${farmId}/expenses`
      )
      .then(normalizeListResponse<ExpenseResponse>),

  findById: (accountId: string, farmId: string, expenseId: string) =>
    api
      .get<{ data: ObjectPayload<ExpenseResponse> }>(
        `/accounts/${accountId}/farms/${farmId}/expenses/${expenseId}`
      )
      .then(normalizeObjectResponse<ExpenseResponse>),

  update: (accountId: string, farmId: string, expenseId: string, payload: ExpenseRequest) =>
    api
      .put<{ data: ObjectPayload<ExpenseResponse> }>(
        `/accounts/${accountId}/farms/${farmId}/expenses/${expenseId}`,
        payload
      )
      .then(normalizeObjectResponse<ExpenseResponse>),

  delete: (accountId: string, farmId: string, expenseId: string) =>
    api.delete(`/accounts/${accountId}/farms/${farmId}/expenses/${expenseId}`),

  markAsPaid: (accountId: string, farmId: string, expenseId: string) =>
    api
      .patch<{ data: ObjectPayload<ExpenseResponse> }>(
        `/accounts/${accountId}/farms/${farmId}/expenses/${expenseId}/pay`
      )
      .then(normalizeObjectResponse<ExpenseResponse>),

  // ── Despesas gerais da conta (sem lavoura) ───────────────────────
  createGeneral: (accountId: string, payload: ExpenseRequest) =>
    api
      .post<{ data: ObjectPayload<ExpenseResponse> }>(
        `/accounts/${accountId}/expenses`,
        payload
      )
      .then(normalizeObjectResponse<ExpenseResponse>),

  findGeneralById: (accountId: string, expenseId: string) =>
    api
      .get<{ data: ObjectPayload<ExpenseResponse> }>(
        `/accounts/${accountId}/expenses/${expenseId}`
      )
      .then(normalizeObjectResponse<ExpenseResponse>),

  updateGeneral: (accountId: string, expenseId: string, payload: ExpenseRequest) =>
    api
      .put<{ data: ObjectPayload<ExpenseResponse> }>(
        `/accounts/${accountId}/expenses/${expenseId}`,
        payload
      )
      .then(normalizeObjectResponse<ExpenseResponse>),

  deleteGeneral: (accountId: string, expenseId: string) =>
    api.delete(`/accounts/${accountId}/expenses/${expenseId}`),

  markGeneralAsPaid: (accountId: string, expenseId: string) =>
    api
      .patch<{ data: ObjectPayload<ExpenseResponse> }>(
        `/accounts/${accountId}/expenses/${expenseId}/pay`
      )
      .then(normalizeObjectResponse<ExpenseResponse>),
}

export default expenseService