<script setup lang="ts">
import { ref } from 'vue'
import { useWeather } from '@/composables/useWeather'
import { getWeatherInfo } from '@/services/weatherService'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const {
  forecast, location, loading, error, geoError,
  requestGeolocation, setLocationByCity,
} = useWeather()

const showCityInput = ref(false)
const cityQuery     = ref('')
const searching     = ref(false)
const searchError   = ref('')

async function handleCitySearch() {
  if (!cityQuery.value.trim() || searching.value) return
  searching.value   = true
  searchError.value = ''
  const ok = await setLocationByCity(cityQuery.value.trim())
  if (ok) {
    showCityInput.value = false
    cityQuery.value     = ''
  } else {
    searchError.value = 'Cidade não encontrada.'
  }
  searching.value = false
}

function formatDayLabel(dateStr: string, index: number): string {
  if (index === 0) return 'Hoje'
  if (index === 1) return 'Amanhã'
  const date = new Date(dateStr + 'T00:00:00')
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' })
  const ddmm    = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${ddmm}`
}

function precipColor(prob: number): string {
  if (prob >= 70) return '#2563eb'
  if (prob >= 40) return '#60a5fa'
  return '#bfdbfe'
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-overlay" @mousedown.self="emit('close')">
        <div class="modal">

          <!-- Cabeçalho -->
          <div class="modal__header">
            <div>
              <h2 class="modal__title">Previsão do tempo</h2>
              <span v-if="location" class="modal__location">📍 {{ location.label }}</span>
            </div>
            <div class="modal__header-actions">
              <button class="icon-btn" title="Buscar cidade" @click="showCityInput = !showCityInput">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </button>
              <button class="icon-btn" title="Usar minha localização" :disabled="loading" @click="requestGeolocation">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                </svg>
              </button>
              <button class="icon-btn icon-btn--close" @click="emit('close')">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Busca manual -->
          <div v-if="showCityInput" class="city-search">
            <input
              v-model="cityQuery"
              type="text"
              class="city-search__input"
              placeholder="Ex: Ceres, GO"
              @keydown.enter="handleCitySearch"
              @keydown.esc="showCityInput = false"
              autofocus
            />
            <button class="city-search__btn" :disabled="searching" @click="handleCitySearch">
              <span v-if="searching" class="spinner spinner--sm" />
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                   viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
            <div v-if="searchError" class="city-search__error">{{ searchError }}</div>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="modal__loading">
            <span class="spinner" /> Buscando previsão...
          </div>

          <!-- Erros -->
          <div v-if="geoError" class="notice">{{ geoError }}</div>
          <div v-if="error"    class="error-banner">{{ error }}</div>

          <template v-if="forecast && !loading">

            <!-- Condição atual -->
            <div class="current">
              <span class="current__emoji">{{ getWeatherInfo(forecast.current.weatherCode).emoji }}</span>
              <div class="current__info">
                <span class="current__temp">{{ forecast.current.temperature }}°C</span>
                <span class="current__label">{{ getWeatherInfo(forecast.current.weatherCode).label }}</span>
                <span class="current__wind">💨 {{ forecast.current.windspeed }} km/h</span>
              </div>
              <div class="current__today" v-if="forecast.daily[0]">
                <span>↑ {{ forecast.daily[0].tempMax }}° · ↓ {{ forecast.daily[0].tempMin }}°</span>
                <span>🌧️ {{ forecast.daily[0].precipProbability }}% · {{ forecast.daily[0].precipSum }} mm</span>
              </div>
            </div>

            <!-- Lista de 14 dias -->
            <div class="days-list">
              <div
                v-for="(day, i) in forecast.daily"
                :key="day.date"
                class="day-row"
                :class="{ 'day-row--today': i === 0, 'day-row--rain': day.precipProbability >= 60 }"
              >
                <span class="day-row__label">{{ formatDayLabel(day.date, i) }}</span>
                <span class="day-row__emoji">{{ getWeatherInfo(day.weatherCode).emoji }}</span>
                <span class="day-row__desc">{{ getWeatherInfo(day.weatherCode).label }}</span>
                <div class="day-row__temps">
                  <span class="day-row__max">{{ day.tempMax }}°</span>
                  <span class="day-row__min">{{ day.tempMin }}°</span>
                </div>
                <div class="day-row__precip">
                  <div class="precip-bar">
                    <div
                      class="precip-bar__fill"
                      :style="{ width: day.precipProbability + '%', background: precipColor(day.precipProbability) }"
                    />
                  </div>
                  <span class="precip-prob" :style="{ color: precipColor(day.precipProbability) }">
                    {{ day.precipProbability }}%
                  </span>
                  <span class="precip-mm">{{ day.precipSum }} mm</span>
                </div>
              </div>
            </div>

          </template>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Overlay / Modal ────────────────────────────────────────────── */
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

.modal {
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ── Cabeçalho ──────────────────────────────────────────────────── */
.modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.modal__title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.modal__location {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  display: block;
  margin-top: 0.15rem;
}

.modal__header-actions { display: flex; gap: 0.375rem; flex-shrink: 0; }

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-background);
  color: var(--color-text-muted);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.icon-btn:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
.icon-btn:disabled { opacity: 0.4; cursor: default; }
.icon-btn--close:hover { border-color: var(--color-error); color: var(--color-error); }

/* ── Busca ──────────────────────────────────────────────────────── */
.city-search { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; }

.city-search__input {
  flex: 1;
  min-width: 160px;
  padding: 0.4rem 0.75rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-background);
  font-family: inherit;
  font-size: 0.875rem;
  color: var(--color-text);
  transition: border-color 0.15s;
}
.city-search__input:focus { outline: none; border-color: var(--color-primary); }

.city-search__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.15s;
  flex-shrink: 0;
}
.city-search__btn:disabled { opacity: 0.5; }
.city-search__btn:not(:disabled):hover { opacity: 0.85; }
.city-search__error { width: 100%; font-size: 0.78rem; color: var(--color-error); }

/* ── Loading / Avisos ───────────────────────────────────────────── */
.modal__loading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.spinner {
  display: inline-block;
  width: 22px; height: 22px;
  border: 2.5px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
.spinner--sm { width: 14px; height: 14px; border-width: 2px; }
@keyframes spin { to { transform: rotate(360deg); } }

.notice { font-size: 0.8125rem; color: var(--color-text-muted); }
.error-banner {
  background: var(--color-error-light);
  color: var(--color-error);
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm);
  padding: 0.625rem 0.875rem;
  font-size: 0.8125rem;
}

/* ── Condição atual ─────────────────────────────────────────────── */
.current {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: var(--color-background);
  border-radius: var(--radius-sm);
  flex-wrap: wrap;
}
.current__emoji { font-size: 2.25rem; line-height: 1; }
.current__info  { display: flex; flex-direction: column; gap: 0.1rem; flex: 1; }
.current__temp  { font-size: 1.75rem; font-weight: 700; color: var(--color-text); letter-spacing: -0.03em; }
.current__label { font-size: 0.875rem; color: var(--color-text-muted); }
.current__wind  { font-size: 0.78rem; color: var(--color-text-muted); }
.current__today { display: flex; flex-direction: column; gap: 0.2rem; text-align: right; font-size: 0.875rem; color: var(--color-text-muted); }

/* ── Lista de dias ──────────────────────────────────────────────── */
.days-list { display: flex; flex-direction: column; gap: 0.25rem; }

.day-row {
  display: grid;
  grid-template-columns: 130px 28px 1fr auto 1fr;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  border: 1.5px solid transparent;
  transition: background 0.12s;
}

.day-row:hover { background: var(--color-background); }
.day-row--today { background: var(--color-primary-light); border-color: var(--color-primary); }
.day-row--rain  { border-color: #bfdbfe; }

.day-row__label { font-size: 0.8125rem; font-weight: 600; color: var(--color-text); }
.day-row__emoji { font-size: 1.125rem; text-align: center; }
.day-row__desc  { font-size: 0.78rem; color: var(--color-text-muted); }

.day-row__temps { display: flex; gap: 0.5rem; justify-content: flex-end; }
.day-row__max   { font-size: 0.875rem; font-weight: 700; color: var(--color-text); }
.day-row__min   { font-size: 0.875rem; color: var(--color-text-muted); }

.day-row__precip {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  justify-content: flex-end;
}

.precip-bar {
  width: 48px;
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  overflow: hidden;
}
.precip-bar__fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; min-width: 2px; }
.precip-prob { font-size: 0.78rem; font-weight: 600; min-width: 30px; text-align: right; }
.precip-mm   { font-size: 0.72rem; color: var(--color-text-muted); min-width: 42px; }

/* ── Animação ───────────────────────────────────────────────────── */
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-active .modal, .modal-leave-active .modal { transition: transform 0.2s ease, opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal, .modal-leave-to .modal { transform: scale(0.96); opacity: 0; }

/* ── Responsividade ─────────────────────────────────────────────── */
@media (max-width: 560px) {
  .day-row { grid-template-columns: 80px 24px 1fr auto; }
  .day-row__precip { display: none; }
  .current__today { display: none; }
}
</style>