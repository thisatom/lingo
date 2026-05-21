import { useState } from 'react'
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
import { formatBytes } from '@/features/app-update/lib/format-bytes'
import { installAppUpdate } from '@/shared/lib/updater'
import type { AppUpdateInfo } from '@/shared/types/ipc'

interface AppUpdateAvailableDialogProps {
  update: AppUpdateInfo
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AppUpdateAvailableDialog({
  update,
  open,
  onOpenChange
}: AppUpdateAvailableDialogProps) {
  const [installing, setInstalling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sizeLabel = formatBytes(update.downloadSize)

  const handleInstall = async () => {
    setInstalling(true)
    setError(null)
    try {
      const result = await installAppUpdate()
      if (!result?.ok) {
        setError(result?.error ?? 'Could not start the update')
        setInstalling(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
      setInstalling(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(85vh,640px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b px-6 py-4 text-left">
          <DialogTitle>Update available</DialogTitle>
          <DialogDescription>
            {update.name || `Version ${update.version}`}
            {sizeLabel ? ` · ${sizeLabel}` : null}
          </DialogDescription>
        </DialogHeader>

        <CustomScrollArea className="min-h-0 flex-1 px-6 py-4" variant="chat">
          <MarkdownContent content={update.body} variant="compact" />
        </CustomScrollArea>

        <DialogFooter className="shrink-0 flex-col gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
          {error ? <p className="w-full text-left text-xs text-destructive">{error}</p> : null}
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Later
          </Button>
          <Button type="button" size="sm" disabled={installing} onClick={() => void handleInstall()}>
            {installing ? 'Downloading…' : 'Update now'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
