import type { ChatComposerMode } from '@/entities/settings/model/store'

/** Final answer text: `done` wins unless streamed cumulative text is a longer merge (continuation tails). */
export function resolveStreamDoneAnswer(doneAnswer: string, streamedAnswer: string): string {
  const trimmedDone = doneAnswer.trim()
  const trimmedStreamed = streamedAnswer.trim()
  if (!trimmedDone) return trimmedStreamed
  if (!trimmedStreamed) return trimmedDone
  if (
    trimmedStreamed.length > trimmedDone.length &&
    trimmedStreamed.endsWith(trimmedDone)
  ) {
    return trimmedStreamed
  }
  return trimmedDone
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
