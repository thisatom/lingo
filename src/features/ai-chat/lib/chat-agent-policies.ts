import type { ChatComposerMode } from '@/entities/settings/model/store'

/** Final answer text: `done` wins; empty `done` keeps streamed cumulative text. */
export function resolveStreamDoneAnswer(doneAnswer: string, streamedAnswer: string): string {
  const trimmedDone = doneAnswer.trim()
  if (trimmedDone) return trimmedDone
  return streamedAnswer.trim()
}

/** Remove empty thinking placeholder only when no reasoning stream was received. */
export function shouldRemoveEmptyThinkingPlaceholder(
  hasThinkingStream: boolean,
  answerHasText: boolean
): boolean {
  return answerHasText && !hasThinkingStream
}

/** TTS after assistant turn — Agent Speech mode only. */
export function shouldPlayAgentTts(
  ttsEnabled: boolean,
  composerMode: ChatComposerMode
): boolean {
  return ttsEnabled && composerMode === 'conversation'
}
