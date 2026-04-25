import api from './api'

export type AreaUnit = 'HECTARE' | 'ALQUEIRE'
export type FarmStatus = 'EM_PREPARACAO' | 'EM_ANDAMENTO' | 'COLHIDA' | 'CANCELADA'

export interface FarmResponse {
  id: string
  name: string
  areaValue: number
  areaUnit: AreaUnit
  lessorName: string | null
  leaseStartDate: string | null
  leaseEndDate: string | null
  leaseValue: number | null
  plantingStartDate: string | null
  plantingEndDate: string | null
  harvestStartDate: string | null
  harvestEndDate: string | null
  cancelled: boolean
  notes: string | null
  status: FarmStatus
  createdAt: string
  updatedAt: string
}

export interface FarmRequest {
  name: string
  areaValue: number
  areaUnit: AreaUnit
  lessorName?: string
  leaseStartDate?: string
  leaseEndDate?: string
  leaseValue?: number
  plantingStartDate?: string
  plantingEndDate?: string
  harvestStartDate?: string
  harvestEndDate?: string
  cancelled: boolean
  notes?: string
}

const farmService = {
  create: (accountId: string, payload: FarmRequest) =>
    api.post<{ data: FarmResponse }>(`/accounts/${accountId}/farms`, payload),

  findAll: (accountId: string, status?: FarmStatus) =>
    api.get<{ data: FarmResponse[] }>(`/accounts/${accountId}/farms`, {
      params: status ? { status } : undefined
    }),

  findById: (accountId: string, farmId: string) =>
    api.get<{ data: FarmResponse }>(`/accounts/${accountId}/farms/${farmId}`),

  update: (accountId: string, farmId: string, payload: FarmRequest) =>
    api.put<{ data: FarmResponse }>(`/accounts/${accountId}/farms/${farmId}`, payload),

  delete: (accountId: string, farmId: string) =>
    api.delete(`/accounts/${accountId}/farms/${farmId}`)
}

export default farmService