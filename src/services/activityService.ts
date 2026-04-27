import api from './api'

export type FarmActivityType =
  | 'EXPENSE_CREATED'
  | 'EXPENSE_UPDATED'
  | 'EXPENSE_DELETED'
  | 'EXPENSE_PAID'
  | 'FARM_UPDATED'
  | 'NOTE'

export interface FarmActivityResponse {
  id: string
  type: FarmActivityType
  description: string
  relatedId: string | null
  userName: string
  userAvatarUrl: string | null
  createdAt: string
}

const activityService = {
  getActivities: (accountId: string, farmId: string) =>
    api.get<{ data: FarmActivityResponse[] }>(
      `/accounts/${accountId}/farms/${farmId}/activities`
    ),

  addNote: (accountId: string, farmId: string, description: string) =>
    api.post<{ data: FarmActivityResponse }>(
      `/accounts/${accountId}/farms/${farmId}/activities/notes`,
      { description }
    ),
}

export default activityService