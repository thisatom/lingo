import type { LocalWebSearchResult } from '@/shared/lib/local-web-search'

const FETCH_TIMEOUT_MS = 8_000

type GeoTimezone = {
  name: string
  country?: string
  timezone: string
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

  const geo = await geocodeForTimezone(city)
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
