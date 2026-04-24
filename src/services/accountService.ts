import api from './api'

export interface AccountResponse {
  id: string
  name: string
  userRole: 'OWNER' | 'ADMIN' | 'MEMBER'
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