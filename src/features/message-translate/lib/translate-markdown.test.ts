import { describe, expect, it, vi } from 'vitest'
import { translateMarkdownPreservingStructure } from './translate-markdown'

describe('translateMarkdownPreservingStructure', () => {
  it('keeps headings, emphasis, lists, and code fences', async () => {
    const source = [
      '## Hello **world**',
      '',
      '- first item',
      '- second item',
      '',
      '```ts',
      'const x = 1',
      '```',
      '',
      'Visit [Docs](https://example.com) for more.'
    ].join('\n')

    const translate = vi.fn(async (text: string) => {
      const map: Record<string, string> = {
        Hello: 'Привет',
        world: 'мир',
        'first item': 'первый пункт',
        'second item': 'второй пункт',
        Docs: 'Документация',
        'for more.': 'подробнее.'
      }
      return map[text.trim()] ?? text
    })

    const result = await translateMarkdownPreservingStructure(source, translate)

    expect(result).toContain('##')
    expect(result).toContain('**')
    expect(result).toContain('Привет')
    expect(result).toContain('мир')
    expect(result).toContain('- ')
    expect(result).toContain('первый пункт')
    expect(result).toContain('```ts')
    expect(result).toContain('const x = 1')
    expect(result).toContain('[Документация](https://example.com)')
    expect(result).not.toContain('Hello')
  })

  it('keeps GFM table structure', async () => {
    const source = '| Name | Value |\n| --- | --- |\n| Hello | **42** |'
    const translate = vi.fn(async (text: string) => {
      const map: Record<string, string> = {
        Name: 'Имя',
        Value: 'Значение',
        Hello: 'Привет',
        '42': '42'
      }
      return map[text.trim()] ?? text
    })

    const result = await translateMarkdownPreservingStructure(source, translate)

    expect(result).toContain('|')
    expect(result).toContain('---')
    expect(result).toContain('Имя')
    expect(result).toContain('Привет')
    expect(result).toContain('**')
  })

  it('leaves math segments unchanged', async () => {
    const source = 'Inline \\(x^2\\) and block:\n\n$$\\frac{a}{b}$$'
    const translate = vi.fn(async (text: string) => `<<${text}>>`)

    const result = await translateMarkdownPreservingStructure(source, translate)

    expect(result).toContain('$x^2$')
    expect(result).toContain('\\frac{a}{b}')
    expect(result).not.toContain('<<x^2>>')
    expect(result).not.toContain('<<\\frac{a}{b}>>')
  })
})
