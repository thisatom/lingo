import { memo, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { normalizeMarkdown } from '@/shared/lib/normalize-markdown'
import { cn } from '@/shared/lib/utils'
import {
  agentMarkdownComponents,
  compactMarkdownComponents
} from '@/shared/ui/markdown/markdown-components'
import { typographyProseClass } from '@/shared/ui/typography'

const remarkPlugins = [remarkGfm, remarkMath, remarkBreaks]

const rehypePlugins = [rehypeKatex, rehypeHighlight]

const proseVariantClass = {
  agent: cn(typographyProseClass, 'markdown-prose'),
  compact: cn(
    'markdown-prose max-w-none text-sm leading-relaxed text-foreground',
    '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0'
  )
} as const

interface MarkdownContentProps {
  content: string
  className?: string
  /** @default 'agent' — AI chat; use 'compact' for dialogs */
  variant?: 'agent' | 'compact' | 'typography' | 'default'
}

function MarkdownContentInner({ content, className, variant = 'agent' }: MarkdownContentProps) {
  const normalized = useMemo(() => normalizeMarkdown(content), [content])
  const resolvedVariant = variant === 'typography' || variant === 'default' ? 'agent' : variant
  const components =
    resolvedVariant === 'compact' ? compactMarkdownComponents : agentMarkdownComponents

  return (
    <div className={cn(proseVariantClass[resolvedVariant], className)}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  )
}

export const MarkdownContent = memo(MarkdownContentInner)
