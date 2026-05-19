import { Link, useLocation } from 'react-router-dom'
import { PanelLeft, Settings } from 'lucide-react'
import { useSettingsStore } from '@/entities/settings/model/store'
import { getInitials } from '@/shared/lib/user'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { SidebarFooter } from '@/shared/ui/sidebar'

interface SidebarUserFooterProps {
  onCustomize: () => void
}

export function SidebarUserFooter({ onCustomize }: SidebarUserFooterProps) {
  const location = useLocation()
  const displayName = useSettingsStore((s) => s.displayName)
  const initials = getInitials(displayName)
  const isSettings = location.pathname.startsWith('/settings')

  return (
    <SidebarFooter className="p-2">
      <div className="flex items-center gap-2 rounded-lg p-1.5">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground"
          aria-hidden
        >
          {initials}
        </div>
        <p className="min-w-0 flex-1 truncate text-sm text-sidebar-foreground">{displayName}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
          title="Customize sidebar"
          aria-label="Customize sidebar"
          onClick={onCustomize}
        >
          <PanelLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'size-7 shrink-0 text-muted-foreground hover:text-foreground',
            isSettings && 'bg-sidebar-accent text-sidebar-accent-foreground'
          )}
          asChild
          title="Settings"
        >
          <Link to="/settings/user">
            <Settings className="size-4" />
          </Link>
        </Button>
      </div>
    </SidebarFooter>
  )
}
