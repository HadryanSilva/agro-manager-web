<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const errorMessage = ref('')

onMounted(() => {
  const accessToken = route.query.accessToken as string
  const refreshToken = route.query.refreshToken as string

  if (!accessToken || !refreshToken) {
    errorMessage.value = 'Autenticação falhou. Tokens não encontrados.'
    return
  }

  // Armazena os tokens e limpa os parâmetros da URL
  authStore.setTokens(accessToken, refreshToken)
  router.replace({ name: 'dashboard' })
})
</script>

<template>
  <div class="callback">
    <div v-if="!errorMessage" class="callback__loading">
      <span class="callback__spinner" />
      <p>Finalizando autenticação...</p>
    </div>

    <div v-else class="callback__error">
      <p>{{ errorMessage }}</p>
      <RouterLink to="/auth/login">Voltar para o login</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.callback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.callback__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.callback__spinner {
  width: 28px;
  height: 28px;
  border: 2.5px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.callback__error {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  color: var(--color-error);
  font-size: 0.9rem;
}

.callback__error a {
  color: var(--color-primary);
  font-weight: 500;
  text-decoration: none;
}
</style>