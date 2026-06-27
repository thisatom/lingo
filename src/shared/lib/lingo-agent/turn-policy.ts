import type { ChatMessagePayload } from '@/shared/types/ipc'
import type { Message } from '@/entities/message/model/types'
import {
  lastApiUserTurnHasAttachments,
  lastUserMessageHasAttachments,
  lastUserMessageText,
  resolveWebSearchForChatTurn,
  resolveWebSearchForStreamTurn
} from '@/shared/lib/web-search-turn'
import {
  optimizeWebSearchQuery,
  shouldForceWebSearch,
  shouldRunWebSearchForTurn
} from '@/shared/lib/web-search-intent'

export type AgentPromptMode = 'research' | 'practice' | 'general' | 'vision'

export type AgentTurnPolicyInput = {
  languagePracticeEnabled: boolean
  webSearchEnabled: boolean
  webSearchPerTurn?: boolean
  messages: readonly Message[] | readonly ChatMessagePayload[]
  lastUserMessage: string
  hasVision?: boolean
}

export type AgentTurnPolicy = {
  promptMode: AgentPromptMode
  languagePractice: boolean
  webSearchForTurn: boolean
  forceWebSearch: boolean
  blockedByAttachments: boolean
  searchQuery: string
  shouldSearch: boolean
}

function isRendererMessage(
  messages: readonly Message[] | readonly ChatMessagePayload[]
): messages is readonly Message[] {
  const first = messages[0]
  if (!first) return true
  return 'id' in first && 'createdAt' in first
}

export function resolveAgentPromptMode(input: {
  languagePracticeEnabled: boolean
  forceWebSearch: boolean
  webSearchForTurn: boolean
  shouldSearch?: boolean
  hasVision?: boolean
}): AgentPromptMode {
  if (input.hasVision) return 'vision'
  if (input.shouldSearch || input.forceWebSearch || input.webSearchForTurn) return 'research'
  if (!input.languagePracticeEnabled) return 'general'
  return 'practice'
}

/** Unified turn policy for renderer + stream layers. */
export function resolveAgentTurnPolicy(input: AgentTurnPolicyInput): AgentTurnPolicy {
  const lastUserMessage = input.lastUserMessage.trim()
  const languagePractice = input.languagePracticeEnabled

  if (isRendererMessage(input.messages)) {
    const blockedByAttachments = lastUserMessageHasAttachments(input.messages)
    const forceWebSearch = shouldForceWebSearch(lastUserMessage)
    const webSearchForTurn =
      !blockedByAttachments &&
      resolveWebSearchForChatTurn(
        { webSearchEnabled: input.webSearchEnabled },
        input.messages
      )
    const shouldSearch = !blockedByAttachments && (webSearchForTurn || forceWebSearch)

    return {
      promptMode: resolveAgentPromptMode({
        languagePracticeEnabled: languagePractice,
        forceWebSearch,
        webSearchForTurn,
        shouldSearch
      }),
      languagePractice,
      webSearchForTurn,
      forceWebSearch,
      blockedByAttachments,
      searchQuery: optimizeWebSearchQuery(lastUserMessage),
      shouldSearch
    }
  }

  const blockedByAttachments = lastApiUserTurnHasAttachments(input.messages)
  const streamDecision = resolveWebSearchForStreamTurn(
    { webSearch: input.webSearchPerTurn },
    input.messages,
    lastUserMessage
  )
  const shouldSearch =
    !blockedByAttachments &&
    (streamDecision.webSearchForTurn || streamDecision.forceWebSearch)

  return {
    promptMode: resolveAgentPromptMode({
      languagePracticeEnabled: languagePractice,
      forceWebSearch: streamDecision.forceWebSearch,
      webSearchForTurn: streamDecision.webSearchForTurn
    }),
    languagePractice,
    webSearchForTurn: streamDecision.webSearchForTurn,
    forceWebSearch: streamDecision.forceWebSearch,
    blockedByAttachments,
    searchQuery: optimizeWebSearchQuery(lastUserMessage),
    shouldSearch
  }
}

export function resolveRendererWebSearchForTurn(
  settings: { webSearchEnabled: boolean; languagePracticeEnabled: boolean },
  messages: readonly Message[]
): boolean {
  return resolveWebSearchForChatTurn(
    { webSearchEnabled: settings.webSearchEnabled },
    messages
  )
}

export function messageNeedsWebSearch(text: string, webSearchEnabled: boolean): boolean {
  return shouldRunWebSearchForTurn(text, webSearchEnabled)
}

export function lastUserTextFromRendererMessages(messages: readonly Message[]): string {
  return lastUserMessageText(messages)
}
