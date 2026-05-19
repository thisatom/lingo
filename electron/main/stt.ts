import type { SttTranscribeRequest, SttTranscribeResponse } from '../../src/shared/types/ipc'
import { openRouterConfig } from '../../src/shared/config/openrouter'
import { getSecret } from './secrets'

const MIN_AUDIO_BYTES = 500

function openRouterHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    'HTTP-Referer': process.env.LINGO_APP_URL ?? 'https://github.com/lingo-app',
    'X-Title': process.env.LINGO_APP_NAME ?? 'Lingo'
  }
}

function parseErrorMessage(errText: string, status: number): string {
  try {
    const parsed = JSON.parse(errText) as {
      error?: { message?: string }
      message?: string
    }
    const message = parsed.error?.message ?? parsed.message
    if (message) return message
  } catch {
    // ignore
  }
  return errText || `Transcription failed (${status})`
}

function extractTranscriptText(data: Record<string, unknown>): string {
  if (typeof data.text === 'string') return data.text
  if (typeof data.transcript === 'string') return data.transcript
  const result = data.result
  if (result && typeof result === 'object' && typeof (result as { text?: string }).text === 'string') {
    return (result as { text: string }).text
  }
  return ''
}

export async function transcribeAudio(
  request: SttTranscribeRequest
): Promise<SttTranscribeResponse> {
  const apiKey = await getSecret('openrouter')
  if (!apiKey) throw new Error('NO_OPENROUTER_KEY')

  const audioBuffer = Buffer.from(request.audioBase64, 'base64')
  if (audioBuffer.length < MIN_AUDIO_BYTES) {
    console.warn('[lingo stt] Audio too small:', audioBuffer.length, 'bytes')
    throw new Error('RECORDING_TOO_SHORT')
  }

  const language = request.language?.trim().split('-')[0] || undefined
  const model = request.model ?? openRouterConfig.sttModel

  console.info(
    '[lingo stt] Transcribing',
    audioBuffer.length,
    'bytes,',
    request.format,
    language ?? 'auto'
  )

  const response = await fetch(`${openRouterConfig.baseURL}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      ...openRouterHeaders(apiKey),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      ...(language ? { language } : {}),
      input_audio: {
        data: request.audioBase64,
        format: request.format
      }
    })
  })

  const raw = await response.text()

  if (!response.ok) {
    console.error('[lingo stt] API error', response.status, raw.slice(0, 500))
    throw new Error(parseErrorMessage(raw, response.status))
  }

  let data: Record<string, unknown>
  try {
    data = JSON.parse(raw) as Record<string, unknown>
  } catch {
    console.error('[lingo stt] Invalid JSON response', raw.slice(0, 200))
    throw new Error('STT_INVALID_RESPONSE')
  }

  const nestedError = data.error as { message?: string } | undefined
  if (nestedError?.message) {
    throw new Error(nestedError.message)
  }

  const text = extractTranscriptText(data).trim()
  if (!text) {
    console.warn('[lingo stt] Empty transcript. Response:', raw.slice(0, 300))
    throw new Error('NO_SPEECH')
  }

  console.info('[lingo stt] OK:', text.slice(0, 80))
  return { text }
}
