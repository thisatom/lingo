const PREFERRED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4'
]

export function isMediaRecorderCaptureSupported(): boolean {
  return typeof MediaRecorder !== 'undefined'
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder.isTypeSupported !== 'function') return undefined
  for (const mime of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mime)) return mime
  }
  return undefined
}

export function mimeTypeToAudioFormat(mimeType: string): string {
  if (mimeType.includes('webm')) return 'webm'
  if (mimeType.includes('ogg')) return 'ogg'
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'm4a'
  return 'webm'
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

export interface RecorderSession {
  stop: () => Promise<{ audioBase64: string; format: string; mimeType: string; byteLength: number } | null>
  abort: () => void
}

export function startMediaRecorder(stream: MediaStream): RecorderSession | null {
  const preferredMime = pickMimeType()
  const chunks: Blob[] = []
  let recorder: MediaRecorder
  try {
    recorder = preferredMime
      ? new MediaRecorder(stream, { mimeType: preferredMime })
      : new MediaRecorder(stream)
  } catch (err) {
    console.warn('[lingo recorder] MediaRecorder failed:', err)
    return null
  }

  const mimeType = recorder.mimeType || preferredMime || 'audio/webm'
  let aborted = false
  const startedAt = Date.now()

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data)
  }

  recorder.start(250)

  const finalize = async (): Promise<{
    audioBase64: string
    format: string
    mimeType: string
    byteLength: number
  } | null> => {
    if (aborted) return null

    const durationMs = Date.now() - startedAt
    if (durationMs < 350) return null

    if (chunks.length === 0) return null

    const blob = new Blob(chunks, { type: mimeType })
    if (blob.size < 500) return null

    return {
      audioBase64: await blobToBase64(blob),
      format: mimeTypeToAudioFormat(mimeType),
      mimeType,
      byteLength: blob.size
    }
  }

  return {
    stop: () =>
      new Promise((resolve) => {
        if (aborted) {
          resolve(null)
          return
        }

        let settled = false
        const settle = (value: Awaited<ReturnType<typeof finalize>>) => {
          if (settled) return
          settled = true
          window.clearTimeout(timeoutId)
          resolve(value)
        }

        const timeoutId = window.setTimeout(() => {
          console.warn('[lingo recorder] stop() timed out')
          settle(null)
        }, 8000)

        recorder.onstop = () => {
          void finalize().then(settle)
        }

        try {
          if (recorder.state === 'recording') {
            recorder.requestData()
          }
        } catch {
          // ignore
        }

        if (recorder.state !== 'inactive') {
          recorder.stop()
        } else {
          void finalize().then(settle)
        }
      }),
    abort: () => {
      aborted = true
      if (recorder.state !== 'inactive') {
        recorder.stop()
      }
    }
  }
}
