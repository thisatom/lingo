import {
  CircleCheckIcon,
  InfoIcon,
  OctagonXIcon,
  TriangleAlertIcon
} from 'lucide-react'
import { toast } from 'sonner'
import { X } from '@/shared/ui/icons'
import {
  confirmActionDialogCloseClass,
  surfaceTitleRowClass
} from '@/shared/lib/confirm-action-dialog-styles'
import { cn } from '@/shared/lib/utils'
import { Spinner } from '@/shared/ui/spinner'

export type LingoToastVariant = 'default' | 'success' | 'info' | 'warning' | 'error' | 'loading'

export interface LingoToastAction {
  label: string
  onClick: () => void
}

export interface LingoToastOptions {
  id?: string | number
  description?: string
  duration?: number
  variant?: LingoToastVariant
  action?: LingoToastAction
  cancel?: LingoToastAction
}

const lingoToastShellClass = cn(
  'lingo-toast pointer-events-auto w-[356px] max-w-[calc(100vw-2rem)]',
  'rounded-lg border border-border bg-popover px-4 pt-2.5 pb-3 text-popover-foreground shadow-md'
)

const lingoToastActionClass = cn(
  'inline-flex h-7 shrink-0 items-center justify-center rounded-md border border-border/60',
  'bg-secondary px-3 text-xs font-medium text-secondary-foreground',
  'transition-colors hover:bg-secondary/80'
)

const lingoToastCancelClass = cn(
  'inline-flex h-7 shrink-0 items-center justify-center rounded-md px-3',
  'text-xs font-medium text-muted-foreground transition-colors hover:text-foreground'
)

function ToastVariantIcon({ variant }: { variant: LingoToastVariant }) {
  const className = 'size-4 shrink-0 text-muted-foreground'
  switch (variant) {
    case 'success':
      return <CircleCheckIcon className={className} aria-hidden />
    case 'info':
      return <InfoIcon className={className} aria-hidden />
    case 'warning':
      return <TriangleAlertIcon className={className} aria-hidden />
    case 'error':
      return <OctagonXIcon className={className} aria-hidden />
    case 'loading':
      return <Spinner size="sm" className={className} aria-hidden />
    default:
      return <InfoIcon className={className} aria-hidden />
  }
}

interface LingoToastContentProps extends LingoToastOptions {
  toastId: string | number
  title: string
}

function LingoToastContent({
  toastId,
  title,
  description,
  variant = 'default',
  action,
  cancel
}: LingoToastContentProps) {
  const hasActions = Boolean(action || cancel)

  return (
    <div className={lingoToastShellClass}>
      <div className="flex gap-3">
        <div className="flex w-4 shrink-0 items-start pt-0.5">
          <ToastVariantIcon variant={variant} />
        </div>

        <div className="min-w-0 flex-1">
          <div className={surfaceTitleRowClass}>
            <p className="min-w-0 flex-1 pr-1 text-sm font-medium leading-snug text-foreground">
              {title}
            </p>
            <button
              type="button"
              className={confirmActionDialogCloseClass}
              aria-label="Close"
              onClick={() => toast.dismiss(toastId)}
            >
              <X className="size-4" />
            </button>
          </div>

          {description ? (
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{description}</p>
          ) : null}

          {hasActions ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {action ? (
                <button type="button" className={lingoToastActionClass} onClick={action.onClick}>
                  {action.label}
                </button>
              ) : null}
              {cancel ? (
                <button type="button" className={lingoToastCancelClass} onClick={cancel.onClick}>
                  {cancel.label}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

const lingoToastWrapperClass =
  '!border-0 !bg-transparent !p-0 !shadow-none !ring-0 group-[.toaster]:!border-0'

function showLingoToast(title: string, options: LingoToastOptions = {}) {
  const { id, duration, variant = 'default', description, action, cancel } = options

  return toast.custom(
    (toastId) => (
      <LingoToastContent
        toastId={toastId}
        title={title}
        description={description}
        variant={variant}
        action={action}
        cancel={cancel}
      />
    ),
    {
      id,
      duration,
      classNames: {
        toast: lingoToastWrapperClass
      }
    }
  )
}

export const lingoToast = {
  message: (title: string, options?: LingoToastOptions) =>
    showLingoToast(title, { ...options, variant: options?.variant ?? 'default' }),
  info: (title: string, options?: Omit<LingoToastOptions, 'variant'>) =>
    showLingoToast(title, { ...options, variant: 'info' }),
  success: (title: string, options?: Omit<LingoToastOptions, 'variant'>) =>
    showLingoToast(title, { ...options, variant: 'success' }),
  warning: (title: string, options?: Omit<LingoToastOptions, 'variant'>) =>
    showLingoToast(title, { ...options, variant: 'warning' }),
  error: (title: string, options?: Omit<LingoToastOptions, 'variant'>) =>
    showLingoToast(title, { ...options, variant: 'error' }),
  loading: (title: string, options?: Omit<LingoToastOptions, 'variant'>) =>
    showLingoToast(title, { ...options, variant: 'loading' }),
  dismiss: toast.dismiss
}
