export function dataTransferHasFiles(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer) return false
  if (dataTransfer.types?.includes('Files')) return true
  return (dataTransfer.files?.length ?? 0) > 0
}

export function collectFilesFromDataTransfer(dataTransfer: DataTransfer | null): File[] {
  if (!dataTransfer?.files?.length) return []
  return Array.from(dataTransfer.files)
}
