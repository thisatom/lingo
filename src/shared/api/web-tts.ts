import { EdgeTTS } from 'edge-tts-universal/browser'
import { getDefaultVoiceForLanguage } from '@/shared/config/tts-voices'
import { prepareTextForSpeech } from '@/shared/lib/prepare-text-for-speech'
import { stripTextForSpeech } from '@/shared/lib/strip-text-for-speech'
import { formatEdgeTtsRate } from '@/shared/lib/tts-rate'
import type { TtsSynthesizeRequest, TtsSynthesizeResponse } from '@/shared/types/ipc'

function resolveVoice(request: TtsSynthesizeRequest): string {
  if (request.voice?.trim()) return request.voice.trim()
  const locale = request.locale?.split('-')[0] ?? 'en'
  return getDefaultVoiceForLanguage(locale)
}

function resolveTtsProsody(request: TtsSynthesizeRequest): {
  rate: string
  pitch: string
  volume: string
} {
  const rate = request.rate?.trim() || formatEdgeTtsRate(request.locale, 'normal')
  return { rate, pitch: '+0Hz', volume: '+0%' }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

export async function synthesizeWebSpeech(
  request: TtsSynthesizeRequest
): Promise<TtsSynthesizeResponse> {
  const voice = resolveVoice(request)
  const stripped = stripTextForSpeech(request.text)
  const text = prepareTextForSpeech(stripped, request.locale)
  if (!text) throw new Error('TTS_EMPTY')

  const prosody = resolveTtsProsody(request)
  const tts = new EdgeTTS(text, voice, prosody)
  const result = await tts.synthesize()
  const buffer = await result.audio.arrayBuffer()
  const mimeType = result.audio.type || 'audio/mpeg'
  if (buffer.byteLength === 0) throw new Error('TTS_EMPTY_AUDIO')

  return {
    audioBase64: arrayBufferToBase64(buffer),
    mimeType
  }
}
