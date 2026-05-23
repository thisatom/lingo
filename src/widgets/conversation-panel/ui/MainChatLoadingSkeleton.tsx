import { Skeleton } from '@/shared/ui/skeleton'
import { Spinner } from '@/shared/ui/spinner'

/** Mirrors `MainPage` header + empty chat column while stores hydrate. */
export function MainChatLoadingSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <header className="flex shrink-0 items-center gap-2 p-2">
        <Skeleton className="size-6 shrink-0 rounded-md" />
        <Skeleton className="h-5 min-w-0 flex-1 max-w-[12rem] rounded-sm" />
        <Skeleton className="size-7 shrink-0 rounded-md" />
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6">
        <Spinner className="size-5 text-muted-foreground" />
        <div className="flex w-full max-w-md flex-col items-center gap-2">
          <Skeleton className="h-4 w-40 rounded-sm" />
          <Skeleton className="h-3 w-56 rounded-sm" />
        </div>
      </div>
    </div>
  )
}
