import type { ConversationTurn } from '@/widgets/conversation-panel/lib/group-turns'

const TURN_BASE_PX = 80
const THINKING_BASE_PX = 72
const ASSISTANT_BASE_PX = 56

const CODE_FENCE_EXTRA_PX = 120
const MATH_BLOCK_EXTRA_PX = 80
const INLINE_MATH_EXTRA_PX = 24
const IMAGE_MARKDOWN_EXTRA_PX = 160
const SEARCH_SOURCE_EXTRA_PX = 36
const ATTACHMENT_EXTRA_PX = 120

function countPairs(marker: string, text: string): number {
  const matches = text.match(new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))
  return matches ? Math.floor(matches.length / 2) : 0
}

function countImageMarkdown(text: string): number {
  return (text.match(/!\[[^\]]*\]\([^)]+\)/g) ?? []).length
}

/** Rough virtualizer row height from message sizes (thinking + answer). */
export function estimateTurnHeightPx(turn: ConversationTurn): number {
  let height = TURN_BASE_PX + Math.min(turn.user.content.length / 10, 200)
  height += (turn.user.attachments?.length ?? 0) * ATTACHMENT_EXTRA_PX

  for (const message of turn.assistantMessages) {
    if (message.role === 'thinking') {
      height += THINKING_BASE_PX + Math.min(message.content.length / 8, 220)
      continue
    }

    let msgHeight = ASSISTANT_BASE_PX + Math.min(message.content.length / 6, 900)
    msgHeight += countPairs('```', message.content) * CODE_FENCE_EXTRA_PX
    msgHeight += countPairs('$$', message.content) * MATH_BLOCK_EXTRA_PX
    msgHeight += countPairs('$', message.content) * INLINE_MATH_EXTRA_PX
    msgHeight += countImageMarkdown(message.content) * IMAGE_MARKDOWN_EXTRA_PX
    msgHeight += (message.searchSources?.length ?? 0) * SEARCH_SOURCE_EXTRA_PX
    height += msgHeight
  }

  return Math.max(140, Math.round(height))
}
