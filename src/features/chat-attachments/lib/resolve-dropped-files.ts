import type { DroppedFileReadResult } from '@/shared/types/ipc'
import { isElectronApp } from '@/shared/lib/lingo'
import {
  collectFilesFromDataTransfer,
  collectFilesFromDataTransferItems,
  dedupeFiles,
  extractLocalPathsFromDataTransfer
} from '@/features/chat-attachments/lib/collect-files'
import { MAX_COMPOSER_ATTACHMENTS } from '@/features/chat-attachments/lib/constants'

export function filesFromDroppedReadResults(results: DroppedFileReadResult[]): File[] {
  return results.map((result) => {
    if (result.kind === 'text') {
      return new File([result.payload], result.name, { type: result.mimeType })
    }
    const match = /^data:([^;]+);base64,(.+)$/s.exec(result.payload)
    if (!match) {
      return new File([], result.name, { type: result.mimeType })
    }
    const mime = match[1] || result.mimeType
    const binary = atob(match[2] ?? '')
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }
    return new File([bytes], result.name, { type: mime })
  })
}

/** Merges main-process reads with renderer blobs for files IPC did not return. */
export function mergeIpcResultsWithBlobs(
  results: DroppedFileReadResult[],
  merged: File[]
): File[] {
  const successNames = new Set(results.map((result) => result.name))
  const fromIpc = filesFromDroppedReadResults(results)
  const blobs = merged.filter((file) => file.size > 0 && !successNames.has(file.name))
  return dedupeFiles([...fromIpc, ...blobs])
}

function readableBlobs(merged: File[]): File[] {
  const readable = merged.filter((file) => file.size > 0)
  return readable.length > 0 ? readable : merged
}

/**
 * Collects dropped files for the composer. In Electron, falls back to OS paths when
 * `DataTransfer` blobs are empty (common from Electron 32+ without `file.path`).
 */
export async function resolveDroppedFilesForProcessing(
  dataTransfer: DataTransfer | null,
  capturedPaths?: string[]
): Promise<{ files: File[]; errors: string[] }> {
  if (!dataTransfer) return { files: [], errors: [] }

  const merged = dedupeFiles([
    ...collectFilesFromDataTransfer(dataTransfer),
    ...collectFilesFromDataTransferItems(dataTransfer)
  ])

  const errors: string[] = []

  if (isElectronApp() && window.lingo?.files) {
    const pathSet = new Set(capturedPaths ?? [])
    if (pathSet.size === 0) {
      for (const diskPath of extractLocalPathsFromDataTransfer(dataTransfer)) {
        pathSet.add(diskPath)
      }
    }

    const allPaths = [...pathSet]
    if (allPaths.length > MAX_COMPOSER_ATTACHMENTS) {
      errors.push(`Only ${MAX_COMPOSER_ATTACHMENTS} file path(s) can be read from disk at once.`)
    }
    const pathsForIpc = allPaths.slice(0, MAX_COMPOSER_ATTACHMENTS)

    if (pathsForIpc.length > 0) {
      try {
        const { results, errors: ipcErrors } =
          await window.lingo.files.readDroppedPaths(pathsForIpc)
        errors.push(...ipcErrors)

        const combined = mergeIpcResultsWithBlobs(results, merged)
        if (combined.length > 0) {
          return { files: combined, errors }
        }
        if (ipcErrors.length > 0) {
          const fallback = readableBlobs(merged)
          if (fallback.some((file) => file.size > 0)) {
            return { files: fallback, errors }
          }
          return { files: [], errors }
        }
      } catch (error) {
        errors.push(
          error instanceof Error ? error.message : 'Could not read dropped files from disk'
        )
      }
    }
  }

  return { files: readableBlobs(merged), errors }
}
