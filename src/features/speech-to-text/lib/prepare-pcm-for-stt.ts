/** Decode captured audio, enhance, and pack as mono float32 for local Whisper IPC. */

import { useSettingsStore } from '@/entities/settings/model/store'
import { enhanceSpeechAudio } from './enhance-speech-audio'
import { float32ToBase64, STT_PCM_F32_FORMAT } from './pcm-base64'
import { WHISPER_SAMPLE_RATE } from './speech-audio-constants'
import { decodeWavPcm16ToFloat32, resampleMono } from './wav-pcm'

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function mixToMono(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) {
    return new Float32Array(buffer.getChannelData(0))
  }
  const length = buffer.length
  const mono = new Float32Array(length)
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const channel = buffer.getChannelData(ch)
    for (let i = 0; i < length; i++) {
      mono[i] += (channel[i] ?? 0) / buffer.numberOfChannels
    }
  }
  return mono
}

function mimeForFormat(format: string): string {
  if (format.includes('webm')) return 'audio/webm'
  if (format.includes('ogg')) return 'audio/ogg'
  if (format.includes('mp4') || format.includes('m4a')) return 'audio/mp4'
  return 'audio/webm'
}

function enhanceAndPack(samples: Float32Array): { audioBase64: string; format: typeof STT_PCM_F32_FORMAT } {
  const level = useSettingsStore.getState().micNoiseSuppression
  const enhanced = enhanceSpeechAudio(samples, WHISPER_SAMPLE_RATE, { level })
  return { audioBase64: float32ToBase64(enhanced), format: STT_PCM_F32_FORMAT }
}

async function decodeToMono16k(audioBase64: string, format: string): Promise<Float32Array> {
  if (format === 'wav') {
    return decodeWavPcm16ToFloat32(base64ToBytes(audioBase64))
  }

  const blob = new Blob([new Uint8Array(base64ToBytes(audioBase64))], {
    type: mimeForFormat(format)
  })
  const audioContext = new AudioContext()
  try {
    const decoded = await audioContext.decodeAudioData(await blob.arrayBuffer())
    const mono = mixToMono(decoded)
    return resampleMono(mono, decoded.sampleRate, WHISPER_SAMPLE_RATE)
  } finally {
    await audioContext.close().catch(() => undefined)
  }
}

export async function preparePcmForLocalStt(
  audioBase64: string,
  format: string
): Promise<{ audioBase64: string; format: typeof STT_PCM_F32_FORMAT }> {
  const mono = await decodeToMono16k(audioBase64, format)
  return enhanceAndPack(mono)
}
