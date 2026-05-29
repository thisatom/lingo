import * as React from 'react'
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu'
import {
  menuContentPaddingClass,
  menuItemHighlightClass,
  menuItemPaddingClass,
  menuSeparatorClass
} from '@/shared/lib/sidebar-filter-menu-styles'
import { cn } from '@/shared/lib/utils'

function ContextMenu({ ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Root>) {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />
}

function ContextMenuTrigger({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Trigger>) {
  return <ContextMenuPrimitive.Trigger data-slot="context-menu-trigger" {...props} />
}

function ContextMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Content>) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        data-slot="context-menu-content"
        className={cn(
          'z-50 min-w-[10rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
          menuContentPaddingClass,
          'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          className
        )}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  )
}

function ContextMenuItem({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Item> & { inset?: boolean }) {
  return (
    <ContextMenuPrimitive.Item
      data-slot="context-menu-item"
      data-inset={inset}
      className={cn(
        'relative flex cursor-default items-center gap-2 rounded-[6px] text-xs leading-normal outline-hidden select-none',
        menuItemPaddingClass,
        menuItemHighlightClass,
        inset && 'pl-8',
        className
      )}
      {...props}
    />
  )
}

function ContextMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Separator>) {
  return (
    <ContextMenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={cn(menuSeparatorClass, 'bg-border/60', className)}
      {...props}
    />
  )
}

export { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator }
