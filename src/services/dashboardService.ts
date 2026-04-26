import api from './api'
import type { AreaUnit, FarmStatus } from './farmService'

// Projeção leve de lavoura para o feed de atividade recente
export interface RecentFarm {
  id: string
  name: string
  areaValue: number
  areaUnit: AreaUnit
  status: FarmStatus
  plantingStartDate: string | null
  createdAt: string
  totalExpenses: number
  totalExpensesPaid: number
}

// Resposta completa do endpoint de dashboard
export interface DashboardSummary {
  // Contagens por status
  totalFarms: number
  emPreparacao: number
  emAndamento: number
  colhida: number
  cancelada: number

  // Áreas
  totalAreaHectares: number
  totalAreaAlqueires: number

  // Alerta de arrendamentos
  leasesExpiringIn30Days: number

  // Resumo financeiro — campos adicionados na última iteração
  totalExpenses: number
  totalExpensesPaid: number
  totalExpensesPending: number

  recentFarms: RecentFarm[]
}

const dashboardService = {
  getSummary: (accountId: string) =>
    api.get<{ data: DashboardSummary }>(`/accounts/${accountId}/dashboard`)
}

export default dashboardService