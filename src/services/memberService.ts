import api from './api'
import type { AccountRole } from './accountService'
import {
  normalizeListResponse,
  normalizeObjectResponse,
  type ListPayload,
  type ObjectPayload,
} from './responseUtils'

export interface AccountMemberResponse {
  id: string
  userId: string
  name: string
  email: string
  avatarUrl: string | null
  role: AccountRole
  joinedAt: string
}

export interface AccountInviteResponse {
  id: string
  token: string
  accountName: string
  role: AccountRole
  invitedEmail: string
  createdByName: string
  expiresAt: string
  used: boolean
  expired: boolean
  inviteUrl: string
}

const memberService = {
  // ── Membros ──────────────────────────────────────────────────────
  listMembers: (accountId: string) =>
    api
      .get<{ data: ListPayload<AccountMemberResponse> }>(`/accounts/${accountId}/members`)
      .then(normalizeListResponse<AccountMemberResponse>),

  updateRole: (accountId: string, memberId: string, role: AccountRole) =>
    api
      .put<{ data: ObjectPayload<AccountMemberResponse> }>(`/accounts/${accountId}/members/${memberId}/role`, { role })
      .then(normalizeObjectResponse<AccountMemberResponse>),

  removeMember: (accountId: string, memberId: string) =>
    api.delete(`/accounts/${accountId}/members/${memberId}`),

  // ── Convites ─────────────────────────────────────────────────────
  listInvites: (accountId: string) =>
    api
      .get<{ data: ListPayload<AccountInviteResponse> }>(`/accounts/${accountId}/invites`)
      .then(normalizeListResponse<AccountInviteResponse>),

  // Convite nominal — email obrigatório, papel opcional (padrão MEMBER)
  createInvite: (accountId: string, email: string, role: AccountRole = 'MEMBER') =>
    api
      .post<{ data: ObjectPayload<AccountInviteResponse> }>(`/accounts/${accountId}/invites`, { email, role })
      .then(normalizeObjectResponse<AccountInviteResponse>),

  revokeInvite: (accountId: string, inviteId: string) =>
    api.delete(`/accounts/${accountId}/invites/${inviteId}`),

  // ── Aceite de convite (token público) ────────────────────────────
  getInviteDetails: (token: string) =>
    api
      .get<{ data: ObjectPayload<AccountInviteResponse> }>(`/invites/${token}`)
      .then(normalizeObjectResponse<AccountInviteResponse>),

  acceptInvite: (token: string) =>
    api
      .post<{ data: ObjectPayload<AccountMemberResponse> }>(`/invites/${token}/accept`)
      .then(normalizeObjectResponse<AccountMemberResponse>),
}

export default memberService