import type { LocalSearchIntent } from '@/shared/lib/local-search-intent'
import type { LocalWebSearchResult } from '@/shared/lib/local-web-search'

const CLOCK_IN_TEXT = /\d{1,2}:\d{2}(?::\d{2})?/

/** Short factual clock/date lines should not trigger “incomplete answer” retries. */
export function looksLikeClockOrDateAnswer(answer: string): boolean {
  const reply = answer.trim()
  if (!CLOCK_IN_TEXT.test(reply)) return false
  return /[.!?…]$/.test(reply) || reply.length >= 36
}

function firstSnippet(results: LocalWebSearchResult[]): string | null {
  const snippet = results[0]?.snippet?.trim()
  return snippet && snippet.length > 0 ? snippet : null
}

function formatRussianTimeReply(snippet: string, city?: string): string | null {
  const head = snippet.split(/\.\s+/)[0]?.trim() ?? ''
  const clockMatch = head.match(/(\d{1,2}:\d{2}(?::\d{2})?[^,)]*)/)
  if (!clockMatch) return null

  const clock = clockMatch[1].trim()
  const placeMatch = head.match(/^([^:]+):\s*/)
  const place = city?.trim() || placeMatch?.[1]?.trim()
  if (place && place.toLowerCase() !== 'your device') {
    return `Сейчас в ${place}: ${clock}.`
  }
  return `Сейчас: ${clock}.`
}

/** Deterministic reply for time/date local lookup — avoids LLM truncating short clock answers. */
export function buildDirectLocalSearchReply(
  intent: LocalSearchIntent,
  results: LocalWebSearchResult[],
  locale: string
): string | null {
  const snippet = firstSnippet(results)
  if (!snippet) return null

  if (intent.type === 'time') {
    if (!CLOCK_IN_TEXT.test(snippet)) return null
    if (locale.startsWith('ru')) {
      return (
        formatRussianTimeReply(snippet, intent.city) ??
        `${snippet.split(/\.\s+/)[0]}.`
      )
    }
    const head = snippet.split(/\.\s+/)[0]?.trim()
    return head ? `${head}.` : null
  }

  if (intent.type === 'date') {
    const line = snippet
      .replace(/^Current local date and time:\s*/i, '')
      .replace(/^Текущая дата и время:\s*/i, '')
      .trim()
    if (!line) return null
    return line.endsWith('.') ? line : `${line}.`
  }

  return null
}
