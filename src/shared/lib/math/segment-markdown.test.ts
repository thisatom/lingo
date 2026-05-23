import { describe, expect, it } from 'vitest'
import { segmentMarkdown } from '@/shared/lib/math/segment-markdown'

describe('segmentMarkdown', () => {
  it('parses \\( ... \\) inline chemistry potentials', () => {
    const input =
      'стандартный потенциал \\(E^\\circ_{Zn^{2+}/Zn} = -0,76\\) В\nCu²⁺(0,10 М) | Cu(s)'
    const segments = segmentMarkdown(input)
    const math = segments.filter((s) => s.type === 'math-inline' || s.type === 'math-display')
    expect(math.length).toBeGreaterThan(0)
    expect(math[0]?.type).toBe('math-inline')
    expect(math[0]?.content).toContain('E^\\circ')
  })

  it('parses doubled backslash delimiters from escaped model output', () => {
    const input = '\\\\(E^\\\\circ_{x} = 1\\\\)'
    const segments = segmentMarkdown(input)
    expect(segments.some((s) => s.type === 'math-inline')).toBe(true)
  })

  it('parses bare E^\\circ_{...} without \\( delimiters', () => {
    const input = 'стандартный потенциал E^\\circ_{Zn^{2+}/Zn} = -0,76 В'
    const segments = segmentMarkdown(input)
    expect(segments.some((s) => s.type === 'math-inline')).toBe(true)
  })

  it('parses unclosed \\( before stream completes', () => {
    const input = 'потенциал \\(E^\\circ_{Zn^{2+}/Zn} = -0,76'
    const segments = segmentMarkdown(input)
    expect(segments.some((s) => s.type === 'math-inline')).toBe(true)
  })
})
