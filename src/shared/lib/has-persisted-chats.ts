import { CHATS_STORAGE_KEY } from '@/shared/lib/needs-welcome-window'

/** True when `lingo-chats-v3` has at least one saved chat (browser localStorage). */
export function hasPersistedChatsInStorage(): boolean {
  if (typeof localStorage === 'undefined') return false
  try {
    const raw = localStorage.getItem(CHATS_STORAGE_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw) as { state?: { chats?: unknown } }
    const chats = parsed?.state?.chats
    return Array.isArray(chats) && chats.length > 0
  } catch {
    return false
  }
}
