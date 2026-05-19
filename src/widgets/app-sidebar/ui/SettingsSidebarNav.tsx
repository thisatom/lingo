import { ChevronLeft } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { SETTINGS_SECTIONS } from '@/entities/settings/config/sections'
import { cn } from '@/shared/lib/utils'
import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from '@/shared/ui/item'

const navItemClass = cn(
  'w-full border-0 text-sidebar-foreground shadow-none',
  'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
  'focus-visible:border-transparent focus-visible:ring-1 focus-visible:ring-sidebar-ring'
)

export function SettingsSidebarNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <ItemGroup className="gap-0.5 pt-2">
      <Item
        asChild
        size="nav"
        className={cn(navItemClass, 'mb-2 text-muted-foreground hover:text-sidebar-foreground')}
      >
        <button type="button" onClick={() => navigate('/')}>
          <ItemMedia className="size-4 shrink-0 bg-transparent [&_svg]:size-3.5">
            <ChevronLeft />
          </ItemMedia>
          <ItemContent className="min-w-0 flex-1 flex-row items-center">
            <ItemTitle className="truncate text-[13px] font-normal leading-normal text-inherit">
              Back
            </ItemTitle>
          </ItemContent>
        </button>
      </Item>

      {SETTINGS_SECTIONS.map((section) => {
        const isActive = pathname === section.path
        return (
          <Item
            key={section.id}
            asChild
            size="nav"
            className={cn(
              navItemClass,
              isActive && 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
            )}
          >
            <NavLink to={section.path}>
              <ItemContent className="min-w-0 flex-1">
                <ItemTitle
                  className={cn(
                    'w-full truncate text-[13px] font-normal leading-normal text-inherit',
                    isActive && 'font-medium'
                  )}
                >
                  {section.label}
                </ItemTitle>
              </ItemContent>
            </NavLink>
          </Item>
        )
      })}
    </ItemGroup>
  )
}
