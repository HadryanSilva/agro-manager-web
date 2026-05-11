<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import memberService from '@/services/memberService'
import type { AccountMemberResponse, AccountInviteResponse } from '@/services/memberService'
import type { AccountRole } from '@/services/accountService'
import SettingsTabs from '@/components/SettingsTabs.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'

const accountStore   = useAccountStore()
const accountId      = computed(() => accountStore.selectedAccount?.id)
const currentAccount = computed(() => accountStore.selectedAccount)

const members  = ref<AccountMemberResponse[]>([])
const invites  = ref<AccountInviteResponse[]>([])
const loading  = ref(true)
const error    = ref('')

// ── Formulário de convite ─────────────────────────────────────────────────────
const showInviteForm  = ref(false)
const inviteEmail     = ref('')
const inviteRole      = ref<AccountRole>('MEMBER')
const inviteLoading   = ref(false)
const inviteError     = ref('')
const inviteSuccess   = ref('')

function openInviteForm() {
  inviteEmail.value   = ''
  inviteRole.value    = 'MEMBER'
  inviteError.value   = ''
  inviteSuccess.value = ''
  showInviteForm.value = true
}

function closeInviteForm() {
  showInviteForm.value = false
}

async function handleSendInvite() {
  if (!accountId.value) return

  const email = inviteEmail.value.trim()
  if (!email) { inviteError.value = 'Informe o e-mail do convidado.'; return }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) { inviteError.value = 'E-mail inválido.'; return }

  inviteLoading.value = true
  inviteError.value   = ''
  inviteSuccess.value = ''

  try {
    const { data } = await memberService.createInvite(accountId.value, email, inviteRole.value)
    invites.value.unshift(data.data)
    inviteSuccess.value = `Convite enviado para ${email} com sucesso!`
    inviteEmail.value   = ''
    // Fecha o formulário após breve confirmação
    setTimeout(() => { showInviteForm.value = false; inviteSuccess.value = '' }, 2000)
  } catch (e: any) {
    inviteError.value = e.response?.data?.message ?? 'Erro ao enviar convite.'
  } finally {
    inviteLoading.value = false
  }
}

// ── Modal de confirmação ──────────────────────────────────────────────────────
const confirmModal = ref<{
  open: boolean; title: string; message: string
  confirmLabel: string; action: (() => Promise<void>) | null; loading: boolean
}>({ open: false, title: '', message: '', confirmLabel: 'Confirmar', action: null, loading: false })

function openConfirm(title: string, message: string, confirmLabel: string, action: () => Promise<void>) {
  confirmModal.value = { open: true, title, message, confirmLabel, action, loading: false }
}

async function handleConfirm() {
  if (!confirmModal.value.action) return
  confirmModal.value.loading = true
  try { await confirmModal.value.action() }
  finally { confirmModal.value.open = false; confirmModal.value.loading = false; confirmModal.value.action = null }
}

function handleCancel() { confirmModal.value.open = false; confirmModal.value.action = null }

// ── Permissões ────────────────────────────────────────────────────────────────
const myRole    = computed(() => currentAccount.value?.userRole ?? 'MEMBER')
const canManage = computed(() => myRole.value === 'OWNER' || myRole.value === 'ADMIN')

const roleConfig: Record<AccountRole, { label: string; color: string; bg: string }> = {
  OWNER:  { label: 'Owner',  color: '#7c3aed',               bg: '#ede9fe' },
  ADMIN:  { label: 'Admin',  color: 'var(--color-info)',      bg: 'var(--color-info-light)' },
  MEMBER: { label: 'Membro', color: 'var(--color-success)',   bg: 'var(--color-success-light)' },
}

const assignableRoles: AccountRole[] = ['ADMIN', 'MEMBER']

// ── Carregamento inicial ──────────────────────────────────────────────────────
onMounted(async () => {
  if (!accountId.value) return
  loading.value = true
  try {
    const [membersRes, invitesRes] = await Promise.all([
      memberService.listMembers(accountId.value),
      canManage.value
        ? memberService.listInvites(accountId.value)
        : Promise.resolve({ data: { data: [] } })
    ])
    members.value = membersRes.data.data
    invites.value = invitesRes.data.data
  } catch {
    error.value = 'Erro ao carregar membros.'
  } finally {
    loading.value = false
  }
})

// ── Ações de membro ───────────────────────────────────────────────────────────
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

async function handleRemoveMember(member: AccountMemberResponse) {
  if (!accountId.value) return
  openConfirm(
    'Remover membro',
    `Deseja remover ${member.name} da conta? Esta ação não pode ser desfeita.`,
    'Remover',
    async () => {
      await memberService.removeMember(accountId.value!, member.id)
      members.value = members.value.filter(m => m.id !== member.id)
    }
  )
}

