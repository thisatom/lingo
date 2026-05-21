import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { MarkdownContent } from '@/shared/ui/markdown-content'
import { CustomScrollArea } from '@/shared/ui/custom-scroll-area'
import type { PendingUpdateNotice } from '@/shared/types/ipc'

interface AppUpdateReleaseNotesDialogProps {
  notice: PendingUpdateNotice
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AppUpdateReleaseNotesDialog({
  notice,
  open,
  onOpenChange
}: AppUpdateReleaseNotesDialogProps) {
  const title = notice.name?.trim() || `Version ${notice.version}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(85vh,640px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b px-6 py-4 text-left">
          <DialogTitle>Updated to {notice.version}</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>

        <CustomScrollArea className="min-h-0 flex-1 px-6 py-4" variant="chat">
          <MarkdownContent content={notice.body} variant="compact" />
        </CustomScrollArea>

        <DialogFooter className="shrink-0 border-t px-6 py-4">
          <Button type="button" size="sm" onClick={() => onOpenChange(false)}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
