import api from './api'

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
    api.get<{ data: AccountResponse[] }>('/accounts'),

  createAccount: (data: CreateAccountRequest) =>
    api.post<{ data: AccountResponse }>('/accounts', data),

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