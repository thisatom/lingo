import { Check } from 'lucide-react'
import type { ChatComposerMode } from '@/entities/settings/model/store'
import { shortOpenRouterModelLabel } from '@/widgets/chat-composer/lib/model-label'
import {
  sidebarMenuItemClass,
  sidebarMenuPickerDotClass,
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
import { Switch } from '@/shared/ui/switch'

export type AgentModeOption = {
  value: ChatComposerMode
  label: string
}

interface ComposerAgentMenuSelectProps {
  mode: ChatComposerMode
  modelId: string
  modeOptions: readonly AgentModeOption[]
  modelIds: readonly string[]
  modelAutoFallback: boolean
  onModeChange: (mode: ChatComposerMode) => void
  onModelChange: (modelId: string) => void
  onModelAutoFallbackChange: (enabled: boolean) => void
  disabled?: boolean
}

export function ComposerAgentMenuSelect({
  mode,
  modelId,
  modeOptions,
  modelIds,
  modelAutoFallback,
  onModeChange,
  onModelChange,
  onModelAutoFallbackChange,
  disabled
}: ComposerAgentMenuSelectProps) {
  const selectedMode = modeOptions.find((option) => option.value === mode)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(sidebarMenuPickerTriggerClass, 'justify-center px-2.5')}
          aria-label="Agent mode and model"
        >
          <span className="inline-flex min-w-0 items-center justify-center gap-1.5">
            <span className="text-[13px] leading-[13px]">{selectedMode?.label ?? mode}</span>
            {modelAutoFallback ? (
              <>
                <span className={sidebarMenuPickerDotClass} aria-hidden />
                <span className="shrink-0 text-[13px] leading-[13px] text-muted-foreground/80">
                  Auto
                </span>
              </>
            ) : null}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={6}
        className={cn('w-52', sidebarMenuSurfaceClass)}
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
            className={cn('min-w-[14rem]', sidebarMenuSurfaceClass)}
          >
            <div
              className={cn(
                sidebarMenuItemClass,
                'pointer-events-auto flex cursor-default items-center justify-between gap-2'
              )}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-[12px] text-foreground">Auto</span>
              <Switch
                checked={modelAutoFallback}
                disabled={disabled}
                aria-label="Auto: try other free models on error"
                onCheckedChange={onModelAutoFallbackChange}
              />
            </div>
            <DropdownMenuSeparator className="my-1 bg-border/60" />
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
