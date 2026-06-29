import { Spinner } from '@/shared/ui/spinner'
import { cn } from '@/shared/lib/utils'
import { sidebarRowActionSizeClass } from '@/widgets/app-sidebar/lib/sidebar-chat-styles'

/** Spinner — agent work indicator in the sidebar chat list. */
export function AgentClusterDots({ className }: { className?: string }) {
  return (
    <span
      className={cn('flex items-center justify-center', sidebarRowActionSizeClass, className)}
      aria-hidden
    >
      <Spinner size="sm" className="text-muted-foreground" />
    </span>
  )
}
