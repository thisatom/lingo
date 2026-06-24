import { describe, expect, it } from 'vitest'

import { classifyAgentIntent } from './intent-classifier'

describe('classifyAgentIntent', () => {
  it('forces search for explicit web-search phrases', () => {
    const intent = classifyAgentIntent('search the web for mars news', false)
    expect(intent.forceWebSearch).toBe(true)
    expect(intent.needsWebSearch).toBe(true)
    expect(intent.searchQuery.length).toBeGreaterThan(0)
  })

  it('skips search for casual chat when toggle is off', () => {
    const intent = classifyAgentIntent('hello how are you', false)
    expect(intent.needsWebSearch).toBe(false)
  })

  it('detects factual questions when web search toggle is on', () => {
    const intent = classifyAgentIntent('What is quantum computing?', true)
    expect(intent.needsWebSearch).toBe(true)
  })
})
