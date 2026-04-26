<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import memberService from '@/services/memberService'
import type { AccountMemberResponse, AccountInviteResponse } from '@/services/memberService'
import type { AccountRole } from '@/services/accountService'
import SettingsTabs from '@/components/SettingsTabs.vue'

const accountStore = useAccountStore()
const accountId = computed(() => accountStore.selectedAccount?.id)
const currentAccount = computed(() => accountStore.selectedAccount)

const members   = ref<AccountMemberResponse[]>([])
const invites   = ref<AccountInviteResponse[]>([])
const loading   = ref(true)
const error     = ref('')
const copiedId  = ref<string | null>(null)

// Role do usuário logado nesta conta (para controle de permissões no UI)
const myRole = computed(() => currentAccount.value?.userRole ?? 'MEMBER')
const canManage = computed(() => myRole.value === 'OWNER' || myRole.value === 'ADMIN')

const roleConfig: Record<AccountRole, { label: string; color: string; bg: string }> = {
  OWNER:  { label: 'Owner',  color: '#7c3aed', bg: '#ede9fe' },
  ADMIN:  { label: 'Admin',  color: '#2563eb', bg: '#dbeafe' },
  MEMBER: { label: 'Membro', color: '#059669', bg: '#d1fae5' },
}

// Papéis que podem ser atribuídos via UI (OWNER é apenas transferência explícita)
const assignableRoles: AccountRole[] = ['ADMIN', 'MEMBER']

onMounted(async () => {
  if (!accountId.value) return
  loading.value = true
  try {
    const [membersRes, invitesRes] = await Promise.all([
      memberService.listMembers(accountId.value),
      canManage.value ? memberService.listInvites(accountId.value) : Promise.resolve({ data: { data: [] } })
    ])
    members.value = membersRes.data.data
    invites.value = invitesRes.data.data
  } catch {
    error.value = 'Erro ao carregar membros.'
  } finally {
    loading.value = false
  }
})

async function handleUpdateRole(member: AccountMemberResponse, role: AccountRole) {
  if (!accountId.value) return
  try {
    const { data } = await memberService.updateRole(accountId.value, member.id, role)
    const idx = members.value.findIndex(m => m.id === member.id)
    if (idx !== -1) members.value[idx] = data.data
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Erro ao alterar papel.'
  }
}

async function handleRemoveMember(memberId: string) {
  if (!accountId.value) return
  if (!confirm('Remover este membro da conta?')) return
  try {
    await memberService.removeMember(accountId.value, memberId)
    members.value = members.value.filter(m => m.id !== memberId)
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Erro ao remover membro.'
  }
}

async function handleCreateInvite(role: AccountRole = 'MEMBER') {
  if (!accountId.value) return
  try {
    const { data } = await memberService.createInvite(accountId.value, role)
    invites.value.unshift(data.data)
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Erro ao gerar convite.'
  }
}

async function handleRevokeInvite(inviteId: string) {
  if (!accountId.value) return
  if (!confirm('Revogar este convite?')) return
  try {
    await memberService.revokeInvite(accountId.value, inviteId)
    invites.value = invites.value.filter(i => i.id !== inviteId)
  } catch {
    error.value = 'Erro ao revogar convite.'
  }
}