async function handleRevokeInvite(inviteId: string, invitedEmail: string) {
  if (!accountId.value) return
  openConfirm(
    'Revogar convite',
    `Deseja revogar o convite enviado para ${invitedEmail}? O link ficará inativo imediatamente.`,
    'Revogar',
    async () => {
      await memberService.revokeInvite(accountId.value!, inviteId)
      invites.value = invites.value.filter(i => i.id !== inviteId)
    }
  )
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

    <div class="members__header">
      <h1 class="members__title">Configurações</h1>
    </div>

    <SettingsTabs />

    <div v-if="error" class="error-banner">{{ error }}</div>

    <div v-if="loading" class="loading-state">
      <span class="spinner" />
    </div>

    <template v-else>

      <!-- ── Lista de membros ─────────────────────────────────── -->
      <div class="section">
        <div class="section__row">
          <h2 class="section__title">Membros ativos ({{ members.length }})</h2>
        </div>

        <div class="members-list">
          <div v-for="member in members" :key="member.id" class="member-row">
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

            <div class="member-actions">
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

              <span
                v-else
                class="role-badge"
                :style="{ background: roleConfig[member.role].bg, color: roleConfig[member.role].color }"
              >
                {{ roleConfig[member.role].label }}
              </span>

              <button
                v-if="canManage && member.role !== 'OWNER'"
                class="icon-btn icon-btn--danger"
                title="Remover membro"
                @click="handleRemoveMember(member)"
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

      <!-- ── Convites (apenas OWNER/ADMIN) ──────────────────── -->
      <div class="section" v-if="canManage">
        <div class="section__row">
          <h2 class="section__title">Convites ativos</h2>
          <button class="btn-outline" @click="openInviteForm">
            + Convidar por e-mail
          </button>
        </div>

        <!-- Formulário inline de convite -->
        <div v-if="showInviteForm" class="invite-form">
          <div v-if="inviteSuccess" class="invite-form__success">
            {{ inviteSuccess }}
          </div>

          <template v-else>
            <div class="invite-form__fields">
              <div class="invite-form__field">
                <label class="invite-form__label">E-mail do convidado</label>
                <input
                  v-model="inviteEmail"
                  type="email"
                  placeholder="colaborador@exemplo.com"
                  class="invite-form__input"
                  :disabled="inviteLoading"
                  @keyup.enter="handleSendInvite"
                />
              </div>

              <div class="invite-form__field">
                <label class="invite-form__label">Papel</label>
                <select v-model="inviteRole" class="invite-form__select" :disabled="inviteLoading">
                  <option value="MEMBER">Membro</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            <div v-if="inviteError" class="invite-form__error">{{ inviteError }}</div>

            <div class="invite-form__actions">
              <button class="btn-ghost" @click="closeInviteForm" :disabled="inviteLoading">
                Cancelar
              </button>
              <button class="btn-primary" @click="handleSendInvite" :disabled="inviteLoading">
                <span v-if="inviteLoading" class="spinner spinner--sm" />
                <span v-else>Enviar convite</span>
              </button>
            </div>
          </template>
        </div>

        <!-- Lista de convites ativos -->
        <div v-if="invites.length === 0 && !showInviteForm" class="empty-invites">
          <p>Nenhum convite ativo. Use o botão acima para convidar colaboradores.</p>
        </div>

        <div v-else class="invites-list">
          <div v-for="invite in invites" :key="invite.id" class="invite-row">
            <div class="invite-info">
              <!-- Ícone de envelope -->
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2" class="invite-icon">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              <div>
                <span class="invite-email">{{ invite.invitedEmail }}</span>
                <span
                  class="role-badge role-badge--sm"
                  :style="{ background: roleConfig[invite.role].bg, color: roleConfig[invite.role].color }"
                >
                  {{ roleConfig[invite.role].label }}
                </span>
                <span class="invite-meta">Expira em {{ formatDate(invite.expiresAt) }}</span>
              </div>
            </div>

            <div class="invite-row__actions">
              <button
                class="icon-btn icon-btn--danger"
                title="Revogar convite"
                @click="handleRevokeInvite(invite.id, invite.invitedEmail)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

    </template>

    <ConfirmModal
      :open="confirmModal.open"
      :title="confirmModal.title"
      :message="confirmModal.message"
      :confirm-label="confirmModal.confirmLabel"
      :loading="confirmModal.loading"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />

  </div>
</template>

<style scoped>
.members { padding: 2rem 1.5rem; max-width: 760px; }
.members__header { margin-bottom: 1.5rem; }
.members__title { font-family: 'DM Serif Display', serif; font-size: 1.75rem; font-weight: 400; color: var(--color-text); margin: 0; }

.error-banner {
  padding: 0.75rem 1rem;
  background: var(--color-error-light); border: 1px solid #fecaca;
  border-radius: var(--radius-md); color: var(--color-error);
  font-size: 0.875rem; margin-bottom: 1rem;
}

.loading-state { display: flex; justify-content: center; padding: 3rem 0; }

.section { margin-top: 2rem; }
.section__row {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 1rem; gap: 1rem; flex-wrap: wrap;
}
.section__title { font-size: 1rem; font-weight: 600; color: var(--color-text); margin: 0; }

/* ── Membros ─────────────────────────────────────────────────────── */
.members-list { display: flex; flex-direction: column; gap: 0.625rem; }
.member-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.875rem 1.25rem; background: var(--color-card);
  border: 1px solid var(--color-border); border-radius: var(--radius-md); gap: 1rem;
}
.member-info { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
.member-avatar {
  width: 38px; height: 38px; border-radius: 50%; overflow: hidden; flex-shrink: 0;
}
.member-avatar img { width: 100%; height: 100%; object-fit: cover; }
.member-avatar--initials {
  background: var(--color-primary-light); color: var(--color-primary);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.8rem; font-weight: 700;
}
.member-text { display: flex; flex-direction: column; min-width: 0; }
.member-name { font-size: 0.875rem; font-weight: 600; color: var(--color-text); }
.member-email { font-size: 0.8rem; color: var(--color-text-muted); }
.member-actions { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }

/* ── Formulário de convite ─────────────────────────────────────── */
.btn-outline {
  display: inline-flex; align-items: center; gap: 0.375rem;
  padding: 0.5rem 1rem; border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm); background: transparent;
  font-family: inherit; font-size: 0.875rem; font-weight: 600;
  color: var(--color-primary); cursor: pointer; transition: all 0.15s;
}
.btn-outline:hover { background: var(--color-primary-light); }

