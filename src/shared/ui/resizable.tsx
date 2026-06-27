import * as ResizablePrimitive from 'react-resizable-panels'

import { cn } from '@/shared/lib/utils'

function ResizablePanelGroup({ className, ...props }: ResizablePrimitive.GroupProps) {
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      className={cn('flex h-full w-full aria-[orientation=vertical]:flex-col', className)}
      {...props}
    />
  )
}

function ResizablePanel({ className, ...props }: ResizablePrimitive.PanelProps) {
  return (
    <ResizablePrimitive.Panel
      data-slot="resizable-panel"
      className={cn('min-h-0 min-w-0', className)}
      {...props}
    />
  )
}

function ResizableHandle({
  className,
  disabled,
  ...props
}: ResizablePrimitive.SeparatorProps) {
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      disabled={disabled}
      className={cn(
        'relative z-20 w-px shrink-0 bg-border transition-colors duration-150',
        'cursor-col-resize aria-[orientation=vertical]:cursor-row-resize',
        'focus-visible:outline-none',
        disabled && 'pointer-events-none opacity-0',
        className
      )}
      {...props}
    />
  )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
