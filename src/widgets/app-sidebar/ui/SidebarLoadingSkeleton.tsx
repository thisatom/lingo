import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu
} from '@/shared/ui/sidebar'
import { Skeleton } from '@/shared/ui/skeleton'
import { APP_RADIUS_8_CLASS } from '@/shared/lib/layout'
import { cn } from '@/shared/lib/utils'
import { sidebarRowHeightClass } from '@/widgets/app-sidebar/lib/sidebar-chat-styles'
import { SidebarChatRowSkeleton } from '@/widgets/app-sidebar/ui/SidebarChatRowSkeleton'

export function SidebarLoadingSkeleton() {
  return (
    <Sidebar collapsible="none" className="flex h-full w-full min-w-0 flex-col overflow-hidden bg-sidebar">
      <SidebarHeader className="gap-2 p-2">
        <div className="flex items-center gap-0.5 px-1">
          <Skeleton className="size-6 shrink-0 rounded-md" />
          <Skeleton className="size-6 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1" />
          <Skeleton className="size-6 shrink-0 rounded-md" />
          <Skeleton className="size-6 shrink-0 rounded-md" />
        </div>
        <Skeleton
          className={cn(
            'mx-1 w-[calc(100%-0.5rem)] rounded-md',
            sidebarRowHeightClass,
            APP_RADIUS_8_CLASS
          )}
        />
      </SidebarHeader>

      <SidebarContent className="min-h-0 flex-1 gap-2 overflow-hidden px-2">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="h-auto px-2 py-1 text-xs">
            <Skeleton className="h-3 w-10 rounded-sm" />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <SidebarChatRowSkeleton />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="h-auto px-2 py-1 text-xs">
            <Skeleton className="h-3 w-12 rounded-sm" />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {Array.from({ length: 6 }, (_, i) => (
                <SidebarChatRowSkeleton key={i} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <div className="flex items-center gap-2 rounded-[8px] p-1.5">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <Skeleton className="h-3.5 min-w-0 flex-1 rounded-sm" />
          <Skeleton className="size-7 shrink-0 rounded-md" />
          <Skeleton className="size-7 shrink-0 rounded-md" />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
