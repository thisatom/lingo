const TOKEN_PATTERN = /[\p{L}\p{N}']+/gu

/** whisper.cpp time tokens — including malformed negative offsets from realtime mode. */
const WHISPER_TIMESTAMP = /\b\d{1,2}(?::-?\d{1,3}){1,2}[.,]-?\d{1,4}\b/g

function normalizeToken(token: string): string {
  return token.toLowerCase().replace(/['']/g, '')
}

export function isWhisperTimestampToken(text: string): boolean {
  return /^\d{1,2}(?::-?\d{1,3}){1,2}[.,]-?\d{1,4}$/.test(text.trim())
}

export function stripWhisperTimestamps(text: string): string {
  return text.replace(WHISPER_TIMESTAMP, '').replace(/\s+/g, ' ').trim()
}

function splitTranscriptionParts(
  transcription: string[][] | string[] | undefined
): string[] {
  if (!Array.isArray(transcription) || transcription.length === 0) return []

  if (typeof transcription[0] === 'string') {
    return (transcription as string[]).map((part) => part.trim()).filter(Boolean)
  }

  const rows = transcription as string[][]
  const lastRow = rows[rows.length - 1] ?? []
  return lastRow.map((part) => part.trim()).filter(Boolean)
}

/** Realtime whisper.cpp may emit timestamp-delimited segments — keep the last speech block. */
export function extractLastSpeechSegment(parts: string[]): string {
  const segments: string[] = []
  let buffer: string[] = []

  for (const part of parts) {
    if (isWhisperTimestampToken(part)) {
      if (buffer.length > 0) {
        segments.push(buffer.join(' ').trim())
        buffer = []
      }
      continue
    }
    buffer.push(part)
  }

  if (buffer.length > 0) segments.push(buffer.join(' ').trim())
  if (segments.length === 0) return parts.join(' ').trim()
  return segments[segments.length - 1]!
}

/** Collapse immediate duplicate prefix inside one transcript (realtime carry-over). */
export function collapseInternalDuplicateTranscript(text: string): string {
  const trimmed = text.trim()
  if (trimmed.length < 30) return trimmed

  const half = Math.floor(trimmed.length / 2)
  for (let size = Math.min(half, 600); size >= 20; size--) {
    const prefix = trimmed.slice(0, size).trim()
    const rest = trimmed.slice(size).trim()
    if (!prefix || !rest.startsWith(prefix)) continue

    const suffix = rest.slice(prefix.length).trim()
    return suffix || prefix
  }

  return trimmed
}

/** Drop text carried over from the previous mic session in the same STT worker. */
export function stripCumulativeWhisperTranscript(previous: string, current: string): string {
  const prev = stripWhisperTimestamps(previous)
  let cur = stripWhisperTimestamps(current)
  if (!prev || !cur) return cur
  if (cur === prev) return cur

  if (cur.startsWith(prev)) {
    const suffix = cur.slice(prev.length).replace(/^[\s,.\-–—:;]+/, '').trim()
    return suffix || cur
  }

  cur = collapseInternalDuplicateTranscript(cur)
  if (prev && cur.startsWith(prev)) {
    const suffix = cur.slice(prev.length).replace(/^[\s,.\-–—:;]+/, '').trim()
    return suffix || cur
  }

  return cur
}

export function parseWhisperCppTranscription(
  transcription: string[][] | string[] | undefined
): string {
  const parts = splitTranscriptionParts(transcription)
  if (parts.length === 0) return ''
  return extractLastSpeechSegment(parts)
}

/** Collapse runs like "ну, ну, ну, …" that Whisper often hallucinates on silence. */
export function collapseRepeatedShortTokens(
  text: string,
  options: { minRun?: number; maxTokenLength?: number } = {}
): string {
  const minRun = options.minRun ?? 4
  const maxTokenLength = options.maxTokenLength ?? 5
  const tokens = text.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return ''

  const out: string[] = []
  let runNorm = ''
  let runCount = 0

  for (const raw of tokens) {
    const norm = normalizeToken(raw.replace(/^[,.\-–—:;]+|[,.\-–—:;]+$/g, ''))
    const isShort = norm.length > 0 && norm.length <= maxTokenLength

    if (isShort && norm === runNorm) {
      runCount++
      if (runCount < minRun) out.push(raw)
      continue
    }

    runNorm = isShort ? norm : ''
    runCount = 1
    out.push(raw)
  }

  return out.join(' ').replace(/\s+/g, ' ').trim()
}

export function isLikelyWhisperHallucination(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return true

  const tokens = trimmed.match(TOKEN_PATTERN) ?? []
  if (tokens.length === 0) return true

  const counts = new Map<string, number>()
  for (const token of tokens) {
    const norm = normalizeToken(token)
    counts.set(norm, (counts.get(norm) ?? 0) + 1)
  }

  const maxCount = Math.max(...counts.values())
  const dominantShare = maxCount / tokens.length

  const [topWord, topCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['', 0]
  if (topCount >= 6 && topWord.length <= 4 && topCount / tokens.length >= 0.45) {
    return true
  }

  if (tokens.length >= 12 && counts.size <= 3 && dominantShare >= 0.55) {
    return true
  }

  const compressed = trimmed.replace(/\s+/g, ' ').replace(/(\b\w+\b)(\s+\1\b)+/gi, '$1')
  if (trimmed.length >= 80 && compressed.length / trimmed.length < 0.45) {
    return true
  }

  return false
}

export function sanitizeWhisperTranscript(text: string): string {
  let cleaned = stripWhisperTimestamps(text)
  cleaned = collapseInternalDuplicateTranscript(cleaned)
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  cleaned = collapseRepeatedShortTokens(cleaned)
  return cleaned.replace(/[,.\-–—:;]+$/g, '').trim()
}
