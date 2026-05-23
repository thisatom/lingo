import { Fragment, memo, useMemo } from 'react'
import { useThrottledValue } from '@/shared/lib/use-throttled-value'
import ReactMarkdown from 'react-markdown'
import type { PluggableList } from 'unified'
import rehypeHighlight from 'rehype-highlight'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { segmentMarkdown, type MarkdownSegment } from '@/shared/lib/math/segment-markdown'
import { normalizeMarkdown } from '@/shared/lib/normalize-markdown'
import { cn } from '@/shared/lib/utils'
import { KaTeXBlock } from '@/shared/ui/katex-block'
import {
  agentMarkdownComponents,
  compactMarkdownComponents
} from '@/shared/ui/markdown/markdown-components'
import { typographyProseClass } from '@/shared/ui/typography'

const remarkPlugins = [remarkGfm, remarkBreaks]

const rehypePlugins: PluggableList = [[rehypeHighlight, { plainText: ['plaintext'] }]]

const proseVariantClass = {
  agent: cn(typographyProseClass, 'markdown-prose'),
  compact: cn(
    'markdown-prose max-w-none text-sm leading-relaxed text-foreground',
    '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0'
  ),
  thinking: cn(
    typographyProseClass,
    'markdown-prose thinking-markdown text-[13px] leading-[1.55]'
  )
} as const

interface MarkdownContentProps {
  content: string
  className?: string
  /** @default 'agent' — AI chat; use 'compact' for dialogs */
  variant?: 'agent' | 'compact' | 'thinking' | 'typography' | 'default'
  /** Throttle KaTeX/markdown re-parses while content grows (streaming). */
  parseThrottleMs?: number
}

function renderSegment(
  segment: MarkdownSegment,
  index: number,
  components: typeof agentMarkdownComponents
) {
  switch (segment.type) {
    case 'math-display':
      return <KaTeXBlock key={index} latex={segment.content} displayMode />
    case 'math-inline':
      return <KaTeXBlock key={index} latex={segment.content} displayMode={false} />
    case 'code':
      return (
        <ReactMarkdown
          key={index}
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
          components={components}
        >
          {segment.content}
        </ReactMarkdown>
      )
    case 'text':
      if (!segment.content) return null
      return (
        <ReactMarkdown
          key={index}
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
          components={components}
        >
          {segment.content}
        </ReactMarkdown>
      )
    default:
      return null
  }
}

function MarkdownContentInner({
  content,
  className,
  variant = 'agent',
  parseThrottleMs
}: MarkdownContentProps) {
  const throttleMs = parseThrottleMs ?? 0
  const parsedSource = useThrottledValue(content, throttleMs, throttleMs > 0)
  const segments = useMemo(
    () => segmentMarkdown(normalizeMarkdown(parsedSource)),
    [parsedSource]
  )
  const resolvedVariant =
    variant === 'typography' || variant === 'default'
      ? 'agent'
      : variant === 'thinking'
        ? 'thinking'
        : variant
  const components =
    resolvedVariant === 'compact' ? compactMarkdownComponents : agentMarkdownComponents

  return (
    <div
      className={cn(
        proseVariantClass[resolvedVariant as keyof typeof proseVariantClass],
        className
      )}
    >
      {segments.map((segment, index) => (
        <Fragment key={index}>{renderSegment(segment, index, components)}</Fragment>
      ))}
    </div>
  )
}

export const MarkdownContent = memo(MarkdownContentInner)
