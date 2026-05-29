/**
 * shadcn/ui typography utility classes
 * @see https://ui.shadcn.com/docs/components/radix/typography
 */

const chatTextClass =
  'text-[length:var(--lingo-chat-font-size)] leading-[var(--lingo-chat-line-height)]'
const codeTextClass =
  'font-mono text-[length:var(--lingo-code-font-size)] leading-[var(--lingo-code-line-height)]'

/** Wrapper for agent markdown — spacing between block elements */
export const typographyProseClass =
  'max-w-full min-w-0 text-foreground break-words [overflow-wrap:anywhere] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0'

export const typography = {
  h1: `scroll-m-20 mt-4 border-b border-border pb-2 text-[calc(var(--lingo-chat-font-size)+4px)] font-semibold tracking-tight text-foreground text-balance first:mt-0`,
  h2: `scroll-m-20 mt-4 border-b border-border/80 pb-1.5 text-[calc(var(--lingo-chat-font-size)+2px)] font-semibold tracking-tight text-foreground first:mt-0`,
  h3: `scroll-m-20 mt-3.5 text-[calc(var(--lingo-chat-font-size)+1px)] font-semibold text-foreground first:mt-0`,
  h4: `scroll-m-20 mt-3 ${chatTextClass} font-semibold text-foreground first:mt-0`,
  p: `${chatTextClass} text-foreground [&:not(:first-child)]:mt-2.5`,
  lead: `${chatTextClass} text-muted-foreground`,
  blockquote: `my-2.5 border-l-2 border-border pl-3 ${chatTextClass} italic text-muted-foreground [&_p]:text-foreground/90`,
  ul: `my-2.5 ml-5 list-disc space-y-1 ${chatTextClass} text-foreground [&>li]:mt-0`,
  ol: `my-2.5 ml-5 list-decimal space-y-1 ${chatTextClass} text-foreground [&>li]:mt-0`,
  li: `${chatTextClass} marker:text-muted-foreground [&>p]:my-0`,
  a: 'font-medium text-foreground underline decoration-border underline-offset-[3px] hover:text-foreground/80',
  strong: 'font-semibold text-foreground',
  em: 'italic text-foreground',
  inlineCode: `rounded-md border border-border/60 bg-muted/70 px-1 py-0.5 ${codeTextClass} font-medium text-foreground`,
  pre: `m-0 overflow-x-auto p-0 ${codeTextClass}`,
  preCode: `block ${codeTextClass}`,
  codeBlock:
    'my-2.5 overflow-hidden rounded-lg border border-border bg-[var(--md-code-bg)]',
  codeBlockHeader:
    'flex items-center justify-between gap-2 border-b border-border/80 bg-muted/30 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground',
  codeBlockCopyButton:
    'inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium normal-case tracking-normal text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
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
  tableTd: `px-3 py-2 ${chatTextClass} text-foreground align-top [overflow-wrap:anywhere]`
} as const

export { chatTextClass, codeTextClass }
