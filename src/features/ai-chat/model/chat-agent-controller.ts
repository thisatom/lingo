import { useChatsStore } from '@/entities/chat/model/store'
import { useMessageQueueStore } from '@/entities/message-queue/model/store'
import { useConversationStore } from '@/entities/conversation/model/store'
import {
  executeAgentStop,
  type AgentStopContext,
  type AgentStopOptions
} from '@/features/ai-chat/lib/chat-agent-stop'
import { shouldAutoFlushMessageQueue } from '@/features/ai-chat/lib/chat-agent-queue'
import { isChatAgentBusy } from '@/features/ai-chat/lib/chat-agent-busy'
import {
  getOtherChatStreamBlocking,
  shouldDeferChatAgentTurn
} from '@/features/ai-chat/lib/agent-stream-guard'
import {
  consumePendingAgentReply,
  hasPendingAgentReply
} from '@/features/ai-chat/lib/pending-agent-reply'
import { setPipelineStageForChat } from '@/features/ai-chat/lib/pipeline-stage'
import {
  runAgentTurn,
  type AgentTurnSession,
  type RunAgentTurnParams
} from '@/features/ai-chat/model/run-agent-turn'

export type { AgentStopOptions, AgentTurnSession }

export class ChatAgentController {
  async runTurn(params: Omit<RunAgentTurnParams, 'session'> & { session: AgentTurnSession }) {
    return runAgentTurn(params)
  }

  stop(options: AgentStopOptions, stopContext: AgentStopContext): boolean {
    return executeAgentStop(options, stopContext)
  }

  async processNextInQueue(
    chatId: string,
    runTurn: (chatId: string) => Promise<boolean>
  ): Promise<void> {
    useConversationStore.getState().setQueueAheadPreview(null)
    const addMessage = useChatsStore.getState().addMessage
    const removeMessagesFrom = useChatsStore.getState().removeMessagesFrom

    while (useMessageQueueStore.getState().getQueue(chatId).length > 0) {
      if (getOtherChatStreamBlocking(chatId)) {
        setPipelineStageForChat(chatId, 'idle')
        return
      }

      const item = useMessageQueueStore.getState().getQueue(chatId)[0]
      if (!item) break

      const hasText = Boolean(item.content.trim())
      const hasAttachments = (item.attachments?.length ?? 0) > 0
      if (!hasText && !hasAttachments) {
        useMessageQueueStore.getState().remove(chatId, item.id)
        continue
      }

      const userMessageId = addMessage(
        {
          role: 'user',
          content: item.content,
          attachments: hasAttachments ? item.attachments : undefined
        },
        chatId
      )
      const ok = await runTurn(chatId)
      if (ok) {
        useMessageQueueStore.getState().remove(chatId, item.id)
        return
      }

      if (userMessageId) removeMessagesFrom(userMessageId, chatId)
      useMessageQueueStore.getState().remove(chatId, item.id)
      setPipelineStageForChat(chatId, 'idle')
      return
    }

    if (await this.tryRunPendingAgentReply(chatId, runTurn)) {
      return
    }

    setPipelineStageForChat(chatId, 'idle')
  }

  async tryRunPendingAgentReply(
    chatId: string,
    runTurn: (chatId: string) => Promise<boolean>
  ): Promise<boolean> {
    if (!hasPendingAgentReply(chatId)) return false
    if (shouldDeferChatAgentTurn(chatId)) return false
    consumePendingAgentReply(chatId)
    return runTurn(chatId)
  }

  async flushQueuedMessages(
    chatId: string | undefined,
    runTurn: (chatId: string) => Promise<boolean>
  ): Promise<void> {
    const targetId = chatId ?? useChatsStore.getState().activeChatId
    if (!targetId) return
    if (shouldDeferChatAgentTurn(targetId)) return
    if (await this.tryRunPendingAgentReply(targetId, runTurn)) return

    const queueLength = useMessageQueueStore.getState().getQueue(targetId).length
    if (
      !shouldAutoFlushMessageQueue({
        chatId: targetId,
        agentBusy: isChatAgentBusy(targetId),
        queueLength,
        deferTurn: false
      })
    ) {
      return
    }

    await this.processNextInQueue(targetId, runTurn)
  }
}
