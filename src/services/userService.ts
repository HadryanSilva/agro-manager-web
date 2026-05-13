import api from './api'
import { normalizeObjectResponse, type ObjectPayload } from './responseUtils'

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
    api
      .get<{ data: ObjectPayload<UserProfileResponse> }>('/users/me')
      .then(normalizeObjectResponse<UserProfileResponse>),

  updateProfile: (payload: { name: string }) =>
    api
      .put<{ data: ObjectPayload<UserProfileResponse> }>('/users/me', payload)
      .then(normalizeObjectResponse<UserProfileResponse>),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    api.put<{ data: null }>('/users/me/password', payload),
}

export default userService