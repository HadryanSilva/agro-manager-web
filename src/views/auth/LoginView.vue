<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

const isFormValid = computed(() => email.value.trim() !== '' && password.value.trim() !== '')

async function handleLogin() {
  if (!isFormValid.value || loading.value) return

  loading.value = true
  errorMessage.value = ''

  try {
    await authStore.login({ email: email.value.trim(), password: password.value })
    router.push({ name: 'dashboard' })
  } catch (err: any) {
    const message = err.response?.data?.message
    errorMessage.value = message ?? 'Erro ao realizar login. Tente novamente.'
  } finally {
    loading.value = false
  }
}

function handleGoogleLogin() {
  window.location.href = `${apiBaseUrl}/oauth2/authorization/google`
}
</script>

<template>
  <div class="login">
    <div class="login__header">
      <h1 class="login__title">Acesse sua conta</h1>
      <p class="login__subtitle">Entre com suas credenciais para continuar</p>
    </div>

    <form class="login__form" @submit.prevent="handleLogin" novalidate>
      <!-- Mensagem de erro global -->
      <div v-if="errorMessage" class="form-error-banner">
        {{ errorMessage }}
      </div>

      <!-- Email -->
      <div class="form-field">
        <label class="form-label" for="email">E-mail</label>
        <input
          id="email"
          v-model="email"
          type="email"
          class="form-input"
          placeholder="seu@email.com"
          autocomplete="email"
          :disabled="loading"
        />
      </div>

      <!-- Senha -->
      <div class="form-field">
        <label class="form-label" for="password">Senha</label>
        <div class="form-input-wrapper">
          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            class="form-input form-input--password"
            placeholder="••••••••"
            autocomplete="current-password"
            :disabled="loading"
          />
          <button
            type="button"
            class="form-input__toggle"
            @click="showPassword = !showPassword"
            :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
          >
            <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Botão de submit -->
      <button type="submit" class="btn-primary" :disabled="!isFormValid || loading">
        <span v-if="loading" class="btn-spinner" />
        <span v-else>Entrar</span>
      </button>
    </form>

    <!-- Divisor -->
    <div class="divider">
      <span>ou</span>
    </div>

    <!-- Botão Google -->
    <button class="btn-google" @click="handleGoogleLogin" :disabled="loading">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      Continuar com Google
    </button>

    <!-- Link para registro -->
    <p class="auth-link">
      Não tem uma conta?
      <RouterLink to="/auth/register">Cadastre-se</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.login__header {
  margin-bottom: 2rem;
}

.login__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.login__subtitle {
  margin-top: 0.375rem;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.login__form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-error-banner {
  background: var(--color-error-light);
  color: var(--color-error);
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.form-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.9375rem;
  color: var(--color-text);
  background: var(--color-card);
  transition: border-color 0.15s, box-shadow 0.15s;
  outline: none;
}

.form-input::placeholder {
  color: var(--color-text-placeholder);
}

.form-input:focus {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(0, 189, 126, 0.12);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-input-wrapper {
  position: relative;
}

.form-input--password {
  padding-right: 2.75rem;
}

.form-input__toggle {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  padding: 0;
  transition: color 0.15s;
}

.form-input__toggle:hover {
  color: var(--color-text);
}

.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  margin-top: 0.25rem;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-primary:active:not(:disabled) {
  transform: scale(0.99);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.divider {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin: 1.5rem 0;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.btn-google {
  width: 100%;
  padding: 0.75rem;
  background: var(--color-card);
  color: var(--color-text);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  min-height: 44px;
}

.btn-google:hover:not(:disabled) {
  background: var(--color-background);
  border-color: #d1d5db;
}

.btn-google:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auth-link {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.auth-link a {
  color: var(--color-primary);
  font-weight: 500;
  text-decoration: none;
  transition: color 0.15s;
}

.auth-link a:hover {
  color: var(--color-primary-dark);
  text-decoration: underline;
}
</style>