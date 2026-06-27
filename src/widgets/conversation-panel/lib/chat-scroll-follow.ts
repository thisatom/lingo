import {
  CHAT_SCROLL_AGENT_BUSY_THRESHOLD_PX,
  CHAT_SCROLL_BOTTOM_THRESHOLD_PX
} from '@/shared/lib/chat-scroll-threshold'
import {
  distanceFromViewportBottom,
  getViewportMaxScrollTop,
  isViewportAtBottom
} from '@/shared/lib/chat-scroll-viewport'
import { scrollViewportToBottom } from '@/widgets/conversation-panel/lib/chat-scroll-anchor'

export { getViewportMaxScrollTop as getMaxScrollTop }

/** @deprecated Use CHAT_SCROLL_BOTTOM_THRESHOLD_PX */
export const CHAT_FOLLOW_BOTTOM_THRESHOLD_PX = CHAT_SCROLL_BOTTOM_THRESHOLD_PX

export type ChatScrollFollowState = {
  pinToBottom: boolean
  isRestoring: boolean
  /** When true, only follow if closer to the bottom (streaming tail growth). */
  agentBusy?: boolean
}

export function distanceFromChatBottom(viewport: HTMLElement): number {
  return distanceFromViewportBottom(viewport)
}

export function isViewportNearChatBottom(
  viewport: HTMLElement,
  threshold = CHAT_SCROLL_BOTTOM_THRESHOLD_PX
): boolean {
  return isViewportAtBottom(viewport, threshold)
}

/** Same rule as auto-follow and CustomScrollArea “at bottom” reporting. */
export const isViewportAtChatBottom = isViewportAtBottom

/** Whether the viewport should stick to the latest message as content grows. */
export function shouldStickToBottom(
  state: ChatScrollFollowState,
  viewport?: HTMLElement | null
): boolean {
  if (state.isRestoring) return false
  if (state.pinToBottom) return true
  if (viewport) {
    const threshold = state.agentBusy
      ? CHAT_SCROLL_AGENT_BUSY_THRESHOLD_PX
      : CHAT_SCROLL_BOTTOM_THRESHOLD_PX
    return isViewportNearChatBottom(viewport, threshold)
  }
  return false
}

export function stickChatViewportToBottom(
  viewport: HTMLElement,
  onAtBottomChange?: (atBottom: boolean) => void
): void {
  scrollViewportToBottom(viewport, 'instant')
  onAtBottomChange?.(true)
}

export type ChatTailScrollExtras = {
  pipelineStage?: string
  pipelineSearchActiveUrl?: string | null
  /** Tail action bar (Copy/Speak) appeared or reply status changed. */
  replyActionsReady?: boolean
}

/** Tracks streaming tail growth (assistant + thinking) and pipeline UI for auto-follow. */
export function buildChatTailScrollSignature(
  messages: readonly {
    id: string
    role: string
    content: string
    replyStatus?: string
  }[],
  extras?: ChatTailScrollExtras
): string {
  if (messages.length === 0) return '0'
  const last = messages[messages.length - 1]!
  let thinkingLen = 0
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]!
    if (message.role === 'thinking') {
      thinkingLen = message.content.length
      break
    }
  }
  let lastAssistantReplyStatus = ''
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]!
    if (message.role === 'assistant') {
      lastAssistantReplyStatus = message.replyStatus ?? ''
      break
    }
  }
  const base = `${messages.length}:${last.id}:${last.content.length}:${last.role}:t${thinkingLen}:rs${lastAssistantReplyStatus}`
  if (!extras) return base
  const stage = extras.pipelineStage ?? ''
  const searchUrl = extras.pipelineSearchActiveUrl ?? ''
  const actionsReady = extras.replyActionsReady ? '1' : '0'
  return `${base}:st${stage}:su${searchUrl}:ar${actionsReady}`
}