.invite-form {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1rem;
}
.invite-form__fields { display: grid; grid-template-columns: 1fr auto; gap: 0.75rem; align-items: end; }
.invite-form__field { display: flex; flex-direction: column; gap: 0.375rem; }
.invite-form__label { font-size: 0.8rem; font-weight: 600; color: var(--color-text-muted); }
.invite-form__input, .invite-form__select {
  padding: 0.5rem 0.75rem; border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); font-family: inherit; font-size: 0.875rem;
  color: var(--color-text); background: var(--color-background);
  transition: border-color 0.15s;
}
.invite-form__input:focus, .invite-form__select:focus {
  outline: none; border-color: var(--color-primary);
}
.invite-form__input { width: 100%; box-sizing: border-box; }
.invite-form__select { min-width: 130px; }
.invite-form__error {
  margin-top: 0.625rem; font-size: 0.8rem; color: var(--color-error);
}
.invite-form__success {
  text-align: center; padding: 0.75rem;
  color: var(--color-success); font-size: 0.875rem; font-weight: 600;
}
.invite-form__actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.875rem; }

.btn-ghost {
  padding: 0.5rem 1rem; border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); background: transparent;
  font-family: inherit; font-size: 0.875rem; color: var(--color-text-muted);
  cursor: pointer; transition: all 0.15s;
}
.btn-ghost:hover { background: var(--color-background); }

.btn-primary {
  display: inline-flex; align-items: center; gap: 0.375rem;
  padding: 0.5rem 1.25rem; background: var(--color-primary);
  border: none; border-radius: var(--radius-sm);
  font-family: inherit; font-size: 0.875rem; font-weight: 600;
  color: #fff; cursor: pointer; transition: opacity 0.15s;
}
.btn-primary:hover:not(:disabled) { opacity: 0.88; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── Lista de convites ─────────────────────────────────────────── */
.empty-invites {
  padding: 1.5rem; background: var(--color-card);
  border: 1px dashed var(--color-border); border-radius: var(--radius-md);
  text-align: center; color: var(--color-text-muted); font-size: 0.875rem;
}
.invites-list { display: flex; flex-direction: column; gap: 0.625rem; }
.invite-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.875rem 1.25rem; background: var(--color-card);
  border: 1px solid var(--color-border); border-radius: var(--radius-md); gap: 1rem;
}
.invite-info { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
.invite-icon { color: var(--color-text-muted); flex-shrink: 0; }
.invite-email { font-size: 0.875rem; font-weight: 600; color: var(--color-text); display: block; }
.invite-meta { font-size: 0.75rem; color: var(--color-text-muted); display: block; margin-top: 2px; }
.invite-row__actions { flex-shrink: 0; }

.role-badge {
  display: inline-block; padding: 0.2rem 0.6rem;
  border-radius: 999px; font-size: 0.75rem; font-weight: 600;
}
.role-badge--sm { font-size: 0.7rem; padding: 0.15rem 0.5rem; margin-left: 0.5rem; }

/* ── Botões de ação ────────────────────────────────────────────── */
.icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border-radius: var(--radius-sm);
  border: 1px solid var(--color-border); background: transparent;
  color: var(--color-text-muted); cursor: pointer; transition: all 0.15s;
}
.icon-btn--danger:hover { border-color: var(--color-error); color: var(--color-error); background: var(--color-error-light); }

.role-select {
  padding: 0.3rem 0.6rem; border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); font-family: inherit; font-size: 0.8rem;
  color: var(--color-text); background: var(--color-background); cursor: pointer;
}

/* ── Responsividade ─────────────────────────────────────────────── */
@media (max-width: 600px) {
  .members { padding: 1.25rem 1rem; }
  .member-email { display: none; }
  .section__row { flex-direction: column; align-items: flex-start; }
  .invite-form__fields { grid-template-columns: 1fr; }
  .invite-form__select { width: 100%; }
}
</style>