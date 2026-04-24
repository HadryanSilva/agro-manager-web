<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/accountStore'

const router = useRouter()
const accountStore = useAccountStore()

const name = ref('')
const loading = ref(false)
const errorMessage = ref('')

const isFormValid = computed(() => name.value.trim().length >= 2)

async function handleSubmit() {
  if (!isFormValid.value || loading.value) return

  loading.value = true
  errorMessage.value = ''

  try {
    await accountStore.createAccount(name.value.trim())
    router.push({ name: 'dashboard' })
  } catch (err: any) {
    const message = err.response?.data?.message
    errorMessage.value = message ?? 'Erro ao criar conta. Tente novamente.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="create-account">
    <!-- Botão de voltar -->
    <button class="back-btn" @click="router.push({ name: 'onboarding' })">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="19" y1="12" x2="5" y2="12"/>
        <polyline points="12 19 5 12 12 5"/>
      </svg>
      Voltar
    </button>

    <div class="create-account__card">
      <div class="create-account__header">
        <div class="create-account__icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <div>
          <h1 class="create-account__title">Criar nova conta</h1>
          <p class="create-account__subtitle">Dê um nome para sua propriedade ou organização.</p>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" novalidate>
        <div v-if="errorMessage" class="form-error-banner">
          {{ errorMessage }}
        </div>

        <div class="form-field">
          <label class="form-label" for="account-name">Nome da conta</label>
          <input
            id="account-name"
            v-model="name"
            type="text"
            class="form-input"
            placeholder="Ex: Fazenda São João"
            autocomplete="off"
            :disabled="loading"
            maxlength="100"
          />
          <span class="form-hint">{{ name.length }}/100 caracteres</span>
        </div>

        <button type="submit" class="btn-primary" :disabled="!isFormValid || loading">
          <span v-if="loading" class="btn-spinner" />
          <span v-else>Criar conta</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0;
  margin-bottom: 1.5rem;
  transition: color 0.15s;
}

.back-btn:hover {
  color: var(--color-text);
}

.create-account__card {
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 2rem;
}

.create-account__header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2rem;
}

.create-account__icon {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.create-account__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.create-account__subtitle {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.form-error-banner {
  background: var(--color-error-light);
  color: var(--color-error);
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  margin-bottom: 1.25rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 1.5rem;
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

.form-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-align: right;
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
</style>