import { looksCutOffMidSentence } from '@/shared/lib/completion-quality'
import type { Message } from '@/entities/message/model/types'

export function canContinueAssistantReply(message: Message): boolean {
  if (message.role !== 'assistant') return false
  if (!message.content.trim()) return false
  if (message.replyStatus === 'interrupted' || message.replyStatus === 'incomplete') {
    return true
  }
  return looksCutOffMidSentence(message.content)
}
