import {
  SPEECH_CHUNK_COMMA_FLUSH,
  SPEECH_CHUNK_MAX_CHARS,
  SPEECH_CHUNK_MIN_CHARS
} from '@/features/text-to-speech/lib/speech-chunk-options'

const SENTENCE_END_CHARS = new Set(['.', '!', '?', '…', '。', '！', '？'])

/** Abbreviation tails immediately before a period (do not treat as sentence end). */
const ABBREV_TAIL =
  /(?:^|[^\p{L}\p{N}_])(?:т|и|др|пр|г|ул|стр|рис|таб|гл|см|им|проф|мр|мс|д|с|e\.g|i\.e|mr|mrs|ms|dr|jr|sr|vs|etc|no|vol|dept|st|ave)\.$/iu

function isAbbreviationPeriod(text: string, dotIndex: number): boolean {
  const window = text.slice(Math.max(0, dotIndex - 14), dotIndex + 1)
  if (ABBREV_TAIL.test(window)) return true
  const before = text[dotIndex - 1]
  if (before && /[A-Za-zА-Яа-яё]/.test(before)) {
    const prev = text[dotIndex - 2]
    if (!prev || !/[A-Za-zА-Яа-яё]/.test(prev)) return true
  }
  if (before && /\d/.test(before)) {
    const prev = text[dotIndex - 2]
    if (!prev || !/\d/.test(prev)) return true
  }
  return false
}

function isSentenceEnd(text: string, index: number): boolean {
  const ch = text[index]
  if (!ch || !SENTENCE_END_CHARS.has(ch)) return false
  if (ch === '.' && isAbbreviationPeriod(text, index)) return false
  const next = text[index + 1]
  if (next !== undefined && next !== ' ' && next !== '\n' && next !== '\r') return false
  return true
}

function findSentenceEnd(text: string, from: number): number | null {
  for (let j = from; j < text.length; j++) {
    if (!isSentenceEnd(text, j)) continue
    let end = j + 1
    while (end < text.length && text[end] === ' ') end++
    return end
  }
  return null
}

function splitLongFragment(fragment: string, maxChars: number): string[] {
  if (fragment.length <= maxChars) return [fragment]
  const parts: string[] = []
  let rest = fragment
  while (rest.length > maxChars) {
    let cut = rest.lastIndexOf(', ', maxChars)
    if (cut < maxChars * 0.35) cut = rest.lastIndexOf(' ', maxChars)
    if (cut < 20) cut = maxChars
    const piece = rest.slice(0, cut).trim()
    if (piece.length >= 2) parts.push(piece)
    rest = rest.slice(cut).trimStart()
  }
  if (rest.trim().length >= 2) parts.push(rest.trim())
  return parts
}

function mergeSpeechChunks(
  sentences: string[],
  flush: boolean
): { chunks: string[]; trailingBuffer: string } {
  const chunks: string[] = []
  let buffer = ''

  const pushBuffer = () => {
    const t = buffer.trim()
    if (t.length >= 2) chunks.push(t)
    buffer = ''
  }

  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (trimmed.length < 2) continue

    if (trimmed.length > SPEECH_CHUNK_MAX_CHARS) {
      pushBuffer()
      chunks.push(...splitLongFragment(trimmed, SPEECH_CHUNK_MAX_CHARS))
      continue
    }

    const candidate = buffer ? `${buffer} ${trimmed}` : trimmed
    if (candidate.length <= SPEECH_CHUNK_MAX_CHARS) {
      buffer = candidate
      if (buffer.length >= SPEECH_CHUNK_MIN_CHARS && buffer.length >= SPEECH_CHUNK_MAX_CHARS * 0.82) {
        pushBuffer()
      }
      continue
    }

    pushBuffer()
    buffer = trimmed
  }

  if (flush && buffer.trim().length >= 2) {
    pushBuffer()
  } else if (!flush) {
    buffer = buffer.trim()
  }

  return { chunks, trailingBuffer: flush ? '' : buffer }
}

function extractSentences(pending: string, flush: boolean): { sentences: string[]; remainder: string } {
  const sentences: string[] = []
  let i = 0

  while (i < pending.length) {
    const end = findSentenceEnd(pending, i)
    if (end === null) break
    const sentence = pending.slice(i, end).trim()
    if (sentence.length >= 2) sentences.push(sentence)
    i = end
  }

  let remainder = pending.slice(i)

  if (!flush && remainder.length >= SPEECH_CHUNK_COMMA_FLUSH) {
    const comma = remainder.lastIndexOf(', ')
    if (comma >= SPEECH_CHUNK_MIN_CHARS) {
      const clause = remainder.slice(0, comma + 1).trim()
      if (clause.length >= 2) sentences.push(clause)
      remainder = remainder.slice(comma + 2)
    }
  }

  if (flush) {
    const parts = remainder
      .split(/\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length >= 2)
    sentences.push(...parts)
    remainder = ''
  }

  return { sentences, remainder }
}

/**
 * Pull speakable chunks from pending plain text.
 * Merges several sentences per TTS call to avoid long pauses on every period.
 */
export function takeSpeechChunks(
  pending: string,
  flush: boolean
): { chunks: string[]; remainder: string } {
  const { sentences, remainder: rawRemainder } = extractSentences(pending, flush)
  const { chunks, trailingBuffer } = mergeSpeechChunks(sentences, flush)
  const remainder = flush
    ? ''
    : [trailingBuffer, rawRemainder].filter((s) => s.length > 0).join(' ')
  return { chunks, remainder }
}

/** @deprecated Use takeSpeechChunks — kept for tests/callers expecting sentence arrays. */
export function takeCompleteSentences(
  pending: string,
  flush: boolean
): { sentences: string[]; remainder: string } {
  const { chunks, remainder } = takeSpeechChunks(pending, flush)
  return { sentences: chunks, remainder }
}
