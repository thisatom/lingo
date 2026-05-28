import { findOrphanAssistantTailIds } from '@/entities/chat/lib/prune-orphan-assistant-tail'
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
import {
  isPendingComposerChatId,
  PENDING_COMPOSER_CHAT_ID,
  PENDING_VOICE_MESSAGE_ID
} from '@/entities/chat/lib/pending-composer'
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

  const store = useChatsStore.getState()
  const chatId = store.activeChatId ?? store.ensureActiveChat()

  useConversationStore.getState().setSpeechError(null)

  if (shouldDeferChatAgentTurn(chatId)) {
    deps.enqueueUserMessage(trimmed, chatId, hasAttachments ? attachments : undefined)
    store.clearComposerDraft(chatId)
    if (hasAttachments) {
      store.clearComposerAttachments(chatId)
    }
    return
  }

  deps.stopAgent({ chatId })

  const chat = store.chats.find((c) => c.id === chatId)
  if (chat) {
    for (const messageId of findOrphanAssistantTailIds(chat.messages)) {
      store.removeMessage(messageId, chatId)
    }
  }

  deps.addMessage(
    {
      role: 'user',
      content: trimmed,
      attachments: hasAttachments ? attachments : undefined
    },
    chatId
  )
  store.clearComposerDraft(chatId)
  store.clearComposerAttachments(chatId)
  await deps.runAssistantReply(chatId)
}

export async function sendQueuedMessageNowAction(
  deps: ChatAgentUserActionsDeps,
  queueItemId: string
): Promise<void> {
  const chatId =
    useChatsStore.getState().activeChatId ?? useChatsStore.getState().ensureActiveChat()
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

function resolveExistingActiveChatId(): string | null {
  const { chats, activeChatId } = useChatsStore.getState()
  if (activeChatId && chats.some((c) => c.id === activeChatId)) {
    return activeChatId
  }
  return null
}

export function beginVoiceUserMessageAction(deps: ChatAgentUserActionsDeps): {
  messageId: string | null
  chatId: string
} {
  const chatId = resolveExistingActiveChatId()
  const guardChatId = chatId ?? PENDING_COMPOSER_CHAT_ID
  if (getOtherChatStreamBlocking(guardChatId)) {
    useConversationStore.getState().setSpeechError(OTHER_CHAT_STREAM_MESSAGE)
    return { messageId: null, chatId: guardChatId }
  }
  deps.stopAgent({ chatId: chatId ?? undefined, force: !chatId })
  useConversationStore.getState().setSpeechError(null)

  if (!chatId) {
    setActiveChatPipelineStage('listening')
    return { messageId: PENDING_VOICE_MESSAGE_ID, chatId: PENDING_COMPOSER_CHAT_ID }
  }

  const messageId = deps.addMessage({ role: 'user', content: '' }, chatId)
  return { messageId: messageId || null, chatId }
}

export function updateVoiceUserMessageAction(
  deps: ChatAgentUserActionsDeps,
  messageId: string,
  content: string,
  chatId: string
): void {
  if (isPendingComposerChatId(chatId)) {
    useChatsStore.getState().setComposerDraft(PENDING_COMPOSER_CHAT_ID, content)
    setActiveChatPipelineStage('listening')
    return
  }
  deps.updateMessageContent(messageId, content, chatId, { allowEmptyUser: true })
}

export function cancelVoiceUserMessageAction(
  deps: ChatAgentUserActionsDeps,
  messageId: string,
  chatId: string
): void {
  if (!messageId) return
  if (isPendingComposerChatId(chatId)) {
    useChatsStore.getState().setComposerDraft(PENDING_COMPOSER_CHAT_ID, '')
    setActiveChatPipelineStage('idle')
    return
  }
  deps.removeMessagesFrom(messageId, chatId)
  setPipelineStageForChat(chatId, 'idle')
}

export async function commitVoiceUserMessageAction(
  deps: ChatAgentUserActionsDeps,
  messageId: string,
  chatId: string
): Promise<string | null> {
  if (!messageId) return null

  if (isPendingComposerChatId(chatId)) {
    const trimmed = useChatsStore.getState().getComposerDraft(PENDING_COMPOSER_CHAT_ID).trim()
    if (!trimmed) {
      cancelVoiceUserMessageAction(deps, messageId, chatId)
      return null
    }

    const store = useChatsStore.getState()
    const realChatId = store.ensureActiveChat()
    store.clearComposerDraft(realChatId)

    if (shouldDeferChatAgentTurn(realChatId)) {
      markPendingAgentReply(realChatId)
      deps.addMessage({ role: 'user', content: trimmed }, realChatId)
      return realChatId
    }

    deps.stopAgent({ chatId: realChatId })
    deps.addMessage({ role: 'user', content: trimmed }, realChatId)
    await deps.runAssistantReply(realChatId)
    return realChatId
  }

  const chat = useChatsStore.getState().chats.find((c) => c.id === chatId)
  const message = chat?.messages.find((m) => m.id === messageId)
  const trimmed = message?.content.trim() ?? ''

  if (!trimmed) {
    cancelVoiceUserMessageAction(deps, messageId, chatId)
    return null
  }

  deps.updateMessageContent(messageId, trimmed, chatId)
  if (!chat) return null

  if (shouldDeferChatAgentTurn(chatId)) {
    markPendingAgentReply(chatId)
    return chatId
  }

  await deps.runAssistantReply(chatId)
  return chatId
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

  const chatBeforeEdit = useChatsStore.getState().chats.find((c) => c.id === chatId)
  if (chatBeforeEdit) {
    for (const orphanId of findOrphanAssistantTailIds(chatBeforeEdit.messages)) {
      useChatsStore.getState().removeMessage(orphanId, chatId)
    }
  }

  deps.updateUserMessageContent(messageId, trimmed, editAttachments)
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
  deps.removeMessagesFrom(removeFromId, chatId)
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
