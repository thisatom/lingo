import { extractLocalPathsFromDataTransfer } from '@/features/chat-attachments/lib/collect-files'
import { isElectronApp } from '@/shared/lib/lingo'

/** Web / fallback path hints from dataTransfer (not used for Electron OS drops). */
export function extractPathsFromDropSync(dataTransfer: DataTransfer | null): string[] {
  if (!dataTransfer || isElectronApp()) return []

  const paths = new Set<string>()
  const getPath = window.lingo?.files?.getPathForFile
  if (!getPath) return []

  if (dataTransfer.files?.length) {
    for (const file of dataTransfer.files) {
      const diskPath = getPath(file)
      if (diskPath) paths.add(diskPath)
    }
  }

  for (const diskPath of extractLocalPathsFromDataTransfer(dataTransfer)) {
    paths.add(diskPath)
  }

  return [...paths]
}
