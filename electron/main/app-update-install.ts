import { app } from 'electron'
import { spawn } from 'node:child_process'
import { chmodSync, mkdirSync, readdirSync, writeFileSync, type Dirent } from 'node:fs'
import { dirname, join } from 'node:path'
import {
  isLinuxAppImage,
  isLinuxDeb,
  isMacZip,
  isWindowsExe,
  isWindowsMsi
} from './app-update-assets'

const WAIT_TIMEOUT_SEC = 120

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

function resolveLinuxAppImagePath(): string | null {
  if (process.env.APPIMAGE) return process.env.APPIMAGE
  if (/\.AppImage$/i.test(process.execPath)) return process.execPath
  return null
}

function waitForPidPosixBlock(pid: number): string {
  return `
wait_for_pid() {
  local pid=$1
  local max=${WAIT_TIMEOUT_SEC}
  local i=0
  while kill -0 "$pid" 2>/dev/null; do
    i=$((i + 1))
    if [ "$i" -ge "$max" ]; then
      exit 1
    fi
    sleep 0.5
  done
}
wait_for_pid ${pid}
`
}

function writePosixScript(scriptPath: string, body: string): void {
  writeFileSync(scriptPath, `#!/bin/sh\nset -eu\n${body}`, { mode: 0o755 })
}

function writeWindowsUpdateScript(scriptPath: string): void {
  const script = `
param(
  [Parameter(Mandatory = $true)][int]$TargetPid,
  [Parameter(Mandatory = $true)][string]$InstallerPath,
  [Parameter(Mandatory = $true)][string]$RelaunchExe,
  [Parameter(Mandatory = $true)][bool]$IsMsi
)
$ErrorActionPreference = "Stop"
$deadline = (Get-Date).AddSeconds(${WAIT_TIMEOUT_SEC})
while ((Get-Process -Id $TargetPid -ErrorAction SilentlyContinue) -and ((Get-Date) -lt $deadline)) {
  Start-Sleep -Milliseconds 500
}
if ($IsMsi) {
  $p = Start-Process -FilePath "msiexec.exe" -ArgumentList @("/i", $InstallerPath, "/qn", "/norestart") -Wait -PassThru
} else {
  $p = Start-Process -FilePath $InstallerPath -ArgumentList @("/S") -Wait -PassThru
}
if ($p.ExitCode -ne 0) { exit $p.ExitCode }
Start-Process -FilePath $RelaunchExe
`
  writeFileSync(scriptPath, script, 'utf8')
}

async function extractMacZip(installerPath: string, extractDir: string): Promise<string> {
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

export async function installDownloadedUpdate(
  installerPath: string,
  fileName: string
): Promise<void> {
  const pid = process.pid
  const relaunchExe = process.execPath
  const scriptDir = dirname(installerPath)

  if (process.platform === 'win32') {
    if (!isWindowsExe(fileName) && !isWindowsMsi(fileName)) {
      throw new Error('Windows silent updates require a .exe or .msi release asset')
    }

    const scriptPath = join(scriptDir, 'lingo-update.ps1')
    writeWindowsUpdateScript(scriptPath)
    runDetached('powershell.exe', [
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
      relaunchExe,
      '-IsMsi',
      isWindowsMsi(fileName) ? 'True' : 'False'
    ])
    return
  }

  if (process.platform === 'darwin') {
    if (!isMacZip(fileName)) {
      throw new Error('macOS silent updates require a .zip release asset')
    }

    const extractDir = join(scriptDir, 'extract')
    const sourceApp = await extractMacZip(installerPath, extractDir)
    const targetApp = macAppBundlePath()
    const scriptPath = join(scriptDir, 'lingo-update.sh')

    writePosixScript(
      scriptPath,
      `${waitForPidPosixBlock(pid)}
ditto "${sourceApp}" "${targetApp}"
open "${targetApp}"
`
    )

    runDetached('/bin/sh', [scriptPath])
    return
  }

  if (process.platform === 'linux') {
    const appImagePath = resolveLinuxAppImagePath()

    if (appImagePath && isLinuxAppImage(fileName)) {
      chmodSync(installerPath, 0o755)
      const scriptPath = join(scriptDir, 'lingo-update.sh')
      writePosixScript(
        scriptPath,
        `${waitForPidPosixBlock(pid)}
chmod +x "${installerPath}"
mv "${installerPath}" "${appImagePath}"
exec "${appImagePath}"
`
      )
      runDetached('/bin/sh', [scriptPath])
      return
    }

    if (isLinuxDeb(fileName)) {
      const scriptPath = join(scriptDir, 'lingo-update.sh')
      writePosixScript(
        scriptPath,
        `${waitForPidPosixBlock(pid)}
if command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
  sudo -n env DEBIAN_FRONTEND=noninteractive dpkg -i "${installerPath}"
else
  pkexec env DEBIAN_FRONTEND=noninteractive dpkg -i "${installerPath}"
fi
if [ -x "${relaunchExe}" ]; then
  nohup "${relaunchExe}" >/dev/null 2>&1 &
fi
`
      )
      runDetached('/bin/sh', [scriptPath])
      return
    }

    if (isLinuxAppImage(fileName) && !appImagePath) {
      throw new Error(
        'AppImage update requires running Lingo from an AppImage (APPIMAGE env not set). Download the new AppImage manually.'
      )
    }

    throw new Error('Unsupported Linux update package')
  }

  throw new Error(`Unsupported platform: ${process.platform}`)
}
