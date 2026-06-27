import { ArrowLeft, ColorMode, Cpu, Mic, Settings, Volume2, WandSparkles } from '@/shared/ui/icons'
import type { ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  SETTINGS_NAV_GROUPS,
  SETTINGS_SECTIONS,
  type SettingsSectionId
} from '@/entities/settings/config/sections'
import { cn } from '@/shared/lib/utils'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/shared/ui/sidebar'
import {
  sidebarChatActiveTextClass,
  sidebarChatHoverTextClass,
  sidebarChatRowRadiusClass,
  sidebarChatTextClass,
  sidebarNavIconColumnClass,
  sidebarRowHeightClass,
  sidebarNavLabelClass
} from '@/widgets/app-sidebar/lib/sidebar-chat-styles'

const navIconClass = 'size-4 shrink-0 opacity-70'

const iconBySection: Record<SettingsSectionId, ReactNode> = {
  general: <Settings className={navIconClass} />,
  appearance: <ColorMode className={navIconClass} />,
  devices: <Mic className={navIconClass} />,
  speech: <Volume2 className={navIconClass} />,
  agent: <WandSparkles className={navIconClass} />,
  api: <Cpu className={navIconClass} />
}

const sectionById = new Map(SETTINGS_SECTIONS.map((section) => [section.id, section]))

const sidebarNavButtonClass = cn(
  sidebarRowHeightClass,
  'flex w-full items-center gap-1.5 !px-0 !py-0',
  sidebarChatTextClass,
  'rounded-lg bg-transparent hover:bg-transparent active:bg-transparent',
  sidebarChatActiveTextClass
)

export function SettingsSidebarNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <SidebarMenu className="gap-0.5">
      <SidebarMenuItem
        className={cn(
          sidebarChatRowRadiusClass,
          sidebarChatHoverTextClass,
          'mb-2 text-muted-foreground hover:text-sidebar-accent-foreground'
        )}
      >
        <SidebarMenuButton className={sidebarNavButtonClass} onClick={() => navigate('/')}>
          <span className={sidebarNavIconColumnClass}>
            <ArrowLeft className={navIconClass} />
          </span>
          <span className={sidebarNavLabelClass}>Back</span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {SETTINGS_NAV_GROUPS.map((group, groupIndex) => (
        <div
          key={group.join('-')}
          className={cn('flex flex-col gap-0.5', groupIndex > 0 && 'mt-3')}
        >
          {group.map((sectionId) => {
            const section = sectionById.get(sectionId)
            if (!section) return null
            const isActive = pathname === section.path
            return (
              <SidebarMenuItem
                key={section.id}
                data-active={isActive ? true : undefined}
                className={cn(
                  sidebarChatRowRadiusClass,
                  !isActive && sidebarChatHoverTextClass,
                  isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
                )}
              >
                <SidebarMenuButton asChild isActive={isActive} className={sidebarNavButtonClass}>
                  <NavLink to={section.path}>
                    <span className={sidebarNavIconColumnClass}>{iconBySection[section.id]}</span>
                    <span className={sidebarNavLabelClass}>{section.label}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </div>
      ))}
    </SidebarMenu>
  )
}
