function fileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`
}

export function dedupeFiles(files: File[]): File[] {
  const seen = new Set<string>()
  const out: File[] = []
  for (const file of files) {
    const key = fileKey(file)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(file)
  }
  return out
}

export function collectFilesFromDataTransfer(dataTransfer: DataTransfer | null): File[] {
  if (!dataTransfer) return []
  const fromList = dataTransfer.files?.length ? Array.from(dataTransfer.files) : []
  if (fromList.length > 0) return dedupeFiles(fromList)
  return collectFilesFromDataTransferItems(dataTransfer)
}

export function collectFilesFromDataTransferItems(dataTransfer: DataTransfer | null): File[] {
  if (!dataTransfer?.items?.length) return []
  const files: File[] = []
  for (let i = 0; i < dataTransfer.items.length; i += 1) {
    const item = dataTransfer.items[i]
    if (item?.kind !== 'file') continue
    const file = item.getAsFile()
    if (file) files.push(file)
  }
  return dedupeFiles(files)
}

/** Decode `file://` URIs and plain absolute paths from OS drag payloads. */
export function fileUriToLocalPath(uri: string): string | null {
  const trimmed = uri.trim()
  if (!trimmed) return null

  if (/^file:/i.test(trimmed)) {
    try {
      const url = new URL(trimmed)
      if (url.protocol !== 'file:') return null
      let local = decodeURIComponent(url.pathname)
      if (/^\/[A-Za-z]:\//.test(local)) {
        local = local.slice(1)
      }
      return local || null
    } catch {
      return null
    }
  }

  if (/^[A-Za-z]:[\\/]/.test(trimmed) || trimmed.startsWith('/') || trimmed.startsWith('\\\\')) {
    return trimmed
  }

  return null
}

export function extractLocalPathsFromDataTransfer(dataTransfer: DataTransfer | null): string[] {
  if (!dataTransfer) return []
  const paths = new Set<string>()

  const uriList = dataTransfer.getData('text/uri-list')
  if (uriList) {
    for (const line of uriList.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const local = fileUriToLocalPath(trimmed)
      if (local) paths.add(local)
    }
  }

  const plain = dataTransfer.getData('text/plain')
  if (plain) {
    for (const line of plain.split(/\r?\n/)) {
      const local = fileUriToLocalPath(line)
      if (local) paths.add(local)
    }
  }

  return [...paths]
}
