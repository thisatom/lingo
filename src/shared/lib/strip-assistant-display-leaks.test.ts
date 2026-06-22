import { describe, expect, it } from 'vitest'
import { stripAssistantDisplayLeaks } from './strip-assistant-display-leaks'
import { stripAssistantRoleMarkup } from './strip-assistant-role-markup'

describe('stripAssistantDisplayLeaks', () => {
  it('removes zero-width chars between letters', () => {
    const broken = 't\u200bhe E\u200bxplorer'
    expect(stripAssistantDisplayLeaks(broken)).toBe('the Explorer')
  })

  it('removes bracket citation headers and following URLs', () => {
    const raw = `[Dora the Explorer – Wikipedia (English)]
https://en.wikipedia.org/wiki/Dora
In the Russian version the character is called Dora.`
    expect(stripAssistantDisplayLeaks(raw)).toBe(
      'In the Russian version the character is called Dora.'
    )
  })

  it('removes WebSearchResponse tool XML blocks', () => {
    const raw = `Answer text here.

<WebSearchResponse>
<title>fakemink - New Album</title>
<url>https://example.com/a</url>
<snippet>Album info.</snippet>
</WebSearchResponse>`
    expect(stripAssistantDisplayLeaks(raw).trim()).toBe('Answer text here.')
  })

  it('removes fenced code blocks with tool markup', () => {
    const raw = `Summary.

\`\`\`
<title>fakemink - New Album Release Information</title>
<url>https://example.com/fakemink-album</url>
<snippet>Latest album info.</snippet>
\`\`\``
    expect(stripAssistantDisplayLeaks(raw).trim()).toBe('Summary.')
  })

  it('keeps short standalone prose lines (only strips them after citation blocks)', () => {
    expect(stripAssistantDisplayLeaks('а')).toBe('а')
    expect(stripAssistantDisplayLeaks('OK')).toBe('OK')
    expect(stripAssistantDisplayLeaks('да нет')).toBe('да нет')
  })

  it('removes citation debris lines after bracket titles', () => {
    const raw = `[Broken title]
ti
https://example.com
Real answer line.`
    expect(stripAssistantDisplayLeaks(raw).trim()).toBe('Real answer line.')
  })

  it('preserves Russian prose', () => {
    const raw = `Привет! Чем могу помочь?

В Санкт-Петербурге центральное время совпадает с Москвой — около 19:52:17, что соответствует UTC+3. Это для общения с соседями и местными жителями.`
    expect(stripAssistantDisplayLeaks(raw)).toBe(raw)
  })

  it('removes provider safety rating boilerplate', () => {
    const raw = `User Safety: safe
Response Safety: safe

Привет! У меня всё хорошо.`
    expect(stripAssistantDisplayLeaks(raw).trim()).toBe('Привет! У меня всё хорошо.')
  })

  it('removes agent answer template prefix', () => {
    expect(stripAssistantDisplayLeaks('agent: ### Answer: Hello there.')).toBe('Hello there.')
  })

  it('removes search preamble before tool XML', () => {
    const raw = `I'll search for information about fakemink's recent album releases.

<title>Album</title>
<url>https://example.com</url>`
    expect(stripAssistantDisplayLeaks(raw)).not.toContain('search for')
    expect(stripAssistantDisplayLeaks(raw)).not.toContain('<title>')
  })
})

describe('stripAssistantRoleMarkup integration', () => {
  it('strips role tags and display leaks together', () => {
    const raw = `<assistant>
[t\u200bitle]
https://example.com

Hello</assistant>`
    expect(stripAssistantRoleMarkup(raw).trim()).toBe('Hello')
  })
})
