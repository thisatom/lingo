import { Check, ChevronDown } from '@/shared/ui/icons'
import type { ChatComposerMode } from '@/entities/settings/model/store'
import type { LlmBackend } from '@/shared/types/ipc'
import { shortOpenRouterModelLabel } from '@/widgets/chat-composer/lib/model-label'
import {
  sidebarMenuItemClass,
  sidebarMenuPickerChevronClass,
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
  llmBackend: LlmBackend
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
  llmBackend,
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
          className={sidebarMenuPickerTriggerClass}
          aria-label="Agent mode and model"
        >
          <span className="inline-flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
            <span className="truncate text-[13px] leading-normal">
              {selectedMode?.label ?? mode}
            </span>
            {modelAutoFallback ? (
              <>
                <span className={sidebarMenuPickerDotClass} aria-hidden />
                <span className="shrink-0 text-[13px] leading-normal text-muted-foreground/80">
                  Auto
                </span>
              </>
            ) : null}
          </span>
          <ChevronDown className={sidebarMenuPickerChevronClass} aria-hidden />
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

        {llmBackend === 'custom' ? (
          <DropdownMenuItem
            className={cn(sidebarMenuItemClass, 'cursor-default focus:bg-transparent')}
            onSelect={(e) => e.preventDefault()}
          >
            <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap leading-normal text-muted-foreground">
              {modelId.trim() ? `Custom · ${modelId}` : 'Custom model (Settings → API)'}
            </span>
          </DropdownMenuItem>
        ) : (
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
                      className={cn(
                        'ml-1 size-3 shrink-0',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
