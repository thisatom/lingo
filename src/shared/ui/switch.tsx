import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '@/shared/lib/utils'

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border transition-colors',
        'border-border/60 bg-neutral-300/90 data-[state=checked]:border-transparent data-[state=checked]:bg-[#3fa266]',
        'dark:border-border/70 dark:bg-muted-foreground/35 dark:data-[state=checked]:bg-[#3fa266]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block size-4 translate-x-[2px] rounded-full shadow-sm transition-transform',
          'bg-white data-[state=checked]:translate-x-[18px]',
          'dark:bg-[#e8e8e8]'
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
