import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuSkeleton
} from '@/shared/ui/sidebar'
import { Skeleton } from '@/shared/ui/skeleton'

export function SidebarLoadingSkeleton() {
  return (
    <Sidebar collapsible="none" className="flex h-full w-full min-w-0 flex-col overflow-hidden bg-sidebar">
      <SidebarHeader className="gap-2 p-2">
        <div className="flex items-center gap-0.5 px-1">
          <Skeleton className="size-7 rounded-md" />
          <Skeleton className="size-7 rounded-md" />
          <div className="min-w-0 flex-1" />
          <Skeleton className="size-7 rounded-md" />
          <Skeleton className="size-7 rounded-md" />
        </div>
        <Skeleton className="mx-1 h-8 w-[calc(100%-0.5rem)] rounded-md" />
      </SidebarHeader>

      <SidebarContent className="min-h-0 flex-1 gap-2 overflow-hidden px-2">
        <Skeleton className="h-3 w-12" />
        <SidebarMenu className="gap-1">
          {Array.from({ length: 6 }, (_, i) => (
            <SidebarMenuSkeleton key={i} showIcon />
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <div className="flex items-center gap-2 rounded-lg p-1.5">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="size-7 shrink-0 rounded-md" />
          <Skeleton className="size-7 shrink-0 rounded-md" />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
