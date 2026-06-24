import type { ChatMessagePayload } from '../types/ipc'
import { extractPlainTextFromPayload } from './chat-message-api'

/** User explicitly asked to search the web — not inferred from question shape. */
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

const CASUAL_GREETING =
  /^(?:hi|hello|hey|thanks|thank you|ok|okay|yes|no|привет|спасибо|да|нет)(?:[!?.…,\s]|$)/i

const SMALL_TALK =
  /\b(?:how are you|how'?s it going|what'?s up|как (?:у тебя )?(?:дела|настроение)|как жизнь)\b/i

const LOCAL_TIME_OR_DATE =
  /\b(?:(?:what|what's) (?:time|day|date)|which day|который час|сколько времени|какое (?:число|время)|какой (?:сегодня )?(?:день|день недели|год))\b/i

/** Factual / lookup-style query — worth searching when the user enabled web search. */
const FACTUAL_QUERY =
  /\b(?:who is|who was|what is|what are|what was|when did|when was|where is|how much|how many|why did|why is|latest|current|news|weather|forecast|price|stock|score|results|winner|release date|population|capital of|tell me about|compare|vs\.?|versus|расскажи (?:про|о)|погода|новости|курс|цена)\b/i

const CREATIVE_OR_ROLEPLAY =
  /\b(?:write (?:me )?(?:a )?(?:story|poem|song|essay|email|letter)|roleplay|pretend (?:you are|to be)|translate (?:this|to)|summarize this|proofread|fix (?:my )?(?:grammar|text)|practice (?:speaking|conversation))\b/i

/**
 * Whether a turn should run web search when the toggle allows it.
 * Explicit search phrases always qualify; small talk and local time/date do not.
 */
const SHORT_FACTUAL_QUESTION =
  /^(?:who|what|when|where|why|how|which|кто|что|когда|где|почему|как|сколько)\b/i

export function shouldUseWebSearchForMessage(userMessage: string): boolean {
  const q = userMessage.trim()
  if (!q) return false
  if (shouldForceWebSearch(q)) return true
  if (CASUAL_GREETING.test(q) || SMALL_TALK.test(q) || LOCAL_TIME_OR_DATE.test(q)) return false
  if (CREATIVE_OR_ROLEPLAY.test(q)) return false
  if (q.length < 10 && !q.includes('?')) return false
  if (FACTUAL_QUERY.test(q)) return true
  if (q.includes('?') && q.length >= 10 && SHORT_FACTUAL_QUESTION.test(q)) return true
  return q.includes('?') && q.length >= 28
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
