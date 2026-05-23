import { Skeleton } from '@/shared/ui/skeleton'
import { cn } from '@/shared/lib/utils'
import {
  sidebarChatRowRadiusClass,
  sidebarRowHeightClass
} from '@/widgets/app-sidebar/lib/sidebar-chat-styles'

/** Matches `ChatListItem` row geometry (indicator + title). */
export function SidebarChatRowSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative flex items-center',
        sidebarRowHeightClass,
        sidebarChatRowRadiusClass,
        className
      )}
    >
      <Skeleton className="absolute left-2.5 top-1/2 size-1.5 -translate-y-1/2 rounded-full" />
      <Skeleton className="ml-8 mr-8 h-3.5 max-w-[88%] flex-1 rounded-sm" />
    </div>
  )
}
