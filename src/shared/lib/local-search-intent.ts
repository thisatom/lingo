/** Detect specialized local lookup intents from the user message (used as search query). */

export type LocalSearchIntent =
  | { type: 'weather'; city: string }
  | { type: 'time'; city?: string }
  | { type: 'date' }
  | { type: 'general' }

const WEATHER_CITY_PATTERNS = [
  /(?:какая|какой)\s+(?:сейчас\s+)?погод[аеу]\s+(?:в|in|for|at)\s+(.+)/i,
  /(?:погод[аеу]|weather)\s+(?:в|in|for|at)\s+(.+)/i,
  /(?:какая\s+)?погода\s+(?:в|in)\s+(.+)/i,
  /(?:погод[аеу]|weather)\s+(.+)/i,
  /weather\s+in\s+(.+)/i
]

const TIME_CITY_PATTERNS = [
  /(?:какое\s+)?время\s+(?:в|in)\s+(.+)/i,
  /(?:what\s+)?time\s+is\s+it\s+(?:in|в)\s+(.+)/i,
  /сколько\s+времени\s+(?:в|in)?\s*(.+)/i,
  /сколько\s+(?:сейчас\s+)?врем(?:я|ени)\s+(?:в|in)\s+(.+)/i,
  /time\s+in\s+(.+)/i
]

const TIME_NOW_PATTERNS =
  /^(?:какое\s+)?время\??$|^(?:what(?:'s|\s+is)\s+)?the\s+time\??$|^сколько\s+(?:сейчас\s+)?времени\??$|^сколько\s+сейчас\s+время\??$|^what\s+time\s+is\s+it\??$|^(?:который|какой)\s+час\??$/i

const DATE_PATTERNS =
  /какой\s+(?:сегодня\s+)?день|какое\s+(?:сегодня\s+)?число|какая\s+(?:сегодня\s+)?дата|what(?:'s|\s+is)\s+(?:the\s+)?date|what\s+day\s+is\s+it|today'?s\s+date/i

function cleanCityToken(raw: string): string {
  return raw
    .replace(/[?.!,;:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchCity(patterns: RegExp[], query: string): string | null {
  for (const pattern of patterns) {
    const match = query.match(pattern)
    const city = match?.[1]?.trim()
    if (city && city.length >= 2) return cleanCityToken(city)
  }
  return null
}

export function detectLocalSearchIntent(query: string): LocalSearchIntent {
  const text = query.trim()
  if (!text) return { type: 'general' }

  if (DATE_PATTERNS.test(text)) {
    return { type: 'date' }
  }

  const weatherCity = matchCity(WEATHER_CITY_PATTERNS, text)
  if (weatherCity && /погод|weather/i.test(text)) {
    return { type: 'weather', city: weatherCity }
  }

  const timeCity = matchCity(TIME_CITY_PATTERNS, text)
  if (timeCity) {
    return { type: 'time', city: timeCity }
  }

  if (TIME_NOW_PATTERNS.test(text) || /^(?:время|time)\s*\??$/i.test(text)) {
    return { type: 'time' }
  }

  if (/погод|weather/i.test(text)) {
    const loose = text
      .replace(/^(?:какая|какой)\s+(?:сейчас\s+)?/i, '')
      .replace(/погода|погоду|погоде|погоды|погодой|weather/gi, '')
      .replace(/^(?:в|in|for|at)\s+/i, '')
      .replace(/^сейчас\s+/i, '')
      .trim()
    if (loose.length >= 2) return { type: 'weather', city: cleanCityToken(loose) }
  }

  return { type: 'general' }
}
