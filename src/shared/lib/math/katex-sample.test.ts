import katex from 'katex'
import { describe, expect, it } from 'vitest'
import { sanitizeAiLatex } from '@/shared/lib/math/latex'

describe('katex chemistry sample', () => {
  it('renders Zn/Cu potentials', () => {
    const raw = 'E^\\circ_{Zn^{2+}/Zn} = -0,76'
    const html = katex.renderToString(sanitizeAiLatex(raw), {
      displayMode: false,
      strict: 'ignore',
      throwOnError: false
    })
    expect(html).toContain('katex')
    expect(html).not.toContain('katex-error')
  })
})
