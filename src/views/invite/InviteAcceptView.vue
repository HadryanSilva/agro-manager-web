<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useAccountStore } from '@/stores/accountStore'
import memberService from '@/services/memberService'
import type { AccountInviteResponse } from '@/services/memberService'

const router       = useRouter()
const route        = useRoute()
const authStore    = useAuthStore()
const accountStore = useAccountStore()

const token   = route.params.token as string
const invite  = ref<AccountInviteResponse | null>(null)
const loading = ref(true)
const accepting = ref(false)
const error   = ref('')
const success = ref(false)

const roleLabels: Record<string, string> = {
  OWNER:  'Owner',
  ADMIN:  'Admin',
  MEMBER: 'Membro',
}

onMounted(async () => {
  // Carrega detalhes do convite (endpoint público)
  try {
    const { data } = await memberService.getInviteDetails(token)
    invite.value = data.data
  } catch (e: any) {
    const status = e.response?.status
    if (status === 404 || status === 410) {
      error.value = 'Este convite não existe, já foi utilizado ou expirou.'
    } else {
      error.value = 'Erro ao carregar convite.'
    }
  } finally {
    loading.value = false
  }
})

async function handleAccept() {
  // Redireciona para login se não autenticado, preservando a rota atual
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }

  accepting.value = true
  error.value     = ''

  try {
    await memberService.acceptInvite(token)

    // Recarrega a lista de contas para incluir a nova
    await accountStore.fetchUserAccounts()

    success.value = true
    // Redireciona ao dashboard após breve feedback
    setTimeout(() => router.push({ name: 'dashboard' }), 1800)
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Erro ao aceitar convite.'
    accepting.value = false
  }
}
</script>

<template>
  <div class="invite-page">
    <div class="invite-card">

      <!-- Marca / logo -->
      <div class="invite-card__brand">
        <span class="invite-card__brand-icon">🌱</span>
        <span class="invite-card__brand-name">Agro Manager</span>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="invite-card__loading">
        <span class="spinner" />
        <p>Carregando convite...</p>
      </div>

      <!-- Erro no carregamento -->
      <div v-else-if="error && !invite" class="invite-card__error">
        <span class="invite-card__error-icon">⚠️</span>
        <h2>Convite inválido</h2>
        <p>{{ error }}</p>
        <button class="btn-primary" @click="router.push({ name: 'login' })">
          Ir para o login
        </button>
      </div>

      <!-- Aceite com sucesso -->
      <div v-else-if="success" class="invite-card__success">
        <span class="invite-card__success-icon">✅</span>
        <h2>Bem-vindo!</h2>
        <p>
          Você agora faz parte da conta
          <strong>{{ invite?.accountName }}</strong>.
          Redirecionando...
        </p>
      </div>

      <!-- Detalhes do convite -->
      <template v-else-if="invite">
        <div class="invite-card__body">
          <h2 class="invite-card__title">Você foi convidado</h2>
          <p class="invite-card__desc">
            Para fazer parte da conta
          </p>

          <div class="invite-card__account">
            <span class="invite-card__account-name">{{ invite.accountName }}</span>
            <span class="invite-card__role">
              Como <strong>{{ roleLabels[invite.role] }}</strong>
            </span>
          </div>

          <p class="invite-card__by">
            Convite gerado por <strong>{{ invite.createdByName }}</strong>
          </p>

          <!-- Erro ao aceitar -->
          <div v-if="error" class="error-banner">{{ error }}</div>

          <!-- Botão principal -->
          <button
            class="btn-accept"
            :disabled="accepting"
            @click="handleAccept"
          >
            <span v-if="accepting" class="spinner spinner--sm" />
            <span v-else-if="!authStore.isAuthenticated">
              Fazer login para aceitar
            </span>
            <span v-else>
              Aceitar convite
            </span>
          </button>

          <p v-if="!authStore.isAuthenticated" class="invite-card__hint">
            Você será redirecionado para o login e voltará aqui automaticamente.
          </p>
        </div>
      </template>

    </div>
  </div>
</template>

<style scoped>
.invite-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background);
  padding: 1.5rem;
}

.invite-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 2.5rem 2rem;
}

.invite-card__brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
}
.invite-card__brand-icon { font-size: 1.25rem; }
.invite-card__brand-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

/* ── Loading ────────────────────────────────────────────────────── */
.invite-card__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

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

/* ── Erro ───────────────────────────────────────────────────────── */
.invite-card__error {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}
.invite-card__error-icon { font-size: 2rem; }
.invite-card__error h2 {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text);
}
.invite-card__error p { font-size: 0.875rem; color: var(--color-text-muted); }

/* ── Sucesso ────────────────────────────────────────────────────── */
.invite-card__success {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}
.invite-card__success-icon { font-size: 2.5rem; }
.invite-card__success h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
}
.invite-card__success p { font-size: 0.9rem; color: var(--color-text-muted); }

/* ── Body principal ─────────────────────────────────────────────── */
.invite-card__body { display: flex; flex-direction: column; gap: 1rem; }

.invite-card__title {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.invite-card__desc { font-size: 0.9rem; color: var(--color-text-muted); margin-top: -0.5rem; }

.invite-card__account {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem 1.25rem;
  background: var(--color-primary-light);
  border: 1.5px solid var(--color-primary);
  border-radius: var(--radius-md);
}

.invite-card__account-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-primary);
}

.invite-card__role { font-size: 0.875rem; color: var(--color-primary); }

.invite-card__by {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.error-banner {
  background: var(--color-error-light);
  color: var(--color-error);
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
}

.btn-accept {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-accept:disabled { opacity: 0.6; cursor: default; }
.btn-accept:not(:disabled):hover { opacity: 0.85; }

.btn-primary {
  padding: 0.65rem 1.5rem;
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
.btn-primary:hover { opacity: 0.85; }

.invite-card__hint {
  font-size: 0.78rem;
  color: var(--color-text-placeholder);
  text-align: center;
}
</style>