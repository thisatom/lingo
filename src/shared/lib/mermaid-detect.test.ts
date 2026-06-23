import { describe, expect, it } from 'vitest'
import { looksLikeMermaidSource, unwrapMermaidFence } from '@/shared/lib/mermaid-detect'

describe('looksLikeMermaidSource', () => {
  it('detects flowchart without fence', () => {
    expect(
      looksLikeMermaidSource(`graph TD;
    A-->B;
    A-->C;`)
    ).toBe(true)
  })

  it('detects fenced mermaid body', () => {
    expect(
      looksLikeMermaidSource('```mermaid\nsequenceDiagram\nAlice->>Bob: hi\n```')
    ).toBe(true)
  })

  it('rejects plain javascript', () => {
    expect(looksLikeMermaidSource('const x = 1')).toBe(false)
  })
})

describe('unwrapMermaidFence', () => {
  it('unwraps fenced block', () => {
    expect(unwrapMermaidFence('```\ngraph TD\nA-->B\n```')).toBe('graph TD\nA-->B')
  })
})
