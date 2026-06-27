import { describe, expect, it } from 'vitest'
import { classifyAgentIntent } from './intent-classifier'

describe('classifyAgentIntent', () => {
  it('forces search on explicit command when toggle is off', () => {
    const intent = classifyAgentIntent('search the web for mars news', false)
    expect(intent.forceWebSearch).toBe(true)
    expect(intent.needsWebSearch).toBe(true)
    expect(intent.searchQuery.length).toBeGreaterThan(0)
  })

  it('does not search when toggle is off and no explicit command', () => {
    const intent = classifyAgentIntent('hello how are you', false)
    expect(intent.needsWebSearch).toBe(false)
    expect(intent.forceWebSearch).toBe(false)
  })

  it('searches any non-empty message when toggle is on', () => {
    const intent = classifyAgentIntent('What is quantum computing?', true)
    expect(intent.needsWebSearch).toBe(true)
    expect(intent.forceWebSearch).toBe(false)

    const casual = classifyAgentIntent('hello how are you', true)
    expect(casual.needsWebSearch).toBe(true)
    expect(casual.forceWebSearch).toBe(false)
  })
})
