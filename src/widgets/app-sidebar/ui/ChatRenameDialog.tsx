import { useEffect, useState } from 'react'
import { X } from '@/shared/ui/icons'
import {
  confirmActionDialogCancelClass,
  confirmActionDialogCloseClass,
  confirmActionDialogContentClass,
  confirmActionDialogHeaderClass,
  confirmActionDialogPrimaryClass,
  confirmActionDialogSeparatorClass,
  confirmActionDialogTitleClass
} from '@/shared/lib/confirm-action-dialog-styles'
import { cn } from '@/shared/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTitle
} from '@/shared/ui/alert-dialog'
import { Input } from '@/shared/ui/input'

interface ChatRenameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTitle: string
  onConfirm: (title: string) => void
}

export function ChatRenameDialog({
  open,
  onOpenChange,
  initialTitle,
  onConfirm
}: ChatRenameDialogProps) {
  const [title, setTitle] = useState(initialTitle)

  useEffect(() => {
    if (open) setTitle(initialTitle)
  }, [initialTitle, open])

  const handleConfirm = () => {
    const trimmed = title.trim()
    if (!trimmed) return
    onConfirm(trimmed)
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={confirmActionDialogContentClass}>
        <div className={confirmActionDialogHeaderClass}>
          <AlertDialogTitle className={cn(confirmActionDialogTitleClass, 'min-w-0 flex-1 pr-1')}>
            Rename chat
          </AlertDialogTitle>
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
        <div className="px-4 py-2">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleConfirm()
              }
            }}
            className="h-7 px-2 py-0 text-[13px] shadow-none"
            autoFocus
          />
        </div>
        <div className={confirmActionDialogSeparatorClass} aria-hidden />
        <div className="flex items-center justify-end gap-2 px-4 py-2">
          <AlertDialogCancel className={confirmActionDialogCancelClass}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={confirmActionDialogPrimaryClass()}
            disabled={!title.trim()}
            onClick={handleConfirm}
          >
            Save
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
