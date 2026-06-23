import {
  isSubstantiveReply,
  looksTruncatedOrRefusal
} from '@/shared/lib/web-search-intent'

/** Reply likely stopped before a natural sentence end (token limit or stream cut). */
export function looksCutOffMidSentence(answer: string): boolean {
  const reply = answer.trim()
  if (!reply) return false
  if (/```[\s\S]*$/.test(reply) && !/```[\s\S]*```/.test(reply)) return true
  if (/[.!?…)"'\]\u3002\uFF01\uFF1F\uFF09]$/.test(reply)) return false
  if (/[,;:—–\-(\[{«\u201C]$/.test(reply)) return true
  // Trailing clause after dash without completion (e.g. "…разговор — дайте").
  if (/[—–-]\s*[\p{L}\p{N}]{2,}$/u.test(reply) && reply.length >= 40) return true
  // Long assistant reply ending mid-sentence.
  if (reply.length >= 48 && /[\p{L}\p{N}]$/u.test(reply)) return true
  return false
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
  if (!head) return continuation.trim()
  if (!tail) return head
  if (/^\s/.test(continuation)) {
    return `${head} ${tail}`
  }
  const needsSpace =
    /[\p{L}\p{N}]$/u.test(head) &&
    /^[\p{L}\p{N}]/u.test(tail) &&
    !/[-–—/([{'"`]$/u.test(head)
  return needsSpace ? `${head} ${tail}` : `${head}${tail}`
}

export function shouldRetryIncompleteCompletion({
  answer,
  finishReason,
  userMessage,
  requireSubstantive = false,
  customBackend = false
}: IncompleteCompletionCheck): boolean {
  if (finishReason === 'length') return true
  if (customBackend) {
    if (finishReason === 'length') return true
    if (looksCutOffMidSentence(answer)) return true
    if (!requireSubstantive) return false
    const question = userMessage.trim()
    if (!question) return false
    return !isSubstantiveReply(answer, question)
  }
  if (looksTruncatedOrRefusal(answer) || looksCutOffMidSentence(answer)) return true
  if (!requireSubstantive) return false
  const question = userMessage.trim()
  if (!question) return false
  if (!isSubstantiveReply(answer, question)) return true
  return false
}

export function buildCompletionRetryUserMessage(userMessage: string): string {
  const trimmed = userMessage.trim()
  if (!trimmed) {
    return 'Your previous reply was cut off. Continue from where you stopped and finish the answer completely.'
  }
  return `Your previous reply was cut off before you finished. Continue from where you stopped, then complete the answer. Original request: "${trimmed}"`
}
