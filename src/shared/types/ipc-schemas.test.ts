import { describe, expect, it } from 'vitest'
import {
  IpcValidationError,
  parseChatStreamRequest,
  parseLinkPreviewUrl,
  parseStreamChannel,
  parseSttTranscribeRequest
} from './ipc-schemas'

describe('ipc-schemas', () => {
  it('parses a minimal chat stream request', () => {
    const req = parseChatStreamRequest({
      messages: [{ role: 'user', content: 'hi' }]
    })
    expect(req.messages).toHaveLength(1)
  })

  it('rejects empty messages', () => {
    expect(() => parseChatStreamRequest({ messages: [] })).toThrow(IpcValidationError)
  })

  it('validates stream channel format', () => {
    expect(() => parseStreamChannel('evil-channel')).toThrow(IpcValidationError)
    expect(parseStreamChannel('lingo:chat:stream:550e8400-e29b-41d4-a716-446655440000')).toContain(
      'lingo:chat:stream:'
    )
  })

  it('rejects oversized link URLs', () => {
    expect(() => parseLinkPreviewUrl('a'.repeat(9000))).toThrow(IpcValidationError)
  })

  it('parses STT payload', () => {
    const req = parseSttTranscribeRequest({
      audioBase64: 'abc',
      format: 'wav'
    })
    expect(req.format).toBe('wav')
  })
})
