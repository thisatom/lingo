import type { ChatMessagePayload } from '../types/ipc'
import { extractPlainTextFromPayload } from './chat-message-api'

/** User explicitly asked to search the web — not inferred from question shape. */
const FORCE_WEB_SEARCH =
  /\b(search the web|search online|search the internet|look up online|google|web search)\b|(?:поиск|поищи|загугли|найди)(?:\s+\S+){0,4}\s*(?:в\s+)?(?:интернет|сети|web)/i

export function shouldForceWebSearch(userMessage: string): boolean {
  return FORCE_WEB_SEARCH.test(userMessage.trim())
}

export function getLastUserMessageContent(messages: ChatMessagePayload[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') return extractPlainTextFromPayload(messages[i].content)
  }
  return ''
}

export function looksTruncatedOrRefusal(answer: string): boolean {
  const reply = answer.trim()
  if (reply.length >= 80) return false
  if (/^(I'm sorry|Sorry|I cannot|I can't|Unfortunately|Извини|К сожалению)/i.test(reply)) {
    return reply.length < 80 || !/[.!?…]$/.test(reply)
  }
  if (reply.length < 32 && !/[.!?…]$/.test(reply)) return true
  return false
}

export function isSubstantiveReply(answer: string, userMessage: string): boolean {
  const reply = answer.trim()
  const question = userMessage.trim()
  if (!reply) return false
  if (looksTruncatedOrRefusal(reply)) return false
  if (question.length < 8) return reply.length >= 2
  return reply.length >= 20
}

export function shouldRetryWebSearchAnswer(
  answer: string,
  userMessage: string,
  finishReason: string | null
): boolean {
  if (finishReason === 'length') return true
  if (!userMessage.trim()) return false
  return looksTruncatedOrRefusal(answer) || !isSubstantiveReply(answer, userMessage)
}
