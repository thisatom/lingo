import { useSettingsStore } from '@/entities/settings/model/store'
import {
  attachTtsPlaybackMeter,
  detachTtsPlaybackMeter
} from '@/features/text-to-speech/lib/tts-playback-meter'
import { applyAudioOutputDevice } from '@/shared/lib/audio-output'
import { ttsVolumeToGain } from '@/shared/lib/tts-volume'

function applyTtsPlaybackVolume(audio: HTMLAudioElement): void {
  const { ttsVolume } = useSettingsStore.getState()
  audio.volume = ttsVolumeToGain(ttsVolume)
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function bytesToObjectUrl(bytes: Uint8Array, mimeType: string): string {
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer
  const blob = new Blob([arrayBuffer], { type: mimeType || 'audio/mpeg' })
  return URL.createObjectURL(blob)
}

type PreparedClip = {
  audio: HTMLAudioElement
  url: string
}

let activeAudio: HTMLAudioElement | null = null
const preparedClips: PreparedClip[] = []
let queueTail: Promise<void> = Promise.resolve()
let queueGeneration = 0

function clearPreparedClips(): void {
  for (const clip of preparedClips) {
    clip.audio.src = ''
    URL.revokeObjectURL(clip.url)
  }
  preparedClips.length = 0
}

export function resetTtsPlaybackQueue(): void {
  queueGeneration++
  queueTail = Promise.resolve()
  clearPreparedClips()
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

/** Decode and warm a clip while earlier chunks play (FIFO). */
export function prepareTtsFromBase64(audioBase64: string, mimeType: string): void {
  if (!audioBase64?.trim()) return

  const type = mimeType || 'audio/mpeg'
  const url = bytesToObjectUrl(base64ToBytes(audioBase64), type)
  const audio = new Audio()
  audio.preload = 'auto'
  audio.src = url
  void audio.load()
  preparedClips.push({ audio, url })
}

async function takeClipForPlayback(
  audioBase64: string,
  mimeType: string
): Promise<HTMLAudioElement> {
  const type = mimeType || 'audio/mpeg'
  const prepared = preparedClips.shift()

  if (prepared) {
    const { speakerDeviceId } = useSettingsStore.getState()
    await applyAudioOutputDevice(prepared.audio, speakerDeviceId)
    applyTtsPlaybackVolume(prepared.audio)
    return prepared.audio
  }

  const url = bytesToObjectUrl(base64ToBytes(audioBase64), type)
  const audio = new Audio()
  audio.preload = 'auto'
  audio.src = url
  applyTtsPlaybackVolume(audio)
  return audio
}

async function playTtsClip(audioBase64: string, mimeType: string): Promise<void> {
  if (!audioBase64?.trim()) {
    throw new Error('TTS_EMPTY_AUDIO')
  }

  const audio = await takeClipForPlayback(audioBase64, mimeType)
  const url = audio.src
  activeAudio = audio

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

      const start = () => {
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
      }

      if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        start()
      } else {
        audio.oncanplay = () => {
          audio.oncanplay = null
          start()
        }
        void audio.load()
      }
    })
  } finally {
    detachTtsPlaybackMeter()
    if (url.startsWith('blob:')) URL.revokeObjectURL(url)
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

/** Queue a clip after the current one (for chunked streaming TTS). */
export function enqueueTtsFromBase64(audioBase64: string, mimeType: string): Promise<void> {
  const generation = queueGeneration
  const task = queueTail.then(async () => {
    if (generation !== queueGeneration) return
    await playTtsClip(audioBase64, mimeType)
  })
  queueTail = task.catch(() => undefined)
  return task
}
