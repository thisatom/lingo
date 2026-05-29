import type { LocalWebSearchResult } from '@/shared/lib/local-web-search'

const FETCH_TIMEOUT_MS = 8_000

type GeoTimezone = {
  name: string
  country?: string
  timezone: string
}

export function normalizeCityForTimezoneLookup(city: string): string {
  return city
    .trim()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[?.!,;:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function geocodeForTimezone(city: string): Promise<GeoTimezone | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  if (!response.ok) return null

  const data = (await response.json()) as {
    results?: Array<{ name: string; country?: string; timezone: string }>
  }
  const hit = data.results?.[0]
  if (!hit?.timezone) return null

  return { name: hit.name, country: hit.country, timezone: hit.timezone }
}

type OsmSearchHit = {
  display_name?: string
  lat?: string
  lon?: string
}

async function geocodeViaNominatim(city: string, locale: string): Promise<GeoTimezone | null> {
  const lang = locale.split('-')[0]?.trim() || 'en'
  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(city)}` +
    `&accept-language=${encodeURIComponent(lang)}`
  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  if (!response.ok) return null
  const data = (await response.json()) as OsmSearchHit[]
  const hit = data?.[0]
  if (!hit?.lat || !hit?.lon) return null
  const latitude = Number(hit.lat)
  const longitude = Number(hit.lon)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  const tzUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(String(latitude))}` +
    `&longitude=${encodeURIComponent(String(longitude))}&hourly=temperature_2m&forecast_days=1&timezone=auto`
  const tzResponse = await fetch(tzUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  if (!tzResponse.ok) return null
  const tzData = (await tzResponse.json()) as { timezone?: string }
  if (!tzData.timezone) return null

  const place = hit.display_name?.split(',')[0]?.trim() || city
  return { name: place, timezone: tzData.timezone }
}

function formatDateTime(
  timeZone: string,
  locale: string,
  placeLabel: string
): LocalWebSearchResult {
  const now = new Date()
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZoneName: 'short'
  })
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short'
  })

  const dateLine = dateFormatter.format(now)
  const timeLine = timeFormatter.format(now)

  return {
    title: `Time — ${placeLabel}`,
    url: 'https://www.timeanddate.com/worldclock/',
    snippet: `${placeLabel}: ${timeLine}. ${dateLine}. Time zone: ${timeZone}.`
  }
}

export function fetchLocalDate(locale: string): LocalWebSearchResult[] {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZoneName: 'short'
  })

  return [
    {
      title: 'Today',
      url: '',
      snippet: `Current local date and time: ${formatter.format(now)}.`
    }
  ]
}

export async function fetchLocalTime(
  city: string | undefined,
  locale: string
): Promise<LocalWebSearchResult[]> {
  if (!city) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return [formatDateTime(tz, locale, 'Your device')]
  }

  const lookupCity = normalizeCityForTimezoneLookup(city)
  let geo = await geocodeForTimezone(lookupCity)
  if (!geo) {
    geo = await geocodeViaNominatim(lookupCity, locale)
  }
  if (!geo) {
    return [
      {
        title: 'Time lookup',
        url: '',
        snippet: `Could not find timezone for "${city}". Try another spelling.`
      }
    ]
  }

  const place = geo.country ? `${geo.name}, ${geo.country}` : geo.name
  return [formatDateTime(geo.timezone, locale, place)]
}
