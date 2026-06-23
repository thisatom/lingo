import { describe, expect, it } from 'vitest'
import { isChatId, parseChatIdFromInput } from '@/features/chat/lib/parse-chat-id'

describe('parseChatIdFromInput', () => {
  it('accepts plain chat ids', () => {
    const id = 'chat-1779889864157-neg5db'
    expect(isChatId(id)).toBe(true)
    expect(parseChatIdFromInput(id)).toBe(id)
  })

  it('extracts id from hash routes and urls', () => {
    const id = 'chat-1779889864157-neg5db'
    expect(parseChatIdFromInput(`/#/c/${id}`)).toBe(id)
    expect(parseChatIdFromInput(`http://localhost:5173/#/c/${id}`)).toBe(id)
  })

  it('returns null for unrelated text', () => {
    expect(parseChatIdFromInput('hello')).toBeNull()
    expect(parseChatIdFromInput('')).toBeNull()
  })
})