async function copyInviteLink(invite: AccountInviteResponse) {
  try {
    await navigator.clipboard.writeText(invite.inviteUrl)
    copiedId.value = invite.id
    setTimeout(() => { copiedId.value = null }, 2000)
  } catch {
    error.value = 'Não foi possível copiar o link.'
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR')
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}
</script>

<template>
  <div class="members">

    <!-- Cabeçalho -->
    <div class="members__header">
      <h1 class="members__title">Configurações</h1>
    </div>
 
    <SettingsTabs />
 
    <div v-if="error" class="error-banner">{{ error }}</div>

    <div v-if="loading" class="loading-state">
      <span class="spinner" />
    </div>

    <template v-else>

      <!-- ── Lista de membros ────────────────────────────────────── -->
      <div class="section">
        <div class="section__row">
          <h2 class="section__title">Membros ativos ({{ members.length }})</h2>
        </div>

        <div class="members-list">
          <div v-for="member in members" :key="member.id" class="member-row">

            <!-- Avatar + info -->
            <div class="member-info">
              <div class="member-avatar" v-if="member.avatarUrl">
                <img :src="member.avatarUrl" :alt="member.name" />
              </div>
              <div class="member-avatar member-avatar--initials" v-else>
                {{ getInitials(member.name) }}
              </div>
              <div class="member-text">
                <span class="member-name">{{ member.name }}</span>
                <span class="member-email">{{ member.email }}</span>
              </div>
            </div>

            <!-- Role + ações -->
            <div class="member-actions">
              <!-- Select de papel (só OWNER/ADMIN podem alterar, não muda o próprio OWNER) -->
              <select
                v-if="canManage && member.role !== 'OWNER'"
                class="role-select"
                :value="member.role"
                @change="handleUpdateRole(member, ($event.target as HTMLSelectElement).value as AccountRole)"
              >
                <option v-for="r in assignableRoles" :key="r" :value="r">
                  {{ roleConfig[r].label }}
                </option>
              </select>

              <!-- Badge estático para OWNER (não editável) -->
              <span
                v-else
                class="role-badge"
                :style="{ background: roleConfig[member.role].bg, color: roleConfig[member.role].color }"
              >
                {{ roleConfig[member.role].label }}
              </span>

              <!-- Remover (só OWNER/ADMIN, não remove o OWNER) -->
              <button
                v-if="canManage && member.role !== 'OWNER'"
                class="icon-btn icon-btn--danger"
                title="Remover membro"
                @click="handleRemoveMember(member.id)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Convites ativos (apenas OWNER/ADMIN) ───────────────── -->
      <div class="section" v-if="canManage">
        <div class="section__row">
          <h2 class="section__title">Convites ativos</h2>
          <div class="invite-actions">
            <button class="btn-outline" @click="handleCreateInvite('MEMBER')">
              + Convidar como Membro
            </button>
            <button class="btn-outline btn-outline--admin" @click="handleCreateInvite('ADMIN')">
              + Convidar como Admin
            </button>
          </div>
        </div>

        <!-- Sem convites -->
        <div v-if="invites.length === 0" class="empty-invites">
          <p>Nenhum convite ativo. Gere um link para adicionar novos membros.</p>
        </div>

        <!-- Lista de convites -->
        <div v-else class="invites-list">
          <div v-for="invite in invites" :key="invite.id" class="invite-row">
            <div class="invite-info">
              <span
                class="role-badge"
                :style="{ background: roleConfig[invite.role].bg, color: roleConfig[invite.role].color }"
              >
                {{ roleConfig[invite.role].label }}
              </span>
              <span class="invite-meta">
                Gerado por {{ invite.createdByName }} · Expira em {{ formatDate(invite.expiresAt) }}
              </span>
            </div>
            <div class="invite-row__actions">
              <button
                class="btn-copy"
                :class="{ 'btn-copy--copied': copiedId === invite.id }"
                @click="copyInviteLink(invite)"
              >
                <svg v-if="copiedId !== invite.id" xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                     viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                     viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {{ copiedId === invite.id ? 'Copiado!' : 'Copiar link' }}
              </button>
              <button class="icon-btn icon-btn--danger" title="Revogar" @click="handleRevokeInvite(invite.id)">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<style scoped>
.members {
  padding: 2rem 1.5rem;
  max-width: 860px;
  margin: 0 auto;
}

.members__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.members__subtitle {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-bottom: 1.75rem;
}

.error-banner {
  background: var(--color-error-light);
  color: var(--color-error);
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  margin-bottom: 1.25rem;
}

.loading-state { display: flex; justify-content: center; padding: 4rem 0; }
.spinner {
  display: inline-block;
  width: 28px; height: 28px;
  border: 2.5px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Seção ──────────────────────────────────────────────────────── */
.section { margin-bottom: 2rem; }

.section__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.section__title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.01em;
}

/* ── Lista de membros ───────────────────────────────────────────── */
.members-list {
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.member-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  gap: 1rem;
}
.member-row:last-child { border-bottom: none; }

.member-info {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  min-width: 0;
}

.member-avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
}
.member-avatar img { width: 100%; height: 100%; object-fit: cover; }
.member-avatar--initials {
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 0.8125rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.member-text { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
.member-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.member-email { font-size: 0.8rem; color: var(--color-text-muted); }

.member-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* ── Role select e badge ────────────────────────────────────────── */
.role-select {
  padding: 0.3rem 0.625rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-background);
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
}
.role-select:focus { outline: none; border-color: var(--color-primary); }

.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.625rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

/* ── Botões de ícone ────────────────────────────────────────────── */
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px; height: 32px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-card);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s;
}
.icon-btn--danger:hover { border-color: var(--color-error); color: var(--color-error); background: var(--color-error-light); }

/* ── Convites ───────────────────────────────────────────────────── */
.invite-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.btn-outline {
  padding: 0.4rem 0.875rem;
  border: 1.5px solid var(--color-primary);
  border-radius: var(--radius-sm);
  background: var(--color-primary-light);
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-primary);
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-outline:hover { opacity: 0.8; }

.btn-outline--admin {
  border-color: #7c3aed;
  background: #ede9fe;
  color: #7c3aed;
}

.empty-invites {
  padding: 1.5rem;
  background: var(--color-card);
  border: 1.5px dashed var(--color-border);
  border-radius: var(--radius-md);
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.invites-list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.invite-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.25rem;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  gap: 1rem;
  flex-wrap: wrap;
}

.invite-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  min-width: 0;
}

.invite-meta {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.invite-row__actions { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }

.btn-copy {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-card);
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.btn-copy:hover       { border-color: var(--color-primary); color: var(--color-primary); }
.btn-copy--copied     { border-color: #059669; color: #059669; background: #f0fdf4; }

/* ── Responsividade ─────────────────────────────────────────────── */
@media (max-width: 600px) {
  .members { padding: 1.25rem 1rem; }
  .member-email { display: none; }
  .section__row { flex-direction: column; align-items: flex-start; }
  .invite-actions { width: 100%; }
  .btn-outline { flex: 1; text-align: center; justify-content: center; }
}
</style>