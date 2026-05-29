import type { ReactNode } from 'react'
import { X } from '@/shared/ui/icons'
import {
  confirmActionDialogCancelClass,
  confirmActionDialogCloseClass,
  confirmActionDialogContentClass,
  confirmActionDialogDescriptionClass,
  confirmActionDialogFooterCheckboxClass,
  confirmActionDialogFooterLabelClass,
  confirmActionDialogHeaderClass,
  confirmActionDialogPrimaryClass,
  confirmActionDialogPrimaryStyle,
  confirmActionDialogSeparatorClass,
  confirmActionDialogTitleClass
} from '@/shared/lib/confirm-action-dialog-styles'
import { cn } from '@/shared/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle
} from '@/shared/ui/alert-dialog'
import { Checkbox } from '@/shared/ui/checkbox'

export interface ConfirmActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  primaryLabel: string
  onPrimary: () => void
  primaryVariant?: 'accent' | 'destructive'
  cancelLabel?: string
  showDontAskAgain?: boolean
  dontAskAgain?: boolean
  onDontAskAgainChange?: (checked: boolean) => void
  dontAskAgainLabel?: string
  dontAskAgainId?: string
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  primaryLabel,
  onPrimary,
  primaryVariant = 'accent',
  cancelLabel = 'Cancel',
  showDontAskAgain = false,
  dontAskAgain = false,
  onDontAskAgainChange,
  dontAskAgainLabel = "Don't ask again",
  dontAskAgainId = 'confirm-dialog-dont-ask-again'
}: ConfirmActionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={confirmActionDialogContentClass}>
        <div className={confirmActionDialogHeaderClass}>
          <div className="min-w-0 flex-1 space-y-2 pr-1">
            <AlertDialogTitle className={confirmActionDialogTitleClass}>{title}</AlertDialogTitle>
            <AlertDialogDescription className={confirmActionDialogDescriptionClass}>
              {description}
            </AlertDialogDescription>
          </div>
          <button
            type="button"
            className={confirmActionDialogCloseClass}
            aria-label="Close"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className={confirmActionDialogSeparatorClass} aria-hidden />

        <div className="flex items-center justify-between gap-3 px-5 py-3">
          {showDontAskAgain ? (
            <div className="flex min-w-0 items-center gap-2">
              <Checkbox
                id={dontAskAgainId}
                checked={dontAskAgain}
                onCheckedChange={(checked) => onDontAskAgainChange?.(checked === true)}
                className={confirmActionDialogFooterCheckboxClass}
              />
              <label
                htmlFor={dontAskAgainId}
                className={confirmActionDialogFooterLabelClass}
              >
                {dontAskAgainLabel}
              </label>
            </div>
          ) : (
            <span className="min-w-0 flex-1" aria-hidden />
          )}

          <div className="flex shrink-0 items-center gap-2">
            <AlertDialogCancel size="xs" className={confirmActionDialogCancelClass}>
              {cancelLabel}
            </AlertDialogCancel>
            <AlertDialogAction
              size="xs"
              className={confirmActionDialogPrimaryClass(primaryVariant)}
              style={confirmActionDialogPrimaryStyle(primaryVariant)}
              onClick={onPrimary}
            >
              {primaryLabel}
            </AlertDialogAction>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
