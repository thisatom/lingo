import type { SttTranscribeRequest, SttTranscribeResponse } from '../../src/shared/types/ipc'
import { transcribeInWorker } from './stt-host'

/** On-device Whisper in an isolated child process (ONNX segfault must not kill the app). */
export async function transcribeAudio(
  request: SttTranscribeRequest
): Promise<SttTranscribeResponse> {
  const text = await transcribeInWorker(request)
  return { text }
}

export { warmSttWorker, shutdownSttWorker } from './stt-host'
