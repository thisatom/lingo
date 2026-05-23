import { hasPersistedChatsInStorage } from '@/shared/lib/has-persisted-chats'

/** Users with chat history are treated as having completed first-run setup. */
export function resolveOnboardingCompleted(
  savedFlag: boolean | undefined,
  fallback: boolean
): boolean {
  if (savedFlag === true) return true
  if (hasPersistedChatsInStorage()) return true
  return savedFlag ?? fallback
}
