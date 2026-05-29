import '@/shared/lib/monaco-vite-setup'
import Editor from '@monaco-editor/react'
import { useMemo } from 'react'
import { useSettingsStore } from '@/entities/settings/model/store'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import { resolveThemePreference } from '@/shared/lib/theme'
import {
  ATTACHMENT_PREVIEW_MONACO_THEME,
  defineAttachmentPreviewMonacoTheme
} from '@/features/chat-attachments/lib/attachment-preview-monaco-theme'
import { monacoLanguageForAttachment } from '@/features/chat-attachments/lib/attachment-monaco-language'
import { useAttachmentDisplayUrl } from '@/features/chat-attachments/model/useAttachmentDisplayUrl'
import { useAttachmentTextContent } from '@/features/chat-attachments/model/useAttachmentTextContent'
import { cn } from '@/shared/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/shared/ui/dialog'

const PREVIEW_EDITOR_OPTIONS = {
  readOnly: true,
  minimap: { enabled: false },
  fontSize: 13,
  lineNumbers: 'on' as const,
  scrollBeyondLastLine: false,
  wordWrap: 'on' as const,
  tabSize: 2,
  automaticLayout: true,
  padding: { top: 8, bottom: 8 },
  domReadOnly: true
}

type AttachmentPreviewDialogProps = {
  attachment: MessageAttachment
  open: boolean
  onOpenChange: (open: boolean) => void
}

function AttachmentImagePreview({ attachment }: { attachment: MessageAttachment }) {
  const src = useAttachmentDisplayUrl(attachment)

  if (!src) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center text-sm text-muted-foreground">
        Loading image…
      </div>
    )
  }

  return (
    <div className="flex max-h-[min(80vh,720px)] min-h-[8rem] items-center justify-center overflow-auto p-4">
      <img
        src={src}
        alt={attachment.name}
        className="max-h-[min(76vh,680px)] max-w-full object-contain"
      />
    </div>
  )
}

function useMonacoPreviewIsDark(): boolean {
  const appTheme = useSettingsStore((s) => s.appTheme)
  return useMemo(() => resolveThemePreference(appTheme) === 'dark', [appTheme])
}

function AttachmentTextPreview({ attachment }: { attachment: MessageAttachment }) {
  const { content, loading } = useAttachmentTextContent(attachment)
  const language = monacoLanguageForAttachment(attachment)
  const isDark = useMonacoPreviewIsDark()

  if (loading) {
    return (
      <div className="flex min-h-[16rem] items-center justify-center bg-background text-sm text-muted-foreground">
        Loading file…
      </div>
    )
  }

  return (
    <div className="h-[min(60vh,520px)] min-h-[16rem] w-full overflow-hidden bg-background">
      <Editor
        key={isDark ? 'preview-dark' : 'preview-light'}
        height="100%"
        language={language}
        value={content}
        theme={ATTACHMENT_PREVIEW_MONACO_THEME}
        beforeMount={(monaco) => defineAttachmentPreviewMonacoTheme(monaco, isDark)}
        options={PREVIEW_EDITOR_OPTIONS}
      />
    </div>
  )
}

export function AttachmentPreviewDialog({
  attachment,
  open,
  onOpenChange
}: AttachmentPreviewDialogProps) {
  const isImage = attachment.kind === 'image'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex max-h-[min(92vh,800px)] min-h-[12rem] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(92vw,900px)]',
          !isImage && 'min-h-[min(60vh,520px)]'
        )}
        closeButtonClassName={cn(
          'text-muted-foreground opacity-80',
          'hover:bg-accent hover:text-foreground hover:opacity-100',
          'dark:hover:bg-[#303030] dark:hover:text-foreground'
        )}
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-border px-5 py-4 text-left">
          <DialogTitle className="truncate pr-8 text-base">{attachment.name}</DialogTitle>
          <DialogDescription className="text-xs">
            {attachment.kind === 'image'
              ? `${attachment.mimeType} · ${formatBytes(attachment.sizeBytes)}`
              : `${attachment.mimeType} · ${formatBytes(attachment.sizeBytes)} · read-only`}
          </DialogDescription>
        </DialogHeader>

        {attachment.kind === 'image' ? (
          <AttachmentImagePreview attachment={attachment} />
        ) : (
          <AttachmentTextPreview attachment={attachment} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
