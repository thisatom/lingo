import type { ReactNode, RefObject } from 'react'
import { ChevronDown, Search, X } from '@/shared/ui/icons'
import { FieldContextMenu } from '@/features/chat-composer/ui/FieldContextMenu'
import { composerPanelSearchInputClass, composerStackPanelHeaderClass } from '@/widgets/chat-composer/lib/composer-stack-panel'
import { iconButtonHoverClass } from '@/shared/lib/design-surface'
import { cn } from '@/shared/lib/utils'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'

type Props = {
  count: number
  countLabel: string
  metaIcon: ReactNode
  metaSuffix: string
  listCollapsed: boolean
  onToggleCollapse: () => void
  collapseShowLabel: string
  collapseHideLabel: string
  listId: string
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  searchOpen: boolean
  onSearchClick: () => void
  searchInputRef: RefObject<HTMLInputElement | null>
  searchPlaceholder?: string
}

const searchToggleClass = cn(
  'size-7 shrink-0 text-muted-foreground shadow-none',
  iconButtonHoverClass
)

export function ComposerStackPanelHeader({
  count,
  countLabel,
  metaIcon,
  metaSuffix,
  listCollapsed,
  onToggleCollapse,
  collapseShowLabel,
  collapseHideLabel,
  listId,
  searchQuery,
  onSearchQueryChange,
  searchOpen,
  onSearchClick,
  searchInputRef,
  searchPlaceholder = 'Search…'
}: Props) {
  const showSearchField = !listCollapsed && searchOpen

  return (
    <div className={composerStackPanelHeaderClass(listCollapsed)}>
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-xs">
          <span className="shrink-0 font-medium text-foreground">
            {count} {countLabel}
          </span>
          <span className="inline-flex min-w-0 items-center gap-1 text-muted-foreground">
            <span className="shrink-0" aria-hidden>
              {metaIcon}
            </span>
            <span className="truncate">{metaSuffix}</span>
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!listCollapsed ? (
            <TooltipIconButton
              type="button"
              variant="ghost"
              size="iconSm"
              className={cn(searchToggleClass, searchOpen && 'text-foreground')}
              tooltip={searchOpen ? 'Close search' : 'Search'}
              aria-label={searchOpen ? 'Close search' : 'Search list'}
              aria-pressed={searchOpen}
              onClick={onSearchClick}
            >
              <Search className="size-3.5" />
            </TooltipIconButton>
          ) : null}
          <button
            type="button"
            className="flex shrink-0 cursor-pointer items-center gap-0.5 whitespace-nowrap rounded-lg px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-expanded={!listCollapsed}
            aria-controls={listId}
            onClick={onToggleCollapse}
          >
            {listCollapsed ? collapseShowLabel : collapseHideLabel}
            <ChevronDown
              className={cn(
                'size-3 opacity-70 transition-transform duration-200',
                !listCollapsed && 'rotate-180'
              )}
              aria-hidden
            />
          </button>
        </div>
      </div>

      {showSearchField ? (
        <FieldContextMenu fieldRef={searchInputRef} onValueChange={onSearchQueryChange}>
          <div className="relative mt-2">
            <Search
              className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              ref={searchInputRef}
              type="text"
              inputMode="search"
              autoComplete="off"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder={searchPlaceholder}
              className={cn(
                composerPanelSearchInputClass,
                searchQuery ? 'pr-7' : 'pr-2'
              )}
              aria-label={searchPlaceholder}
            />
            {searchQuery ? (
              <button
                type="button"
                className="absolute right-1.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
                onClick={() => onSearchQueryChange('')}
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
        </FieldContextMenu>
      ) : null}
    </div>
  )
}
