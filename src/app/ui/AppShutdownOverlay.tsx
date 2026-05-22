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
        'fixed inset-0 z-[10000] flex items-center justify-center bg-overlay/55 backdrop-blur-[2px]',
        className
      )}
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-labelledby="app-shutdown-title"
      aria-describedby="app-shutdown-desc"
    >
      <div className="mx-4 w-full max-w-[20rem] rounded-xl border border-menu-border bg-popover px-5 py-4 shadow-xl">
        <div className="flex items-center gap-3">
          <Spinner className="size-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p
              id="app-shutdown-title"
              className="text-sm font-medium leading-snug text-foreground"
            >
              Сохранение данных
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
