import translate from 'google-translate-api-x'
import { splitTextForTranslation } from '@/shared/lib/split-translation-text'
import { withTranslateRetry } from '@/shared/lib/translate-retry'

export type TranslateTextRequest = {
  text: string
  from?: string
  to: string
}

export type TranslateTextResponse = {
  text: string
  detectedLanguage?: string
}

export type TranslateTextBatchRequest = {
  texts: readonly string[]
  from?: string
  to: string
}

export type TranslateTextBatchResponse = {
  texts: string[]
  detectedLanguage?: string
}

const TRANSLATE_OPTIONS = {
  fallbackBatch: true,
  rejectOnPartialFail: false
} as const

function resolveLanguages(request: { from?: string; to: string }) {
  const from = request.from?.trim() || 'auto'
  const to = request.to.trim()
  if (!to) throw new Error('TRANSLATE_TARGET_REQUIRED')
  return { from, to }
}

function readDetectedLanguage(
  result: { from?: { language?: { iso?: string } } },
  current?: string
): string | undefined {
  const iso = result.from?.language?.iso
  if (iso && iso !== 'auto') return iso
  return current
}

async function translateChunk(
  chunk: string,
  from: string,
  to: string
): Promise<{ text: string; detectedLanguage?: string }> {
  if (!chunk.trim()) return { text: chunk }

  const result = await withTranslateRetry(() =>
    translate(chunk, {
      from,
      to,
      ...TRANSLATE_OPTIONS
    })
  )

  return {
    text: result.text,
    detectedLanguage: readDetectedLanguage(result)
  }
}

/** Translate many short strings in one Google batch request (fewer failures vs parallel singles). */
export async function translateManyWithGoogle(
  request: TranslateTextBatchRequest
): Promise<TranslateTextBatchResponse> {
  const { from, to } = resolveLanguages(request)
  const inputs = request.texts.map((text) => text ?? '')

  if (inputs.length === 0) return { texts: [] }

  if (inputs.length === 1) {
    const single = await translateWithGoogle({ text: inputs[0], from, to })
    return { texts: [single.text], detectedLanguage: single.detectedLanguage }
  }

  const nonEmpty = inputs.map((text, index) => ({ text, index }))
  const toTranslate = nonEmpty.filter(({ text }) => text.trim().length > 0)

  if (toTranslate.length === 0) {
    return { texts: inputs.map(() => '') }
  }

  let detectedLanguage: string | undefined

  try {
    const results = await withTranslateRetry(() =>
      translate(
        toTranslate.map(({ text }) => text),
        { from, to, ...TRANSLATE_OPTIONS }
      )
    )

    if (!Array.isArray(results)) {
      throw new Error('TRANSLATE_BATCH_UNEXPECTED_RESPONSE')
    }

    const translatedByIndex = new Map<number, string>()
    for (let i = 0; i < toTranslate.length; i += 1) {
      const entry = toTranslate[i]
      const item = results[i]
      const text = item?.text ?? entry.text
      translatedByIndex.set(entry.index, text)
      detectedLanguage = readDetectedLanguage(item, detectedLanguage)
    }

    return {
      texts: inputs.map((text, index) => translatedByIndex.get(index) ?? text),
      detectedLanguage
    }
  } catch {
    const texts: string[] = []
    for (const text of inputs) {
      if (!text.trim()) {
        texts.push(text)
        continue
      }
      const single = await translateChunk(text, from, to)
      texts.push(single.text)
      detectedLanguage = single.detectedLanguage ?? detectedLanguage
    }
    return { texts, detectedLanguage }
  }
}

export async function translateWithGoogle(
  request: TranslateTextRequest
): Promise<TranslateTextResponse> {
  const chunks = splitTextForTranslation(request.text)
  if (chunks.length === 0) throw new Error('TRANSLATE_EMPTY')

  const { from, to } = resolveLanguages(request)

  if (from !== 'auto' && from === to) {
    return { text: request.text, detectedLanguage: from }
  }

  const parts: string[] = []
  let detectedLanguage: string | undefined

  for (const chunk of chunks) {
    const result = await translateChunk(chunk, from, to)
    parts.push(result.text)
    detectedLanguage = result.detectedLanguage ?? detectedLanguage
  }

  return {
    text: parts.join('\n\n'),
    detectedLanguage
  }
}
