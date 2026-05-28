import { useRef } from 'react'
import { Paperclip } from '@/shared/ui/icons'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import { processDroppedFiles } from '@/features/chat-attachments/lib/process-files'
import { composerToolbarIconClass } from '@/widgets/chat-composer/lib/composer-toolbar'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'

const ACCEPT =
  'image/png,image/jpeg,image/gif,image/webp,.txt,.md,.json,.csv,.xml,.html,.css,.js,.ts,.tsx,.jsx,.py,.rs,.go,.java,.c,.cpp,.yaml,.yml,.sql,text/plain'

type Props = {
  existingCount: number
  disabled?: boolean
  onAdd: (items: MessageAttachment[]) => void
  onError?: (message: string) => void
}

export function ComposerFileInput({ existingCount, disabled, onAdd, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const files = e.target.files ? Array.from(e.target.files) : []
          e.target.value = ''
          if (files.length === 0) return
          void processDroppedFiles(files, existingCount).then(({ attachments, errors }) => {
            if (attachments.length > 0) onAdd(attachments)
            if (errors.length > 0) onError?.(errors.join(' '))
          })
        }}
      />
      <TooltipIconButton
        type="button"
        variant="ghost"
        size="iconSm"
        className={composerToolbarIconClass}
        disabled={disabled}
        tooltip="Attach image or file (paste image with Ctrl+V)"
        aria-label="Attach image or file"
        onClick={() => inputRef.current?.click()}
      >
        <Paperclip />
      </TooltipIconButton>
    </>
  )
}
