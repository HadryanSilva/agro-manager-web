import api from './api'

export type AuthProvider = 'LOCAL' | 'GOOGLE'

export interface UserProfileResponse {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  authProvider: AuthProvider
  emailVerified: boolean
  createdAt: string
}

const userService = {
  getProfile: () =>
    api.get<{ data: UserProfileResponse }>('/users/me'),

  updateProfile: (payload: { name: string }) =>
    api.put<{ data: UserProfileResponse }>('/users/me', payload),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    api.put<{ data: null }>('/users/me/password', payload),
}

export default userService