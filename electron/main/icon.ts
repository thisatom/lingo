import { app } from 'electron'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const mainDir = path.dirname(fileURLToPath(import.meta.url))

export function resolveAppIconPath(): string | undefined {
  const names =
    process.platform === 'win32'
      ? ['icon.ico']
      : process.platform === 'darwin'
        ? ['icon.icns']
        : ['icon.png']

  const roots = app.isPackaged
    ? [process.resourcesPath, path.join(process.resourcesPath, 'resources')]
    : [
        path.join(app.getAppPath(), 'resources'),
        path.join(process.cwd(), 'resources'),
        path.join(mainDir, '../../resources'),
        app.getAppPath()
      ]

  for (const root of roots) {
    for (const name of names) {
      const full = path.join(root, name)
      if (existsSync(full)) return full
    }
  }

  return undefined
}
