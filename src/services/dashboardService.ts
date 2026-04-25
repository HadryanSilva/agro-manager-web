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
}

// Resposta completa do endpoint de dashboard
export interface DashboardSummary {
  totalFarms: number
  emPreparacao: number
  emAndamento: number
  colhida: number
  cancelada: number
  totalAreaHectares: number
  totalAreaAlqueires: number
  leasesExpiringIn30Days: number
  recentFarms: RecentFarm[]
}

const dashboardService = {
  getSummary: (accountId: string) =>
    api.get<{ data: DashboardSummary }>(`/accounts/${accountId}/dashboard`)
}

export default dashboardService