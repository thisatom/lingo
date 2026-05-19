import { useChatsStore } from '@/entities/chat/model/store'
import { isAgentRunActive } from '@/features/ai-chat/model/agent-run'
import { takeCompleteSentences } from '@/features/text-to-speech/lib/split-speech-sentences'
import {
  enqueueTtsFromBase64,
  resetTtsPlaybackQueue,
  stopTtsPlayback
} from '@/features/text-to-speech/model/playTts'
import { getLingo } from '@/shared/lib/lingo'
import { stripTextForSpeech } from '@/shared/lib/strip-text-for-speech'

export interface StreamingSentenceTtsOptions {
  locale: string
  runId: number
  targetChatId: string
  onSpeaking?: () => void
}

export class StreamingSentenceTts {
  private readonly locale: string
  private readonly runId: number
  private readonly targetChatId: string
  private readonly onSpeaking?: () => void

  private cancelled = false
  private plainText = ''
  private consumedLength = 0
  private pipeline: Promise<void> = Promise.resolve()
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

    const plain = stripTextForSpeech(rawText)
    if (!plain) return

    if (plain.length < this.plainText.length && !plain.startsWith(this.plainText.slice(0, this.consumedLength))) {
      this.cancel()
      return
    }

    this.plainText = plain
    const pending = plain.slice(this.consumedLength)
    const { sentences, remainder } = takeCompleteSentences(pending, false)
    this.consumedLength = plain.length - remainder.length

    for (const sentence of sentences) {
      this.scheduleSentence(sentence)
    }
  }

  async finish(): Promise<void> {
    if (this.cancelled) return

    const pending = this.plainText.slice(this.consumedLength)
    const { sentences, remainder } = takeCompleteSentences(pending, true)
    this.consumedLength = this.plainText.length - remainder.length

    for (const sentence of sentences) {
      this.scheduleSentence(sentence)
    }

    await this.pipeline
  }

  cancel(): void {
    this.cancelled = true
    resetTtsPlaybackQueue()
    stopTtsPlayback()
    this.pipeline = Promise.resolve()
  }

  private scheduleSentence(text: string): void {
    if (this.cancelled || text.length < 2) return
    if (!this.shouldContinue()) return

    const synthPromise = getLingo().tts.synthesize({ text, locale: this.locale })

    this.pipeline = this.pipeline.then(async () => {
      if (this.cancelled || !this.shouldContinue()) return

      const { audioBase64, mimeType } = await synthPromise
      if (this.cancelled || !this.shouldContinue()) return

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
