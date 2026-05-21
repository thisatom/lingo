import { ArrowLeft, Cpu, Mic, User, Volume2, WandSparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { SETTINGS_SECTIONS } from '@/entities/settings/config/sections'
import { APP_RADIUS_8_CLASS } from '@/shared/lib/layout'
import { cn } from '@/shared/lib/utils'
import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from '@/shared/ui/item'
import {
  sidebarChatHoverTextClass,
  sidebarChatTextClass
} from '@/widgets/app-sidebar/lib/sidebar-chat-styles'

const navItemClass = cn(
  'w-full border-0 shadow-none',
  APP_RADIUS_8_CLASS,
  sidebarChatTextClass,
  sidebarChatHoverTextClass,
  'focus-visible:border-transparent focus-visible:ring-1 focus-visible:ring-sidebar-ring'
)

const navIconClass = 'size-4 shrink-0 opacity-70'

export function SettingsSidebarNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const iconBySection: Record<string, ReactNode> = {
    user: <User className={navIconClass} />,
    devices: <Mic className={navIconClass} />,
    speech: <Volume2 className={navIconClass} />,
    practice: <WandSparkles className={navIconClass} />,
    api: <Cpu className={navIconClass} />
  }

  return (
    <ItemGroup className="gap-0.5 pt-2">
      <Item
        asChild
        size="nav"
        className={cn(navItemClass, 'mb-2 text-muted-foreground hover:text-sidebar-accent-foreground')}
      >
        <button type="button" onClick={() => navigate('/')}>
          <ItemMedia className="size-4 shrink-0 bg-transparent [&_svg]:size-3.5">
            <ArrowLeft />
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
              isActive && 'bg-sidebar-accent font-normal text-sidebar-accent-foreground'
            )}
          >
            <NavLink to={section.path}>
              <ItemMedia className="size-4 shrink-0 bg-transparent [&_svg]:size-3.5">
                {iconBySection[section.id] ?? <User className={navIconClass} />}
              </ItemMedia>
              <ItemContent className="min-w-0 flex-1">
                <ItemTitle className="w-full truncate text-[13px] font-normal leading-normal text-inherit">
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
