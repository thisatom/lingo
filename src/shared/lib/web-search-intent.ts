import type { ChatMessagePayload } from '../types/ipc'
import { extractPlainTextFromPayload } from './chat-message-api'

/** User explicitly asked to search the web — command phrases only, not topic keywords. */
const FORCE_WEB_SEARCH =
  /\b(search the web|search online|search the internet|look up online|google search|google this|google it|google for|search on google|web search)\b|(?:поиск|поищи|загугли|найди)(?:\s+\S+){0,4}\s*(?:в\s+)?(?:интернет|сети|web)/i

const SEARCH_PHRASE_PREFIX =
  /^(?:please\s+)?(?:can you\s+)?(?:search the web(?:\s+for)?|search online(?:\s+for)?|search the internet(?:\s+for)?|look up online(?:\s+for)?|google search(?:\s+for)?|google (?:this|it|for)|search on google(?:\s+for)?|web search(?:\s+for)?)\s*/i

const RU_SEARCH_PREFIX =
  /^(?:пожалуйста\s+)?(?:можешь\s+)?(?:поиск|поищи|загугли|найди)(?:\s+\S+){0,4}\s*(?:в\s+)?(?:интернет(?:е)?|сети|web)\s*/i

export function buildWebSearchQuery(userMessage: string): string {
  let query = userMessage.trim()
  query = query.replace(SEARCH_PHRASE_PREFIX, '')
  query = query.replace(RU_SEARCH_PREFIX, '')
  query = query.replace(/^(?:for|about)\s+/i, '')
  return query.trim() || userMessage.trim()
}

const CONVERSATIONAL_PREFIX =
  /^(?:(?:please|could you|can you|would you|help me(?: find| understand)?|tell me(?: about)?|i(?:'m| am) (?:looking for|trying to find|wondering(?: about)?)|i (?:need|want) to (?:know|find|learn)(?: about)?)\s+)+/i

const CONVERSATIONAL_SUFFIX = /\s*(?:please|thanks|thank you)[.!?…]*$/i

/** Compact lookup string for search providers — strips chat phrasing, keeps factual terms. */
export function optimizeWebSearchQuery(userMessage: string): string {
  let query = buildWebSearchQuery(userMessage)
  query = query.replace(CONVERSATIONAL_PREFIX, '')
  query = query.replace(CONVERSATIONAL_SUFFIX, '')
  query = query.replace(/\s+/g, ' ').replace(/[?.!…]+$/g, '').trim()
  return query || buildWebSearchQuery(userMessage)
}

export function shouldForceWebSearch(userMessage: string): boolean {
  return FORCE_WEB_SEARCH.test(userMessage.trim())
}

/**
 * Whether to run web search for this turn.
 * Uses Settings toggle or explicit search command — never topic keywords (weather, news, …).
 */
export function shouldRunWebSearchForTurn(
  userMessage: string,
  webSearchEnabled: boolean
): boolean {
  const q = userMessage.trim()
  if (!q) return false
  if (shouldForceWebSearch(q)) return true
  return webSearchEnabled
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
