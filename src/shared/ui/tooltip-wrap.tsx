import type { ComponentProps, ReactElement, ReactNode } from 'react'
import { Button, type ButtonProps } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'

type TooltipWrapProps = {
  label: ReactNode
  children: ReactElement
  side?: ComponentProps<typeof TooltipContent>['side']
  align?: ComponentProps<typeof TooltipContent>['align']
  sideOffset?: number
  contentClassName?: string
}

export function TooltipWrap({
  label,
  children,
  side = 'top',
  align,
  sideOffset,
  contentClassName
}: TooltipWrapProps) {
  return (
    <Tooltip delayDuration={240}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        className={contentClassName}
      >
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

type TooltipIconButtonProps = ButtonProps & {
  tooltip: ReactNode
  children: ReactNode
  /** Layout/position classes for the Radix trigger wrapper (e.g. absolute overlay). */
  triggerClassName?: string
  tooltipSide?: ComponentProps<typeof TooltipContent>['side']
  tooltipAlign?: ComponentProps<typeof TooltipContent>['align']
  tooltipSideOffset?: number
}

export function TooltipIconButton({
  tooltip,
  disabled,
  className,
  triggerClassName,
  tooltipSide,
  tooltipAlign,
  tooltipSideOffset,
  children,
  type = 'button',
  'aria-label': ariaLabelProp,
  ...props
}: TooltipIconButtonProps) {
  const ariaFallback =
    typeof tooltip === 'string' || typeof tooltip === 'number' ? String(tooltip) : undefined

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Button
          type={type}
          disabled={disabled}
          className={cn(className, triggerClassName)}
          {...props}
          aria-label={ariaLabelProp ?? ariaFallback}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side={tooltipSide}
        align={tooltipAlign}
        sideOffset={tooltipSideOffset}
      >
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}
