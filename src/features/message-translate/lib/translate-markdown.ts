import { unified } from 'unified'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { visit } from 'unist-util-visit'
import type { Root, Text } from 'mdast'
import type { MarkdownSegment } from '@/shared/lib/math/segment-markdown'
import { segmentMarkdown } from '@/shared/lib/math/segment-markdown'

function preserveEdgeWhitespace(original: string, translated: string): string {
  const lead = original.match(/^\s*/)?.[0] ?? ''
  const trail = original.match(/\s*$/)?.[0] ?? ''
  const core = translated.trim()
  if (!core) return original
  return `${lead}${core}${trail}`
}

function collectTextNodes(tree: Root): Text[] {
  const nodes: Text[] = []
  visit(tree, 'text', (node, _index, parent) => {
    if (parent?.type === 'code' || parent?.type === 'inlineCode') return
    if (!node.value.trim()) return
    nodes.push(node)
  })
  return nodes
}

async function translateMarkdownProse(
  prose: string,
  translateText: (text: string) => Promise<string>
): Promise<string> {
  const trimmed = prose.trim()
  if (!trimmed) return prose

  const tree = unified().use(remarkParse).use(remarkGfm).parse(prose) as Root
  const textNodes = collectTextNodes(tree)
  if (textNodes.length === 0) return prose

  await Promise.all(
    textNodes.map(async (node) => {
      const source = node.value.trim()
      if (!source) return
      const translated = await translateText(source)
      node.value = preserveEdgeWhitespace(node.value, translated)
    })
  )

  const rendered = unified()
    .use(remarkGfm)
    .use(remarkStringify, {
      bullet: '-',
      fences: true,
      listItemIndent: 'one'
    })
    .stringify(tree)
  if (!prose.endsWith('\n') && rendered.endsWith('\n')) {
    return rendered.replace(/\n+$/, '')
  }
  return rendered
}

function serializeSegment(segment: MarkdownSegment): string {
  switch (segment.type) {
    case 'text':
    case 'code':
      return segment.content
    case 'math-inline':
      return `$${segment.content}$`
    case 'math-display':
      return `\n$$\n${segment.content}\n$$\n`
    default:
      return ''
  }
}

/** Translate visible text only; code, math, links structure, and markdown syntax stay intact. */
export async function translateMarkdownPreservingStructure(
  markdown: string,
  translateText: (text: string) => Promise<string>
): Promise<string> {
  const segments = segmentMarkdown(markdown)
  const parts: string[] = []

  for (const segment of segments) {
    if (segment.type === 'code' || segment.type === 'math-display' || segment.type === 'math-inline') {
      parts.push(serializeSegment(segment))
      continue
    }
    parts.push(await translateMarkdownProse(segment.content, translateText))
  }

  return parts.join('')
}
