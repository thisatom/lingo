import { Spinner } from '@/shared/ui/spinner'

export function ChatStartupSpinner() {
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center bg-background">
      <Spinner className="size-5 text-muted-foreground" />
    </div>
  )
}
