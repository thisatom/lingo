import { openRouterConfig } from '@/shared/config/openrouter'
import { openRouterHeaders } from '@/shared/lib/openrouter-headers'
import { formatOpenRouterError } from '@/shared/lib/openrouter-errors'
import type { SttTranscribeRequest, SttTranscribeResponse } from '@/shared/types/ipc'
import { getWebSecret } from '@/shared/api/web-secrets'

function base64ToBlob(audioBase64: string, mimeType: string): Blob {
  const binary = atob(audioBase64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mimeType })
}

function mimeForFormat(format: string): string {
  const f = format.toLowerCase()
  if (f.includes('wav')) return 'audio/wav'
  if (f.includes('webm')) return 'audio/webm'
  if (f.includes('ogg')) return 'audio/ogg'
  if (f.includes('mp4') || f.includes('m4a')) return 'audio/mp4'
  return 'audio/wav'
}

export async function transcribeWebAudio(
  request: SttTranscribeRequest
): Promise<SttTranscribeResponse> {
  const apiKey = await getWebSecret('openrouter')
  if (!apiKey) throw new Error('NO_OPENROUTER_KEY')

  const mime = mimeForFormat(request.format)
  const blob = base64ToBlob(request.audioBase64, mime)
  const fileName = request.format.toLowerCase().includes('webm') ? 'audio.webm' : 'audio.wav'

  const form = new FormData()
  form.append('file', blob, fileName)
  form.append('model', request.model ?? openRouterConfig.sttModel)
  if (request.language) {
    form.append('language', request.language.split('-')[0] ?? request.language)
  }

  const response = await fetch(`${openRouterConfig.baseURL}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: form
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    let message = `Transcription failed (${response.status})`
    try {
      const parsed = JSON.parse(errText) as { error?: { message?: string } }
      if (parsed.error?.message) message = parsed.error.message
    } catch {
      // ignore
    }
    throw new Error(formatOpenRouterError(message))
  }

  const data = (await response.json()) as { text?: string }
  const text = data.text?.trim() ?? ''
  if (!text) throw new Error('NO_SPEECH')
  return { text }
}
