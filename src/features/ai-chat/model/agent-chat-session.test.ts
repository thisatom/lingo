import { describe, expect, it } from 'vitest'
import {
  buildAgentStopContext,
  buildAgentTurnSession
} from '@/features/ai-chat/model/agent-chat-session'

describe('agent-chat-session', () => {
  it('buildAgentTurnSession wires refs for stream controller', () => {
    const streamControllerRef = { current: null as { abort: () => void } | null }
    const streamTargetChatIdRef = { current: null as string | null }
    const streamingTtsRef = { current: null }
    let streamActive = false

    const session = buildAgentTurnSession({
      streamControllerRef,
      streamTargetChatIdRef,
      streamingTtsRef,
      setStreamActive: (active) => {
        streamActive = active
      }
    })

    const controller = { abort: () => undefined }
    session.setStreamController(controller)
    session.setStreamTargetChatId('chat-1')
    session.setStreamActive(true)

    expect(session.getStreamController()).toBe(controller)
    expect(session.getStreamTargetChatId()).toBe('chat-1')
    expect(streamActive).toBe(true)
  })

  it('buildAgentStopContext mirrors session refs', () => {
    const streamControllerRef = { current: { abort: () => undefined } }
    const streamTargetChatIdRef = { current: 'chat-2' }
    const streamingTtsRef = { current: null }
    let blurred: string | null = 'x'
    let globalIdle = false

    const ctx = buildAgentStopContext(
      {
        streamControllerRef,
        streamTargetChatIdRef,
        streamingTtsRef,
        setStreamActive: () => undefined
      },
      {
        setBlurAnimateMessageId: (id) => {
          blurred = id
        },
        setGlobalStageIdle: () => {
          globalIdle = true
        }
      }
    )

    ctx.setBlurAnimateMessageId(null)
    ctx.setGlobalStageIdle()

    expect(ctx.streamController).toBe(streamControllerRef.current)
    expect(ctx.streamTargetChatId).toBe('chat-2')
    expect(blurred).toBeNull()
    expect(globalIdle).toBe(true)
  })
})
