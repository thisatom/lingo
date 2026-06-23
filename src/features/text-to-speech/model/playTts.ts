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

export type TtsPreparedClip = {
  audio: HTMLAudioElement
  url: string
}

let activeAudio: HTMLAudioElement | null = null
let queueTail: Promise<void> = Promise.resolve()
let queueGeneration = 0

export function disposeTtsPreparedClip(clip: TtsPreparedClip): void {
  clip.audio.src = ''
  URL.revokeObjectURL(clip.url)
}

/** Decode one clip while the previous chunk plays — tied to a specific synth result. */
export function prefetchTtsClip(audioBase64: string, mimeType: string): TtsPreparedClip | null {
  if (!audioBase64?.trim()) return null
  const type = mimeType || 'audio/mpeg'
  const url = bytesToObjectUrl(base64ToBytes(audioBase64), type)
  const audio = new Audio()
  audio.preload = 'auto'
  audio.src = url
  void audio.load()
  return { audio, url }
}

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

async function createAudioForPlayback(
  audioBase64: string,
  mimeType: string,
  prepared: TtsPreparedClip | null
): Promise<{ audio: HTMLAudioElement; url: string; disposePrepared: boolean }> {
  if (prepared) {
    const { speakerDeviceId } = useSettingsStore.getState()
    await applyAudioOutputDevice(prepared.audio, speakerDeviceId)
    applyTtsPlaybackVolume(prepared.audio)
    return { audio: prepared.audio, url: prepared.url, disposePrepared: true }
  }

  const type = mimeType || 'audio/mpeg'
  const url = bytesToObjectUrl(base64ToBytes(audioBase64), type)
  const audio = new Audio()
  audio.preload = 'auto'
  audio.src = url
  applyTtsPlaybackVolume(audio)
  return { audio, url, disposePrepared: false }
}

async function playAudioElement(audio: HTMLAudioElement): Promise<void> {
  const { speakerDeviceId } = useSettingsStore.getState()
  await applyAudioOutputDevice(audio, speakerDeviceId)

  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      audio.onended = null
      audio.onerror = null
      audio.oncanplay = null
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
}

async function playTtsClip(
  audioBase64: string,
  mimeType: string,
  prepared: TtsPreparedClip | null = null
): Promise<void> {
  if (!audioBase64?.trim() && !prepared) {
    throw new Error('TTS_EMPTY_AUDIO')
  }

  const { audio, url, disposePrepared } = await createAudioForPlayback(
    audioBase64,
    mimeType,
    prepared
  )
  activeAudio = audio

  try {
    await playAudioElement(audio)
  } finally {
    detachTtsPlaybackMeter()
    if (disposePrepared) {
      disposeTtsPreparedClip({ audio, url })
    } else if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
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
export function enqueueTtsFromBase64(
  audioBase64: string,
  mimeType: string,
  prepared: TtsPreparedClip | null = null
): Promise<void> {
  const generation = queueGeneration
  const task = queueTail.then(async () => {
    if (generation !== queueGeneration) return
    await playTtsClip(audioBase64, mimeType, prepared)
  })
  queueTail = task.catch(() => undefined)
  return task
}
