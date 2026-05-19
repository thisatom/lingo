import { app } from 'electron'
import { existsSync } from 'node:fs'
import path from 'node:path'

export function resolveAppIconPath(): string | undefined {
  const names =
    process.platform === 'win32'
      ? ['icon.ico', 'icon.png']
      : process.platform === 'darwin'
        ? ['icon.icns', 'icon.png']
        : ['icon.png']

  const roots = app.isPackaged
    ? [process.resourcesPath, path.join(process.resourcesPath, 'resources')]
    : [path.join(app.getAppPath(), 'resources'), app.getAppPath()]

  for (const root of roots) {
    for (const name of names) {
      const full = path.join(root, name)
      if (existsSync(full)) return full
    }
  }

  return undefined
}
