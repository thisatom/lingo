import { useEffect, useRef, useState } from 'react'
import {
  collectFilesFromDataTransfer,
  dataTransferHasFiles
} from '@/features/chat-attachments/lib/collect-files'
import { processDroppedFiles } from '@/features/chat-attachments/lib/process-files'

type Options = {
  enabled?: boolean
  existingCount: number
  onAdd: (items: Awaited<ReturnType<typeof processDroppedFiles>>['attachments']) => void
  onError?: (message: string) => void
}

/**
 * Native DOM listeners — more reliable than React synthetic events in Electron.
 */
export function useNativeComposerDrop({
  enabled = true,
  existingCount,
  onAdd,
  onError
}: Options) {
  const zoneRef = useRef<HTMLDivElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const depthRef = useRef(0)
  const onAddRef = useRef(onAdd)
  const onErrorRef = useRef(onError)
  onAddRef.current = onAdd
  onErrorRef.current = onError

  useEffect(() => {
    if (!enabled) return

    const preventFileNav = (e: globalThis.DragEvent) => {
      if (!dataTransferHasFiles(e.dataTransfer)) return
      e.preventDefault()
    }

    document.addEventListener('dragover', preventFileNav)
    document.addEventListener('drop', preventFileNav)

    return () => {
      document.removeEventListener('dragover', preventFileNav)
      document.removeEventListener('drop', preventFileNav)
    }
  }, [enabled])

  useEffect(() => {
    const el = zoneRef.current
    if (!el || !enabled) return

    const onDragEnter = (e: globalThis.DragEvent) => {
      if (!dataTransferHasFiles(e.dataTransfer)) return
      e.preventDefault()
      e.stopPropagation()
      depthRef.current += 1
      setDragOver(true)
    }

    const onDragLeave = (e: globalThis.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      depthRef.current -= 1
      if (depthRef.current <= 0) {
        depthRef.current = 0
        setDragOver(false)
      }
    }

    const onDragOver = (e: globalThis.DragEvent) => {
      if (!dataTransferHasFiles(e.dataTransfer)) return
      e.preventDefault()
      e.stopPropagation()
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
    }

    const onDrop = (e: globalThis.DragEvent) => {
      if (!dataTransferHasFiles(e.dataTransfer)) return
      e.preventDefault()
      e.stopPropagation()
      depthRef.current = 0
      setDragOver(false)

      const files = collectFilesFromDataTransfer(e.dataTransfer)
      if (files.length === 0) return

      void processDroppedFiles(files, existingCount).then(({ attachments, errors }) => {
        if (attachments.length > 0) onAddRef.current(attachments)
        if (errors.length > 0) onErrorRef.current?.(errors.join(' '))
      })
    }

    el.addEventListener('dragenter', onDragEnter)
    el.addEventListener('dragleave', onDragLeave)
    el.addEventListener('dragover', onDragOver)
    el.addEventListener('drop', onDrop)

    return () => {
      el.removeEventListener('dragenter', onDragEnter)
      el.removeEventListener('dragleave', onDragLeave)
      el.removeEventListener('dragover', onDragOver)
      el.removeEventListener('drop', onDrop)
    }
  }, [enabled, existingCount])

  return { zoneRef, dragOver }
}
