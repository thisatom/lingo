import { CHAT_SCROLL_MIN_PX } from '@/entities/chat/lib/chat-scroll-persist'
import { recallChatScrollTop } from '@/widgets/conversation-panel/lib/chat-scroll-memory'

export type ChatScrollRestoreTarget = {
  chatId: string
  scrollTop: number | null
}

export function resolveSavedScrollTop(
  chatId: string,
  storedScrollTop: number | null | undefined
): number | null {
  const memory = recallChatScrollTop(chatId)
  if (memory != null && memory >= CHAT_SCROLL_MIN_PX) return memory
  if (storedScrollTop != null && storedScrollTop >= CHAT_SCROLL_MIN_PX) {
    return storedScrollTop
  }
  return null
}

/** Updates restore target when persisted scroll arrives after hydration. */
export function mergeChatScrollRestoreTarget(
  current: ChatScrollRestoreTarget | null,
  chatId: string,
  storedScrollTop: number | null | undefined,
  chatsStoreHydrated: boolean
): { target: ChatScrollRestoreTarget; lateHydration: boolean } {
  const resolved = chatsStoreHydrated
    ? resolveSavedScrollTop(chatId, storedScrollTop)
    : null

  if (!current || current.chatId !== chatId) {
    return { target: { chatId, scrollTop: resolved }, lateHydration: false }
  }

  if (current.scrollTop == null && resolved != null) {
    return { target: { chatId, scrollTop: resolved }, lateHydration: true }
  }

  return { target: current, lateHydration: false }
}
