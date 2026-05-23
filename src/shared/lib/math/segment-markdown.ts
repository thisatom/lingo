import { isDisplayMath, looksLikeLatex } from '@/shared/lib/math/latex'
import { normalizeMathDelimiters } from '@/shared/lib/math/normalize-math-delimiters'

export type MarkdownSegment =
  | { type: 'text'; content: string }
  | { type: 'math-display'; content: string }
  | { type: 'math-inline'; content: string }
  | { type: 'code'; content: string }

export function segmentMarkdown(input: string): MarkdownSegment[] {
  const chunks = splitByFencedCode(normalizeMathDelimiters(input))
  const segments: MarkdownSegment[] = []

  for (const chunk of chunks) {
    if (chunk.fenced) {
      segments.push({ type: 'code', content: chunk.text })
    } else {
      segments.push(...segmentProse(chunk.text))
    }
  }

  return mergeAdjacent(segments)
}

type FenceChunk = { text: string; fenced: boolean }

function splitByFencedCode(content: string): FenceChunk[] {
  const segments: FenceChunk[] = []
  const re = /(```[\s\S]*?```|~~~[\s\S]*?~~~)/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(content)) !== null) {
    if (match.index > last) {
      segments.push({ text: content.slice(last, match.index), fenced: false })
    }
    segments.push({ text: match[0], fenced: true })
    last = match.index + match[0].length
  }

  if (last < content.length) {
    segments.push({ text: content.slice(last), fenced: false })
  }

  return segments.length > 0 ? segments : [{ text: content, fenced: false }]
}

function mergeAdjacent(segments: MarkdownSegment[]): MarkdownSegment[] {
  const out: MarkdownSegment[] = []
  for (const seg of segments) {
    const prev = out[out.length - 1]
    if (prev?.type === 'text' && seg.type === 'text') {
      prev.content += seg.content
    } else {
      out.push({ ...seg })
    }
  }
  return out
}

function readDelimited(
  text: string,
  start: number,
  open: string,
  close: string
): { inner: string; end: number } | null {
  if (!text.startsWith(open, start)) return null
  const from = start + open.length
  const idx = text.indexOf(close, from)
  if (idx === -1) return null
  return { inner: text.slice(from, idx), end: idx + close.length }
}

function readUnclosedParenMath(
  text: string,
  start: number
): { inner: string; end: number } | null {
  if (!text.startsWith('\\(', start)) return null
  const from = start + 2
  const closeIdx = text.indexOf('\\)', from)
  const end = closeIdx === -1 ? text.length : closeIdx
  const inner = text.slice(from, end).trim()
  if (!inner || !looksLikeLatex(inner)) return null
  return { inner, end: closeIdx === -1 ? text.length : closeIdx + 2 }
}

function tryBareLatexAt(text: string, pos: number): { inner: string; end: number } | null {
  if (pos > 0) {
    const prev = text[pos - 1]
    if (/[A-Za-z0-9\\)\]}_]/.test(prev)) return null
  }

  const rest = text.slice(pos)
  const match = rest.match(
    /^([A-Za-z](?:(?:\^|_)(?:\\[a-zA-Z]+|\{[^}]*\}|[A-Za-z0-9+\-/]+))+)(?:\s*[=<>±+\-]\s*[-+0-9.,\u202f\s]+)?/
  )
  if (!match) return null

  const inner = match[0].trimEnd()
  if (!looksLikeLatex(inner) || !/\\[a-zA-Z]+/.test(inner)) return null
  return { inner, end: pos + match[0].length }
}

function segmentProse(text: string): MarkdownSegment[] {
  const out: MarkdownSegment[] = []
  let pos = 0
  let textBuf = ''

  const flushText = () => {
    if (textBuf) {
      out.push({ type: 'text', content: textBuf })
      textBuf = ''
    }
  }

  const pushMath = (inner: string) => {
    const trimmed = inner.trim()
    if (!trimmed || !looksLikeLatex(trimmed)) {
      textBuf += inner
      return
    }
    flushText()
    out.push({
      type: isDisplayMath(trimmed) ? 'math-display' : 'math-inline',
      content: trimmed
    })
  }

  while (pos < text.length) {
    if (isLineStart(text, pos)) {
      const bracket = tryLineBracketBlock(text, pos)
      if (bracket) {
        flushText()
        pushMath(bracket.inner)
        pos = bracket.end
        continue
      }
    }

    if (text.startsWith('$$', pos)) {
      const block = readDelimited(text, pos, '$$', '$$')
      if (block) {
        flushText()
        pushMath(block.inner)
        pos = block.end
        continue
      }
    }

    if (text.startsWith('\\[', pos)) {
      const block = readDelimited(text, pos, '\\[', '\\]')
      if (block) {
        flushText()
        pushMath(block.inner)
        pos = block.end
        continue
      }
    }

    if (text.startsWith('\\(', pos)) {
      const block = readDelimited(text, pos, '\\(', '\\)')
      if (block) {
        flushText()
        out.push({ type: 'math-inline', content: block.inner.trim() })
        pos = block.end
        continue
      }
      const open = readUnclosedParenMath(text, pos)
      if (open) {
        flushText()
        out.push({ type: 'math-inline', content: open.inner.trim() })
        pos = open.end
        continue
      }
    }

    const bare = tryBareLatexAt(text, pos)
    if (bare) {
      flushText()
      out.push({
        type: isDisplayMath(bare.inner) ? 'math-display' : 'math-inline',
        content: bare.inner.trim()
      })
      pos = bare.end
      continue
    }

    if (text[pos] === '$' && text[pos + 1] !== '$') {
      const block = readSingleDollar(text, pos)
      if (block) {
        flushText()
        out.push({ type: 'math-inline', content: block.inner.trim() })
        pos = block.end
        continue
      }
    }

    if (text[pos] === '[') {
      const single = trySameLineBracket(text, pos)
      if (single) {
        flushText()
        pushMath(single.inner)
        pos = single.end
        continue
      }
    }

    if (text[pos] === '(' && canStartParenMath(text, pos)) {
      const balanced = readBalancedParen(text, pos)
      if (balanced && looksLikeLatex(balanced.inner)) {
        flushText()
        out.push({
          type: isDisplayMath(balanced.inner) ? 'math-display' : 'math-inline',
          content: balanced.inner.trim()
        })
        pos = balanced.end
        continue
      }
    }

    textBuf += text[pos]
    pos++
  }

  flushText()
  return out
}

