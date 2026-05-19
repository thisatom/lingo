import { memo, useMemo } from 'react'
import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { normalizeMarkdown } from '@/shared/lib/normalize-markdown'
import { cn } from '@/shared/lib/utils'
import { typography, typographyProseClass } from '@/shared/ui/typography'

const remarkPlugins = [remarkGfm, remarkBreaks]

const defaultMarkdownComponents: Components = {
  h1: ({ children }) => (
    <h2 className="mb-2 mt-4 text-lg font-semibold tracking-tight text-foreground first:mt-0">
      {children}
    </h2>
  ),
  h2: ({ children }) => (
    <h3 className="mb-2 mt-4 text-base font-semibold text-foreground first:mt-0">{children}</h3>
  ),
  h3: ({ children }) => (
    <h4 className="mb-1.5 mt-3 text-sm font-semibold text-foreground first:mt-0">{children}</h4>
  ),
  h4: ({ children }) => (
    <h5 className="mb-1.5 mt-3 text-sm font-medium text-foreground first:mt-0">{children}</h5>
  ),
  h5: ({ children }) => (
    <h5 className="mb-1 mt-2 text-sm font-medium text-muted-foreground first:mt-0">{children}</h5>
  ),
  h6: ({ children }) => (
    <h6 className="mb-1 mt-2 text-sm font-medium text-muted-foreground first:mt-0">{children}</h6>
  ),
  p: ({ children }) => (
    <p className="mb-2 text-sm leading-relaxed text-foreground last:mb-0">{children}</p>
  ),
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic text-foreground">{children}</em>,
  del: ({ children }) => (
    <del className="text-muted-foreground line-through decoration-muted-foreground">{children}</del>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-foreground underline underline-offset-4 hover:text-foreground/80"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-foreground last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-foreground last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-foreground [&>ol]:mt-1 [&>p]:mb-1 [&>ul]:mt-1">{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-2 border-border pl-3 text-sm text-muted-foreground last:mb-0 [&_p]:text-foreground">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-border" />,
  img: ({ src, alt, title }) => (
    <img
      src={src}
      alt={alt ?? ''}
      title={title}
      className="my-2 max-h-80 max-w-full rounded-md border border-border object-contain"
      loading="lazy"
    />
  ),
  table: ({ children }) => (
    <div className="mb-2 overflow-x-auto rounded-lg border border-border last:mb-0">
      <table className="w-full min-w-[16rem] border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-border last:border-0">{children}</tr>,
  th: ({ children }) => (
    <th className="border border-border px-3 py-2 font-medium text-foreground">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border border-border px-3 py-2 text-foreground">{children}</td>
  ),
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed last:mb-0">
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }) => {
    const isFenced = Boolean(className)
    if (isFenced) {
      return (
        <code className={cn('block font-mono text-foreground', className)} {...props}>
          {children}
        </code>
      )
    }
    return (
      <code
        className="rounded bg-muted/80 px-1 py-0.5 font-mono text-[0.9em] text-foreground"
        {...props}
      >
        {children}
      </code>
    )
  },
  input: ({ checked, disabled, ...props }) => (
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      readOnly
      className="mr-2 size-3.5 shrink-0 accent-foreground"
      {...props}
    />
  )
}

const typographyMarkdownComponents: Components = {
  h1: ({ children }) => <h2 className={typography.h1}>{children}</h2>,
  h2: ({ children }) => <h3 className={typography.h2}>{children}</h3>,
  h3: ({ children }) => <h4 className={typography.h3}>{children}</h4>,
  h4: ({ children }) => <h5 className={typography.h4}>{children}</h5>,
  h5: ({ children }) => <h6 className={typography.h4}>{children}</h6>,
  h6: ({ children }) => <h6 className={typography.h4}>{children}</h6>,
  p: ({ children }) => <p className={typography.p}>{children}</p>,
  strong: ({ children }) => <strong className={typography.strong}>{children}</strong>,
  em: ({ children }) => <em className={typography.em}>{children}</em>,
  del: ({ children }) => (
    <del className="text-muted-foreground line-through decoration-muted-foreground">{children}</del>
  ),
  a: ({ href, children }) => (
    <a href={href} className={typography.a} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className={typography.ul}>{children}</ul>,
  ol: ({ children }) => <ol className={typography.ol}>{children}</ol>,
  li: ({ children }) => <li className={typography.li}>{children}</li>,
  blockquote: ({ children }) => <blockquote className={typography.blockquote}>{children}</blockquote>,
  hr: () => <hr className={typography.hr} />,
  img: ({ src, alt, title }) => (
    <img
      src={src}
      alt={alt ?? ''}
      title={title}
      className="my-4 max-h-80 max-w-full rounded-md border border-border object-contain"
      loading="lazy"
    />
  ),
  table: ({ children }) => (
    <div className={typography.tableWrap}>
      <table className={typography.table}>{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className={typography.tbodyTr}>{children}</tr>,
  th: ({ children }) => <th className={typography.th}>{children}</th>,
  td: ({ children }) => <td className={typography.td}>{children}</td>,
  pre: ({ children }) => <pre className={typography.pre}>{children}</pre>,
  code: ({ className, children, ...props }) => {
    const isFenced = Boolean(className)
    if (isFenced) {
      return (
        <code className={cn(typography.preCode, className)} {...props}>
          {children}
        </code>
      )
    }
    return (
      <code className={typography.inlineCode} {...props}>
        {children}
      </code>
    )
  },
  input: defaultMarkdownComponents.input
}

interface MarkdownContentProps {
  content: string
  className?: string
  variant?: 'default' | 'typography'
}

function MarkdownContentInner({ content, className, variant = 'default' }: MarkdownContentProps) {
  const normalized = useMemo(() => normalizeMarkdown(content), [content])
  const components = variant === 'typography' ? typographyMarkdownComponents : defaultMarkdownComponents

  return (
    <div
      className={cn(
        variant === 'typography' ? typographyProseClass : 'prose-chat max-w-none text-sm leading-relaxed text-foreground',
        className
      )}
    >
      <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
        {normalized}
      </ReactMarkdown>
    </div>
  )
}

export const MarkdownContent = memo(MarkdownContentInner)
