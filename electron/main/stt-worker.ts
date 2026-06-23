import { existsSync } from 'node:fs'
import {
  configureLocalStt,
  transcribeAudioLocal,
  warmLocalSttModel
} from './local-stt'
import { ensureWhisperNativeEnv } from './whisper-native'

type WorkerInMessage =
  | { type: 'init'; cacheDir: string }
  | { type: 'warm' }
  | {
      type: 'transcribe'
      id: string
      audioBase64: string
      format: string
      language?: string
    }

type WorkerOutMessage =
  | { type: 'ready' }
  | { type: 'warm-done' }
  | { type: 'result'; id: string; ok: true; text: string }
  | { type: 'result'; id: string; ok: false; error: string }

function send(message: WorkerOutMessage): void {
  if (process.send) process.send(message)
}

process.on('message', (message: WorkerInMessage) => {
  void (async () => {
    if (message.type === 'init') {
      ensureWhisperNativeEnv()
      configureLocalStt({ cacheDir: message.cacheDir })
      send({ type: 'ready' })
      return
    }

    if (message.type === 'warm') {
      try {
        await warmLocalSttModel()
        send({ type: 'warm-done' })
      } catch (error) {
        const err = error instanceof Error ? error.message : 'STT_MODEL_LOAD_FAILED'
        console.warn('[lingo stt worker] Warm failed:', err)
      }
      return
    }

    if (message.type === 'transcribe') {
      try {
        const text = await transcribeAudioLocal(message)
        send({ type: 'result', id: message.id, ok: true, text })
      } catch (error) {
        const err = error instanceof Error ? error.message : 'STT_INFERENCE_FAILED'
        send({ type: 'result', id: message.id, ok: false, error: err })
      }
    }
  })()
})

process.on('uncaughtException', (error) => {
  console.error('[lingo stt worker] uncaughtException:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error('[lingo stt worker] unhandledRejection:', reason)
  process.exit(1)
})
