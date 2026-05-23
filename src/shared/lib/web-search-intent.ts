/** User explicitly asked to search the web or for factual lookup. */
const FORCE_WEB_SEARCH =
  /\b(search the web|search online|search the internet|look up online|google|web search)\b|(?:поиск|поищи|загугли|найди)(?:\s+\S+){0,4}\s*(?:в\s+)?(?:интернет|сети|web)|(?:кто|что)\s+такой|(?:who|what)\s+is\b/i

/** Factual / meta questions that need a real answer, not a 1-word drill reply. */
const RESEARCH_QUESTION =
  /\?|^(?:why|how|who|what|when|where|do you|can you|are you|is there)\b|(?:почему|зачем|откуда|как|кто|что|где|когда|какой|какая|какое|сколько|есть ли|у тебя|имеешь|можешь|интернет|internet|коротко|short|access|доступ|год|year)/i

const FACTUAL_QUESTION =
  /\?|(?:какой|какая|какое|сколько|when|what|which|how many|year|год|date|дата|time|время)/i

export function shouldForceWebSearch(userMessage: string): boolean {
  return FORCE_WEB_SEARCH.test(userMessage.trim())
}

export function shouldUseResearchMode(userMessage: string): boolean {
  const text = userMessage.trim()
  if (!text) return false
  if (shouldForceWebSearch(text)) return true
  if (RESEARCH_QUESTION.test(text)) return true
  if (text.length >= 8) return true
  return false
}

/** Whether to run web search plugins / local search (skip short casual drill phrases). */
export function shouldRunWebSearch(userMessage: string): boolean {
  const text = userMessage.trim()
  if (!text) return false
  if (shouldForceWebSearch(text)) return true
  if (text.length < 12 && !FACTUAL_QUESTION.test(text)) return false
  if (RESEARCH_QUESTION.test(text)) return true
  if (FACTUAL_QUESTION.test(text)) return true
  return text.length >= 24
}

export function shouldRetryWebSearchAnswer(
  answer: string,
  userMessage: string,
  finishReason: string | null
): boolean {
  if (finishReason === 'length') return true
  if (!shouldRunWebSearch(userMessage)) return false
  return looksTruncatedOrRefusal(answer) || !isSubstantiveReply(answer, userMessage)
}

import type { ChatMessagePayload } from '../types/ipc'
import { extractPlainTextFromPayload } from './chat-message-api'

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

  const needsFullAnswer = shouldUseResearchMode(question) || FACTUAL_QUESTION.test(question)
  if (needsFullAnswer) return reply.length >= 36

  if (question.length < 8) return reply.length >= 2
  return reply.length >= 20
}
