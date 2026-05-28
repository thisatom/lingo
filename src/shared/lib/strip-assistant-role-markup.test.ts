import { describe, expect, it } from 'vitest'
import { stripAssistantRoleMarkup } from './strip-assistant-role-markup'

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
})
