import {
  isSubstantiveReply,
  looksTruncatedOrRefusal,
  shouldUseResearchMode
} from '@/shared/lib/web-search-intent'

/** Reply likely stopped before a natural sentence end (token limit or stream cut). */
export function looksCutOffMidSentence(answer: string): boolean {
  const reply = answer.trim()
  if (reply.length < 100) return false
  if (/[.!?…)"'\]]$/.test(reply)) return false
  if (/```[\s\S]*$/.test(reply) && !/```[\s\S]*```/.test(reply)) return true
  return true
}

export type IncompleteCompletionCheck = {
  answer: string
  finishReason: string | null
  userMessage: string
  /** When true, short answers to factual questions also trigger retry. */
  requireSubstantive?: boolean
  /** Custom OpenAI-compatible endpoints (NVIDIA, Ollama, …). */
  customBackend?: boolean
}

/** Join first stream tail with continuation chunk (retry pass). */
export function mergeContinuationAnswer(prefix: string, continuation: string): string {
  const head = prefix.trimEnd()
  const tail = continuation.trimStart()
  if (!head) return tail
  if (!tail) return head
  return `${head}${tail}`
}

export function shouldRetryIncompleteCompletion({
  answer,
  finishReason,
  userMessage,
  requireSubstantive = false,
  customBackend = false
}: IncompleteCompletionCheck): boolean {
  if (finishReason === 'length') return true
  if (customBackend && !looksTruncatedOrRefusal(answer) && !looksCutOffMidSentence(answer)) {
    return false
  }
  if (looksTruncatedOrRefusal(answer) || looksCutOffMidSentence(answer)) return true
  if (!requireSubstantive) return false
  const question = userMessage.trim()
  if (!question) return false
  if (shouldUseResearchMode(question) && !isSubstantiveReply(answer, question)) return true
  return false
}

export function buildCompletionRetryUserMessage(userMessage: string): string {
  const trimmed = userMessage.trim()
  if (!trimmed) {
    return 'Your previous reply was cut off. Continue from where you stopped and finish the answer completely.'
  }
  return `Your previous reply was cut off before you finished. Continue from where you stopped, then complete the answer. Original request: "${trimmed}"`
}
