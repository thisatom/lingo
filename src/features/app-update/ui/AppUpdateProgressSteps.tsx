import {
  APP_UPDATE_ACTIVE_PHASES,
  isAppUpdateStepComplete,
  isAppUpdateStepCurrent
} from '@/features/app-update/lib/app-update-phases'
import { cn } from '@/shared/lib/utils'
import type { AppUpdatePhase } from '@/shared/types/ipc'

interface AppUpdateProgressStepsProps {
  phase: AppUpdatePhase
  className?: string
}

export function AppUpdateProgressSteps({ phase, className }: AppUpdateProgressStepsProps) {
  return (
    <ol className={cn('flex items-center gap-1', className)} aria-label="Update progress">
      {APP_UPDATE_ACTIVE_PHASES.map((step, index) => {
        const complete = isAppUpdateStepComplete(step.id, phase)
        const current = isAppUpdateStepCurrent(step.id, phase)

        return (
          <li key={step.id} className="flex min-w-0 flex-1 items-center gap-1">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span
                className={cn(
                  'flex size-2 shrink-0 rounded-full transition-colors',
                  complete || current ? 'bg-primary' : 'bg-muted-foreground/30'
                )}
                aria-hidden
              />
              <span
                className={cn(
                  'w-full truncate text-center text-[10px] leading-none',
                  current ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
            {index < APP_UPDATE_ACTIVE_PHASES.length - 1 ? (
              <span
                className={cn(
                  'mb-3 h-px w-full min-w-[0.5rem] max-w-[1.25rem] shrink',
                  complete ? 'bg-primary/60' : 'bg-border'
                )}
                aria-hidden
              />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
