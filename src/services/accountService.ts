import api from './api'

// Tipo exportado separadamente para ser reutilizado em memberService, expenseService, etc.
export type AccountRole = 'OWNER' | 'ADMIN' | 'MEMBER'

export interface AccountResponse {
  id: string
  name: string
  userRole: AccountRole
  memberCount: number
  createdAt: string
}

const accountService = {
  getUserAccounts: () =>
    api.get<{ data: AccountResponse[] }>('/accounts/me'),

  createAccount: (payload: { name: string }) =>
    api.post<{ data: AccountResponse }>('/accounts', payload)
}

export default accountService