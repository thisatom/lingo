/**
 * shadcn/ui typography utility classes
 * @see https://ui.shadcn.com/docs/components/radix/typography
 */

/** Wrapper for agent markdown — spacing between block elements */
export const typographyProseClass =
  'max-w-full min-w-0 text-foreground break-words [overflow-wrap:anywhere] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0'

export const typography = {
  h1: 'scroll-m-20 mt-4 border-b border-border pb-2 text-[17px] font-semibold tracking-tight text-foreground text-balance first:mt-0',
  h2: 'scroll-m-20 mt-4 border-b border-border/80 pb-1.5 text-[15px] font-semibold tracking-tight text-foreground first:mt-0',
  h3: 'scroll-m-20 mt-3.5 text-[14px] font-semibold text-foreground first:mt-0',
  h4: 'scroll-m-20 mt-3 text-[13px] font-semibold text-foreground first:mt-0',
  p: 'text-[13px] leading-[1.55] text-foreground [&:not(:first-child)]:mt-2.5',
  lead: 'text-[13px] leading-[1.55] text-muted-foreground',
  blockquote:
    'my-2.5 border-l-2 border-border pl-3 text-[13px] italic text-muted-foreground [&_p]:text-foreground/90',
  ul: 'my-2.5 ml-5 list-disc space-y-1 text-[13px] leading-[1.55] text-foreground [&>li]:mt-0',
  ol: 'my-2.5 ml-5 list-decimal space-y-1 text-[13px] leading-[1.55] text-foreground [&>li]:mt-0',
  li: 'text-[13px] leading-[1.55] marker:text-muted-foreground [&>p]:my-0',
  a: 'font-medium text-foreground underline decoration-border underline-offset-[3px] hover:text-foreground/80',
  strong: 'font-semibold text-foreground',
  em: 'italic text-foreground',
  inlineCode:
    'rounded-md border border-border/60 bg-muted/70 px-1 py-0.5 font-mono text-[12px] font-medium text-foreground',
  pre: 'm-0 overflow-x-auto p-0 font-mono text-[12px] leading-[1.55]',
  preCode: 'block font-mono text-[12px] leading-[1.55]',
  codeBlock:
    'my-2.5 overflow-hidden rounded-lg border border-border bg-[var(--md-code-bg)]',
  codeBlockHeader:
    'flex items-center justify-between gap-2 border-b border-border/80 bg-muted/30 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground',
  codeBlockCopyButton:
    'inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium normal-case tracking-normal text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
  /** KaTeX display — larger than body (13px), distinct card layout */
  mathDisplayWrap:
    'katex-display-wrap my-3 w-full max-w-full overflow-x-auto rounded-xl border border-border/70 bg-muted/25 px-4 py-3 text-center',
  /** KaTeX inline — between body and code */
  mathInlineWrap: 'katex-inline-wrap inline align-middle leading-none',
  hr: 'my-5 border-border',
  tableWrap:
    'my-2.5 w-full max-w-full overflow-x-auto rounded-lg border border-border bg-muted/15 shadow-sm',
  table: 'w-full min-w-[16rem] border-collapse text-left',
  tableHead: 'bg-muted/45 [&_tr]:border-b [&_tr]:border-border',
  tableBody:
    '[&_tr]:border-b [&_tr]:border-border/70 [&_tr:nth-child(even)]:bg-muted/20 [&_tr:hover]:bg-muted/35 [&_tr:last-child]:border-0',
  tableRow: '',
  tableTh:
    'whitespace-nowrap px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground',
  tableTd: 'px-3 py-2 text-[13px] leading-[1.45] text-foreground align-top [overflow-wrap:anywhere]'
} as const
