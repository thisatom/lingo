import { Readability } from '@mozilla/readability'
import TurndownService from 'turndown'

function createTurndown(): TurndownService {
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-'
  })
  td.remove(['script', 'style', 'nav', 'footer', 'aside', 'iframe', 'noscript'])
  return td
}

function trimMarkdown(markdown: string, maxChars: number): string {
  const text = markdown.replace(/\r\n/g, '\n').trim()
  if (text.length <= maxChars) return text
  const cut = text.slice(0, maxChars)
  const lastBreak = cut.lastIndexOf('\n\n')
  if (lastBreak > maxChars * 0.55) {
    return `${cut.slice(0, lastBreak).trim()}\n\n…`
  }
  return `${cut.trim()}…`
}

function readabilityMarkdown(document: Document, turndown: TurndownService): string {
  const article = new Readability(document.cloneNode(true) as Document).parse()
  const html = article?.content?.trim()
  if (html && html.replace(/<[^>]+>/g, '').trim().length >= 80) {
    return turndown.turndown(html)
  }
  const body = document.body?.innerHTML?.trim()
  if (body) return turndown.turndown(body)
  return turndown.turndown(document.documentElement?.innerHTML ?? '')
}

function markdownFromBrowserHtml(html: string, maxChars: number, pageUrl?: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  if (pageUrl) {
    const base = doc.createElement('base')
    base.href = pageUrl
    doc.head?.appendChild(base)
  }
  const md = readabilityMarkdown(doc, createTurndown())
  return trimMarkdown(md, maxChars)
}

async function markdownFromNodeHtml(html: string, maxChars: number, pageUrl?: string): Promise<string> {
  const { JSDOM } = await import('jsdom')
  const dom = new JSDOM(html, { url: pageUrl ?? 'https://example.com/' })
  const md = readabilityMarkdown(dom.window.document, createTurndown())
  return trimMarkdown(md, maxChars)
}

/**
 * HTML → LLM-friendly Markdown (Readability article extract + Turndown).
 * Works in browser (DOMParser) and Node/Electron main (jsdom).
 */
export async function extractMarkdownFromHtml(
  html: string,
  maxChars = 4000,
  pageUrl?: string
): Promise<string> {
  const withoutNoise = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')

  let markdown: string
  if (typeof DOMParser !== 'undefined') {
    markdown = markdownFromBrowserHtml(withoutNoise, maxChars, pageUrl)
  } else {
    markdown = await markdownFromNodeHtml(withoutNoise, maxChars, pageUrl)
  }

  return markdown.trim()
}
