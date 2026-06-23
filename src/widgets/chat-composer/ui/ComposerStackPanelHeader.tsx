import type { ReactNode } from 'react'
import { ChevronDown, Search, X } from '@/shared/ui/icons'
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
  onToggleSearch: () => void
  searchPlaceholder?: string
}

const searchToggleClass = cn(
  'size-7 shrink-0 bg-transparent text-muted-foreground shadow-none',
  'hover:bg-transparent hover:text-foreground',
  'dark:hover:bg-transparent dark:hover:text-foreground',
  'focus-visible:bg-transparent'
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
  onToggleSearch,
  searchPlaceholder = 'Search…'
}: Props) {
  return (
    <div className="px-3 py-2">
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
          <TooltipIconButton
            type="button"
            variant="ghost"
            size="iconSm"
            className={cn(searchToggleClass, searchOpen && 'text-foreground')}
            tooltip={searchOpen ? 'Close search' : 'Search'}
            aria-label={searchOpen ? 'Close search' : 'Search list'}
            aria-pressed={searchOpen}
            onClick={onToggleSearch}
          >
            <Search className="size-3.5" />
          </TooltipIconButton>
          <button
            type="button"
            className="flex shrink-0 cursor-pointer items-center gap-0.5 whitespace-nowrap text-xs text-muted-foreground transition-colors hover:text-foreground"
            aria-expanded={!listCollapsed}
            aria-controls={listId}
            onClick={onToggleCollapse}
          >
            {listCollapsed ? collapseShowLabel : collapseHideLabel}
            <ChevronDown
              className={cn('size-3 opacity-70 transition-transform', listCollapsed && '-rotate-90')}
              aria-hidden
            />
          </button>
        </div>
      </div>

      {searchOpen ? (
        <div className="relative mt-2">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder={searchPlaceholder}
            className={cn(
              'h-7 w-full rounded-md border border-border bg-input py-0 pl-8 pr-8 text-xs leading-none text-foreground',
              'placeholder:text-muted-foreground outline-none focus-visible:border-ring'
            )}
            aria-label={searchPlaceholder}
          />
          {searchQuery ? (
            <button
              type="button"
              className="absolute right-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
              onClick={() => onSearchQueryChange('')}
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
