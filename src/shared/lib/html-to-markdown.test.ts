// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { extractMarkdownFromHtml } from './html-to-markdown'

const SAMPLE = `<!DOCTYPE html><html><head><title>Weather</title></head><body>
<nav>Menu</nav>
<article><h1>Paris weather</h1><p>Today is sunny, 22°C.</p><p>Humidity 45%.</p></article>
<footer>Copyright</footer>
</body></html>`

describe('extractMarkdownFromHtml', () => {
  it('extracts article as markdown headings and paragraphs', async () => {
    const md = await extractMarkdownFromHtml(SAMPLE, 2000, 'https://example.com/weather')
    expect(md).toMatch(/Paris weather/i)
    expect(md).toMatch(/22/)
    expect(md).not.toMatch(/Copyright/)
    expect(md).not.toMatch(/Menu/)
  })

  it('respects max length with paragraph-aware trim', async () => {
    const long = `<html><body><article><p>${'word '.repeat(800)}</p></article></body></html>`
    const md = await extractMarkdownFromHtml(long, 400)
    expect(md.length).toBeLessThanOrEqual(420)
  })
})
