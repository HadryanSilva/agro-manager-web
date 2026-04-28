import { ref, readonly } from 'vue'
import { fetchForecast, geocodeCity, reverseGeocode } from '@/services/weatherService'
import type { WeatherForecast } from '@/services/weatherService'

const STORAGE_KEY = 'agro_weather_location'

interface SavedLocation {
  lat: number
  lon: number
  label: string
}

// Singleton
const forecast = ref<WeatherForecast | null>(null)
const location = ref<SavedLocation | null>(null)
const loading  = ref(false)
const error    = ref('')
const geoError = ref('')

function loadSavedLocation(): SavedLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveLocation(loc: SavedLocation) {
  location.value = loc
  localStorage.setItem(STORAGE_KEY, JSON.stringify(loc))
}

async function fetchWeather(lat: number, lon: number) {
  loading.value = true
  error.value   = ''
  try {
    forecast.value = await fetchForecast(lat, lon)
  } catch {
    error.value    = 'Não foi possível carregar a previsão do tempo.'
    forecast.value = null
  } finally {
    loading.value = false
  }
}

export function useWeather() {

  async function init() {
    if (forecast.value) return

    const saved = loadSavedLocation()
    if (saved) {
      location.value = saved
      await fetchWeather(saved.lat, saved.lon)
      return
    }

    await requestGeolocation()
  }

  async function requestGeolocation() {
    if (!navigator.geolocation) {
      geoError.value = 'Geolocalização não suportada neste navegador.'
      return
    }

    loading.value  = true
    geoError.value = ''
    error.value    = ''

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude

        // Obtém o nome da cidade via reverse geocoding antes de salvar
        const label = await reverseGeocode(lat, lon)

        const loc: SavedLocation = { lat, lon, label }
        saveLocation(loc)
        await fetchWeather(lat, lon)
      },
      (err) => {
        loading.value = false
        if (err.code === err.PERMISSION_DENIED) {
          geoError.value = 'Permissão de localização negada. Informe a cidade manualmente.'
        } else {
          geoError.value = 'Não foi possível obter sua localização.'
        }
      },
      { timeout: 8000 }
    )
  }

  async function setLocationByCity(query: string): Promise<boolean> {
    loading.value = true
    error.value   = ''
    try {
      const result = await geocodeCity(query)
      if (!result) {
        error.value   = 'Cidade não encontrada. Tente outro nome.'
        loading.value = false
        return false
      }
      const loc: SavedLocation = {
        lat:   result.lat,
        lon:   result.lon,
        label: `${result.name}, ${result.country}`,
      }
      saveLocation(loc)
      await fetchWeather(loc.lat, loc.lon)
      return true
    } catch {
      error.value   = 'Erro ao buscar cidade.'
      loading.value = false
      return false
    }
  }

  function clearLocation() {
    localStorage.removeItem(STORAGE_KEY)
    location.value = null
    forecast.value = null
    error.value    = ''
    geoError.value = ''
  }

  return {
    forecast: readonly(forecast),
    location: readonly(location),
    loading:  readonly(loading),
    error:    readonly(error),
    geoError: readonly(geoError),
    init,
    requestGeolocation,
    setLocationByCity,
    clearLocation,
  }
}