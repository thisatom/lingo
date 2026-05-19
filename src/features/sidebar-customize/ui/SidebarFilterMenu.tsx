import { useState } from 'react'
import { Calendar, Check, Clock, List, ListFilter, Pin } from 'lucide-react'
import { useSettingsStore } from '@/entities/settings/model/store'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'

const menuSurfaceClass = 'border-border/60 bg-[#181818] text-popover-foreground shadow-lg'

const menuItemClass =
  'h-6 min-h-6 cursor-pointer gap-2 py-0 pr-2 pl-2 text-xs leading-none'

const menuLabelClass = 'px-2 py-1 text-xs font-normal leading-none text-muted-foreground'

const menuSubTriggerClass = cn(menuItemClass, 'pr-7')

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
    <DropdownMenuItem className={menuItemClass} onSelect={onSelect}>
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <Check className={cn('ml-1 size-3 shrink-0', selected ? 'opacity-100' : 'opacity-0')} />
    </DropdownMenuItem>
  )
}

export function SidebarFilterMenu() {
  const sidebarShowDateGroups = useSettingsStore((s) => s.sidebarShowDateGroups)
  const setSidebarShowDateGroups = useSettingsStore((s) => s.setSidebarShowDateGroups)
  const [menuOpen, setMenuOpen] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)

  const showTooltip = tooltipOpen && !menuOpen

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
              className="size-7 shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
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
        className={cn('w-52 p-1', menuSurfaceClass)}
      >
        <DropdownMenuLabel className={menuLabelClass}>Group by</DropdownMenuLabel>

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

        <DropdownMenuSeparator className="my-1 bg-border/60" />

        <DropdownMenuLabel className={menuLabelClass}>Show</DropdownMenuLabel>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className={menuSubTriggerClass}>
            <Pin className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">Pinned</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent sideOffset={4} className={cn('w-44 p-1', menuSurfaceClass)}>
            <DropdownMenuItem disabled className={menuItemClass}>
              <Check className="size-3 opacity-100" />
              Always visible
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className={menuSubTriggerClass}>
            <Calendar className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">Date groups</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent sideOffset={4} className={cn('w-44 p-1', menuSurfaceClass)}>
            <FilterMenuItem
              icon={Calendar}
              label="Section headers"
              selected={sidebarShowDateGroups}
              onSelect={() => setSidebarShowDateGroups(true)}
            />
            <FilterMenuItem
              icon={List}
              label="Hide headers"
              selected={!sidebarShowDateGroups}
              onSelect={() => setSidebarShowDateGroups(false)}
            />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
