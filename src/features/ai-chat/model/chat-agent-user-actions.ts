import { useChatsStore } from '@/entities/chat/model/store'
import { useMessageQueueStore } from '@/entities/message-queue/model/store'
import { useConversationStore } from '@/entities/conversation/model/store'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import type { AgentStopOptions } from '@/features/ai-chat/lib/chat-agent-stop'
import { findTurnTailRemoveId } from '@/features/ai-chat/lib/agent-turn-cleanup'
import {
  getOtherChatStreamBlocking,
  OTHER_CHAT_STREAM_MESSAGE,
  shouldDeferChatAgentTurn
} from '@/features/ai-chat/lib/agent-stream-guard'
import { markPendingAgentReply } from '@/features/ai-chat/lib/pending-agent-reply'
import {
  setActiveChatPipelineStage,
  setPipelineStageForChat
} from '@/features/ai-chat/lib/pipeline-stage'
import { isPlaybackOnlyConversationError } from '@/features/ai-chat/lib/post-reply'
import { persistAttachments } from '@/entities/message/lib/prepare-attachment'
import { formatLlmError } from '@/shared/lib/llm-errors'
import {
  restoreUserMessageEdit,
  snapshotUserMessageEdit,
  type SubmitEditedUserMessageResult
} from '@/features/ai-chat/model/submit-edited-user-message'

export type ChatAgentUserActionsDeps = {
  addMessage: ReturnType<typeof useChatsStore.getState>['addMessage']
  removeMessagesFrom: ReturnType<typeof useChatsStore.getState>['removeMessagesFrom']
  removeMessagesAfter: ReturnType<typeof useChatsStore.getState>['removeMessagesAfter']
  updateUserMessageContent: ReturnType<typeof useChatsStore.getState>['updateUserMessageContent']
  updateMessageContent: ReturnType<typeof useChatsStore.getState>['updateMessageContent']
  stopAgent: (options?: AgentStopOptions) => void
  runAssistantReply: (chatId: string) => Promise<boolean>
  enqueueUserMessage: (content: string, chatId: string, attachments?: MessageAttachment[]) => void
  setBlurAnimateMessageId: (id: string | null) => void
  setError: (error: string | null, targetChatId?: string) => void
}

export async function sendUserMessageAction(
  deps: ChatAgentUserActionsDeps,
  content: string,
  attachments?: MessageAttachment[]
): Promise<void> {
  const trimmed = content.trim()
  const hasAttachments = (attachments?.length ?? 0) > 0
  if (!trimmed && !hasAttachments) return

  const chatId = useChatsStore.getState().activeChatId ?? useChatsStore.getState().ensureActiveChat()

  useConversationStore.getState().setSpeechError(null)

  if (shouldDeferChatAgentTurn(chatId)) {
    deps.enqueueUserMessage(trimmed, chatId, hasAttachments ? attachments : undefined)
    if (hasAttachments) {
      useChatsStore.getState().clearComposerAttachments(chatId)
    }
    return
  }

  deps.stopAgent({ chatId })
  deps.addMessage(
    {
      role: 'user',
      content: trimmed,
      attachments: hasAttachments ? attachments : undefined
    },
    chatId
  )
  useChatsStore.getState().clearComposerAttachments(chatId)
  await deps.runAssistantReply(chatId)
}

export async function sendQueuedMessageNowAction(
  deps: ChatAgentUserActionsDeps,
  queueItemId: string
): Promise<void> {
  const chatId = useChatsStore.getState().activeChatId
  if (!chatId) return

  const item = useMessageQueueStore.getState().getQueue(chatId).find((m) => m.id === queueItemId)
  if (!item) return

  useMessageQueueStore.getState().remove(chatId, queueItemId)
  deps.stopAgent({ force: true })
  useConversationStore.getState().setSpeechError(null)
  deps.addMessage(
    {
      role: 'user',
      content: item.content,
      attachments: item.attachments?.length ? item.attachments : undefined
    },
    chatId
  )
  await deps.runAssistantReply(chatId)
}

export function beginVoiceUserMessageAction(deps: ChatAgentUserActionsDeps): {
  messageId: string | null
  chatId: string
} {
  const chatId = useChatsStore.getState().activeChatId ?? useChatsStore.getState().ensureActiveChat()
  if (getOtherChatStreamBlocking(chatId)) {
    useConversationStore.getState().setSpeechError(OTHER_CHAT_STREAM_MESSAGE)
    return { messageId: null, chatId }
  }
  deps.stopAgent({ chatId })
  useConversationStore.getState().setSpeechError(null)
  const messageId = deps.addMessage({ role: 'user', content: '' }, chatId)
  return { messageId: messageId || null, chatId }
}

