import api from './api'
import type { AreaUnit, FarmStatus } from './farmService'
import { normalizeObjectResponse, type ObjectPayload } from './responseUtils'

export interface MonthlyExpense {
  year: number
  month: number
  monthLabel: string
  total: number
  paid: number
  pending: number
  insumos: number
  servicos: number
}

export interface ReportExpenseItem {
  id: string
  description: string
  category: 'INSUMO' | 'SERVICO'
  value: number
  competenceDate: string
  paymentDate: string | null
  paid: boolean
  notes: string | null
}

export interface FarmReportResponse {
  farmId: string
  farmName: string
  areaValue: number
  areaUnit: AreaUnit
  status: FarmStatus
  lessorName: string | null
  leaseStartDate: string | null
  leaseEndDate: string | null
  leaseValue: number | null
  totalExpenses: number
  totalInsumos: number
  totalServicos: number
  totalPaid: number
  totalPending: number
  totalCost: number
  monthlyBreakdown: MonthlyExpense[]
  expenses: ReportExpenseItem[]
}

const reportService = {
  getFarmReport: (accountId: string, farmId: string) =>
    api
      .get<{ data: ObjectPayload<FarmReportResponse> }>(`/accounts/${accountId}/farms/${farmId}/report`)
      .then(normalizeObjectResponse<FarmReportResponse>)
}

export default reportService