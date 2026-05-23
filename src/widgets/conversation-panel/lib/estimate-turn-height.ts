import type { ConversationTurn } from '@/widgets/conversation-panel/lib/group-turns'

const TURN_BASE_PX = 80
const THINKING_BASE_PX = 72
const ASSISTANT_BASE_PX = 56

/** Rough virtualizer row height from message sizes (thinking + answer). */
export function estimateTurnHeightPx(turn: ConversationTurn): number {
  let height = TURN_BASE_PX + Math.min(turn.user.content.length / 10, 200)

  for (const message of turn.assistantMessages) {
    if (message.role === 'thinking') {
      height += THINKING_BASE_PX + Math.min(message.content.length / 8, 220)
    } else {
      height += ASSISTANT_BASE_PX + Math.min(message.content.length / 6, 720)
    }
  }

  return Math.max(140, Math.round(height))
}
