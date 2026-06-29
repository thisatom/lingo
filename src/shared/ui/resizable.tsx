import * as ResizablePrimitive from 'react-resizable-panels'

import { cn } from '@/shared/lib/utils'

/** Swallow InvalidStateError when the library captures on a detached separator. */
function patchPointerCapture(): void {
  if (typeof Element === 'undefined') return
  const proto = Element.prototype as Element & { __lingoPointerCapturePatched?: boolean }
  if (proto.__lingoPointerCapturePatched) return

  const nativeSet = proto.setPointerCapture
  proto.setPointerCapture = function setPointerCaptureSafe(this: Element, pointerId: number) {
    try {
      nativeSet.call(this, pointerId)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'InvalidStateError') return
      throw error
    }
  }
  proto.__lingoPointerCapturePatched = true
}

patchPointerCapture()

function ResizablePanelGroup({
  className,
  disableCursor = true,
  ...props
}: ResizablePrimitive.GroupProps) {
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      disableCursor={disableCursor}
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
  onDoubleClickReset,
  ...props
}: ResizablePrimitive.SeparatorProps & {
  /** Double-click: expand hidden sidebar or restore default width. */
  onDoubleClickReset?: () => void
}) {
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      disableDoubleClick
      onDoubleClick={(event) => {
        event.preventDefault()
        onDoubleClickReset?.()
      }}
      className={cn(
        'relative z-30 w-px min-w-px max-w-px shrink-0 bg-border',
        'focus-visible:outline-none',
        className
      )}
      {...props}
    />
  )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
