import { useSettingsStore } from '@/entities/settings/model/store'
import { messageHasVisibleContent } from '@/shared/lib/chat-message-api'
import type { ChatMessagePayload } from '@/shared/types/ipc'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import type { Message } from '@/entities/message/model/types'

type HistoryCacheEntry = {
  chatId: string
  messages: ChatMessagePayload[]
}

const historyCache = new Map<string, HistoryCacheEntry>()

export function messageContentFingerprint(content: string): number {
  let hash = 5381
  for (let i = 0; i < content.length; i++) {
    hash = (hash * 33) ^ content.charCodeAt(i)
  }
  return hash >>> 0
}

function attachmentsSig(attachments?: MessageAttachment[]): string {
  if (!attachments?.length) return ''
  return attachments
    .map((a) => `${a.id}:${a.kind}:${a.mimeType}:${a.sizeBytes}`)
    .join(',')
}

export function messageSig(message: Message): string {
  const len = message.content.length
  const fp = messageContentFingerprint(message.content)
  const att = attachmentsSig(message.attachments)
  return `${message.id}:${message.role}:${len}:${fp}:${att}`
}

export function historySignature(chatId: string, messages: Message[]): string {
  const visible = messages.filter(messageHasVisibleContent)
  const { addressUserByName, displayName } = useSettingsStore.getState()
  const name = displayName?.trim() ?? ''
  const namePart = addressUserByName && name ? `@${name}` : ''
  if (visible.length === 0) return `${chatId}:0:${namePart}`

  return `${chatId}:${visible.map(messageSig).join('|')}:${namePart}`
}

export function getCachedApiHistory(signature: string): ChatMessagePayload[] | null {
  return historyCache.get(signature)?.messages ?? null
}

export function setCachedApiHistory(
  signature: string,
  chatId: string,
  messages: ChatMessagePayload[]
): void {
  historyCache.set(signature, { chatId, messages })
  if (historyCache.size > 24) {
    const oldest = historyCache.keys().next().value
    if (oldest) historyCache.delete(oldest)
  }
}

export function invalidateChatApiHistoryCache(chatId?: string): void {
  if (!chatId) {
    historyCache.clear()
    return
  }
  for (const [key, entry] of historyCache) {
    if (entry.chatId === chatId) historyCache.delete(key)
  }
}
