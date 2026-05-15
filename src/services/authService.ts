import api from './api'
import { normalizeObjectResponse, type ObjectPayload } from './responseUtils'

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  tokenType: string
  expiresIn: number
}

const authService = {
  register: (payload: RegisterPayload) =>
    api
      .post<{ data: ObjectPayload<AuthTokens> }>('/auth/register', payload)
      .then(normalizeObjectResponse<AuthTokens>),

  login: (payload: LoginPayload) =>
    api
      .post<{ data: ObjectPayload<AuthTokens> }>('/auth/login', payload)
      .then(normalizeObjectResponse<AuthTokens>),

  refresh: () =>
    api
      .post<{ data: ObjectPayload<AuthTokens> }>('/auth/refresh')
      .then(normalizeObjectResponse<AuthTokens>)
}

export default authService
