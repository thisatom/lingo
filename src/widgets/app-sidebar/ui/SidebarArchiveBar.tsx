import { Archive, ArrowLeft } from '@/shared/ui/icons'
import { SIDEBAR_INSET_CLASS } from '@/shared/lib/layout'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import {
  sidebarBackIconClass,
  sidebarNavIconColumnClass,
  sidebarNavLabelClass,
  sidebarRowHeightClass
} from '@/widgets/app-sidebar/lib/sidebar-chat-styles'

interface SidebarArchiveBarProps {
  showArchived: boolean
  onToggle: () => void
}

/** Archive toggle — same vertical rhythm as sidebar header chrome (`pt-2 pb-1`). */
export function SidebarArchiveBar({ showArchived, onToggle }: SidebarArchiveBarProps) {
  return (
    <div className={cn('shrink-0 pt-2 pb-1', SIDEBAR_INSET_CLASS)}>
      <Button
        type="button"
        variant="ghost"
        className={cn(
          sidebarRowHeightClass,
          'w-full justify-start gap-0 px-0 text-xs font-normal text-muted-foreground hover:bg-accent hover:text-foreground'
        )}
        onClick={onToggle}
      >
        <span className={sidebarNavIconColumnClass}>
          {showArchived ? (
            <ArrowLeft className={sidebarBackIconClass} />
          ) : (
            <Archive className={sidebarBackIconClass} />
          )}
        </span>
        <span className={sidebarNavLabelClass}>{showArchived ? 'Back to chats' : 'Archive'}</span>
      </Button>
    </div>
  )
}
