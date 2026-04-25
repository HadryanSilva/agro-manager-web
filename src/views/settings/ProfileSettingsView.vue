<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import SettingsTabs from '@/components/SettingsTabs.vue'
import userService from '@/services/userService'
import type { UserProfileResponse } from '@/services/userService'

const profile        = ref<UserProfileResponse | null>(null)
const loading        = ref(true)
const loadError      = ref('')

// ── Estado do formulário de nome ──────────────────────────────────
const name           = ref('')
const savingName     = ref(false)
const nameSuccess    = ref(false)
const nameError      = ref('')

// ── Estado do formulário de senha ─────────────────────────────────
const currentPassword  = ref('')
const newPassword      = ref('')
const confirmPassword  = ref('')
const showCurrent      = ref(false)
const showNew          = ref(false)
const showConfirm      = ref(false)
const savingPassword   = ref(false)
const passwordSuccess  = ref(false)
const passwordError    = ref('')

const isLocalAuth = computed(() => profile.value?.authProvider === 'LOCAL')

// Validação em tempo real da nova senha
const passwordMismatch = computed(() =>
  confirmPassword.value.length > 0 && newPassword.value !== confirmPassword.value
)
const passwordTooShort = computed(() =>
  newPassword.value.length > 0 && newPassword.value.length < 8
)

onMounted(async () => {
  try {
    const { data } = await userService.getProfile()
    profile.value = data.data
    name.value    = data.data.name
  } catch {
    loadError.value = 'Erro ao carregar perfil.'
  } finally {
    loading.value = false
  }
})

async function handleSaveName() {
  if (!name.value.trim() || savingName.value) return
  savingName.value = true
  nameError.value  = ''
  nameSuccess.value = false
  try {
    const { data } = await userService.updateProfile({ name: name.value.trim() })
    profile.value = data.data
    nameSuccess.value = true
    setTimeout(() => { nameSuccess.value = false }, 3000)
  } catch (e: any) {
    nameError.value = e.response?.data?.message ?? 'Erro ao salvar nome.'
  } finally {
    savingName.value = false
  }
}

