import * as React from 'react'

import { cn } from '@/shared/lib/utils'

function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        'pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-muted px-1.5 font-sans text-[10px] font-normal leading-none text-muted-foreground select-none',
        'dark:bg-[#252525] dark:text-[#cccccc]',
        '[[data-slot=kbd-group]_&]:rounded-none',
        '[[data-slot=kbd-group]_&:first-child]:rounded-l-[4px]',
        '[[data-slot=kbd-group]_&:last-child]:rounded-r-[4px]',
        '[[data-slot=kbd-group]_&:only-child]:rounded-[4px]',
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
      className={cn('inline-flex items-center gap-[2px]', className)}
      {...props}
    />
  )
}

export { Kbd, KbdGroup }
