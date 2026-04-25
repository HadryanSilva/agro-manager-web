import api from './api'
import type { AccountRole } from './accountService'

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
  createdByName: string
  expiresAt: string
  used: boolean
  expired: boolean
  inviteUrl: string
}

const memberService = {
  // ── Membros ──────────────────────────────────────────────────────
  listMembers: (accountId: string) =>
    api.get<{ data: AccountMemberResponse[] }>(`/accounts/${accountId}/members`),

  updateRole: (accountId: string, memberId: string, role: AccountRole) =>
    api.put<{ data: AccountMemberResponse }>(`/accounts/${accountId}/members/${memberId}/role`, { role }),

  removeMember: (accountId: string, memberId: string) =>
    api.delete(`/accounts/${accountId}/members/${memberId}`),

  // ── Convites ─────────────────────────────────────────────────────
  listInvites: (accountId: string) =>
    api.get<{ data: AccountInviteResponse[] }>(`/accounts/${accountId}/invites`),

  createInvite: (accountId: string, role: AccountRole = 'MEMBER') =>
    api.post<{ data: AccountInviteResponse }>(`/accounts/${accountId}/invites`, { role }),

  revokeInvite: (accountId: string, inviteId: string) =>
    api.delete(`/accounts/${accountId}/invites/${inviteId}`),

  // ── Aceite de convite (token público) ────────────────────────────
  getInviteDetails: (token: string) =>
    api.get<{ data: AccountInviteResponse }>(`/invites/${token}`),

  acceptInvite: (token: string) =>
    api.post<{ data: AccountMemberResponse }>(`/invites/${token}/accept`),
}

export default memberService