import { getAppSaveStepLabel, type AppSaveStep } from '@/app/lib/persist-app-state'
import { Spinner } from '@/shared/ui/spinner'
import { cn } from '@/shared/lib/utils'

interface AppShutdownOverlayProps {
  open: boolean
  step: AppSaveStep
  className?: string
}

export function AppShutdownOverlay({ open, step, className }: AppShutdownOverlayProps) {
  if (!open) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-[10000] flex items-center justify-center bg-background/70',
        'shadow-[inset_0_0_0_1px_hsl(var(--border)/0.35),inset_0_-100px_90px_-48px_rgba(0,0,0,0.28)]',
        'dark:shadow-[inset_0_0_0_1px_hsl(var(--border)/0.2),inset_0_-120px_100px_-40px_rgba(0,0,0,0.55)]',
        className
      )}
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-labelledby="app-shutdown-title"
      aria-describedby="app-shutdown-desc"
    >
      <div className="mx-4 w-full max-w-[20rem] rounded-xl border border-menu-border bg-popover px-5 py-4 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.35),0_12px_24px_-8px_rgba(0,0,0,0.2)] dark:shadow-[0_28px_56px_-12px_rgba(0,0,0,0.65),0_12px_28px_-8px_rgba(0,0,0,0.45)]">
        <div className="flex items-center gap-3">
          <Spinner className="size-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p
              id="app-shutdown-title"
              className="text-sm font-medium leading-snug text-foreground"
            >
              Saving your data
            </p>
            <p
              id="app-shutdown-desc"
              className="mt-0.5 text-xs leading-snug text-muted-foreground"
            >
              {getAppSaveStepLabel(step)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
