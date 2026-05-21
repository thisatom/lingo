import { useEffect, useRef, type RefObject } from 'react'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import { processDroppedFiles } from '@/features/chat-attachments/lib/process-files'

type Options = {
  textareaRef: RefObject<HTMLTextAreaElement | null>
  enabled?: boolean
  existingCount: number
  onAdd: (items: MessageAttachment[]) => void
  onError?: (message: string) => void
}

export function useComposerPaste({
  textareaRef,
  enabled = true,
  existingCount,
  onAdd,
  onError
}: Options) {
  const onAddRef = useRef(onAdd)
  const onErrorRef = useRef(onError)
  onAddRef.current = onAdd
  onErrorRef.current = onError

  useEffect(() => {
    const el = textareaRef.current
    if (!el || !enabled) return

    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items?.length) return

      const files: File[] = []
      for (const item of items) {
        if (item.kind !== 'file') continue
        const file = item.getAsFile()
        if (file) files.push(file)
      }

      if (files.length === 0) return
      e.preventDefault()

      void processDroppedFiles(files, existingCount).then(({ attachments, errors }) => {
        if (attachments.length > 0) onAddRef.current(attachments)
        if (errors.length > 0) onErrorRef.current?.(errors.join(' '))
      })
    }

    el.addEventListener('paste', onPaste)
    return () => el.removeEventListener('paste', onPaste)
  }, [textareaRef, enabled, existingCount])
}
