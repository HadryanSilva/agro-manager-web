import api from './api'
import type { ExpenseCategory } from './expenseService'

export interface TransactionResponse {
  id: string
  farmId: string
  farmName: string
  description: string
  category: ExpenseCategory
  value: number
  competenceDate: string
  paymentDate: string | null
  paid: boolean
  notes: string | null
  createdAt: string
}

export interface TransactionFilters {
  farmId?: string
  category?: ExpenseCategory
  paid?: boolean
  startDate?: string
  endDate?: string
  page?: number
  size?: number
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
  totalValue: number
}

const transactionService = {
  getTransactions: (accountId: string, filters: TransactionFilters = {}) => {
    // Remove propriedades undefined para não poluir a query string
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
    )
    return api.get<{ data: PageResponse<TransactionResponse> }>(
      `/accounts/${accountId}/transactions`,
      { params }
    )
  }
}

export default transactionService