async function handleChangePassword() {
  if (passwordMismatch.value || passwordTooShort.value || savingPassword.value) return
  savingPassword.value  = true
  passwordError.value   = ''
  passwordSuccess.value = false
  try {
    await userService.changePassword({
      currentPassword: currentPassword.value,
      newPassword:     newPassword.value,
    })
    passwordSuccess.value = true
    currentPassword.value = ''
    newPassword.value     = ''
    confirmPassword.value = ''
    setTimeout(() => { passwordSuccess.value = false }, 4000)
  } catch (e: any) {
    passwordError.value = e.response?.data?.message ?? 'Erro ao alterar senha.'
  } finally {
    savingPassword.value = false
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}
</script>

<template>
  <div class="profile">

    <div class="profile__header">
      <h1 class="profile__title">Configurações</h1>
    </div>

    <!-- Sub-navegação Perfil | Membros -->
    <SettingsTabs />

    <div v-if="loading" class="loading-state">
      <span class="spinner" />
    </div>

    <div v-else-if="loadError" class="error-banner">{{ loadError }}</div>

    <template v-else-if="profile">

      <!-- ── Card de identidade ─────────────────────────────────── -->
      <div class="identity-card">
        <div class="identity-card__avatar">
          <img v-if="profile.avatarUrl" :src="profile.avatarUrl" :alt="profile.name" />
          <span v-else class="avatar-initials">{{ getInitials(profile.name) }}</span>
        </div>
        <div class="identity-card__info">
          <span class="identity-card__name">{{ profile.name }}</span>
          <span class="identity-card__email">{{ profile.email }}</span>
          <div class="identity-card__badges">
            <span class="provider-badge" :class="`provider-badge--${profile.authProvider.toLowerCase()}`">
              <svg v-if="profile.authProvider === 'GOOGLE'" xmlns="http://www.w3.org/2000/svg"
                   width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {{ profile.authProvider === 'GOOGLE' ? 'Google' : 'E-mail' }}
            </span>
            <span v-if="profile.emailVerified" class="verified-badge">
              ✓ E-mail verificado
            </span>
          </div>
          <span class="identity-card__since">
            Membro desde {{ formatDate(profile.createdAt) }}
          </span>
        </div>
      </div>

      <!-- ── Atualizar nome ─────────────────────────────────────── -->
      <div class="settings-section">
        <h2 class="settings-section__title">Informações pessoais</h2>

        <div class="form-field">
          <label class="form-label">Nome</label>
          <input
            v-model="name"
            type="text"
            class="form-input"
            placeholder="Seu nome completo"
            maxlength="100"
            @keydown.enter="handleSaveName"
          />
        </div>

        <div class="form-field">
          <label class="form-label">E-mail</label>
          <input
            :value="profile.email"
            type="email"
            class="form-input form-input--readonly"
            readonly
            title="O e-mail não pode ser alterado"
          />
          <span class="form-hint">O e-mail não pode ser alterado.</span>
        </div>

        <div v-if="nameError"   class="error-banner">{{ nameError }}</div>
        <div v-if="nameSuccess" class="success-banner">Nome atualizado com sucesso!</div>

        <div class="section-footer">
          <button
            class="btn-primary"
            :disabled="savingName || !name.trim() || name === profile.name"
            @click="handleSaveName"
          >
            <span v-if="savingName" class="spinner spinner--sm" />
            Salvar nome
          </button>
        </div>
      </div>

      <!-- ── Alterar senha (apenas LOCAL) ──────────────────────── -->
      <div class="settings-section" v-if="isLocalAuth">
        <h2 class="settings-section__title">Alterar senha</h2>

        <!-- Senha atual -->
        <div class="form-field">
          <label class="form-label">Senha atual</label>
          <div class="input-wrapper">
            <input
              v-model="currentPassword"
              :type="showCurrent ? 'text' : 'password'"
              class="form-input form-input--password"
              placeholder="Sua senha atual"
              autocomplete="current-password"
            />
            <button type="button" class="toggle-btn" @click="showCurrent = !showCurrent">
              <svg v-if="!showCurrent" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                   viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                   viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Nova senha -->
        <div class="form-field">
          <label class="form-label">Nova senha</label>
          <div class="input-wrapper">
            <input
              v-model="newPassword"
              :type="showNew ? 'text' : 'password'"
              class="form-input form-input--password"
              :class="{ 'form-input--error': passwordTooShort }"
              placeholder="Mínimo 8 caracteres"
              autocomplete="new-password"
            />
            <button type="button" class="toggle-btn" @click="showNew = !showNew">
              <svg v-if="!showNew" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                   viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                   viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
          <span v-if="passwordTooShort" class="form-hint form-hint--error">
            Mínimo 8 caracteres
          </span>
        </div>

        <!-- Confirmar nova senha -->
        <div class="form-field">
          <label class="form-label">Confirmar nova senha</label>
          <div class="input-wrapper">
            <input
              v-model="confirmPassword"
              :type="showConfirm ? 'text' : 'password'"
              class="form-input form-input--password"
              :class="{ 'form-input--error': passwordMismatch }"
              placeholder="Repita a nova senha"
              autocomplete="new-password"
            />
            <button type="button" class="toggle-btn" @click="showConfirm = !showConfirm">
              <svg v-if="!showConfirm" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                   viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                   viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
          <span v-if="passwordMismatch" class="form-hint form-hint--error">
            As senhas não coincidem
          </span>
        </div>

        <div v-if="passwordError"   class="error-banner">{{ passwordError }}</div>
        <div v-if="passwordSuccess" class="success-banner">Senha alterada com sucesso!</div>

        <div class="section-footer">
          <button
            class="btn-primary"
            :disabled="savingPassword || !currentPassword || !newPassword || !confirmPassword || passwordMismatch || passwordTooShort"
            @click="handleChangePassword"
          >
            <span v-if="savingPassword" class="spinner spinner--sm" />
            Alterar senha
          </button>
        </div>
      </div>

      <!-- Aviso para contas OAuth2 -->
      <div class="settings-section settings-section--muted" v-else>
        <h2 class="settings-section__title">Senha</h2>
        <p class="oauth-notice">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Sua conta usa autenticação via Google. A senha é gerenciada pelo Google e não pode ser alterada aqui.
        </p>
      </div>

    </template>
  </div>
</template>

<style scoped>
.profile {
  padding: 2rem 1.5rem;
  max-width: 640px;
  margin: 0 auto;
}

.profile__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
  margin-bottom: 1.5rem;
}

