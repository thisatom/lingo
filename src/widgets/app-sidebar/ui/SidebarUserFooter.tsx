import { Link, useLocation } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { SidebarFilterMenu } from '@/features/sidebar-customize/ui/SidebarFilterMenu'
import { useSettingsStore } from '@/entities/settings/model/store'
import { getInitials } from '@/shared/lib/user'
import { cn } from '@/shared/lib/utils'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { SidebarFooter } from '@/shared/ui/sidebar'
import { TooltipWrap } from '@/shared/ui/tooltip-wrap'

export function SidebarUserFooter() {
  const location = useLocation()
  const displayName = useSettingsStore((s) => s.displayName)
  const initials = getInitials(displayName)
  const isSettings = location.pathname.startsWith('/settings')

  return (
    <SidebarFooter className="p-2">
      <div className="flex items-center gap-2 rounded-[8px] p-1.5">
        <Avatar className="size-8 shrink-0" aria-hidden>
          <AvatarFallback className="bg-muted text-xs font-medium text-foreground">{initials}</AvatarFallback>
        </Avatar>
        <p className="min-w-0 flex-1 truncate text-sm text-sidebar-foreground">{displayName}</p>
        <SidebarFilterMenu />
        <TooltipWrap label="Settings">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'size-7 shrink-0 text-muted-foreground hover:text-foreground',
              isSettings && 'bg-sidebar-accent text-sidebar-accent-foreground'
            )}
            asChild
            aria-label="Settings"
          >
            <Link to="/settings/user">
              <Settings className="size-4" />
            </Link>
          </Button>
        </TooltipWrap>
      </div>
    </SidebarFooter>
  )
}
