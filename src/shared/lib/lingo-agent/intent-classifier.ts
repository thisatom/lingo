import { z } from 'zod'
import {
  optimizeWebSearchQuery,
  shouldForceWebSearch,
  shouldUseWebSearchForMessage
} from '@/shared/lib/web-search-intent'

export const agentIntentSchema = z.object({
  needsWebSearch: z.boolean(),
  forceWebSearch: z.boolean(),
  searchQuery: z.string()
})

export type AgentIntent = z.infer<typeof agentIntentSchema>

/**
 * Heuristic intent classification (no extra LLM call).
 * Structured output shape matches future `generateObject` classifier.
 */
export function classifyAgentIntent(
  message: string,
  webSearchEnabled: boolean
): AgentIntent {
  const trimmed = message.trim()
  const forceWebSearch = shouldForceWebSearch(trimmed)
  const needsWebSearch =
    forceWebSearch || (webSearchEnabled && shouldUseWebSearchForMessage(trimmed))

  return {
    needsWebSearch,
    forceWebSearch,
    searchQuery: optimizeWebSearchQuery(trimmed)
  }
}
