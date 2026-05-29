import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import { extractPathsFromDropSync } from '@/features/chat-attachments/lib/extract-drop-paths-sync'
import { runComposerAttachmentPipeline } from '@/features/chat-attachments/lib/process-files'
import {
  filesFromDroppedReadResults,
  resolveDroppedFilesForProcessing
} from '@/features/chat-attachments/lib/resolve-dropped-files'
import { isElectronApp } from '@/shared/lib/lingo'
import type { ComposerDropRect } from '@/shared/types/ipc'

type Options = {
  enabled?: boolean
  existingCount: number
  onAdd: (items: MessageAttachment[]) => void
  onError?: (message: string) => void
}

const COMPOSER_DROP_RECT_PAD_PX = 12

function rectFromElement(el: HTMLElement): ComposerDropRect {
  const r = el.getBoundingClientRect()
  return {
    left: r.left - COMPOSER_DROP_RECT_PAD_PX,
    top: r.top - COMPOSER_DROP_RECT_PAD_PX,
    right: r.right + COMPOSER_DROP_RECT_PAD_PX,
    bottom: r.bottom + COMPOSER_DROP_RECT_PAD_PX
  }
}

/**
 * Web: DOM drop on composer shell. Electron: preload reads OS paths (webUtils) and
 * delivers payloads via onDesktopFileDrop; renderer syncs the composer hit-rect.
 */
export function useNativeComposerDrop({
  enabled = true,
  existingCount,
  onAdd,
  onError
}: Options) {
  const zoneRef = useRef<HTMLDivElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const dragOverRef = useRef(false)
  const onAddRef = useRef(onAdd)
  const onErrorRef = useRef(onError)
  const existingCountRef = useRef(existingCount)
  onAddRef.current = onAdd
  onErrorRef.current = onError
  existingCountRef.current = existingCount

  const setDragOverIfChanged = useCallback((over: boolean) => {
    if (dragOverRef.current === over) return
    dragOverRef.current = over
    setDragOver(over)
  }, [])

  const processWebDrop = useCallback((dataTransfer: DataTransfer | null) => {
    const capturedPaths = extractPathsFromDropSync(dataTransfer)
    runComposerAttachmentPipeline(
      resolveDroppedFilesForProcessing(dataTransfer, capturedPaths),
      existingCountRef.current,
      (items) => onAddRef.current(items),
      (message) => onErrorRef.current?.(message)
    )
  }, [])

  useEffect(() => {
    if (!enabled || !isElectronApp() || !window.lingo?.files?.onDesktopFileDrop) return

    const syncRect = () => {
      const el = zoneRef.current
      if (el) window.lingo.files!.setComposerDropRect(rectFromElement(el))
    }

    syncRect()
    const el = zoneRef.current
    const observer =
      el && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncRect) : null
    if (el && observer) observer.observe(el)
    window.addEventListener('resize', syncRect)

    const unsubscribe = window.lingo.files.onDesktopFileDrop((payload) => {
      setDragOverIfChanged(false)
      const files = filesFromDroppedReadResults(payload.results)
      runComposerAttachmentPipeline(
        Promise.resolve({ files, errors: payload.errors }),
        existingCountRef.current,
        (items) => onAddRef.current(items),
        (message) => onErrorRef.current?.(message)
      )
    })

    return () => {
      unsubscribe()
      observer?.disconnect()
      window.removeEventListener('resize', syncRect)
      window.lingo.files?.setComposerDropRect(null)
    }
  }, [enabled, setDragOverIfChanged])

  useLayoutEffect(() => {
    if (!enabled) {
      dragOverRef.current = false
      setDragOver(false)
      return
    }

    const onDragEnter = (event: DragEvent) => {
      event.preventDefault()
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
      setDragOverIfChanged(true)
    }

    const onDragOver = (event: DragEvent) => {
      event.preventDefault()
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
      setDragOverIfChanged(true)
    }

    const onDragLeave = (event: DragEvent) => {
      const zone = zoneRef.current
      if (zone && event.relatedTarget instanceof Node && zone.contains(event.relatedTarget)) {
        return
      }
      setDragOverIfChanged(false)
    }

    const onDrop = (event: DragEvent) => {
      event.preventDefault()
      setDragOverIfChanged(false)
      if (!isElectronApp()) {
        processWebDrop(event.dataTransfer)
      }
    }

    const attach = (el: HTMLElement) => {
      el.addEventListener('dragenter', onDragEnter, true)
      el.addEventListener('dragover', onDragOver, true)
      el.addEventListener('dragleave', onDragLeave, true)
      el.addEventListener('drop', onDrop, true)
    }

    const detach = (el: HTMLElement) => {
      el.removeEventListener('dragenter', onDragEnter, true)
      el.removeEventListener('dragover', onDragOver, true)
      el.removeEventListener('dragleave', onDragLeave, true)
      el.removeEventListener('drop', onDrop, true)
    }

    const el = zoneRef.current
    if (!el) return

    if (isElectronApp()) {
      window.lingo?.files?.setComposerDropRect(rectFromElement(el))
    }

    attach(el)
    return () => {
      detach(el)
      dragOverRef.current = false
      setDragOver(false)
      if (isElectronApp()) {
        window.lingo?.files?.setComposerDropRect(null)
      }
    }
  }, [enabled, processWebDrop, setDragOverIfChanged])

  return { zoneRef, dragOver }
}
