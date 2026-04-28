<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useWeather } from '@/composables/useWeather'
import { getWeatherInfo } from '@/services/weatherService'
import WeatherModal from '@/components/WeatherModal.vue'

const { forecast, location, loading, error, geoError, init, requestGeolocation, setLocationByCity } = useWeather()

const showModal     = ref(false)
const showCityInput = ref(false)
const cityQuery     = ref('')
const searching     = ref(false)

onMounted(init)

async function handleCitySearch() {
  if (!cityQuery.value.trim() || searching.value) return
  searching.value = true
  const ok = await setLocationByCity(cityQuery.value.trim())
  if (ok) {
    showCityInput.value = false
    cityQuery.value     = ''
  }
  searching.value = false
}
</script>

<template>
  <div class="weather-compact">

    <!-- Loading -->
    <div v-if="loading" class="weather-compact__loading">
      <span class="spinner spinner--sm" />
      <span>Buscando previsão do tempo...</span>
    </div>

    <!-- Sem localização -->
    <div v-else-if="!forecast && (geoError || !location)" class="weather-compact__empty">
      <span>🌤️</span>
      <template v-if="!showCityInput">
        <span class="weather-compact__empty-text">
          {{ geoError || 'Ative a localização para ver a previsão do tempo.' }}
        </span>
        <button class="btn-sm" @click="requestGeolocation">Usar localização</button>
        <button class="btn-sm btn-sm--outline" @click="showCityInput = true">Informar cidade</button>
      </template>
      <template v-else>
        <input
          v-model="cityQuery"
          type="text"
          class="city-input"
          placeholder="Ex: Ceres, GO"
          @keydown.enter="handleCitySearch"
          @keydown.esc="showCityInput = false"
          autofocus
        />
        <button class="btn-sm" :disabled="searching" @click="handleCitySearch">
          <span v-if="searching" class="spinner spinner--sm" />
          <span v-else>Buscar</span>
        </button>
      </template>
    </div>

    <!-- Card compacto clicável -->
    <button
      v-else-if="forecast"
      class="weather-compact__card"
      @click="showModal = true"
      title="Ver previsão completa"
    >
      <!-- Condição atual -->
      <div class="weather-compact__current">
        <span class="weather-compact__emoji">{{ getWeatherInfo(forecast.current.weatherCode).emoji }}</span>
        <div class="weather-compact__main">
          <span class="weather-compact__temp">{{ forecast.current.temperature }}°C</span>
          <span class="weather-compact__label">{{ getWeatherInfo(forecast.current.weatherCode).label }}</span>
        </div>
        <div class="weather-compact__location-info">
          <span class="weather-compact__city">📍 {{ location?.label }}</span>
          <span class="weather-compact__range" v-if="forecast.daily[0]">
            ↑ {{ forecast.daily[0].tempMax }}° · ↓ {{ forecast.daily[0].tempMin }}° ·
            🌧️ {{ forecast.daily[0].precipProbability }}%
          </span>
        </div>
      </div>

      <!-- Próximos 4 dias em miniatura -->
      <div class="weather-compact__mini-days">
        <div
          v-for="(day, i) in forecast.daily.slice(1, 5)"
          :key="day.date"
          class="mini-day"
          :class="{ 'mini-day--rain': day.precipProbability >= 60 }"
        >
          <span class="mini-day__label">
            {{ i === 0 ? 'Amanhã' : new Date(day.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.','') }}
          </span>
          <span class="mini-day__emoji">{{ getWeatherInfo(day.weatherCode).emoji }}</span>
          <span class="mini-day__temp">{{ day.tempMax }}°</span>
          <span class="mini-day__prob">{{ day.precipProbability }}%</span>
        </div>
        <div class="mini-day mini-day--more">
          <span>Ver</span>
          <span>14d</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>
    </button>

    <!-- Modal completo -->
    <WeatherModal :open="showModal" @close="showModal = false" />
  </div>
</template>

<style scoped>
.weather-compact { margin-bottom: 1.75rem; }

/* ── Loading ────────────────────────────────────────────────────── */
.weather-compact__loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

/* ── Vazio ──────────────────────────────────────────────────────── */
.weather-compact__empty {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-wrap: wrap;
  padding: 0.75rem 1rem;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
}

.weather-compact__empty-text {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  flex: 1;
  min-width: 0;
}

.btn-sm {
  padding: 0.35rem 0.875rem;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}
.btn-sm:disabled { opacity: 0.5; cursor: default; }
.btn-sm:not(:disabled):hover { opacity: 0.85; }

.btn-sm--outline {
  background: none;
  border: 1.5px solid var(--color-border);
  color: var(--color-text-muted);
}
.btn-sm--outline:hover { border-color: var(--color-primary); color: var(--color-primary); background: none; }

.city-input {
  padding: 0.35rem 0.75rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-background);
  font-family: inherit;
  font-size: 0.8125rem;
  color: var(--color-text);
  width: 160px;
}
.city-input:focus { outline: none; border-color: var(--color-primary); }

/* ── Card compacto clicável ─────────────────────────────────────── */
.weather-compact__card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1.125rem;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: border-color 0.15s, background 0.15s;
  flex-wrap: wrap;
}
.weather-compact__card:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

/* Condição atual */
.weather-compact__current {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.weather-compact__emoji { font-size: 1.875rem; line-height: 1; flex-shrink: 0; }

.weather-compact__main {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  flex-shrink: 0;
}
.weather-compact__temp  { font-size: 1.25rem; font-weight: 700; color: var(--color-text); letter-spacing: -0.02em; }
.weather-compact__label { font-size: 0.78rem; color: var(--color-text-muted); }

.weather-compact__location-info {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  min-width: 0;
}
.weather-compact__city  { font-size: 0.78rem; color: var(--color-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.weather-compact__range { font-size: 0.75rem; color: var(--color-text-muted); }

/* Mini dias */
.weather-compact__mini-days {
  display: flex;
  gap: 0.375rem;
  flex-shrink: 0;
}

.mini-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  padding: 0.375rem 0.5rem;
  border-radius: var(--radius-sm);
  background: var(--color-background);
  min-width: 44px;
}

.mini-day--rain { background: #eff6ff; }

.mini-day--more {
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 0.72rem;
  font-weight: 600;
}

.mini-day__label { font-size: 0.65rem; color: var(--color-text-muted); font-weight: 600; }
.mini-day__emoji { font-size: 1rem; }
.mini-day__temp  { font-size: 0.8rem; font-weight: 700; color: var(--color-text); }
.mini-day__prob  { font-size: 0.65rem; color: var(--color-text-muted); }

/* ── Spinner ────────────────────────────────────────────────────── */
.spinner {
  display: inline-block;
  width: 22px; height: 22px;
  border: 2.5px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
.spinner--sm { width: 12px; height: 12px; border-width: 2px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Responsividade ─────────────────────────────────────────────── */
@media (max-width: 640px) {
  .weather-compact__mini-days { display: none; }
  .weather-compact__card { gap: 0.75rem; }
}
</style>