// Integração com Open-Meteo (https://open-meteo.com)
// Gratuita, sem chave de API, sem CORS, cobertura global

const BASE_URL = 'https://api.open-meteo.com/v1/forecast'

export interface WeatherDay {
  date: string
  tempMax: number
  tempMin: number
  precipSum: number
  precipProbability: number
  weatherCode: number
}

export interface CurrentWeather {
  temperature: number
  windspeed: number
  weatherCode: number
  isDay: boolean
}

export interface WeatherForecast {
  latitude: number
  longitude: number
  timezone: string
  current: CurrentWeather
  daily: WeatherDay[]
}

export async function fetchForecast(lat: number, lon: number): Promise<WeatherForecast> {
  const params = new URLSearchParams({
    latitude:  lat.toFixed(4),
    longitude: lon.toFixed(4),
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'precipitation_probability_max',
      'weather_code',
    ].join(','),
    current_weather: 'true',
    timezone: 'America/Sao_Paulo',
    forecast_days: '15',
  })

  const response = await fetch(`${BASE_URL}?${params}`)
  if (!response.ok) throw new Error('Erro ao buscar previsão do tempo')

  const data = await response.json()

  const daily: WeatherDay[] = data.daily.time.map((date: string, i: number) => ({
    date,
    tempMax:           Math.round(data.daily.temperature_2m_max[i]),
    tempMin:           Math.round(data.daily.temperature_2m_min[i]),
    precipSum:         Number((data.daily.precipitation_sum[i] ?? 0).toFixed(1)),
    precipProbability: data.daily.precipitation_probability_max[i] ?? 0,
    weatherCode:       data.daily.weather_code[i],
  }))

  return {
    latitude:  data.latitude,
    longitude: data.longitude,
    timezone:  data.timezone,
    current: {
      temperature: Math.round(data.current_weather.temperature),
      windspeed:   Math.round(data.current_weather.windspeed),
      weatherCode: data.current_weather.weathercode,
      isDay:       data.current_weather.is_day === 1,
    },
    daily,
  }
}

export async function geocodeCity(query: string): Promise<{ name: string; lat: number; lon: number; country: string } | null> {
  const params = new URLSearchParams({
    q:                   `${query}, Brasil`,
    format:              'json',
    limit:               '1',
    'accept-language':   'pt-BR',
    countrycodes:        'br',   // restringe ao Brasil
  })

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    { headers: { 'User-Agent': 'AgroManager/1.0' } }
  )

  if (!response.ok) return null

  const data = await response.json()
  if (!data.length) return null

  const r = data[0]

  // Extrai nome legível do display_name (ex: "Uruana, Goiás, Brasil" → "Uruana, GO")
  const parts = r.display_name.split(', ')
  const city  = parts[0]

  return { name: city, lat: parseFloat(r.lat), lon: parseFloat(r.lon), country: 'Brasil' }
}

/**
 * Obtém o nome da cidade a partir de coordenadas geográficas.
 * Usa Nominatim (OpenStreetMap) — gratuito, sem chave de API.
 * Retorna ex: "Ceres, GO" ou "São Paulo, SP".
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const params = new URLSearchParams({
      lat:            lat.toFixed(6),
      lon:            lon.toFixed(6),
      format:         'json',
      'accept-language': 'pt-BR',
      zoom:           '10',  // nível de cidade
    })

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params}`,
      { headers: { 'User-Agent': 'AgroManager/1.0' } }
    )

    if (!response.ok) return 'Minha localização'

    const data = await response.json()
    const addr = data.address

    // Tenta montar "Cidade, Estado" no padrão brasileiro
    const city  = addr.city || addr.town || addr.village || addr.municipality || ''
    const state = addr.state_code || addr.state || ''

    if (city && state) return `${city}, ${state}`
    if (city)          return city
    if (data.display_name) return data.display_name.split(',')[0]

    return 'Minha localização'
  } catch {
    return 'Minha localização'
  }
}

// ── Mapeamento de WMO weather codes ───────────────────────────────
export function getWeatherInfo(code: number): { label: string; emoji: string } {
  if (code === 0)  return { label: 'Céu limpo',           emoji: '☀️' }
  if (code <= 2)   return { label: 'Parcialmente nublado', emoji: '⛅' }
  if (code === 3)  return { label: 'Nublado',              emoji: '☁️' }
  if (code <= 49)  return { label: 'Neblina',              emoji: '🌫️' }
  if (code <= 55)  return { label: 'Garoa',                emoji: '🌦️' }
  if (code <= 65)  return { label: 'Chuva',                emoji: '🌧️' }
  if (code <= 77)  return { label: 'Neve',                 emoji: '❄️' }
  if (code <= 82)  return { label: 'Chuva forte',          emoji: '🌧️' }
  if (code <= 86)  return { label: 'Neve forte',           emoji: '❄️' }
  if (code <= 99)  return { label: 'Tempestade',           emoji: '⛈️' }
  return                   { label: 'Indisponível',        emoji: '❓' }
}