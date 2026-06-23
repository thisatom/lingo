import { playTtsFromBase64, stopTtsPlayback } from '@/features/text-to-speech/model/playTts'
import { resolvePracticeLanguage } from '@/shared/config/practice-languages'
import { getLingo, isLingoAvailable } from '@/shared/lib/lingo'
import { prepareTextForSpeech } from '@/shared/lib/prepare-text-for-speech'
import { stripTextForSpeech } from '@/shared/lib/strip-text-for-speech'
import { buildTtsSynthesizeRequest } from '@/shared/lib/tts-synthesize-options'

export async function speakPlainText(text: string, localeHint?: string): Promise<void> {
  if (!isLingoAvailable()) {
    throw new Error('TTS requires the desktop app or web preview with speech enabled.')
  }

  stopTtsPlayback()

  const locale = resolvePracticeLanguage(localeHint ?? 'auto', { assistantText: text })
  const stripped = stripTextForSpeech(text)
  const plain = prepareTextForSpeech(stripped, locale)
  if (!plain) throw new Error('TTS_EMPTY')

  const result = await getLingo().tts.synthesize(buildTtsSynthesizeRequest(plain, locale))
  await playTtsFromBase64(result.audioBase64, result.mimeType)
}
