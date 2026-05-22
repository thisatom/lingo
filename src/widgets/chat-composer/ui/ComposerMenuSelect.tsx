import type { ReactNode } from 'react'
import { Check, ChevronDown } from '@/shared/ui/icons'
import {
  sidebarMenuItemClass,
  sidebarMenuPickerChevronClass,
  sidebarMenuPickerTriggerClass,
  sidebarMenuSurfaceClass
} from '@/shared/lib/sidebar-filter-menu-styles'
import { cn } from '@/shared/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/shared/ui/dropdown-menu'

export type ComposerMenuSelectOption = {
  value: string
  label: string
  triggerLabel?: string
  suffix?: ReactNode
}

interface ComposerMenuSelectProps {
  value: string
  options: readonly ComposerMenuSelectOption[]
  onValueChange: (value: string) => void
  disabled?: boolean
  'aria-label': string
  triggerClassName?: string
  contentClassName?: string
}

export function ComposerMenuSelect({
  value,
  options,
  onValueChange,
  disabled,
  'aria-label': ariaLabel,
  triggerClassName,
  contentClassName
}: ComposerMenuSelectProps) {
  const selected = options.find((option) => option.value === value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(sidebarMenuPickerTriggerClass, triggerClassName)}
          aria-label={ariaLabel}
        >
          <span className="block min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap leading-normal">
            {selected?.triggerLabel ?? selected?.label ?? value}
          </span>
          <ChevronDown className={sidebarMenuPickerChevronClass} aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={6}
        className={cn('w-52', sidebarMenuSurfaceClass, contentClassName)}
      >
        {options.map((option) => {
          const isSelected = option.value === value
          return (
            <DropdownMenuItem
              key={option.value}
              className={sidebarMenuItemClass}
              onSelect={() => onValueChange(option.value)}
            >
              <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap leading-normal">
                {option.label}
              </span>
              {option.suffix}
              <Check
                className={cn('ml-1 size-3 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')}
              />
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
