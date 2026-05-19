/**
 * shadcn/ui typography utility classes
 * @see https://ui.shadcn.com/docs/components/radix/typography
 */

/** Wrapper for agent markdown — spacing between block elements */
export const typographyProseClass =
  'max-w-none text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0'

export const typography = {
  h1: 'scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-balance first:mt-0',
  h2: 'scroll-m-20 mt-6 border-b border-border pb-2 text-lg font-semibold tracking-tight first:mt-0',
  h3: 'scroll-m-20 mt-5 text-base font-semibold tracking-tight first:mt-0',
  h4: 'scroll-m-20 mt-4 text-sm font-semibold tracking-tight first:mt-0',
  p: 'leading-7 text-foreground [&:not(:first-child)]:mt-3',
  lead: 'text-base text-muted-foreground',
  blockquote: 'mt-3 border-l-2 border-border pl-6 italic text-muted-foreground',
  ul: 'my-3 ml-6 list-disc text-foreground [&>li]:mt-1.5',
  ol: 'my-3 ml-6 list-decimal text-foreground [&>li]:mt-1.5',
  li: 'leading-7',
  a: 'font-medium text-primary underline underline-offset-4',
  strong: 'font-semibold text-foreground',
  em: 'italic',
  inlineCode:
    'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-foreground',
  pre: 'my-3 overflow-x-auto rounded-lg border border-border bg-muted/40 p-4',
  preCode: 'font-mono text-sm leading-relaxed text-foreground',
  hr: 'my-5 border-border',
  tableWrap: 'my-3 w-full overflow-y-auto',
  table: 'w-full',
  theadTr: 'm-0 border-t border-border p-0 even:bg-muted',
  th: 'border border-border px-4 py-2 text-left font-bold text-foreground [&[align=center]]:text-center [&[align=right]]:text-right',
  tbodyTr: 'm-0 border-t border-border p-0 even:bg-muted',
  td: 'border border-border px-4 py-2 text-left text-foreground [&[align=center]]:text-center [&[align=right]]:text-right'
} as const
