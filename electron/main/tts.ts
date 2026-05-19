import { UniversalEdgeTTS } from 'edge-tts-universal'
import type { TtsSynthesizeRequest, TtsSynthesizeResponse } from '../../src/shared/types/ipc'
import { stripTextForSpeech } from '../../src/shared/lib/strip-text-for-speech'

const DEFAULT_VOICE = 'en-US-EmmaMultilingualNeural'

const LOCALE_VOICE: Record<string, string> = {
  en: 'en-US-EmmaMultilingualNeural',
  de: 'de-DE-KatjaNeural',
  es: 'es-ES-ElviraNeural',
  fr: 'fr-FR-DeniseNeural',
  it: 'it-IT-ElsaNeural',
  pt: 'pt-BR-FranciscaNeural',
  ru: 'ru-RU-SvetlanaNeural',
  ja: 'ja-JP-NanamiNeural',
  zh: 'zh-CN-XiaoxiaoNeural'
}

export function resolveVoice(request: TtsSynthesizeRequest): string {
  if (request.voice) return request.voice
  const locale = request.locale?.split('-')[0] ?? 'en'
  return LOCALE_VOICE[locale] ?? DEFAULT_VOICE
}

export async function synthesizeSpeech(
  request: TtsSynthesizeRequest
): Promise<TtsSynthesizeResponse> {
  const voice = resolveVoice(request)
  const text = stripTextForSpeech(request.text)
  if (!text) {
    throw new Error('TTS_EMPTY')
  }
  const tts = new UniversalEdgeTTS(text, voice)
  const result = await tts.synthesize()
  const buffer = Buffer.from(await result.audio.arrayBuffer())
  const mimeType = result.audio.type || 'audio/mpeg'
  if (buffer.length === 0) {
    throw new Error('TTS_EMPTY_AUDIO')
  }
  return {
    audioBase64: buffer.toString('base64'),
    mimeType
  }
}
