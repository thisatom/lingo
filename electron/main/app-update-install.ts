import { app } from 'electron'
import { chmodSync, mkdirSync, readdirSync, writeFileSync, type Dirent } from 'node:fs'
import { dirname, join } from 'node:path'
import {
  detectLinuxInstallFormat,
  isLinuxAppImage,
  isLinuxDeb,
  isMacZip,
  isWindowsExe,
  isWindowsMsi
} from './app-update-assets'
import {
  buildLinuxAppImageUpdateScriptBody,
  buildLinuxDebUpdateScriptBody,
  buildMacUpdateScriptBody,
  buildWindowsUpdateScript
} from './app-update-install-scripts'
import { spawnDetachedVerified, resolveWindowsPowerShellPath } from './app-update-spawn'
import type { LinuxInstallFormat } from './app-update-assets'

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

function resolveLinuxAppImagePath(): string | null {
  if (process.env.APPIMAGE) return process.env.APPIMAGE
  if (/\.AppImage$/i.test(process.execPath)) return process.execPath
  return null
}

function writePosixScript(scriptPath: string, body: string): void {
  writeFileSync(scriptPath, `#!/bin/sh\nset -eu\n${body}`, { mode: 0o755 })
}

async function extractMacZip(installerPath: string, extractDir: string): Promise<string> {
  const { spawn } = await import('node:child_process')
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
  return appEntry
}

async function spawnWindowsInstaller(
  pid: number,
  installerPath: string,
  relaunchExe: string,
  fileName: string,
  scriptDir: string
): Promise<void> {
  if (!isWindowsExe(fileName) && !isWindowsMsi(fileName)) {
    throw new Error('Windows silent updates require a .exe or .msi release asset')
  }

  const scriptPath = join(scriptDir, 'lingo-update.ps1')
  writeFileSync(scriptPath, buildWindowsUpdateScript(isWindowsMsi(fileName)), 'utf8')

  await spawnDetachedVerified(resolveWindowsPowerShellPath(), [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    scriptPath,
    '-TargetPid',
    String(pid),
    '-InstallerPath',
    installerPath,
    '-RelaunchExe',
    relaunchExe
  ])
}

async function spawnMacInstaller(
  pid: number,
  installerPath: string,
  fileName: string,
  scriptDir: string
): Promise<void> {
  if (!isMacZip(fileName)) {
    throw new Error('macOS silent updates require a .zip release asset')
  }

  const extractDir = join(scriptDir, 'extract')
  const sourceApp = await extractMacZip(installerPath, extractDir)
  const targetApp = macAppBundlePath()
  const scriptPath = join(scriptDir, 'lingo-update.sh')

  writePosixScript(scriptPath, buildMacUpdateScriptBody(pid, sourceApp, targetApp))
  await spawnDetachedVerified('/bin/sh', [scriptPath])
}

async function spawnLinuxInstaller(
  pid: number,
  installerPath: string,
  fileName: string,
  scriptDir: string,
  installFormat: LinuxInstallFormat
): Promise<{ manualHandoff: boolean }> {
  const relaunchExe = process.execPath
  const appImagePath = resolveLinuxAppImagePath()

  if (installFormat === 'appimage' && isLinuxAppImage(fileName)) {
    if (!appImagePath) {
      throw new Error(
        'AppImage update requires running Lingo from an AppImage. Download the new AppImage manually from Releases.'
      )
    }

    chmodSync(installerPath, 0o755)
    const scriptPath = join(scriptDir, 'lingo-update.sh')
    writePosixScript(
      scriptPath,
      buildLinuxAppImageUpdateScriptBody(pid, installerPath, appImagePath)
    )
    await spawnDetachedVerified('/bin/sh', [scriptPath])
    return { manualHandoff: false }
  }

  if (installFormat === 'deb' && isLinuxDeb(fileName)) {
    const scriptPath = join(scriptDir, 'lingo-update.sh')
    writePosixScript(scriptPath, buildLinuxDebUpdateScriptBody(pid, installerPath, relaunchExe))
    await spawnDetachedVerified('/bin/sh', [scriptPath])
    return { manualHandoff: false }
  }

  if (isLinuxAppImage(fileName) && installFormat !== 'appimage') {
    return { manualHandoff: true }
  }

  if (isLinuxDeb(fileName) && installFormat !== 'deb') {
    return { manualHandoff: true }
  }

  throw new Error('Unsupported Linux update package for this installation type')
}

export type InstallDownloadedUpdateResult = {
  manualHandoff?: boolean
}

export async function installDownloadedUpdate(
  installerPath: string,
  fileName: string
): Promise<InstallDownloadedUpdateResult> {
  const pid = process.pid
  const relaunchExe = process.execPath
  const scriptDir = dirname(installerPath)

  if (process.platform === 'win32') {
    await spawnWindowsInstaller(pid, installerPath, relaunchExe, fileName, scriptDir)
    return {}
  }

  if (process.platform === 'darwin') {
    await spawnMacInstaller(pid, installerPath, fileName, scriptDir)
    return {}
  }

  if (process.platform === 'linux') {
    const installFormat = detectLinuxInstallFormat()
    return spawnLinuxInstaller(pid, installerPath, fileName, scriptDir, installFormat)
  }

  throw new Error(`Unsupported platform: ${process.platform}`)
}

/** @internal test hook */
export function getLinuxInstallFormatForTest(): LinuxInstallFormat {
  return detectLinuxInstallFormat()
}

/** @internal test hook */
export function getAppImagePathForTest(): string | null {
  if (process.platform !== 'linux') return null
  return resolveLinuxAppImagePath()
}
