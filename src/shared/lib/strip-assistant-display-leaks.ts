/** Invisible / format chars models use for citation highlights (break words in UI). */
const INVISIBLE_CHARS = /[\u200B-\u200D\uFEFF\u2060\u00AD\u200E\u200F\u180E]/g

export function stripInvisibleFormatChars(text: string): string {
  return text.replace(INVISIBLE_CHARS, '')
}

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

/** Provider / model safety-classifier boilerplate leaked into visible text. */
const SAFETY_RATING_BLOCK =
  /(?:^|\n)User Safety:\s*(?:safe|unsafe)\s*\nResponse Safety:\s*(?:safe|unsafe)\s*(?:\n|$)/gi

/** Standalone user safety line (Nemotron-style classifiers when no bot reply yet). */
const USER_SAFETY_LINE = /(?:^|\n)User Safety:\s*(?:safe|unsafe)\s*(?:\n|$)/gi

/** Corrupted safety prefix when stream chunks were coerced from undefined. */
const USER_SAFETY_UNDEFINED_TAIL =
  /(?:^|\n)User Safety:\s*(?:safe|unsafe)(?:\s*undefined)+\s*/gi

const AGENT_ANSWER_PREFIX = /^agent:\s*(?:#{1,6}\s*)?Answer:\s*/im

/** Collapsed Windows kernel IRP major function names (often split with invisible chars). */
const IRPMJ_COLLAPSED =
  /\bIRPMJ?R?(READ|WRITE|CREATE|CLOSE|DEVICE_CONTROL|SHUTDOWN|QUERY_INFORMATION|SET_INFORMATION|CLEANUP|POWER|SYSTEM_CONTROL|PNP|INTERNAL_DEVICE_CONTROL)\b/gi

function normalizeKernelConstantLeaks(text: string): string {
  return text.replace(IRPMJ_COLLAPSED, (_, op: string) => `IRP_MJ_${op.toUpperCase()}`)
}

function isCitationTitleLine(line: string): boolean {
  return /^\[[^\]\n]{2,200}\]$/.test(line.trim())
}

function isCitationUrlLine(line: string): boolean {
  return /^https?:\/\/\S+$/i.test(line.trim())
}

/** Isolated 1–2 letter lines left after citation span stripping (not normal prose). */
function isBrokenCitationFragment(line: string): boolean {
  const t = line.trim()
  if (!t) return false
  return t.length <= 2 && /\p{L}/u.test(t)
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

/** Stream-safe subset — no line-based citation cleanup (would eat split words). */
export function stripAssistantStreamDisplayLeaks(text: string): string {
  if (!text) return text

  let s = stripInvisibleFormatChars(text)
  s = normalizeKernelConstantLeaks(s)
  s = s.replace(/^User Safety:\s*(?:safe|unsafe)(?:\s*undefined)*/i, '')
  s = s.replace(USER_SAFETY_UNDEFINED_TAIL, '\n')
  s = s.replace(USER_SAFETY_LINE, '\n')
  s = s.replace(AGENT_ANSWER_PREFIX, '')
  return s
}

/** Remove tool XML, citations, and citation debris from visible assistant text. */
export function stripAssistantDisplayLeaks(text: string): string {
  if (!text) return text

  let s = stripInvisibleFormatChars(text)
  s = normalizeKernelConstantLeaks(s)
  s = s.replace(SAFETY_RATING_BLOCK, '\n')
  s = s.replace(USER_SAFETY_UNDEFINED_TAIL, '\n')
  s = s.replace(USER_SAFETY_LINE, '\n')
  s = s.replace(AGENT_ANSWER_PREFIX, '')
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
