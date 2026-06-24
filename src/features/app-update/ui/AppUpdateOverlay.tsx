import {
  getAppUpdateProgressLabel,
  isAppUpdateOverlayVisible
} from '@/features/app-update/lib/app-update-progress-label'
import { Spinner } from '@/shared/ui/spinner'
import { cn } from '@/shared/lib/utils'
import type { AppUpdateProgress } from '@/shared/types/ipc'

interface AppUpdateOverlayProps {
  progress: AppUpdateProgress | null
  className?: string
}

export function AppUpdateOverlay({ progress, className }: AppUpdateOverlayProps) {
  if (!isAppUpdateOverlayVisible(progress) || !progress) return null

  const label = getAppUpdateProgressLabel(progress)

  return (
    <div
      className={cn(
        'fixed inset-0 z-[10000] flex items-center justify-center bg-background/75',
        'shadow-[inset_0_0_0_1px_hsl(var(--border)/0.35)]',
        className
      )}
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-live="polite"
      aria-labelledby="app-update-title"
      aria-describedby="app-update-desc"
    >
      <div className="mx-4 w-full max-w-[22rem] rounded-xl border border-menu-border bg-popover px-5 py-4 shadow-lg">
        <div className="flex items-start gap-3">
          <Spinner className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p id="app-update-title" className="text-sm font-medium leading-snug text-foreground">
              Updating Lingo
            </p>
            <p id="app-update-desc" className="mt-1 text-xs leading-snug text-muted-foreground">
              {label}
            </p>
            {progress.phase === 'downloading' && progress.percent != null ? (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-200"
                  style={{ width: `${Math.max(4, progress.percent)}%` }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