function isLineStart(text: string, pos: number): boolean {
  return pos === 0 || text[pos - 1] === '\n'
}

function readSingleDollar(text: string, start: number): { inner: string; end: number } | null {
  if (text[start] !== '$') return null
  let i = start + 1
  while (i < text.length) {
    if (text[i] === '\\' && i + 1 < text.length) {
      i += 2
      continue
    }
    if (text[i] === '$') {
      const inner = text.slice(start + 1, i)
      if (inner.trim() && looksLikeLatex(inner)) {
        return { inner, end: i + 1 }
      }
      return null
    }
    i++
  }
  return null
}

function readBalancedParen(text: string, openPos: number): { inner: string; end: number } | null {
  if (text[openPos] !== '(') return null
  let depth = 0

  for (let i = openPos; i < text.length; i++) {
    if (text[i] === '\\' && i + 1 < text.length) {
      const next = text[i + 1]
      if (next === '(' || next === ')' || next === '[' || next === ']') {
        i++
        continue
      }
    }
    if (text[i] === '(') depth++
    else if (text[i] === ')') {
      depth--
      if (depth === 0) {
        return { inner: text.slice(openPos + 1, i), end: i + 1 }
      }
    }
  }

  return null
}

function canStartParenMath(text: string, pos: number): boolean {
  if (text[pos] !== '(') return false

  if (pos > 0) {
    const prev = text[pos - 1]
    if (/[a-zA-Z0-9]/.test(prev)) return false
    if (prev === '\\' && pos >= 2 && /[a-zA-Z]/.test(text[pos - 2] ?? '')) return false
  }

  let j = pos + 1
  while (j < text.length && text[j] === ' ') j++
  if (j >= text.length || text[j] === ')') return false

  const rest = text.slice(j, Math.min(j + 80, text.length))
  return looksLikeLatex(rest) || /\\displaystyle|\\frac|\\int/.test(rest)
}

function tryLineBracketBlock(
  text: string,
  pos: number
): { inner: string; end: number } | null {
  const lineEnd = text.indexOf('\n', pos)
  const line = text.slice(pos, lineEnd === -1 ? text.length : lineEnd)
  if (line.trim() !== '[') return null

  const bodyStart = (lineEnd === -1 ? text.length : lineEnd) + 1
  let scan = bodyStart

  while (scan < text.length) {
    const nextEnd = text.indexOf('\n', scan)
    const row = text.slice(scan, nextEnd === -1 ? text.length : nextEnd)
    const trimmed = row.trim()

    if (trimmed === ']') {
      const inner = text.slice(bodyStart, scan).trim()
      if (inner && looksLikeLatex(inner)) {
        const end = nextEnd === -1 ? text.length : nextEnd + 1
        return { inner, end }
      }
      return null
    }

    if (trimmed.endsWith(']') && trimmed.startsWith('[')) {
      const inner = trimmed.slice(1, -1).trim()
      if (inner && looksLikeLatex(inner)) {
        const end = nextEnd === -1 ? text.length : nextEnd + 1
        return { inner, end }
      }
    }

    scan = nextEnd === -1 ? text.length : nextEnd + 1
  }

  return null
}

function trySameLineBracket(text: string, pos: number): { inner: string; end: number } | null {
  const lineEnd = text.indexOf('\n', pos)
  const line = text.slice(pos, lineEnd === -1 ? text.length : lineEnd)
  const trimmed = line.trim()
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return null

  const inner = trimmed.slice(1, -1).trim()
  if (inner.length < 2 || !looksLikeLatex(inner)) return null

  const end = lineEnd === -1 ? text.length : lineEnd
  return { inner, end }
}
