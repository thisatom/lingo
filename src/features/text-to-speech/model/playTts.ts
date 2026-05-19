function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

let activeAudio: HTMLAudioElement | null = null

export function stopTtsPlayback(): void {
  if (!activeAudio) return
  activeAudio.pause()
  activeAudio.src = ''
  activeAudio.onended = null
  activeAudio.onerror = null
  activeAudio = null
}

export async function playTtsFromBase64(audioBase64: string, mimeType: string): Promise<void> {
  if (!audioBase64?.trim()) {
    throw new Error('TTS_EMPTY_AUDIO')
  }

  stopTtsPlayback()

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

      void audio.play().catch((playError: unknown) => {
        cleanup()
        if (activeAudio === audio) activeAudio = null
        const detail =
          playError instanceof Error ? playError.message : 'Autoplay blocked or unsupported format'
        reject(new Error(`PLAYBACK_FAILED: ${detail}`))
      })
    })
  } finally {
    URL.revokeObjectURL(url)
    if (activeAudio === audio) {
      audio.src = ''
      activeAudio = null
    }
  }
}
