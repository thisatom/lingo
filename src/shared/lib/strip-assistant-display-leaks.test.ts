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

  it('removes single-letter lines as citation debris (assistant leak cleanup)', () => {
    expect(stripAssistantDisplayLeaks('а')).toBe('')
    expect(stripAssistantDisplayLeaks('OK')).toBe('')
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
