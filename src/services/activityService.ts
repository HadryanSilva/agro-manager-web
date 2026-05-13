import api from './api'
import {
  normalizeListResponse,
  normalizeObjectResponse,
  type ListPayload,
  type ObjectPayload,
} from './responseUtils'

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
    api
      .get<{ data: ListPayload<FarmActivityResponse> }>(
        `/accounts/${accountId}/farms/${farmId}/activities`
      )
      .then(normalizeListResponse<FarmActivityResponse>),

  addNote: (accountId: string, farmId: string, description: string) =>
    api
      .post<{ data: ObjectPayload<FarmActivityResponse> }>(
        `/accounts/${accountId}/farms/${farmId}/activities/notes`,
        { description }
      )
      .then(normalizeObjectResponse<FarmActivityResponse>),
}

export default activityService