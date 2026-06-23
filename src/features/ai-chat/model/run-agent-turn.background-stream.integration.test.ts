import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CHAT_PERSIST_KEY } from '@/entities/chat/lib/chat-persist-storage'
import { useChatsStore } from '@/entities/chat/model/store'
import { useConversationStore } from '@/entities/conversation/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'
import { getBackgroundStreamChatId } from '@/features/ai-chat/lib/agent-stream-session'
import {
  patchChatPipeline,
  syncPipelineUiForActiveChat
} from '@/features/ai-chat/lib/chat-pipeline-registry'
import type { AgentTurnSession } from '@/features/ai-chat/model/run-agent-turn'

const chatA = 'chat-a-stream'
const chatB = 'chat-b-view'

const agentRunState = vi.hoisted(() => ({
  generation: 0
}))

let releaseStream: (() => void) | null = null

const streamMock = vi.hoisted(() =>
  vi.fn(
    (
      _request: unknown,
      handlers: {
        onTextDelta?: (e: { text: string }) => void
        onDone?: (e: { text: string }) => void
      }
    ) => {
      handlers.onTextDelta?.({ text: 'Partial from A' })
      return {
        abort: vi.fn(),
        done: new Promise<void>((resolve) => {
          releaseStream = resolve
        }).then(() => {
          handlers.onDone?.({ text: 'Partial from A' })
        })
      }
    }
  )
)

vi.mock('@/features/ai-chat/model/agent-run', () => ({
  beginAgentRun: () => {
    agentRunState.generation += 1
    return agentRunState.generation
  },
  cancelAgentRun: () => {
    agentRunState.generation += 1
    return agentRunState.generation
  },
  isAgentRunActive: (runId: number) => runId === agentRunState.generation,
  resetAgentRunGeneration: () => {
    agentRunState.generation = 0
  },
  getAgentRunGeneration: () => agentRunState.generation
}))

vi.mock('@/shared/lib/lingo', () => ({
  isLingoAvailable: () => true,
  getLingo: () => ({
    secrets: { getStatus: async () => ({ isSet: true }) },
    chat: { stream: (...args: Parameters<typeof streamMock>) => streamMock(...args) }
  })
}))

vi.mock('@/features/ai-chat/lib/chat-api-history', () => ({
  getHistoryForApi: async () => [{ role: 'user', content: 'Hello A' }]
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

describe.sequential('runAgentTurn background stream (integration)', () => {
  beforeEach(() => {
    vi.stubGlobal('location', { ...globalThis.location, hash: '#/' })
    vi.stubGlobal('window', { location: globalThis.location } as unknown as Window)
    vi.stubGlobal('localStorage', createLocalStorageMock())
    localStorage.removeItem(CHAT_PERSIST_KEY)
    agentRunState.generation = 0
    releaseStream = null
    streamMock.mockClear()
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', () => undefined)

    useChatsStore.setState({
      chats: [
        {
          id: chatA,
          title: 'A',
          messages: [{ id: 'u-a', role: 'user', content: 'Hello A', createdAt: 0 }],
          createdAt: 0,
          updatedAt: 0
        },
        {
          id: chatB,
          title: 'B',
          messages: [{ id: 'u-b', role: 'user', content: 'Hello B', createdAt: 0 }],
          createdAt: 0,
          updatedAt: 0
        }
      ],
      activeChatId: chatA
    })
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

  it('keeps chat A streaming after switching active chat to B', async () => {
    const { runAgentTurn } = await import('@/features/ai-chat/model/run-agent-turn')
    const session = createTestSession()

    const turnPromise = runAgentTurn({
      targetChatId: chatA,
      session,
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

    await Promise.resolve()
    await Promise.resolve()

    expect(streamMock).toHaveBeenCalledOnce()
    expect(session.getStreamTargetChatId()).toBe(chatA)

    patchChatPipeline(chatB, { stage: 'idle' })
    useChatsStore.getState().selectChat(chatB)
    syncPipelineUiForActiveChat()

    expect(getBackgroundStreamChatId(chatB)).toBe(chatA)
    expect(useConversationStore.getState().stage).toBe('idle')
    expect(session.getStreamTargetChatId()).toBe(chatA)

    releaseStream?.()
    const ok = await turnPromise
    expect(ok).toBe(true)

    const messagesA =
      useChatsStore.getState().chats.find((c) => c.id === chatA)?.messages ?? []
    expect(messagesA.some((m) => m.role === 'assistant' && m.content.includes('Partial'))).toBe(
      true
    )
  })
})
