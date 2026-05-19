import {
  isMediaRecorderCaptureSupported,
  startMediaRecorder,
  type RecorderSession
} from '@/features/speech-to-text/lib/media-recorder-capture'
import {
  isWavRecorderSupported,
  startWavRecorder,
  type WavRecorderSession
} from '@/features/speech-to-text/lib/wav-recorder'

export type AudioCaptureSession = RecorderSession | WavRecorderSession

export interface RecordedAudio {
  audioBase64: string
  format: string
  byteLength: number
}

export function isAudioCaptureSupported(): boolean {
  return isWavRecorderSupported() || isMediaRecorderCaptureSupported()
}

export async function startAudioCapture(
  stream: MediaStream,
  options?: { preferWav?: boolean }
): Promise<AudioCaptureSession | null> {
  if (options?.preferWav && isWavRecorderSupported()) {
    const wav = await startWavRecorder(stream)
    if (wav) return wav
  }

  if (isMediaRecorderCaptureSupported()) {
    const recorder = startMediaRecorder(stream)
    if (recorder) return recorder
  }

  if (isWavRecorderSupported()) {
    const wav = await startWavRecorder(stream)
    if (wav) return wav
  }

  console.warn('[lingo voice] No audio capture backend available')
  return null
}
