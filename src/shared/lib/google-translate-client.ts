import translate from 'google-translate-api-x'
import { splitTextForTranslation } from '@/shared/lib/split-translation-text'

export type TranslateTextRequest = {
  text: string
  from?: string
  to: string
}

export type TranslateTextResponse = {
  text: string
  detectedLanguage?: string
}

export async function translateWithGoogle(
  request: TranslateTextRequest
): Promise<TranslateTextResponse> {
  const chunks = splitTextForTranslation(request.text)
  if (chunks.length === 0) throw new Error('TRANSLATE_EMPTY')

  const from = request.from?.trim() || 'auto'
  const to = request.to.trim()
  if (!to) throw new Error('TRANSLATE_TARGET_REQUIRED')

  const parts: string[] = []
  let detectedLanguage: string | undefined

  for (const chunk of chunks) {
    const result = await translate(chunk, {
      from,
      to,
      forceBatch: false
    })
    parts.push(result.text)
    const iso = result.from?.language?.iso
    if (iso && iso !== 'auto') detectedLanguage = iso
  }

  return {
    text: parts.join('\n\n'),
    detectedLanguage
  }
}
