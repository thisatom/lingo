import { ipcRenderer, webUtils } from 'electron'
import type { DroppedFileReadResult } from '../../src/shared/types/ipc'

export type ComposerDropRect = {
  left: number
  top: number
  right: number
  bottom: number
} | null

export type DesktopFileDropPayload = {
  results: DroppedFileReadResult[]
  errors: string[]
}

type DropHandler = (payload: DesktopFileDropPayload) => void
type DragOverHandler = (over: boolean) => void

let composerDropRect: ComposerDropRect = null
let dropHandler: DropHandler | null = null
let dragOverHandler: DragOverHandler | null = null
let dragOverActive = false
let dropInFlight = false

export function setComposerDropRect(rect: ComposerDropRect): void {
  composerDropRect = rect
}

export function setDesktopFileDropHandler(handler: DropHandler | null): void {
  dropHandler = handler
}

export function setComposerDragOverHandler(handler: DragOverHandler | null): void {
  dragOverHandler = handler
  if (!handler) {
    dragOverActive = false
  }
}

function setDragOverActive(over: boolean): void {
  if (dragOverActive === over) return
  dragOverActive = over
  dragOverHandler?.(over)
}

function isPointInComposer(clientX: number, clientY: number): boolean {
  if (!composerDropRect) return true
  return (
    clientX >= composerDropRect.left &&
    clientX <= composerDropRect.right &&
    clientY >= composerDropRect.top &&
    clientY <= composerDropRect.bottom
  )
}

function pathsFromDataTransfer(dataTransfer: DataTransfer | null): string[] {
  if (!dataTransfer?.files?.length) return []
  const paths: string[] = []
  for (let i = 0; i < dataTransfer.files.length; i += 1) {
    const file = dataTransfer.files[i]
    if (!file) continue
    try {
      const diskPath = webUtils.getPathForFile(file)
      if (diskPath) paths.push(diskPath)
    } catch {
      // not backed by disk
    }
  }
  return [...new Set(paths)]
}

function notifyDrop(payload: DesktopFileDropPayload): void {
  dropHandler?.(payload)
}

let fileDropCaptureInstalled = false

/**
 * OS file drops are handled in preload (webUtils + real File objects). Renderer
 * only supplies the composer hit-rect and receives read results via callback.
 */
export function installPreloadFileDropCapture(): void {
  if (fileDropCaptureInstalled) return
  fileDropCaptureInstalled = true

  const allowDrop = (event: DragEvent) => {
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy'
    }
    setDragOverActive(isPointInComposer(event.clientX, event.clientY))
  }

  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragOverActive(false)

    if (dropInFlight) return
    if (!isPointInComposer(event.clientX, event.clientY)) return

    const paths = pathsFromDataTransfer(event.dataTransfer)
    if (paths.length === 0) {
      notifyDrop({ results: [], errors: ['Could not read dropped file paths'] })
      return
    }

    dropInFlight = true
    void ipcRenderer
      .invoke('lingo:files:readDroppedPaths', paths)
      .then((payload: DesktopFileDropPayload) => {
        notifyDrop(payload)
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Could not read dropped files'
        notifyDrop({ results: [], errors: [message] })
      })
      .finally(() => {
        window.setTimeout(() => {
          dropInFlight = false
        }, 50)
      })
  }

  const onDragLeave = (event: DragEvent) => {
    if (event.relatedTarget != null) return
    setDragOverActive(false)
  }

  document.addEventListener('dragover', allowDrop, true)
  document.addEventListener('drop', onDrop, true)
  document.addEventListener('dragleave', onDragLeave, true)
}

export function ensurePreloadFileDropCapture(): void {
  if (typeof document === 'undefined') return
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', installPreloadFileDropCapture, { once: true })
    return
  }
  installPreloadFileDropCapture()
}
