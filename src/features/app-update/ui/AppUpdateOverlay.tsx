import {
  getAppUpdateProgressLabel,
  isAppUpdateOverlayVisible
} from '@/features/app-update/lib/app-update-progress-label'
import { AppUpdateProgressSteps } from '@/features/app-update/ui/AppUpdateProgressSteps'
import { dialogOverlayClass, modalSurfaceClass } from '@/shared/lib/design-surface'
import { Spinner } from '@/shared/ui/spinner'
import { cn } from '@/shared/lib/utils'
import type { AppUpdateProgress } from '@/shared/types/ipc'

interface AppUpdateOverlayProps {
  progress: AppUpdateProgress | null
  updateName?: string | null
  className?: string
}

export function AppUpdateOverlay({ progress, updateName, className }: AppUpdateOverlayProps) {
  if (!isAppUpdateOverlayVisible(progress) || !progress) return null

  const label = getAppUpdateProgressLabel(progress)
  const versionLabel = progress.version ? `v${progress.version}` : null
  const title = updateName?.trim() || (versionLabel ? `Updating to ${versionLabel}` : 'Updating Lingo')
  const showBar = progress.phase === 'downloading' && progress.percent != null && progress.percent > 0
  const barPercent = showBar ? progress.percent! : 0

  return (
    <div
      className={cn(
        'fixed inset-0 z-[10000] flex items-center justify-center p-4',
        dialogOverlayClass,
        className
      )}
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-live="polite"
      aria-labelledby="app-update-title"
      aria-describedby="app-update-desc"
    >
      <div className={cn('w-full max-w-[24rem] px-5 py-5', modalSurfaceClass)}>
        <div className="flex items-start gap-3">
          <Spinner className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p id="app-update-title" className="text-sm font-semibold leading-snug text-foreground">
              {title}
            </p>
            <p id="app-update-desc" className="mt-1 text-xs leading-snug text-muted-foreground">
              {label}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <AppUpdateProgressSteps phase={progress.phase} />
        </div>

        {showBar ? (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Download progress</span>
              {progress.percent != null && progress.percent > 0 ? (
                <span className="tabular-nums">{progress.percent}%</span>
              ) : null}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-200"
                style={{ width: `${barPercent}%` }}
              />
            </div>
          </div>
        ) : null}

        <p className="mt-4 text-[11px] leading-snug text-muted-foreground">
          Keep Lingo open until the update finishes. The app will restart automatically.
        </p>
      </div>
    </div>
  )
}
