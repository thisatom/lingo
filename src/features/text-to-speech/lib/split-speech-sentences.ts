const SENTENCE_END_CHARS = new Set(['.', '!', '?', '…', '。', '！', '？'])

function findSentenceEnd(text: string, from: number): number | null {
  for (let j = from; j < text.length; j++) {
    const ch = text[j]
    if (!ch || !SENTENCE_END_CHARS.has(ch)) continue
    const next = text[j + 1]
    if (next !== undefined && next !== ' ' && next !== '\n' && next !== '\r') continue
    let end = j + 1
    while (end < text.length && text[end] === ' ') end++
    return end
  }
  return null
}

/**
 * Pull fully ended sentences from pending plain text.
 * With flush, speaks any trailing fragment (end of stream).
 */
export function takeCompleteSentences(
  pending: string,
  flush: boolean
): { sentences: string[]; remainder: string } {
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

  if (!flush && remainder.length >= 100) {
    const comma = remainder.lastIndexOf(', ')
    if (comma >= 40) {
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
