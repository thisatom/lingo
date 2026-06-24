import { app } from 'electron'
import { spawn } from 'node:child_process'
import { chmodSync, mkdirSync, readdirSync, writeFileSync, type Dirent } from 'node:fs'
import { dirname, join } from 'node:path'

function macAppBundlePath(): string {
  return join(dirname(process.execPath), '..', '..')
}

function findMacAppBundle(root: string): string | null {
  for (const entry of readdirSync(root, { withFileTypes: true }) as Dirent[]) {
    const full = join(root, entry.name)
    if (entry.isDirectory() && entry.name.endsWith('.app')) return full
    if (entry.isDirectory()) {
      const nested = findMacAppBundle(full)
      if (nested) return nested
    }
  }
  return null
}

function runDetached(command: string, args: string[]): void {
  const child = spawn(command, args, { detached: true, stdio: 'ignore' })
  child.unref()
}

export async function installDownloadedUpdate(
  installerPath: string,
  fileName: string
): Promise<void> {
  if (process.platform === 'win32') {
    runDetached(installerPath, ['/S'])
    setImmediate(() => app.quit())
    return
  }

  if (process.platform === 'darwin') {
    if (!/\.zip$/i.test(fileName)) {
      throw new Error('macOS silent updates require a .zip release asset')
    }

    const extractDir = join(dirname(installerPath), 'extract')
    mkdirSync(extractDir, { recursive: true })

    await new Promise<void>((resolve, reject) => {
      const child = spawn('ditto', ['-x', '-k', installerPath, extractDir], { stdio: 'ignore' })
      child.on('error', reject)
      child.on('exit', (code) => {
        if (code === 0) resolve()
        else reject(new Error(`Failed to extract update (${code ?? 'unknown'})`))
      })
    })

    const appEntry = findMacAppBundle(extractDir)
    if (!appEntry) {
      throw new Error('Update package does not contain a .app bundle')
    }

    const targetApp = macAppBundlePath()
    const sourceApp = appEntry
    const scriptPath = join(dirname(installerPath), 'lingo-update.sh')

    writeFileSync(
      scriptPath,
      `#!/bin/bash
set -euo pipefail
sleep 2
ditto "${sourceApp}" "${targetApp}"
open "${targetApp}"
`,
      { mode: 0o755 }
    )

    runDetached('/bin/bash', [scriptPath])
    setImmediate(() => app.quit())
    return
  }

  if (process.platform === 'linux') {
    const appImage = process.env.APPIMAGE
    if (appImage && /\.AppImage$/i.test(fileName)) {
      chmodSync(installerPath, 0o755)
      const scriptPath = join(dirname(installerPath), 'lingo-update.sh')
      writeFileSync(
        scriptPath,
        `#!/bin/sh
set -e
sleep 2
chmod +x "$1"
mv "$1" "$2"
exec "$2"
`,
        { mode: 0o755 }
      )
      runDetached('/bin/sh', [scriptPath, installerPath, appImage])
      setImmediate(() => app.quit())
      return
    }

    if (/\.deb$/i.test(fileName)) {
      runDetached('pkexec', ['dpkg', '-i', installerPath])
      setImmediate(() => app.quit())
      return
    }

    throw new Error('Unsupported Linux update package')
  }

  throw new Error(`Unsupported platform: ${process.platform}`)
}
