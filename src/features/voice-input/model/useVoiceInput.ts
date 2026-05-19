import type { LiveVoiceHandlers } from '@/features/voice-input/model/useLiveVoiceInput'
import { useLiveVoiceInput } from '@/features/voice-input/model/useLiveVoiceInput'
import { selectSttBackend } from '@/features/voice-input/lib/select-stt-backend'

export type { VoiceInputPhase } from '@/features/voice-input/model/useLiveVoiceInput'

export function useVoiceInput(handlers: LiveVoiceHandlers) {
  return useLiveVoiceInput(handlers)
}

export function useVoiceInputBackend() {
  return selectSttBackend()
}
