import {
  resolveStreamDoneAnswer,
  shouldRemoveEmptyThinkingPlaceholder
} from '@/features/ai-chat/lib/chat-agent-policies'

export type TurnStreamAccumulators = {
  finalText: string
  finalThinkingText: string
  hasThinkingStream: boolean
}

export type TextDeltaTurnEffects = {
  accumulators: TurnStreamAccumulators
  removeThinkingPlaceholder: boolean
  flushThinkingNow: boolean
  pushAnswerToSync: boolean
}

/** Applies one `text-delta` event to in-memory turn state (pure). */
export function applyTextDeltaToTurn(
  acc: TurnStreamAccumulators,
  cumulativeAnswerText: string,
  hasThinkingMessage: boolean
): TextDeltaTurnEffects {
  const answerHasText = cumulativeAnswerText.trim().length > 0
  const next: TurnStreamAccumulators = { ...acc }

  if (answerHasText) {
    next.finalText = cumulativeAnswerText
  }

  const removeThinkingPlaceholder =
    answerHasText &&
    hasThinkingMessage &&
    shouldRemoveEmptyThinkingPlaceholder(acc.hasThinkingStream, answerHasText)

  const flushThinkingNow =
    answerHasText && acc.hasThinkingStream && acc.finalThinkingText.trim().length > 0

  return {
    accumulators: next,
    removeThinkingPlaceholder,
    flushThinkingNow,
    pushAnswerToSync: answerHasText
  }
}

export type DoneTurnEffects = {
  accumulators: TurnStreamAccumulators
  flushThinkingText: string
  flushAnswerText: string | null
}

/** Applies `done` event; may recover thinking text from persisted message content. */
export function applyDoneToTurn(
  acc: TurnStreamAccumulators,
  doneAnswer: string,
  thinkingMessageContent: string
): DoneTurnEffects {
  const resolvedAnswer = resolveStreamDoneAnswer(doneAnswer, acc.finalText)
  const next: TurnStreamAccumulators = {
    ...acc,
    finalText: resolvedAnswer || acc.finalText
  }

  if (!next.finalThinkingText.trim() && thinkingMessageContent.trim()) {
    next.hasThinkingStream = true
    next.finalThinkingText = thinkingMessageContent.trim()
  }

  const flushAnswerText = doneAnswer.trim()
    ? doneAnswer.trim()
    : next.finalText.trim()
      ? next.finalText
      : null

  return {
    accumulators: next,
    flushThinkingText: next.finalThinkingText,
    flushAnswerText
  }
}
