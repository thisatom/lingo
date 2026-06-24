import { app, nativeImage, type NativeImage } from 'electron'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const mainDir = path.dirname(fileURLToPath(import.meta.url))

function iconFileNames(): string[] {
  if (process.platform === 'win32') return ['icon.ico']
  if (process.platform === 'darwin') return ['icon.icns', 'icon.png']
  return ['icon.png']
}

function iconSearchRoots(): string[] {
  if (app.isPackaged) {
    return [process.resourcesPath, path.join(process.resourcesPath, 'resources')]
  }
  return [
    path.join(app.getAppPath(), 'resources'),
    path.join(process.cwd(), 'resources'),
    path.join(mainDir, '../../resources'),
    app.getAppPath()
  ]
}

/** True when Electron can decode the file (existsSync alone is not enough on macOS). */
export function isReadableIconFile(fullPath: string): boolean {
  if (!existsSync(fullPath)) return false
  try {
    return !nativeImage.createFromPath(fullPath).isEmpty()
  } catch {
    return false
  }
}

export function resolveAppIconPath(): string | undefined {
  for (const root of iconSearchRoots()) {
    for (const name of iconFileNames()) {
      const full = path.join(root, name)
      if (isReadableIconFile(full)) return full
    }
  }
  return undefined
}

export function createAppIconImage(): NativeImage | undefined {
  const iconPath = resolveAppIconPath()
  if (!iconPath) return undefined
  try {
    const image = nativeImage.createFromPath(iconPath)
    return image.isEmpty() ? undefined : image
  } catch {
    return undefined
  }
}

/** Best-effort dock icon — must never throw (breaks app.whenReady on macOS). */
export function applyDockIcon(): void {
  if (process.platform !== 'darwin' || !app.dock) return

  // Packaged .app already uses CFBundleIcon; avoid broken Resources/icon.icns from builder.
  if (app.isPackaged) return

  const image = createAppIconImage()
  if (!image) return

  try {
    app.dock.setIcon(image)
  } catch (error) {
    console.warn('[lingo] Failed to set dock icon:', error)
  }
}
