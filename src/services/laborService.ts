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
  notes?: string | null
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
  dailyRate?: number | null
  notes?: string | null
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
  notes?: string | null
}

export interface PaymentFilters {
  employeeId?: string
  startDate?: string
  endDate?: string
  page?: number
  size?: number
}

function cleanParams<T extends object>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
  ) as Partial<T>
}

const laborService = {
  createEmployee: (accountId: string, payload: EmployeeRequest) =>
    api
      .post<{ data: ObjectPayload<EmployeeResponse> }>(`/accounts/${accountId}/employees`, payload)
      .then(normalizeObjectResponse<EmployeeResponse>),

  findEmployees: (accountId: string, active?: boolean) =>
    api
      .get<{ data: ListPayload<EmployeeResponse> }>(`/accounts/${accountId}/employees`, {
        params: active === undefined ? undefined : { active },
      })
      .then(normalizeListResponse<EmployeeResponse>),

  updateEmployee: (accountId: string, employeeId: string, payload: EmployeeRequest) =>
    api
      .put<{ data: ObjectPayload<EmployeeResponse> }>(
        `/accounts/${accountId}/employees/${employeeId}`,
        payload
      )
      .then(normalizeObjectResponse<EmployeeResponse>),

  activateEmployee: (accountId: string, employeeId: string) =>
    api
      .patch<{ data: ObjectPayload<EmployeeResponse> }>(
        `/accounts/${accountId}/employees/${employeeId}/activate`
      )
      .then(normalizeObjectResponse<EmployeeResponse>),

  deactivateEmployee: (accountId: string, employeeId: string) =>
    api
      .patch<{ data: ObjectPayload<EmployeeResponse> }>(
        `/accounts/${accountId}/employees/${employeeId}/deactivate`
      )
      .then(normalizeObjectResponse<EmployeeResponse>),

  createWorkEntry: (accountId: string, payload: EmployeeWorkEntryRequest) =>
    api
      .post<{ data: ObjectPayload<EmployeeWorkEntryResponse> }>(
        `/accounts/${accountId}/employee-work-entries`,
        payload
      )
      .then(normalizeObjectResponse<EmployeeWorkEntryResponse>),

  updateWorkEntry: (accountId: string, entryId: string, payload: EmployeeWorkEntryRequest) =>
    api
      .put<{ data: ObjectPayload<EmployeeWorkEntryResponse> }>(
        `/accounts/${accountId}/employee-work-entries/${entryId}`,
        payload
      )
      .then(normalizeObjectResponse<EmployeeWorkEntryResponse>),

  deleteWorkEntry: (accountId: string, entryId: string) =>
    api.delete(`/accounts/${accountId}/employee-work-entries/${entryId}`),

  findWorkEntries: (accountId: string, filters: WorkEntryFilters = {}) =>
    api
      .get<{ data: unknown }>(`/accounts/${accountId}/employee-work-entries`, {
        params: cleanParams(filters),
      })
      .then((response) => ({
        ...response,
        data: {
          data: normalizePagePayload<EmployeeWorkEntryResponse>(
            response.data?.data
          ) as PageResponse<EmployeeWorkEntryResponse>,
        },
      })),

  payEmployee: (accountId: string, payload: EmployeePaymentRequest) =>
    api
      .post<{ data: ObjectPayload<EmployeePaymentResponse> }>(
        `/accounts/${accountId}/employee-payments`,
        payload
      )
      .then(normalizeObjectResponse<EmployeePaymentResponse>),

  findPayments: (accountId: string, filters: PaymentFilters = {}) =>
    api
      .get<{ data: unknown }>(`/accounts/${accountId}/employee-payments`, {
        params: cleanParams(filters),
      })
      .then((response) => ({
        ...response,
        data: {
          data: normalizePagePayload<EmployeePaymentResponse>(
            response.data?.data
          ) as PageResponse<EmployeePaymentResponse>,
        },
      })),
}

export default laborService