/* ── Loading / Erro ──────────────────────────────────────────────── */
.loading-state { display: flex; justify-content: center; padding: 4rem 0; }
.spinner {
  display: inline-block;
  width: 28px; height: 28px;
  border: 2.5px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
.spinner--sm { width: 16px; height: 16px; border-width: 2px; }
@keyframes spin { to { transform: rotate(360deg); } }

.error-banner {
  background: var(--color-error-light);
  color: var(--color-error);
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.success-banner {
  background: #f0fdf4;
  color: #059669;
  border: 1px solid #6ee7b7;
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

/* ── Card de identidade ─────────────────────────────────────────── */
.identity-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.25rem;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  margin-bottom: 1.5rem;
}

.identity-card__avatar {
  width: 64px; height: 64px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
}
.identity-card__avatar img { width: 100%; height: 100%; object-fit: cover; }

.avatar-initials {
  width: 100%; height: 100%;
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 1.25rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.identity-card__info { display: flex; flex-direction: column; gap: 0.25rem; min-width: 0; }

.identity-card__name {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--color-text);
}

.identity-card__email {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.identity-card__badges { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.25rem; }

.provider-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  font-size: 0.72rem;
  font-weight: 600;
}
.provider-badge--local  { background: var(--color-primary-light); color: var(--color-primary); }
.provider-badge--google { background: #fef9c3; color: #b45309; }

.verified-badge {
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  font-size: 0.72rem;
  font-weight: 600;
  background: #d1fae5;
  color: #059669;
}

.identity-card__since {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  margin-top: 0.1rem;
}

/* ── Seções de configuração ─────────────────────────────────────── */
.settings-section {
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.375rem;
  margin-bottom: 1rem;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.settings-section--muted { opacity: 0.7; }

.settings-section__title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.01em;
}

/* ── Campos de formulário ───────────────────────────────────────── */
.form-field { display: flex; flex-direction: column; gap: 0.375rem; }

.form-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text);
}

.form-input {
  padding: 0.625rem 0.875rem;
  background: var(--color-background);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.9rem;
  color: var(--color-text);
  transition: border-color 0.15s;
  width: 100%;
  box-sizing: border-box;
}
.form-input:focus         { outline: none; border-color: var(--color-primary); }
.form-input--readonly     { color: var(--color-text-muted); cursor: not-allowed; background: var(--color-background); }
.form-input--password     { padding-right: 2.75rem; }
.form-input--error        { border-color: var(--color-error); }

.form-hint              { font-size: 0.75rem; color: var(--color-text-muted); }
.form-hint--error       { color: var(--color-error); }

/* ── Input com botão de toggle de senha ─────────────────────────── */
.input-wrapper { position: relative; }
.input-wrapper .form-input { width: 100%; }

.toggle-btn {
  position: absolute;
  right: 0.625rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  transition: color 0.15s;
}
.toggle-btn:hover { color: var(--color-text); }

/* ── Footer de seção ────────────────────────────────────────────── */
.section-footer { display: flex; justify-content: flex-end; padding-top: 0.25rem; }

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.375rem;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-primary:disabled           { opacity: 0.5; cursor: default; }
.btn-primary:not(:disabled):hover { opacity: 0.85; }

/* ── Aviso OAuth ────────────────────────────────────────────────── */
.oauth-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
.oauth-notice svg { flex-shrink: 0; margin-top: 0.1rem; }

/* ── Responsividade ─────────────────────────────────────────────── */
@media (max-width: 640px) {
  .profile { padding: 1.25rem 1rem; }
  .identity-card { flex-direction: column; text-align: center; }
  .identity-card__badges { justify-content: center; }
  .identity-card__email { white-space: normal; }
  .section-footer { justify-content: stretch; }
  .btn-primary { width: 100%; justify-content: center; }
}
</style>