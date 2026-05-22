import * as React from 'react'
import { Command as CommandPrimitive } from 'cmdk'
import { SearchIcon } from '@/shared/ui/icons'

import { sidebarMenuSurfaceClass } from '@/shared/lib/sidebar-filter-menu-styles'
import { cn } from '@/shared/lib/utils'
import { CustomScrollArea } from '@/shared/ui/custom-scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/shared/ui/dialog'

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-md',
        sidebarMenuSurfaceClass,
        className
      )}
      {...props}
    />
  )
}

function CommandDialog({
  title = 'Command Palette',
  description = 'Search for a command to run...',
  children,
  className,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string
  description?: string
  className?: string
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn('overflow-hidden border p-0 shadow-lg', sidebarMenuSurfaceClass, className)}
        showCloseButton={false}
      >
        <Command>{children}</Command>
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({
  className,
  wrapperClassName,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input> & {
  wrapperClassName?: string
}) {
  return (
    <div
      data-slot="command-input-wrapper"
      className={cn(
        'flex h-[30px] min-h-[30px] items-center gap-2 border-b border-menu-border px-2.5',
        wrapperClassName
      )}
    >
      <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          'flex h-[30px] min-h-[30px] w-full bg-transparent py-0 text-sm leading-none text-foreground outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    </div>
  )
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CustomScrollArea variant="menu" className={cn('max-h-[300px] min-h-0', className)}>
      <CommandPrimitive.List
        data-slot="command-list"
        className="scroll-py-1 overflow-x-hidden overflow-y-visible"
        {...props}
      />
    </CustomScrollArea>
  )
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn('py-6 text-center text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        'overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground',
        className
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn('-mx-1 h-px bg-border/60', className)}
      {...props}
    />
  )
}

function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        'relative flex h-7 min-h-7 cursor-pointer items-center gap-2 rounded-sm px-2 py-0 text-sm text-foreground outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 data-[selected=true]:bg-menu-hover data-[selected=true]:text-popover-foreground dark:data-[selected=true]:bg-[#252525] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4 [&_svg:not([class*="text-"])]:text-muted-foreground',
        className
      )}
      {...props}
    />
  )
}

function CommandShortcut({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn('ml-auto text-xs tracking-widest text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator
}
