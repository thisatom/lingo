import { beforeEach, describe, expect, it, vi } from 'vitest'

/** Isolated generation counter — parallel specs must not call real `cancelAgentRun`. */
const agentRunState = vi.hoisted(() => ({
  generation: 0,
  cancelAgentRunMock: vi.fn()
}))

vi.mock('@/features/ai-chat/model/agent-run', () => ({
  beginAgentRun: () => {
    agentRunState.generation += 1
    return agentRunState.generation
  },
  cancelAgentRun: () => {
    agentRunState.cancelAgentRunMock()
    agentRunState.generation += 1
    return agentRunState.generation
  },
  isAgentRunActive: (runId: number) => runId === agentRunState.generation,
  resetAgentRunGeneration: () => {
    agentRunState.generation = 0
    agentRunState.cancelAgentRunMock.mockClear()
  },
  getAgentRunGeneration: () => agentRunState.generation
}))

function createLocalStorageMock() {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    }
  }
}

function seedIntegrationChat(): void {
  useChatsStore.setState({
    chats: [
      {
        id: chatId,
        title: 'Test',
        messages: [
          {
            id: 'u1',
            role: 'user',
            content: 'Hello',
            createdAt: Date.now()
          }
        ],
        createdAt: 0,
        updatedAt: 0
      }
    ],
    activeChatId: chatId
  })
}

const chatId = 'integration-chat'

const streamMock = vi.fn(
  (
    _request: unknown,
    handlers: {
      onThinkingDelta?: (e: { text: string }) => void
      onTextDelta?: (e: { text: string }) => void
      onDone?: (e: { text: string }) => void
    }
  ) => {
    handlers.onThinkingDelta?.({ text: 'Reasoning step' })
    handlers.onTextDelta?.({ text: 'Assistant reply' })
    handlers.onDone?.({ text: 'Assistant reply' })
    return {
      abort: vi.fn(),
      done: Promise.resolve()
    }
  }
)

vi.mock('@/shared/lib/lingo', () => ({
  isLingoAvailable: () => true,
  getLingo: () => ({
    secrets: {
      getStatus: async () => ({ isSet: true })
    },
    chat: {
      stream: (...args: Parameters<typeof streamMock>) => streamMock(...args)
    }
  })
}))

vi.mock('@/features/ai-chat/lib/chat-api-history', () => ({
  getHistoryForApi: async () => [{ role: 'user', content: 'Hello' }]
}))

import { CHAT_PERSIST_KEY } from '@/entities/chat/lib/chat-persist-storage'
import { useChatsStore } from '@/entities/chat/model/store'
import { useConversationStore } from '@/entities/conversation/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'
import { getOtherChatStreamBlocking } from '@/features/ai-chat/lib/agent-stream-guard'
import { isChatAgentBusy } from '@/features/ai-chat/lib/chat-agent-busy'
import { getChatPipeline } from '@/features/ai-chat/lib/chat-pipeline-registry'
import { setAgentStreamSession } from '@/features/ai-chat/lib/agent-stream-session'
import {
  beginAgentRun,
  getAgentRunGeneration,
  resetAgentRunGeneration
} from '@/features/ai-chat/model/agent-run'
import type { AgentTurnSession } from '@/features/ai-chat/model/run-agent-turn'

function createTestSession(): AgentTurnSession {
  const state = {
    streamController: null as AgentTurnSession['getStreamController'] extends () => infer R
      ? R
      : null,
    streamTargetChatId: null as string | null,
    streamingTts: null as ReturnType<AgentTurnSession['getStreamingTts']>,
    streamActive: false
  }

  return {
    getStreamController: () => state.streamController,
    setStreamController: (c) => {
      state.streamController = c
    },
    getStreamTargetChatId: () => state.streamTargetChatId,
    setStreamTargetChatId: (id) => {
      state.streamTargetChatId = id
    },
    getStreamingTts: () => state.streamingTts,
    setStreamingTts: (tts) => {
      state.streamingTts = tts
    },
    setStreamActive: (active) => {
      state.streamActive = active
    }
  }
}

