import api from './api'
import {
  normalizeListResponse,
  normalizeObjectResponse,
  type ListPayload,
  type ObjectPayload,
} from './responseUtils'

export type AccountRole = 'OWNER' | 'ADMIN' | 'MEMBER'

export interface AccountResponse {
  id: string
  name: string
  userRole: AccountRole
  memberCount: number
  createdAt: string
}

export interface CreateAccountRequest {
  name: string
}

const accountService = {
  getUserAccounts: () =>
    api
      .get<{ data: ListPayload<AccountResponse> }>('/accounts')
      .then(normalizeListResponse<AccountResponse>),

  createAccount: (data: CreateAccountRequest) =>
    api
      .post<{ data: ObjectPayload<AccountResponse> }>('/accounts', data)
      .then(normalizeObjectResponse<AccountResponse>),

  /**
   * Exclui permanentemente a conta.
   * confirmationName deve ser idêntico ao nome da conta — validação no backend.
   */
  deleteAccount: (accountId: string, confirmationName: string) =>
    api.delete(`/accounts/${accountId}`, {
      data: { confirmationName }
    }),
}

export default accountService