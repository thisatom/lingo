import type { Components } from 'react-markdown'
import { cn } from '@/shared/lib/utils'
import { MarkdownLink } from '@/shared/ui/link-preview-hover'
import { MarkdownCodeBlock } from '@/shared/ui/markdown/markdown-code-block'
import {
  MarkdownTable,
  MarkdownTableBody,
  MarkdownTableCell,
  MarkdownTableHead,
  MarkdownTableHeaderCell,
  MarkdownTableRow
} from '@/shared/ui/markdown/markdown-table'
import { typography } from '@/shared/ui/typography'

function MarkdownImage({ src, alt, title }: { src?: string; alt?: string; title?: string }) {
  if (!src) return null
  return (
    <figure className="my-2.5 max-w-full">
      <img
        src={src}
        alt={alt ?? ''}
        title={title}
        className="max-h-80 max-w-full rounded-lg border border-border bg-muted/20 object-contain"
        loading="lazy"
        decoding="async"
      />
      {alt?.trim() ? (
        <figcaption className="mt-1.5 text-[11px] text-muted-foreground">{alt}</figcaption>
      ) : null}
    </figure>
  )
}

function MarkdownCode({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<'code'> & { className?: string }) {
  const isFenced = Boolean(className?.includes('language-') || className?.includes('hljs'))

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
}

/** Agent chat markdown — headings, lists, links, images, GFM tables, highlighted code. */
export const agentMarkdownComponents: Components = {
  h1: ({ children }) => <h1 className={typography.h1}>{children}</h1>,
  h2: ({ children }) => <h2 className={typography.h2}>{children}</h2>,
  h3: ({ children }) => <h3 className={typography.h3}>{children}</h3>,
  h4: ({ children }) => <h4 className={typography.h4}>{children}</h4>,
  h5: ({ children }) => <h5 className={typography.h4}>{children}</h5>,
  h6: ({ children }) => <h6 className={typography.h4}>{children}</h6>,
  p: ({ children }) => <p className={typography.p}>{children}</p>,
  strong: ({ children }) => <strong className={typography.strong}>{children}</strong>,
  em: ({ children }) => <em className={typography.em}>{children}</em>,
  del: ({ children }) => (
    <del className="text-muted-foreground line-through decoration-muted-foreground">{children}</del>
  ),
  a: ({ href, children }) => (
    <MarkdownLink href={href} className={typography.a}>
      {children}
    </MarkdownLink>
  ),
  ul: ({ children }) => <ul className={typography.ul}>{children}</ul>,
  ol: ({ children }) => <ol className={typography.ol}>{children}</ol>,
  li: ({ children }) => <li className={typography.li}>{children}</li>,
  blockquote: ({ children }) => <blockquote className={typography.blockquote}>{children}</blockquote>,
  hr: () => <hr className={typography.hr} />,
  img: ({ src, alt, title }) => <MarkdownImage src={src} alt={alt} title={title} />,
  table: ({ children }) => <MarkdownTable>{children}</MarkdownTable>,
  thead: ({ children }) => <MarkdownTableHead>{children}</MarkdownTableHead>,
  tbody: ({ children }) => <MarkdownTableBody>{children}</MarkdownTableBody>,
  tr: ({ children }) => <MarkdownTableRow>{children}</MarkdownTableRow>,
  th: ({ children, align }) => <MarkdownTableHeaderCell align={align}>{children}</MarkdownTableHeaderCell>,
  td: ({ children, align }) => <MarkdownTableCell align={align}>{children}</MarkdownTableCell>,
  pre: ({ children, className }) => (
    <MarkdownCodeBlock className={className}>{children}</MarkdownCodeBlock>
  ),
  code: MarkdownCode,
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

/** Compact markdown for dialogs (release notes, etc.). */
export const compactMarkdownComponents: Components = {
  ...agentMarkdownComponents,
  h1: ({ children }) => (
    <h2 className="mb-2 mt-3 text-base font-semibold text-foreground first:mt-0">{children}</h2>
  ),
  h2: ({ children }) => (
    <h3 className="mb-1.5 mt-3 text-sm font-semibold text-foreground first:mt-0">{children}</h3>
  ),
  h3: ({ children }) => (
    <h4 className="mb-1 mt-2.5 text-sm font-medium text-foreground first:mt-0">{children}</h4>
  )
}
