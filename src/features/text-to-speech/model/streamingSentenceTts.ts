import { useChatsStore } from '@/entities/chat/model/store'
import { isAgentRunActive } from '@/features/ai-chat/model/agent-run'
import { takeSpeechChunks } from '@/features/text-to-speech/lib/split-speech-sentences'
import {
  enqueueTtsFromBase64,
  prepareTtsFromBase64,
  resetTtsPlaybackQueue,
  stopTtsPlayback
} from '@/features/text-to-speech/model/playTts'
import { getLingo } from '@/shared/lib/lingo'
import { buildTtsSynthesizeRequest } from '@/shared/lib/tts-synthesize-options'
import { prepareTextForSpeech } from '@/shared/lib/prepare-text-for-speech'
import { stripTextForSpeech } from '@/shared/lib/strip-text-for-speech'

export interface StreamingSentenceTtsOptions {
  locale: string
  runId: number
  targetChatId: string
  onSpeaking?: () => void
}

type TtsSynthResult = { audioBase64: string; mimeType: string }

/** In-flight synth cap; one extra slot prefetches the next sentence while the current plays. */
const MAX_SYNTH_IN_FLIGHT = 4

export class StreamingSentenceTts {
  private readonly locale: string
  private readonly runId: number
  private readonly targetChatId: string
  private readonly onSpeaking?: () => void

  private cancelled = false
  private plainText = ''
  private consumedLength = 0
  private playChain: Promise<void> = Promise.resolve()
  private synthInFlight = 0
  private synthWaiters: Array<() => void> = []
  private hasStartedSpeaking = false
  private chunksSubmitted = 0

  constructor(options: StreamingSentenceTtsOptions) {
    this.locale = options.locale
    this.runId = options.runId
    this.targetChatId = options.targetChatId
    this.onSpeaking = options.onSpeaking
  }

  get isActive(): boolean {
    return this.hasStartedSpeaking
  }

  feed(rawText: string): void {
    if (this.cancelled) return

    const stripped = stripTextForSpeech(rawText)
    const plain = prepareTextForSpeech(stripped, this.locale)
    if (!plain) return

    if (
      plain.length < this.plainText.length &&
      !plain.startsWith(this.plainText.slice(0, this.consumedLength))
    ) {
      this.restartFromPlain(plain)
      return
    }

    this.plainText = plain
    const pending = plain.slice(this.consumedLength)
    const { chunks, remainder } = takeSpeechChunks(pending, false)
    this.consumedLength = plain.length - remainder.length

    for (const chunk of chunks) {
      this.scheduleChunk(chunk)
    }
  }

  async finish(): Promise<void> {
    if (this.cancelled) return

    const pending = this.plainText.slice(this.consumedLength)
    const { chunks, remainder } = takeSpeechChunks(pending, true)
    this.consumedLength = this.plainText.length - remainder.length

    for (const chunk of chunks) {
      this.scheduleChunk(chunk)
    }

    await this.playChain

    if (
      !this.cancelled &&
      this.chunksSubmitted > 0 &&
      !this.hasStartedSpeaking
    ) {
      throw new Error('TTS_EMPTY')
    }
  }

  cancel(): void {
    this.cancelled = true
    resetTtsPlaybackQueue()
    stopTtsPlayback()
    this.playChain = Promise.resolve()
    this.synthInFlight = 0
    this.drainSynthWaiters()
  }

  /** Answer replaced reasoning in the text stream — restart playback from the new text. */
  private restartFromPlain(plain: string): void {
    this.plainText = plain
    this.consumedLength = 0
    this.chunksSubmitted = 0
    this.hasStartedSpeaking = false
    resetTtsPlaybackQueue()
    stopTtsPlayback()
    this.playChain = Promise.resolve()
    const { chunks, remainder } = takeSpeechChunks(plain, false)
    this.consumedLength = plain.length - remainder.length
    for (const chunk of chunks) {
      this.scheduleChunk(chunk)
    }
  }

  private drainSynthWaiters(): void {
    while (this.synthWaiters.length > 0) {
      const next = this.synthWaiters.shift()
      next?.()
    }
  }

  private async acquireSynthSlot(): Promise<boolean> {
    while (this.synthInFlight >= MAX_SYNTH_IN_FLIGHT) {
      await new Promise<void>((resolve) => {
        this.synthWaiters.push(resolve)
      })
      if (this.cancelled || !this.shouldContinue()) return false
    }
    if (this.cancelled || !this.shouldContinue()) return false
    this.synthInFlight++
    return true
  }

  private releaseSynthSlot(): void {
    this.synthInFlight = Math.max(0, this.synthInFlight - 1)
    const next = this.synthWaiters.shift()
    if (next) next()
  }

  private startSynth(text: string): Promise<TtsSynthResult | null> {
    return (async () => {
      if (!(await this.acquireSynthSlot())) return null
      try {
        return await getLingo().tts.synthesize(buildTtsSynthesizeRequest(text, this.locale))
      } catch {
        return null
      } finally {
        this.releaseSynthSlot()
      }
    })()
  }

  private scheduleChunk(text: string): void {
    if (this.cancelled || text.length < 2) return
    if (!this.shouldContinue()) return

    this.chunksSubmitted += 1
    const synthPromise = this.startSynth(text)

    void synthPromise.then((result) => {
      if (!result || this.cancelled) return
      prepareTtsFromBase64(result.audioBase64, result.mimeType)
    })

    this.playChain = this.playChain.then(async () => {
      if (this.cancelled || !this.shouldContinue()) return

      const result = await synthPromise
      if (!result || this.cancelled || !this.shouldContinue()) return

      const { audioBase64, mimeType } = result

      if (!this.hasStartedSpeaking) {
        this.hasStartedSpeaking = true
        this.onSpeaking?.()
      }

      await enqueueTtsFromBase64(audioBase64, mimeType)
    })
  }

  private shouldContinue(): boolean {
    return (
      isAgentRunActive(this.runId) &&
      useChatsStore.getState().activeChatId === this.targetChatId
    )
  }
}

export function createStreamingSentenceTts(
  options: StreamingSentenceTtsOptions
): StreamingSentenceTts {
  resetTtsPlaybackQueue()
  return new StreamingSentenceTts(options)
}
