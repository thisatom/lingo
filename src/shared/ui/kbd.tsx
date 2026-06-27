import * as React from 'react'

import { cn } from '@/shared/lib/utils'

const kbdBaseClass = cn(
  'pointer-events-none inline-flex h-[18px] min-w-[18px] items-center justify-center',
  'rounded-[5px] border border-overlay-border bg-secondary px-1.5',
  'font-sans text-[10px] font-medium leading-none tracking-wide text-foreground/85',
  'shadow-[0_1px_0_0_rgb(255_255_255_/_0.06)_inset,0_1px_2px_0_rgb(0_0_0_/_0.12)]',
  'dark:shadow-[0_1px_0_0_rgb(255_255_255_/_0.04)_inset,0_1px_2px_0_rgb(0_0_0_/_0.35)]',
  'select-none [&_svg:not([class*="size-"])]:size-3'
)

function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
  return <kbd data-slot="kbd" className={cn(kbdBaseClass, className)} {...props} />
}

function KbdGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="kbd-group"
      className={cn('inline-flex items-center gap-1', className)}
      {...props}
    />
  )
}

export { Kbd, KbdGroup, kbdBaseClass }