describe.sequential('runAgentTurn (integration)', () => {
  beforeEach(async () => {
    vi.stubGlobal('location', { ...globalThis.location, hash: '#/' })
    vi.stubGlobal('window', { location: globalThis.location } as unknown as Window)
    vi.stubGlobal('localStorage', createLocalStorageMock())
    localStorage.removeItem(CHAT_PERSIST_KEY)
    resetAgentRunGeneration()
    vi.clearAllMocks()
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', () => undefined)
    setAgentStreamSession(null, false)
    useChatsStore.getState().resetChats()
    seedIntegrationChat()
    useSettingsStore.setState({
      llmBackend: 'openrouter',
      modelId: 'openrouter/free',
      ttsEnabled: false,
      chatComposerMode: 'text',
      webSearchEnabled: false
    })
    useConversationStore.setState({
      stage: 'idle',
      error: null,
      pipelineThinkingText: '',
      pipelineSearchTargets: [],
      pipelineStreamingAnswer: false
    })
  })

  it('agent-run generation is isolated for this spec', () => {
    resetAgentRunGeneration()
    const runId = beginAgentRun()
    expect(runId).toBeGreaterThan(0)
  })

  it('creates thinking and assistant messages and returns to idle', async () => {
    expect(getOtherChatStreamBlocking(chatId)).toBeNull()
    resetAgentRunGeneration()
    seedIntegrationChat()
    expect(useChatsStore.getState().chats.some((c) => c.id === chatId)).toBe(true)
    const probeId = useChatsStore.getState().addMessage({ role: 'thinking', content: 'probe' }, chatId)
    expect(probeId, 'addMessage must resolve target chat').not.toBe('')
    useChatsStore.getState().removeMessage(probeId, chatId)

    const generationBefore = getAgentRunGeneration()
    const roleTimeline: string[] = []
    const unsub = useChatsStore.subscribe((state) => {
      const roles =
        state.chats.find((c) => c.id === chatId)?.messages.map((m) => m.role).join('+') ?? 'none'
      roleTimeline.push(roles)
    })
    const { runAgentTurn } = await import('@/features/ai-chat/model/run-agent-turn')

    const ok = await runAgentTurn({
      targetChatId: chatId,
      session: createTestSession(),
      practiceLanguage: 'en',
      chatComposerMode: 'text',
      setBlurAnimateMessageId: () => undefined,
      setError: (error) => useConversationStore.getState().setError(error),
      processNextInQueue: async () => undefined,
      tryRunPendingAgentReply: async () => false,
      agentRun: {
        beginAgentRun: () => {
          agentRunState.generation += 1
          return agentRunState.generation
        },
        isAgentRunActive: (runId) => runId === agentRunState.generation
      }
    })

    expect(streamMock).toHaveBeenCalledOnce()
    expect(agentRunState.cancelAgentRunMock).not.toHaveBeenCalled()
    const messages = useChatsStore.getState().chats.find((c) => c.id === chatId)?.messages ?? []
    unsub()
    expect(
      messages.some((m) => m.role === 'thinking' && m.content.includes('Reasoning')),
      `roles=${messages.map((m) => m.role).join('+')} contents=${messages.map((m) => JSON.stringify(m.content)).join('; ')} ok=${ok} err=${useConversationStore.getState().error}`
    ).toBe(true)
    expect(messages.some((m) => m.role === 'assistant' && m.content.includes('Assistant'))).toBe(
      true
    )
    expect(getChatPipeline(chatId).stage).toBe('idle')
    expect(isChatAgentBusy(chatId)).toBe(false)
    expect(
      ok,
      `ok=${ok} error=${useConversationStore.getState().error ?? 'none'} genBefore=${generationBefore} genAfter=${getAgentRunGeneration()} timeline=${roleTimeline.join(' | ')}`
    ).toBe(true)
  })
})
