import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

import { dismissAllTooltips, registerTooltipDismissHandler } from '@/shared/ui/tooltip-dismiss'
import { cn } from '@/shared/lib/utils'

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
      dismissAllTooltips()
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') dismissAllTooltips()
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
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
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : uncontrolledOpen

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange]
  )

  React.useEffect(() => {
    if (!open) return
    return registerTooltipDismissHandler(() => setOpen(false))
  }, [open, setOpen])

  return (
    <TooltipPrimitive.Root
      data-slot="tooltip"
      delayDuration={delayDuration}
      open={open}
      onOpenChange={setOpen}
      {...props}
    />
  )
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

const tooltipContentMotionClass = cn(
  'z-50 max-w-[min(20rem,calc(100vw-1.5rem))] origin-(--radix-tooltip-content-transform-origin) overflow-visible',
  'rounded-md border border-menu-border bg-tooltip px-2.5 py-1.5 text-xs leading-snug font-medium text-balance text-tooltip-foreground',
  'shadow-lg shadow-black/15 dark:shadow-black/35',
  'transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none',
  'animate-in fade-in-0 zoom-in-95',
  'data-[side=bottom]:slide-in-from-top-1.5 data-[side=left]:slide-in-from-right-1.5 data-[side=right]:slide-in-from-left-1.5 data-[side=top]:slide-in-from-bottom-1.5',
  'data-[state=closed]:pointer-events-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-100'
)

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
        className={cn(tooltipContentMotionClass, className)}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
