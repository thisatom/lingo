/**
 * Electron shows a forbidden cursor and may navigate to file:// unless dragover/drop
 * call preventDefault on document (see GeeksforGeeks Electron drag-and-drop guide).
 */
export function installFileDropNavigationGuard(): void {
  if (typeof document === 'undefined') return

  const allowFileDrop = (event: DragEvent) => {
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy'
    }
  }

  document.addEventListener('dragover', allowFileDrop, true)
  document.addEventListener('drop', allowFileDrop, true)
}
