import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

import { cn } from '@/shared/lib/utils'

function dismissOpenTooltips(): void {
  for (const trigger of document.querySelectorAll('[data-slot="tooltip-trigger"]')) {
    const state = trigger.getAttribute('data-state')
    if (state !== 'delayed-open' && state !== 'instant-open') continue
    trigger.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }))
    trigger.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
  }
}

function TooltipProvider({
  delayDuration = 280,
  skipDelayDuration = 200,
  disableHoverableContent = true,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  React.useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('[data-slot="tooltip-trigger"]')) return
      if (target.closest('[data-slot="tooltip-content"]')) return
      dismissOpenTooltips()
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') dismissOpenTooltips()
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('blur', dismissOpenTooltips)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('blur', dismissOpenTooltips)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
      disableHoverableContent={disableHoverableContent}
      {...props}
    >
      {children}
    </TooltipPrimitive.Provider>
  )
}

function Tooltip({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipPrimitive.Root data-slot="tooltip" delayDuration={delayDuration} {...props} />
  )
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 6,
  collisionPadding = 12,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          'z-50 max-w-[min(20rem,calc(100vw-1.5rem))] origin-(--radix-tooltip-content-transform-origin) overflow-visible rounded-md border border-menu-border bg-tooltip px-2.5 py-1.5 text-xs leading-snug font-medium text-balance text-tooltip-foreground shadow-lg shadow-black/15 dark:shadow-black/35',
          'animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-1.5 data-[side=left]:slide-in-from-right-1.5 data-[side=right]:slide-in-from-left-1.5 data-[side=top]:slide-in-from-bottom-1.5',
          'data-[state=closed]:pointer-events-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          className
        )}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
