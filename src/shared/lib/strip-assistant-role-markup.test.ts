import { describe, expect, it } from 'vitest'
import {
  stripAssistantRoleMarkup,
  stripAssistantStreamSafeMarkup
} from './strip-assistant-role-markup'

describe('stripAssistantRoleMarkup', () => {
  it('removes assistant closing tags', () => {
    expect(stripAssistantRoleMarkup('Ответ модели.\n</assistant>')).toBe('Ответ модели.\n')
  })

  it('removes paired role tags', () => {
    expect(stripAssistantRoleMarkup('<assistant>\nHello</assistant>')).toBe('\nHello')
  })

  it('removes ChatML role markers', () => {
    expect(stripAssistantRoleMarkup('<|im_start|>assistant\nHello\n')).toBe('Hello\n')
  })
  it('removes underline html tags without eating letters', () => {
    expect(stripAssistantRoleMarkup('<u>П</u>ривет')).toBe('Привет')
    expect(stripAssistantRoleMarkup('Hello </underline>world')).toBe('Hello world')
  })
})

describe('stripAssistantStreamSafeMarkup', () => {
  it('hides partial closing tags at stream tail', () => {
    expect(stripAssistantStreamSafeMarkup('Привет</u')).toBe('Привет')
    expect(stripAssistantStreamSafeMarkup('Привет</u>')).toBe('Привет')
  })
  it('does not drop partial lines while tokens arrive', () => {
    const chunks = ['П', 'р', 'ивет', '!\n\n', 'П', 'етербург']
    let raw = ''
    let display = ''
    for (const chunk of chunks) {
      raw += chunk
      display = stripAssistantStreamSafeMarkup(raw)
    }
    expect(display).toBe('Привет!\n\nПетербург')
    expect(stripAssistantRoleMarkup(raw)).toBe('Привет!\n\nПетербург')
  })

  it('survives a newline between streamed syllables', () => {
    const chunks = ['П', '\n', 'ривет!']
    let raw = ''
    for (const chunk of chunks) {
      raw += chunk
    }
    expect(stripAssistantStreamSafeMarkup(raw)).toBe('П\nривет!')
    expect(stripAssistantRoleMarkup(raw)).toBe('П\nривет!')
  })

  it('keeps partial code fences during streaming', () => {
    const partial = 'Example:\n```typescript\nconst answer = '
    expect(stripAssistantStreamSafeMarkup(partial)).toBe(partial)
  })
})
