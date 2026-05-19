import { Check, ChevronDown } from 'lucide-react'
import type { ChatComposerMode } from '@/entities/settings/model/store'
import { shortOpenRouterModelLabel } from '@/widgets/chat-composer/lib/model-label'
import {
  sidebarMenuItemClass,
  sidebarMenuPickerTriggerClass,
  sidebarMenuSubTriggerClass,
  sidebarMenuSurfaceClass
} from '@/shared/lib/sidebar-filter-menu-styles'
import { cn } from '@/shared/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/shared/ui/dropdown-menu'

export type AgentModeOption = {
  value: ChatComposerMode
  label: string
}

interface ComposerAgentMenuSelectProps {
  mode: ChatComposerMode
  modelId: string
  modeOptions: readonly AgentModeOption[]
  modelIds: readonly string[]
  onModeChange: (mode: ChatComposerMode) => void
  onModelChange: (modelId: string) => void
  disabled?: boolean
}

export function ComposerAgentMenuSelect({
  mode,
  modelId,
  modeOptions,
  modelIds,
  onModeChange,
  onModelChange,
  disabled
}: ComposerAgentMenuSelectProps) {
  const selectedMode = modeOptions.find((option) => option.value === mode)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={sidebarMenuPickerTriggerClass}
          aria-label="Agent mode and model"
        >
          <span className="block min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap leading-normal">
            {selectedMode?.label ?? mode}
          </span>
          <ChevronDown
            className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground opacity-70"
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={6}
        className={cn('w-52 p-1', sidebarMenuSurfaceClass)}
      >
        {modeOptions.map((option) => {
          const isSelected = option.value === mode
          return (
            <DropdownMenuItem
              key={option.value}
              className={sidebarMenuItemClass}
              onSelect={() => onModeChange(option.value)}
            >
              <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap leading-normal">
                {option.label}
              </span>
              <Check
                className={cn('ml-1 size-3 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')}
              />
            </DropdownMenuItem>
          )
        })}

        <DropdownMenuSeparator className="my-1 bg-border/60" />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className={sidebarMenuSubTriggerClass}>
            <span className="min-w-0 flex-1 truncate">Models</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent
            sideOffset={4}
            className={cn(
              'max-h-64 min-w-[14rem] overflow-y-auto p-1',
              sidebarMenuSurfaceClass
            )}
          >
            {modelIds.map((id) => {
              const isSelected = id === modelId
              return (
                <DropdownMenuItem
                  key={id}
                  className={sidebarMenuItemClass}
                  onSelect={() => onModelChange(id)}
                >
                  <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap leading-normal">
                    {shortOpenRouterModelLabel(id)}
                  </span>
                  <Check
                    className={cn('ml-1 size-3 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')}
                  />
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
