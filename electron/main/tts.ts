import { UniversalEdgeTTS } from 'edge-tts-universal'
import type { TtsSynthesizeRequest, TtsSynthesizeResponse } from '../../src/shared/types/ipc'
import { getDefaultVoiceForLanguage } from '../../src/shared/config/tts-voices'
import { prepareTextForSpeech } from '../../src/shared/lib/prepare-text-for-speech'
import { stripTextForSpeech } from '../../src/shared/lib/strip-text-for-speech'
import { resolveTtsProsody } from './tts-prosody'

export function resolveVoice(request: TtsSynthesizeRequest): string {
  if (request.voice?.trim()) return request.voice.trim()
  const locale = request.locale?.split('-')[0] ?? 'en'
  return getDefaultVoiceForLanguage(locale)
}

export async function synthesizeSpeech(
  request: TtsSynthesizeRequest
): Promise<TtsSynthesizeResponse> {
  const voice = resolveVoice(request)
  const stripped = stripTextForSpeech(request.text)
  const text = prepareTextForSpeech(stripped, request.locale)
  if (!text) {
    throw new Error('TTS_EMPTY')
  }
  const prosody = resolveTtsProsody(request)
  const tts = new UniversalEdgeTTS(text, voice, prosody)
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
