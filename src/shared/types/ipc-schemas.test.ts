import { describe, expect, it } from 'vitest'
import {
  IpcValidationError,
  parseChatStreamRequest,
  parseDroppedFilePaths,
  parseLinkPreviewUrl,
  parseStreamChannel,
  parseSttTranscribeRequest
} from './ipc-schemas'
import { MAX_DROPPED_PATHS_IPC } from '@/shared/config/attachments'

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

  it('accepts dropped file paths up to IPC batch guard', () => {
    const paths = Array.from({ length: MAX_DROPPED_PATHS_IPC }, (_, i) => `/tmp/file-${i}.txt`)
    expect(parseDroppedFilePaths(paths)).toHaveLength(MAX_DROPPED_PATHS_IPC)
    expect(() =>
      parseDroppedFilePaths([...paths, '/tmp/extra.txt'])
    ).toThrow(IpcValidationError)
  })
})
