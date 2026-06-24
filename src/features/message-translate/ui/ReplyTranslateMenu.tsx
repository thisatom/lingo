import {
  PRACTICE_LANGUAGE_AUTO,
  practiceLanguageOptionsForSelect,
  translationTargetOptionsForSelect
} from '@/shared/config/practice-languages'
import { cn } from '@/shared/lib/utils'
import { Check, ChevronDown, Languages, Loader2Icon } from '@/shared/ui/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/shared/ui/dropdown-menu'
import {
  sidebarMenuItemClass,
  sidebarMenuSubTriggerClass,
  sidebarMenuSurfaceClass
} from '@/shared/lib/sidebar-filter-menu-styles'
import {
  messageActionButtonClass,
  messageActionDividerClass
} from '@/widgets/conversation-panel/ui/agent-layout'
import { Button } from '@/shared/ui/button'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'

type Props = {
  isShowingTranslation: boolean
  loading: boolean
  fromLang: string
  toLang: string
  disabled?: boolean
  onToggle: () => void
  onFromLangChange: (value: string) => void
  onToLangChange: (value: string) => void
}

const SOURCE_OPTIONS = practiceLanguageOptionsForSelect(PRACTICE_LANGUAGE_AUTO)

export function ReplyTranslateMenu({
  isShowingTranslation,
  loading,
  fromLang,
  toLang,
  disabled = false,
  onToggle,
  onFromLangChange,
  onToLangChange
}: Props) {
  const targetOptions = translationTargetOptionsForSelect(toLang)
  const toggleLabel = loading
    ? 'Translating…'
    : isShowingTranslation
      ? 'Show original'
      : 'Translate'

  return (
    <>
      <span className={messageActionDividerClass} aria-hidden />
      <TooltipIconButton
        type="button"
        variant="ghost"
        size="icon-xs"
        className={cn(messageActionButtonClass, isShowingTranslation && 'text-primary')}
        tooltip={toggleLabel}
        aria-label={toggleLabel}
        aria-pressed={isShowingTranslation}
        disabled={disabled || loading}
        onClick={() => void onToggle()}
      >
        {loading ? (
          <Loader2Icon className="size-3.5 animate-spin" />
        ) : (
          <Languages className="size-3.5" />
        )}
      </TooltipIconButton>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className={cn(messageActionButtonClass, '-ml-0.5')}
            aria-label="Translation settings"
            disabled={disabled || loading}
          >
            <ChevronDown className="size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className={cn('min-w-[12rem]', sidebarMenuSurfaceClass)}>
          <DropdownMenuLabel className="text-[11px] font-medium text-muted-foreground">
            Translation
          </DropdownMenuLabel>
          <DropdownMenuItem className={sidebarMenuItemClass} onSelect={() => void onToggle()}>
            {toggleLabel}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border/60" />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className={sidebarMenuSubTriggerClass}>
              <span className="min-w-0 flex-1 truncate">From</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent
              side="right"
              align="start"
              sideOffset={6}
              className={cn('min-w-[11rem]', sidebarMenuSurfaceClass)}
            >
              {SOURCE_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  className={sidebarMenuItemClass}
                  onSelect={() => onFromLangChange(option.value)}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  <Check
                    className={cn(
                      'ml-1 size-3 shrink-0',
                      fromLang === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className={sidebarMenuSubTriggerClass}>
              <span className="min-w-0 flex-1 truncate">To</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent
              side="right"
              align="start"
              sideOffset={6}
              className={cn('min-w-[11rem]', sidebarMenuSurfaceClass)}
            >
              {targetOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  className={sidebarMenuItemClass}
                  onSelect={() => onToLangChange(option.value)}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  <Check
                    className={cn(
                      'ml-1 size-3 shrink-0',
                      toLang === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
