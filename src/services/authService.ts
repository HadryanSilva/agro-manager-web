import api from './api'

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
  refreshToken: string
  tokenType: string
  expiresIn: number
}

const authService = {
  register: (payload: RegisterPayload) =>
    api.post<{ data: AuthTokens }>('/auth/register', payload),

  login: (payload: LoginPayload) =>
    api.post<{ data: AuthTokens }>('/auth/login', payload),

  refresh: (refreshToken: string) =>
    api.post<{ data: AuthTokens }>('/auth/refresh', { refreshToken })
}

export default authService