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

const MAX_SYNTH_IN_FLIGHT = 3

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
  private hasStartedSpeaking = false

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
      this.cancel()
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
  }

  cancel(): void {
    this.cancelled = true
    resetTtsPlaybackQueue()
    stopTtsPlayback()
    this.playChain = Promise.resolve()
    this.synthInFlight = 0
  }

  private scheduleChunk(text: string): void {
    if (this.cancelled || text.length < 2) return
    if (!this.shouldContinue()) return

    const runSynth = async () => {
      while (this.synthInFlight >= MAX_SYNTH_IN_FLIGHT) {
        await new Promise((r) => setTimeout(r, 16))
        if (this.cancelled || !this.shouldContinue()) return null
      }
      this.synthInFlight++
      try {
        return await getLingo().tts.synthesize(buildTtsSynthesizeRequest(text, this.locale))
      } finally {
        this.synthInFlight--
      }
    }

    const synthPromise = runSynth()

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
