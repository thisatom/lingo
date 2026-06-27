import { z } from 'zod'
import {
  optimizeWebSearchQuery,
  shouldForceWebSearch,
  shouldRunWebSearchForTurn
} from '@/shared/lib/web-search-intent'

export const agentIntentSchema = z.object({
  needsWebSearch: z.boolean(),
  forceWebSearch: z.boolean(),
  searchQuery: z.string()
})

export type AgentIntent = z.infer<typeof agentIntentSchema>

/** Structured intent from Settings toggle + explicit search commands (no topic keywords). */
export function classifyAgentIntent(
  message: string,
  webSearchEnabled: boolean
): AgentIntent {
  const trimmed = message.trim()
  const forceWebSearch = shouldForceWebSearch(trimmed)
  const needsWebSearch = shouldRunWebSearchForTurn(trimmed, webSearchEnabled)

  return {
    needsWebSearch,
    forceWebSearch,
    searchQuery: optimizeWebSearchQuery(trimmed)
  }
}
