import { useState } from 'react'
import { ArrowDownAZ, ArrowUpAZ, Calendar, Check, Clock, List, ListFilter } from 'lucide-react'
import { useChatsStore } from '@/entities/chat/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'
import {
  SIDEBAR_CHAT_SORT_OPTIONS,
  type SidebarChatSort
} from '@/shared/lib/chat-sidebar'
import {
  sidebarMenuItemClass,
  sidebarMenuLabelClass,
  sidebarMenuSurfaceClass
} from '@/shared/lib/sidebar-filter-menu-styles'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/shared/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'

function FilterMenuItem({
  icon: Icon,
  label,
  selected,
  onSelect
}: {
  icon: typeof Clock
  label: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <DropdownMenuItem className={sidebarMenuItemClass} onSelect={onSelect}>
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <Check className={cn('ml-1 size-3 shrink-0', selected ? 'opacity-100' : 'opacity-0')} />
    </DropdownMenuItem>
  )
}

function sortIcon(sort: SidebarChatSort) {
  if (sort.startsWith('name')) {
    return sort === 'name-asc' ? ArrowDownAZ : ArrowUpAZ
  }
  if (sort.startsWith('created')) {
    return Calendar
  }
  return Clock
}

export function SidebarFilterMenu() {
  const sidebarShowDateGroups = useSettingsStore((s) => s.sidebarShowDateGroups)
  const setSidebarShowDateGroups = useSettingsStore((s) => s.setSidebarShowDateGroups)
  const sidebarChatSort = useSettingsStore((s) => s.sidebarChatSort)
  const setSidebarChatSort = useSettingsStore((s) => s.setSidebarChatSort)
  const resortChats = useChatsStore((s) => s.resortChats)
  const [menuOpen, setMenuOpen] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)

  const showTooltip = tooltipOpen && !menuOpen

  const applySort = (sort: SidebarChatSort) => {
    setSidebarChatSort(sort)
    resortChats()
  }

  return (
    <DropdownMenu
      open={menuOpen}
      onOpenChange={(open) => {
        setMenuOpen(open)
        if (open) setTooltipOpen(false)
      }}
    >
      <Tooltip open={showTooltip} delayDuration={0} disableHoverableContent>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                'size-7 shrink-0 text-muted-foreground hover:text-foreground',
                menuOpen && 'bg-sidebar-accent text-sidebar-accent-foreground'
              )}
              aria-label="Filter chats"
              onPointerEnter={() => setTooltipOpen(true)}
              onPointerLeave={() => setTooltipOpen(false)}
              onFocus={() => setTooltipOpen(false)}
              onPointerDown={() => setTooltipOpen(false)}
            >
              <ListFilter className="size-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6}>
          Filter chats
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={6}
        className={cn('w-52 p-1', sidebarMenuSurfaceClass)}
      >
        <DropdownMenuLabel className={sidebarMenuLabelClass}>Sort by</DropdownMenuLabel>

        {SIDEBAR_CHAT_SORT_OPTIONS.map((option) => {
          const Icon = sortIcon(option.value)
          return (
            <FilterMenuItem
              key={option.value}
              icon={Icon}
              label={option.label}
              selected={sidebarChatSort === option.value}
              onSelect={() => applySort(option.value)}
            />
          )
        })}

        <DropdownMenuSeparator className="my-1 bg-border/60" />

        <DropdownMenuLabel className={sidebarMenuLabelClass}>Group by</DropdownMenuLabel>

        <FilterMenuItem
          icon={Clock}
          label="Updated"
          selected={sidebarShowDateGroups}
          onSelect={() => setSidebarShowDateGroups(true)}
        />
        <FilterMenuItem
          icon={List}
          label="Flat list"
          selected={!sidebarShowDateGroups}
          onSelect={() => setSidebarShowDateGroups(false)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
