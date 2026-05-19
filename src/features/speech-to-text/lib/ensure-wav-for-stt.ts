/** Convert recorded audio to enhanced 16 kHz mono WAV for local Whisper. */

import { useSettingsStore } from '@/entities/settings/model/store'
import { enhanceSpeechAudio } from './enhance-speech-audio'
import { WHISPER_SAMPLE_RATE } from './speech-audio-constants'
import { decodeWavPcm16ToFloat32, encodeWav16Mono } from './wav-pcm'

function downsampleToMono(
  input: Float32Array,
  inputSampleRate: number,
  targetSampleRate: number
): Float32Array {
  if (inputSampleRate === targetSampleRate) return input
  const ratio = inputSampleRate / targetSampleRate
  const length = Math.max(1, Math.round(input.length / ratio))
  const output = new Float32Array(length)
  for (let i = 0; i < length; i++) {
    const start = Math.floor(i * ratio)
    const end = Math.min(input.length, Math.floor((i + 1) * ratio))
    let sum = 0
    let count = 0
    for (let j = start; j < end; j++) {
      sum += input[j] ?? 0
      count++
    }
    output[i] = count > 0 ? sum / count : 0
  }
  return output
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

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

function mimeForFormat(format: string): string {
  if (format.includes('webm')) return 'audio/webm'
  if (format.includes('ogg')) return 'audio/ogg'
  if (format.includes('mp4') || format.includes('m4a')) return 'audio/mp4'
  return 'audio/webm'
}

function toEnhancedWavBase64(samples: Float32Array): string {
  const level = useSettingsStore.getState().micNoiseSuppression
  const enhanced = enhanceSpeechAudio(samples, WHISPER_SAMPLE_RATE, { level })
  return arrayBufferToBase64(encodeWav16Mono(enhanced, WHISPER_SAMPLE_RATE))
}

export async function ensureWavForLocalStt(
  audioBase64: string,
  format: string
): Promise<{ audioBase64: string; format: 'wav' }> {
  if (format === 'wav') {
    const bytes = base64ToBytes(audioBase64)
    const mono = decodeWavPcm16ToFloat32(bytes)
    return { audioBase64: toEnhancedWavBase64(mono), format: 'wav' }
  }

  const blob = new Blob([new Uint8Array(base64ToBytes(audioBase64))], {
    type: mimeForFormat(format)
  })
  const audioContext = new AudioContext()
  try {
    const decoded = await audioContext.decodeAudioData(await blob.arrayBuffer())
    const mono = downsampleToMono(
      mixToMono(decoded),
      decoded.sampleRate,
      WHISPER_SAMPLE_RATE
    )
    return { audioBase64: toEnhancedWavBase64(mono), format: 'wav' }
  } finally {
    await audioContext.close().catch(() => undefined)
  }
}
