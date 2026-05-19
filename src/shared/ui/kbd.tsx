import * as React from 'react'

import { cn } from '@/shared/lib/utils'

function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        'pointer-events-none inline-flex h-5 min-w-5 items-center justify-center bg-[#252525] px-1.5 text-[10px] font-normal leading-none text-foreground/90 select-none',
        'rounded-sm',
        '[[data-slot=kbd-group]_&]:rounded-none',
        '[[data-slot=kbd-group]_&:first-child]:rounded-l-sm',
        '[[data-slot=kbd-group]_&:last-child]:rounded-r-sm',
        '[[data-slot=kbd-group]_&:only-child]:rounded-sm',
        '[[data-slot=kbd-group]_&:not(:last-child)]:border-r [[data-slot=kbd-group]_&:not(:last-child)]:border-[var(--kbd-divider,var(--background))]',
        '[[data-slot=tooltip-content]_&]:text-[#cccccc]',
        '[&_svg:not([class*="size-"])]:size-3',
        className
      )}
      {...props}
    />
  )
}

function KbdGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="kbd-group"
      className={cn('inline-flex items-center [--kbd-divider:var(--background)]', className)}
      {...props}
    />
  )
}

export { Kbd, KbdGroup }
