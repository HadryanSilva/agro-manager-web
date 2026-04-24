<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="onboarding">
    <div class="onboarding__header">
      <h1 class="onboarding__title">Bem-vindo ao Agro Manager</h1>
      <p class="onboarding__subtitle">
        Para começar, crie uma nova conta ou entre em uma existente com um convite.
      </p>
    </div>

    <div class="onboarding__options">
      <!-- Opção: Criar nova conta -->
      <button class="option-card" @click="router.push({ name: 'create-account' })">
        <div class="option-card__icon option-card__icon--primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        </div>
        <div class="option-card__body">
          <h2 class="option-card__title">Criar nova conta</h2>
          <p class="option-card__description">
            Configure uma nova conta e comece a gerenciar sua propriedade do zero.
          </p>
        </div>
        <div class="option-card__arrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </div>
      </button>

      <!-- Opção: Usar convite -->
      <button class="option-card option-card--disabled" disabled>
        <div class="option-card__icon option-card__icon--muted">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <div class="option-card__body">
          <h2 class="option-card__title">
            Usar um convite
            <span class="option-card__badge">Em breve</span>
          </h2>
          <p class="option-card__description">
            Já recebeu um convite? Entre em uma conta existente pelo link enviado.
          </p>
        </div>
        <div class="option-card__arrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.onboarding__header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.onboarding__title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.03em;
  line-height: 1.2;
}

.onboarding__subtitle {
  margin-top: 0.625rem;
  font-size: 0.9375rem;
  color: var(--color-text-muted);
  max-width: 420px;
  margin-inline: auto;
  line-height: 1.6;
}

.onboarding__options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  width: 100%;
  padding: 1.5rem;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
}

.option-card:hover:not(:disabled) {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-1px);
}

.option-card:active:not(:disabled) {
  transform: translateY(0);
}

.option-card--disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.option-card__icon {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.option-card__icon--primary {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.option-card__icon--muted {
  background: #f3f4f6;
  color: var(--color-text-muted);
}

.option-card__body {
  flex: 1;
}

.option-card__title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.option-card__badge {
  font-size: 0.7rem;
  font-weight: 500;
  padding: 0.125rem 0.5rem;
  background: #f3f4f6;
  color: var(--color-text-muted);
  border-radius: 20px;
  letter-spacing: 0.02em;
}

.option-card__description {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.option-card__arrow {
  flex-shrink: 0;
  color: var(--color-text-muted);
  transition: color 0.15s, transform 0.15s;
}

.option-card:hover:not(:disabled) .option-card__arrow {
  color: var(--color-primary);
  transform: translateX(3px);
}

@media (max-width: 480px) {
  .option-card {
    padding: 1.25rem;
    gap: 1rem;
  }

  .option-card__icon {
    width: 48px;
    height: 48px;
  }

  .option-card__arrow {
    display: none;
  }
}
</style>