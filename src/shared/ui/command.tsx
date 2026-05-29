import * as React from 'react'
import { Command as CommandPrimitive } from 'cmdk'
import { SearchIcon } from '@/shared/ui/icons'

import {
  commandPaletteDialogContentClass,
  commandPaletteEmptyClass,
  commandPaletteGroupClass,
  commandPaletteInputClass,
  commandPaletteInputWrapperClass,
  commandPaletteItemClass,
  commandPaletteListClass,
  commandPaletteOverlayClass,
  commandPaletteRootClass,
  commandPaletteSeparatorClass
} from '@/shared/lib/command-palette-styles'
import {
  menuCommandItemClass,
  menuContentPaddingClass,
  menuLabelClass,
  sidebarMenuSurfaceClass
} from '@/shared/lib/sidebar-filter-menu-styles'
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
        overlayClassName={commandPaletteOverlayClass}
        className={cn(commandPaletteDialogContentClass, className)}
        showCloseButton={false}
      >
        <Command className={commandPaletteRootClass}>{children}</Command>
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({
  className,
  wrapperClassName,
  variant = 'menu',
  showSearchIcon,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input> & {
  wrapperClassName?: string
  /** `palette` — glass command dialog (42px input, #1e1e1e separator). */
  variant?: 'menu' | 'palette'
  showSearchIcon?: boolean
}) {
  const isPalette = variant === 'palette'
  const showIcon = showSearchIcon ?? !isPalette

  return (
    <div
      data-slot="command-input-wrapper"
      className={cn(
        isPalette
          ? commandPaletteInputWrapperClass
          : 'flex h-[30px] min-h-[30px] items-center gap-2 border-b border-menu-border px-2.5',
        wrapperClassName
      )}
    >
      {showIcon ? <SearchIcon className="size-4 shrink-0 text-muted-foreground" /> : null}
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          isPalette
            ? commandPaletteInputClass
            : 'flex h-[30px] min-h-[30px] w-full bg-transparent py-0 text-sm leading-none text-foreground outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    </div>
  )
}

function CommandPaletteInput(
  props: Omit<React.ComponentProps<typeof CommandInput>, 'variant'>
) {
  return <CommandInput variant="palette" showSearchIcon={false} {...props} />
}

function CommandList({
  className,
  variant = 'menu',
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List> & {
  variant?: 'menu' | 'palette'
}) {
  return (
    <CustomScrollArea
      variant="menu"
      className={cn(
        variant === 'palette' ? commandPaletteListClass : 'max-h-[300px]',
        'min-h-0',
        className
      )}
    >
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
  variant = 'menu',
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty> & {
  variant?: 'menu' | 'palette'
}) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn(
        variant === 'palette' ? commandPaletteEmptyClass : 'py-6 text-center text-sm text-muted-foreground',
        className
      )}
      {...props}
    />
  )
}

function CommandGroup({
  className,
  variant = 'menu',
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group> & {
  variant?: 'menu' | 'palette'
}) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        variant === 'palette'
          ? commandPaletteGroupClass
          : cn(
              'overflow-hidden text-foreground',
              menuContentPaddingClass,
              '[&_[cmdk-group-heading]]:p-[3px] [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:leading-normal [&_[cmdk-group-heading]]:text-muted-foreground'
            ),
        className
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  variant = 'menu',
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator> & {
  variant?: 'menu' | 'palette'
}) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn(
        variant === 'palette' ? commandPaletteSeparatorClass : '-mx-1 h-px bg-border/60',
        className
      )}
      {...props}
    />
  )
}

function CommandItem({
  className,
  variant = 'menu',
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item> & {
  variant?: 'menu' | 'palette'
}) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        variant === 'palette'
          ? commandPaletteItemClass
          : cn(
              menuCommandItemClass,
              'data-[disabled=true]:pointer-events-none data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 data-[disabled=true]:data-[selected=true]:bg-transparent dark:data-[disabled=true]:data-[selected=true]:bg-transparent [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4 [&_svg:not([class*="text-"])]:text-muted-foreground'
            ),
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
  CommandPaletteInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator
}
