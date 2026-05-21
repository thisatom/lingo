import { useSettingsStore } from '@/entities/settings/model/store'
import { TTS_VOICE_AUTO } from '@/shared/config/tts-voices'
import { formatEdgeTtsRate } from '@/shared/lib/tts-rate'
import type { TtsSynthesizeRequest } from '@/shared/types/ipc'

/** Build IPC TTS request from current user settings. */
export function buildTtsSynthesizeRequest(
  text: string,
  locale: string
): TtsSynthesizeRequest {
  const { ttsVoiceId, ttsSpeechRate } = useSettingsStore.getState()
  const voice = ttsVoiceId && ttsVoiceId !== TTS_VOICE_AUTO ? ttsVoiceId : undefined
  return {
    text,
    locale,
    voice,
    rate: formatEdgeTtsRate(locale, ttsSpeechRate)
  }
}
