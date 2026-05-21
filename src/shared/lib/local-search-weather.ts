import type { LocalWebSearchResult } from '@/shared/lib/local-web-search'
import {
  cityGeocodeVariants,
  geocodeLanguageForCity
} from '@/shared/lib/local-search-city'

const FETCH_TIMEOUT_MS = 10_000

const WMO_LABELS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm'
}

type GeoResult = {
  name: string
  country?: string
  latitude: number
  longitude: number
  timezone: string
}

async function geocodeCityOnce(city: string, language: string): Promise<GeoResult | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=3&language=${language}&format=json`
  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  if (!response.ok) return null

  const data = (await response.json()) as {
    results?: Array<{
      name: string
      country?: string
      latitude: number
      longitude: number
      timezone: string
    }>
  }

  const hit = data.results?.[0]
  if (!hit) return null

  return {
    name: hit.name,
    country: hit.country,
    latitude: hit.latitude,
    longitude: hit.longitude,
    timezone: hit.timezone
  }
}

async function geocodeCity(city: string): Promise<GeoResult | null> {
  const variants = cityGeocodeVariants(city)
  const language = geocodeLanguageForCity(city)

  for (const variant of variants) {
    const hit = await geocodeCityOnce(variant, language).catch(() => null)
    if (hit) return hit
    if (language !== 'en') {
      const enHit = await geocodeCityOnce(variant, 'en').catch(() => null)
      if (enHit) return enHit
    }
  }

  return null
}

function weatherLabel(code: number): string {
  return WMO_LABELS[code] ?? `Weather code ${code}`
}

async function fetchOpenMeteoWeather(geo: GeoResult): Promise<LocalWebSearchResult | null> {
  const params = new URLSearchParams({
    latitude: String(geo.latitude),
    longitude: String(geo.longitude),
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'precipitation',
      'weather_code',
      'wind_speed_10m'
    ].join(','),
    timezone: geo.timezone,
    forecast_days: '1'
  })

  const url = `https://api.open-meteo.com/v1/forecast?${params}`
  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  if (!response.ok) return null

  const data = (await response.json()) as {
    current?: {
      time?: string
      temperature_2m?: number
      apparent_temperature?: number
      relative_humidity_2m?: number
      precipitation?: number
      weather_code?: number
      wind_speed_10m?: number
    }
    current_units?: {
      temperature_2m?: string
      wind_speed_10m?: string
    }
  }

  const current = data.current
  if (!current || current.temperature_2m == null) return null

  const tempUnit = data.current_units?.temperature_2m ?? '°C'
  const windUnit = data.current_units?.wind_speed_10m ?? 'km/h'
  const place = geo.country ? `${geo.name}, ${geo.country}` : geo.name
  const condition = weatherLabel(current.weather_code ?? -1)
  const lines = [
    `${place}: ${Math.round(current.temperature_2m)}${tempUnit}, ${condition}`,
    current.apparent_temperature != null
      ? `Feels like ${Math.round(current.apparent_temperature)}${tempUnit}`
      : null,
    current.relative_humidity_2m != null ? `Humidity ${current.relative_humidity_2m}%` : null,
    current.wind_speed_10m != null ? `Wind ${current.wind_speed_10m} ${windUnit}` : null,
    current.precipitation != null && current.precipitation > 0
      ? `Precipitation ${current.precipitation} mm`
      : null,
    current.time ? `Observed ${current.time} (${geo.timezone})` : null
  ].filter(Boolean)

  return {
    title: `Weather — ${place}`,
    url: 'https://open-meteo.com/',
    snippet: lines.join('. ') + '.'
  }
}

/** wttr.in JSON fallback (no API key). */
async function fetchWttrWeather(city: string): Promise<LocalWebSearchResult | null> {
  const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'Lingo/1.0' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  })
  if (!response.ok) return null

  const data = (await response.json()) as {
    nearest_area?: Array<{ value?: string }>
    current_condition?: Array<{
      temp_C?: string
      weatherDesc?: Array<{ value?: string }>
      humidity?: string
      windspeedKmph?: string
      local_observation_date_time?: string
    }>
  }

  const current = data.current_condition?.[0]
  if (!current?.temp_C) return null

  const place = data.nearest_area?.[0]?.value ?? city
  const desc = current.weatherDesc?.[0]?.value ?? 'Current conditions'
  const snippet = [
    `${place}: ${current.temp_C}°C, ${desc}`,
    current.humidity ? `Humidity ${current.humidity}%` : null,
    current.windspeedKmph ? `Wind ${current.windspeedKmph} km/h` : null,
    current.local_observation_date_time
      ? `Observed ${current.local_observation_date_time}`
      : null
  ]
    .filter(Boolean)
    .join('. ')

  return {
    title: `Weather — ${place}`,
    url: `https://wttr.in/${encodeURIComponent(city)}`,
    snippet: snippet + '.'
  }
}

export async function fetchLocalWeather(city: string): Promise<LocalWebSearchResult[]> {
  const geo = await geocodeCity(city)
  if (geo) {
    const openMeteo = await fetchOpenMeteoWeather(geo).catch(() => null)
    if (openMeteo) return [openMeteo]
  }

  for (const variant of cityGeocodeVariants(city)) {
    const wttr = await fetchWttrWeather(variant).catch(() => null)
    if (wttr) return [wttr]
  }

  return [
    {
      title: 'Weather lookup',
      url: '',
      snippet: `Could not find weather for "${city}". Check the city name or try again.`
    }
  ]
}
