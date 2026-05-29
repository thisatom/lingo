/** Invisible / format chars models use for citation highlights (break words in UI). */
const INVISIBLE_CHARS = /[\u200B-\u200D\uFEFF\u2060\u00AD]/g

const WEB_SEARCH_RESPONSE_BLOCK =
  /<WebSearchResponse\b[^>]*>[\s\S]*?<\/WebSearchResponse>/gi

const WEB_SEARCH_RESPONSE_TAIL = /<WebSearchResponse\b[^>]*>[\s\S]*$/gi

const WEB_SEARCH_TAG = /<\/?WebSearchResponse\b[^>]*>/gi

const SEARCH_TOOL_ENTRY =
  /<title>\s*[\s\S]*?<\/title>\s*<url>\s*[\s\S]*?<\/url>(?:\s*(?:<snippet>[\s\S]*?(?:<\/snippet>)?|Looking[\s\S]*?(?:<\/snippet>)?))?/gi

const LONE_TOOL_TAGS = /<\/?(?:title|url|snippet)\b[^>]*>/gi

const PERPLEXITY_CITE = /【[^】\n]+】/g

const INDENTED_TOOL_BLOCK =
  /(?:^|\n)(?:[ \t]*<(?:title|url|snippet)>[\s\S]*?)(?=\n\n|\n[^\s<]|$)/gi

const TOOL_PLANNING_PREAMBLE =
  /(?:^|\n)I(?:'|’)ll search for[\s\S]{0,240}\.\s*(?=\n\s*<(?:title|WebSearchResponse))/gi

function isCitationTitleLine(line: string): boolean {
  return /^\[[^\]\n]{2,200}\]$/.test(line.trim())
}

function isCitationUrlLine(line: string): boolean {
  return /^https?:\/\/\S+$/i.test(line.trim())
}

/** Single-letter lines or tiny fragments left after citation span stripping. */
function isBrokenCitationFragment(line: string): boolean {
  const t = line.trim()
  if (!t) return false
  if (t.length <= 2 && /\p{L}/u.test(t)) return true
  if (t.length > 32) return false
  const words = t.split(/\s+/).filter(Boolean)
  if (words.length >= 2 && words.every((w) => w.length <= 3)) return true
  return false
}

function stripBracketCitationBlocks(text: string): string {
  const lines = text.split('\n')
  const out: string[] = []

  for (let i = 0; i < lines.length; ) {
    if (isCitationTitleLine(lines[i])) {
      i++
      while (
        i < lines.length &&
        (isCitationUrlLine(lines[i]) || isBrokenCitationFragment(lines[i]))
      ) {
        i++
      }
      continue
    }
    if (isBrokenCitationFragment(lines[i])) {
      i++
      continue
    }
    out.push(lines[i])
    i++
  }

  return out.join('\n')
}

function stripFencedToolBlocks(text: string): string {
  return text.replace(/(?:^|\n)```[^\n]*\n([\s\S]*?)```/gi, (match, body: string) => {
    if (/<(?:title|url|snippet|WebSearchResponse)\b/i.test(body)) return '\n'
    const trimmed = body.trim()
    if (!trimmed) return '\n'
    return match
  })
}

/** Remove empty or prose-only fences left after tool XML was stripped from inside. */
function stripOrphanFencedBlocks(text: string): string {
  return text.replace(/(?:^|\n)```[^\n]*\n([\s\S]*?)```/gi, (match, body: string) => {
    const trimmed = body.trim()
    if (!trimmed) return '\n'
    if (/<\/?(?:snippet|title|url|WebSearchResponse)\b/i.test(trimmed)) return '\n'
    const looksLikeCode = /[{[\]}();=]|^\s*(?:const |function |import |def |class |#include)/m.test(
      trimmed
    )
    if (!looksLikeCode && trimmed.length < 400) return '\n'
    return match
  })
}

function stripOrphanCitationUrls(text: string): string {
  return text
    .split('\n')
    .filter((line) => !isCitationUrlLine(line))
    .join('\n')
}

/** Remove tool XML, citations, and citation debris from visible assistant text. */
export function stripAssistantDisplayLeaks(text: string): string {
  if (!text) return text

  let s = text.replace(INVISIBLE_CHARS, '')
  s = s.replace(TOOL_PLANNING_PREAMBLE, '\n')
  s = stripFencedToolBlocks(s)
  s = s.replace(WEB_SEARCH_RESPONSE_BLOCK, '')
  s = s.replace(WEB_SEARCH_RESPONSE_TAIL, '')
  s = s.replace(WEB_SEARCH_TAG, '')
  s = s.replace(SEARCH_TOOL_ENTRY, '')
  s = s.replace(INDENTED_TOOL_BLOCK, '')
  s = s.replace(LONE_TOOL_TAGS, '')
  s = stripFencedToolBlocks(s)
  s = stripOrphanFencedBlocks(s)
  s = s.replace(PERPLEXITY_CITE, '')
  s = stripBracketCitationBlocks(s)
  s = stripOrphanCitationUrls(s)
  s = s.replace(/\n{3,}/g, '\n\n')
  return s
}
