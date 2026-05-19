import type { SttTranscribeRequest, SttTranscribeResponse } from '../../src/shared/types/ipc'
import { transcribeAudioLocal } from './local-stt'

/** On-device Whisper in the main process (no renderer CSP / CDN). */
export async function transcribeAudio(
  request: SttTranscribeRequest
): Promise<SttTranscribeResponse> {
  const text = await transcribeAudioLocal(request)
  return { text }
}