export function updateVoiceUserMessageAction(
  deps: ChatAgentUserActionsDeps,
  messageId: string,
  content: string
): void {
  deps.updateMessageContent(messageId, content, undefined, { allowEmptyUser: true })
}

export function cancelVoiceUserMessageAction(
  deps: ChatAgentUserActionsDeps,
  messageId: string
): void {
  if (!messageId) return
  deps.removeMessagesFrom(messageId)
  setActiveChatPipelineStage('idle')
}

export async function commitVoiceUserMessageAction(
  deps: ChatAgentUserActionsDeps,
  messageId: string
): Promise<void> {
  if (!messageId) return

  const chat = useChatsStore.getState().getActiveChat()
  const message = chat?.messages.find((m) => m.id === messageId)
  const trimmed = message?.content.trim() ?? ''

  if (!trimmed) {
    cancelVoiceUserMessageAction(deps, messageId)
    return
  }

  deps.updateMessageContent(messageId, trimmed)
  if (!chat) return

  if (shouldDeferChatAgentTurn(chat.id)) {
    markPendingAgentReply(chat.id)
    return
  }

  await deps.runAssistantReply(chat.id)
}

export async function submitEditedUserMessageAction(
  deps: ChatAgentUserActionsDeps,
  messageId: string,
  content: string,
  attachments?: MessageAttachment[]
): Promise<SubmitEditedUserMessageResult> {
  const trimmed = content.trim()
  const editAttachments = attachments ?? []

  const chat = useChatsStore.getState().getActiveChat()
  const message = chat?.messages.find((m) => m.id === messageId)
  if (!chat || !message || message.role !== 'user') return
  if (!trimmed && editAttachments.length === 0) return

  const chatId = chat.id
  const snapshot = snapshotUserMessageEdit(chat.messages, messageId)
  if (!snapshot) return

  if (getOtherChatStreamBlocking(chatId)) {
    deps.setError(OTHER_CHAT_STREAM_MESSAGE, chatId)
    return
  }

  const rollbackEdit = (): SubmitEditedUserMessageResult => {
    const current = useChatsStore.getState().chats.find((c) => c.id === chatId)
    if (current) {
      useChatsStore
        .getState()
        .setChatMessages(chatId, restoreUserMessageEdit(current.messages, snapshot))
    }
    return { rollbackToEdit: messageId }
  }

  deps.stopAgent({ chatId })
  deps.updateUserMessageContent(
    messageId,
    trimmed,
    editAttachments.length > 0 ? editAttachments : undefined
  )
  deps.removeMessagesAfter(messageId, chatId)
  deps.setBlurAnimateMessageId(null)
  deps.setError(null, chatId)

  try {
    if (editAttachments.length > 0) {
      const preparedAttachments = await persistAttachments(editAttachments)
      deps.updateUserMessageContent(messageId, trimmed, preparedAttachments)
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Request failed'
    deps.setError(formatLlmError(msg), chatId)
    setPipelineStageForChat(chatId, 'idle')
    return rollbackEdit()
  }

  await deps.runAssistantReply(chatId)
  const err = useConversationStore.getState().error
  if (err && !isPlaybackOnlyConversationError(err)) {
    return rollbackEdit()
  }
}

export async function regenerateAssistantMessageAction(
  deps: ChatAgentUserActionsDeps,
  messageId: string
): Promise<void> {
  const chat = useChatsStore.getState().getActiveChat()
  const message = chat?.messages.find((m) => m.id === messageId)
  if (!chat || !message || (message.role !== 'assistant' && message.role !== 'thinking')) {
    return
  }

  const chatId = chat.id
  if (getOtherChatStreamBlocking(chatId)) {
    deps.setError(OTHER_CHAT_STREAM_MESSAGE, chatId)
    return
  }

  const removeFromId = findTurnTailRemoveId(chat.messages, messageId) ?? messageId

  deps.stopAgent({ chatId })
  deps.removeMessagesFrom(removeFromId)
  deps.setBlurAnimateMessageId(null)
  await deps.runAssistantReply(chatId)
}

export async function retryLastRequestAction(deps: ChatAgentUserActionsDeps): Promise<void> {
  const chat = useChatsStore.getState().getActiveChat()
  if (!chat || chat.messages.length === 0) return

  const chatId = chat.id
  if (getOtherChatStreamBlocking(chatId)) {
    deps.setError(OTHER_CHAT_STREAM_MESSAGE, chatId)
    return
  }

  deps.setError(null)
  deps.stopAgent({ chatId, force: true })
  const last = chat.messages[chat.messages.length - 1]

  if (last.role === 'user') {
    await deps.runAssistantReply(chatId)
    return
  }

  if (last.role === 'assistant' || last.role === 'thinking') {
    await regenerateAssistantMessageAction(deps, last.id)
  }
}
