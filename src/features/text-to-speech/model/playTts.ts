import { useSettingsStore } from '@/entities/settings/model/store'
import {
  attachTtsPlaybackMeter,
  detachTtsPlaybackMeter
} from '@/features/text-to-speech/lib/tts-playback-meter'
import { applyAudioOutputDevice } from '@/shared/lib/audio-output'

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

let activeAudio: HTMLAudioElement | null = null
let queueTail: Promise<void> = Promise.resolve()
let queueGeneration = 0

export function resetTtsPlaybackQueue(): void {
  queueGeneration++
  queueTail = Promise.resolve()
}

export function stopTtsPlayback(): void {
  resetTtsPlaybackQueue()
  detachTtsPlaybackMeter()
  if (!activeAudio) return
  activeAudio.pause()
  activeAudio.src = ''
  activeAudio.onended = null
  activeAudio.onerror = null
  activeAudio = null
}

async function playTtsClip(audioBase64: string, mimeType: string): Promise<void> {
  if (!audioBase64?.trim()) {
    throw new Error('TTS_EMPTY_AUDIO')
  }

  const type = mimeType || 'audio/mpeg'
  const bytes = base64ToBytes(audioBase64)
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer
  const blob = new Blob([arrayBuffer], { type })
  const url = URL.createObjectURL(blob)

  const audio = new Audio()
  activeAudio = audio
  audio.preload = 'auto'
  audio.src = url

  const { speakerDeviceId } = useSettingsStore.getState()
  await applyAudioOutputDevice(audio, speakerDeviceId)

  try {
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        audio.onended = null
        audio.onerror = null
      }

      audio.onended = () => {
        cleanup()
        if (activeAudio === audio) activeAudio = null
        resolve()
      }

      audio.onerror = () => {
        cleanup()
        if (activeAudio === audio) activeAudio = null
        const code = audio.error?.code ?? 'unknown'
        const message = audio.error?.message ?? 'decode or load failed'
        reject(new Error(`PLAYBACK_FAILED (${code}: ${message})`))
      }

      void audio
        .play()
        .then(() => {
          attachTtsPlaybackMeter(audio)
        })
        .catch((playError: unknown) => {
          cleanup()
          detachTtsPlaybackMeter()
          if (activeAudio === audio) activeAudio = null
          const detail =
            playError instanceof Error
              ? playError.message
              : 'Autoplay blocked or unsupported format'
          reject(new Error(`PLAYBACK_FAILED: ${detail}`))
        })
    })
  } finally {
    detachTtsPlaybackMeter()
    URL.revokeObjectURL(url)
    if (activeAudio === audio) {
      audio.src = ''
      activeAudio = null
    }
  }
}

/** Play one clip immediately (stops any current playback and clears the queue). */
export async function playTtsFromBase64(audioBase64: string, mimeType: string): Promise<void> {
  stopTtsPlayback()
  await playTtsClip(audioBase64, mimeType)
}

/** Queue a clip after the current one (for sentence-by-sentence streaming). */
export function enqueueTtsFromBase64(audioBase64: string, mimeType: string): Promise<void> {
  const generation = queueGeneration
  const task = queueTail.then(async () => {
    if (generation !== queueGeneration) return
    await playTtsClip(audioBase64, mimeType)
  })
  queueTail = task.catch(() => undefined)
  return task
}
