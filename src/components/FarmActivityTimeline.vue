<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import activityService from '@/services/activityService'
import type { FarmActivityResponse, FarmActivityType } from '@/services/activityService'

const props = defineProps<{ farmId: string }>()

const accountStore = useAccountStore()
const accountId    = computed(() => accountStore.selectedAccount?.id)

const activities = ref<FarmActivityResponse[]>([])
const loading    = ref(true)
const error      = ref('')

// Estado da nota manual
const noteText    = ref('')
const savingNote  = ref(false)
const noteError   = ref('')

// Configuração visual por tipo
type ActivityConfig = { icon: string; color: string; bg: string; label: string }

const typeConfig: Record<FarmActivityType, ActivityConfig> = {
  EXPENSE_CREATED: {
    label: 'Despesa registrada',
    color: '#2563eb',
    bg:    '#dbeafe',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`
  },
  EXPENSE_UPDATED: {
    label: 'Despesa atualizada',
    color: '#7c3aed',
    bg:    '#ede9fe',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`
  },
  EXPENSE_DELETED: {
    label: 'Despesa removida',
    color: '#dc2626',
    bg:    '#fee2e2',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`
  },
  EXPENSE_PAID: {
    label: 'Despesa paga',
    color: '#059669',
    bg:    '#d1fae5',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
  },
  FARM_UPDATED: {
    label: 'Lavoura atualizada',
    color: '#d97706',
    bg:    '#fef3c7',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`
  },
  NOTE: {
    label: 'Anotação',
    color: '#6b7280',
    bg:    '#f3f4f6',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`
  },
}

onMounted(loadActivities)

async function loadActivities() {
  if (!accountId.value) return
  loading.value = true
  error.value   = ''
  try {
    const { data } = await activityService.getActivities(accountId.value, props.farmId)
    activities.value = data.data
  } catch {
    error.value = 'Erro ao carregar histórico.'
  } finally {
    loading.value = false
  }
}

async function handleAddNote() {
  if (!accountId.value || !noteText.value.trim() || savingNote.value) return
  savingNote.value = true
  noteError.value  = ''
  try {
    const { data } = await activityService.addNote(
      accountId.value, props.farmId, noteText.value.trim()
    )
    // Insere no topo da timeline
    activities.value.unshift(data.data)
    noteText.value = ''
  } catch {
    noteError.value = 'Erro ao salvar anotação.'
  } finally {
    savingNote.value = false
  }
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}
</script>

<template>
  <div class="timeline">

    <!-- Caixa de nova anotação -->
    <div class="note-box">
      <div class="note-box__input-row">
        <textarea
          v-model="noteText"
          class="note-box__textarea"
          placeholder="Adicionar uma anotação sobre esta lavoura..."
          rows="2"
          maxlength="1000"
          @keydown.ctrl.enter="handleAddNote"
        />
        <button
          class="note-box__btn"
          :disabled="!noteText.trim() || savingNote"
          @click="handleAddNote"
        >
          <span v-if="savingNote" class="spinner spinner--sm" />
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15"
               viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
      <div v-if="noteError" class="note-box__error">{{ noteError }}</div>
      <span class="note-box__hint">Ctrl+Enter para enviar</span>
    </div>

    <!-- Erro ao carregar -->
    <div v-if="error" class="error-banner">{{ error }}</div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state"><span class="spinner" /></div>

    <!-- Vazio -->
    <div v-else-if="!loading && activities.length === 0" class="empty-state">
      <p>Nenhuma atividade registrada ainda.</p>
      <p class="empty-state__hint">As atividades aparecerão aqui conforme você interagir com a lavoura.</p>
    </div>

    <!-- Lista de atividades -->
    <div v-else class="timeline__list">
      <div
        v-for="(activity, index) in activities"
        :key="activity.id"
        class="timeline__item"
        :class="{ 'timeline__item--last': index === activities.length - 1 }"
      >
        <!-- Linha vertical da timeline -->
        <div class="timeline__line" v-if="index < activities.length - 1" />

        <!-- Ícone do tipo -->
        <div
          class="timeline__icon"
          :style="{
            background: typeConfig[activity.type].bg,
            color: typeConfig[activity.type].color
          }"
          v-html="typeConfig[activity.type].icon"
        />

        <!-- Conteúdo -->
        <div class="timeline__content">
          <div class="timeline__header">
            <span class="timeline__type-label"
              :style="{ color: typeConfig[activity.type].color }"
            >
              {{ typeConfig[activity.type].label }}
            </span>
            <span class="timeline__date">{{ formatDateTime(activity.createdAt) }}</span>
          </div>

          <p class="timeline__description">{{ activity.description }}</p>

          <!-- Autor -->
          <div class="timeline__author">
            <div class="author-avatar" v-if="activity.userAvatarUrl">
              <img :src="activity.userAvatarUrl" :alt="activity.userName" />
            </div>
            <div class="author-avatar author-avatar--initials" v-else>
              {{ getInitials(activity.userName) }}
            </div>
            <span class="author-name">{{ activity.userName }}</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.timeline { display: flex; flex-direction: column; gap: 1rem; }

/* ── Caixa de anotação ──────────────────────────────────────────── */
.note-box {
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.note-box__input-row {
  display: flex;
  gap: 0.625rem;
  align-items: flex-start;
}

.note-box__textarea {
  flex: 1;
  padding: 0.625rem 0.75rem;
  background: var(--color-background);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.875rem;
  color: var(--color-text);
  resize: none;
  transition: border-color 0.15s;
  min-height: 60px;
}
.note-box__textarea:focus  { outline: none; border-color: var(--color-primary); }
.note-box__textarea::placeholder { color: var(--color-text-placeholder); }

.note-box__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
  transition: opacity 0.15s;
}
.note-box__btn:disabled { opacity: 0.4; cursor: default; }
.note-box__btn:not(:disabled):hover { opacity: 0.85; }

.note-box__hint {
  font-size: 0.72rem;
  color: var(--color-text-placeholder);
}

.note-box__error {
  font-size: 0.8rem;
  color: var(--color-error);
}

/* ── Loading / Erro / Vazio ─────────────────────────────────────── */
.loading-state { display: flex; justify-content: center; padding: 2rem 0; }

.spinner {
  display: inline-block;
  width: 24px; height: 24px;
  border: 2.5px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
.spinner--sm { width: 14px; height: 14px; border-width: 2px; }
@keyframes spin { to { transform: rotate(360deg); } }

.error-banner {
  background: var(--color-error-light);
  color: var(--color-error);
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  background: var(--color-card);
  border: 1.5px dashed var(--color-border);
  border-radius: var(--radius-md);
}
.empty-state__hint { margin-top: 0.375rem; font-size: 0.8rem; }

/* ── Timeline ───────────────────────────────────────────────────── */
.timeline__list { display: flex; flex-direction: column; }

.timeline__item {
  display: flex;
  gap: 0.875rem;
  position: relative;
  padding-bottom: 1.25rem;
}
.timeline__item--last { padding-bottom: 0; }

.timeline__line {
  position: absolute;
  left: 15px;
  top: 28px;
  bottom: 0;
  width: 1.5px;
  background: var(--color-border);
}

.timeline__icon {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  z-index: 1;
}

.timeline__content {
  flex: 1;
  min-width: 0;
  padding-top: 0.125rem;
}

.timeline__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.25rem;
}

.timeline__type-label {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.timeline__date {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.timeline__description {
  font-size: 0.875rem;
  color: var(--color-text);
  line-height: 1.5;
  margin-bottom: 0.5rem;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ── Autor ──────────────────────────────────────────────────────── */
.timeline__author {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.author-avatar {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}
.author-avatar img { width: 100%; height: 100%; object-fit: cover; }
.author-avatar--initials {
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 0.55rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.author-name {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
</style>