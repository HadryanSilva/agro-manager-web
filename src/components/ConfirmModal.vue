<script setup lang="ts">
// Props configuráveis para reutilização em qualquer contexto
withDefaults(defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  // Variante visual do botão de confirmação
  variant?: 'danger' | 'primary'
  loading?: boolean
}>(), {
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  variant: 'danger',
  loading: false,
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-overlay" @mousedown.self="emit('cancel')">
        <div class="modal" role="dialog" aria-modal="true" :aria-labelledby="'modal-title'">

          <!-- Ícone de alerta -->
          <div class="modal__icon" :class="`modal__icon--${variant}`">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>

          <!-- Conteúdo -->
          <div class="modal__content">
            <h2 class="modal__title" id="modal-title">{{ title }}</h2>
            <p class="modal__message">{{ message }}</p>
          </div>

          <!-- Ações -->
          <div class="modal__actions">
            <button
              class="btn-cancel"
              :disabled="loading"
              @click="emit('cancel')"
            >
              {{ cancelLabel }}
            </button>
            <button
              class="btn-confirm"
              :class="`btn-confirm--${variant}`"
              :disabled="loading"
              @click="emit('confirm')"
            >
              <span v-if="loading" class="spinner spinner--sm" />
              {{ confirmLabel }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Overlay ────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

/* ── Modal ──────────────────────────────────────────────────────── */
.modal {
  width: 100%;
  max-width: 400px;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18);
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ── Ícone ──────────────────────────────────────────────────────── */
.modal__icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal__icon--danger  { background: #fee2e2; color: #dc2626; }
.modal__icon--primary { background: var(--color-primary-light); color: var(--color-primary); }

/* ── Conteúdo ───────────────────────────────────────────────────── */
.modal__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.01em;
}

.modal__message {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.55;
  margin-top: 0.25rem;
}

/* ── Ações ──────────────────────────────────────────────────────── */
.modal__actions {
  display: flex;
  gap: 0.625rem;
  justify-content: flex-end;
  margin-top: 0.25rem;
}

.btn-cancel {
  padding: 0.6rem 1.25rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-card);
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.btn-cancel:hover:not(:disabled) { border-color: var(--color-text-muted); color: var(--color-text); }
.btn-cancel:disabled { opacity: 0.5; cursor: default; }

.btn-confirm {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.25rem;
  border: none;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-confirm:disabled { opacity: 0.5; cursor: default; }
.btn-confirm:not(:disabled):hover { opacity: 0.85; }

.btn-confirm--danger  { background: #dc2626; color: #fff; }
.btn-confirm--primary { background: var(--color-primary); color: #fff; }

/* ── Spinner ────────────────────────────────────────────────────── */
.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Animação ───────────────────────────────────────────────────── */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: scale(0.95);
  opacity: 0;
}

/* ── Responsividade ─────────────────────────────────────────────── */
@media (max-width: 480px) {
  .modal { padding: 1.375rem; }
  .modal__actions { flex-direction: column-reverse; }
  .btn-cancel,
  .btn-confirm { width: 100%; justify-content: center; }
}
</style>