import { Link, useLocation } from 'react-router-dom'
import { Settings } from '@/shared/ui/icons'
import { SidebarFilterMenu } from '@/features/sidebar-customize/ui/SidebarFilterMenu'
import { useSettingsStore } from '@/entities/settings/model/store'
import { getInitials } from '@/shared/lib/user'
import { APP_RADIUS_8_CLASS } from '@/shared/lib/layout'
import { cn } from '@/shared/lib/utils'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { SidebarFooter } from '@/shared/ui/sidebar'
import { TooltipWrap } from '@/shared/ui/tooltip-wrap'
import { sidebarChromeIconButtonClass } from '@/widgets/app-sidebar/lib/sidebar-chat-styles'

export function SidebarUserFooter({ insetClassName }: { insetClassName?: string }) {
  const location = useLocation()
  const displayName = useSettingsStore((s) => s.displayName)
  const initials = getInitials(displayName)
  const isSettings = location.pathname.startsWith('/settings')

  return (
    <SidebarFooter className={cn('shrink-0 py-2', insetClassName)}>
      <div className={cn('flex min-w-0 items-center gap-2 rounded-lg py-1', APP_RADIUS_8_CLASS)}>
        <Avatar className="size-8 shrink-0" aria-hidden>
          <AvatarFallback className="bg-muted text-xs font-medium text-foreground">{initials}</AvatarFallback>
        </Avatar>
        <p className="min-w-0 flex-1 truncate text-sm leading-normal text-sidebar-foreground">{displayName}</p>
        {!isSettings && <SidebarFilterMenu />}
        <TooltipWrap label="Settings">
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn(
              sidebarChromeIconButtonClass,
              isSettings && 'bg-sidebar-accent text-sidebar-accent-foreground'
            )}
            asChild
            aria-label="Settings"
          >
            <Link to={isSettings ? '/' : '/settings/general'}>
              <Settings className="size-4" />
            </Link>
          </Button>
        </TooltipWrap>
      </div>
    </SidebarFooter>
  )
}
