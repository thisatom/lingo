import { spawn } from 'node:child_process'

export function resolveWindowsPowerShellPath(): string {
  const windir = process.env.WINDIR ?? process.env.SystemRoot ?? 'C:\\Windows'
  return `${windir}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`
}

/**
 * Spawn a detached helper process and resolve only after the OS accepts the new process.
 * Rejects if spawn fails — caller must not quit the app on failure.
 */
export function spawnDetachedVerified(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    })

    child.once('error', (error) => {
      reject(error)
    })

    child.once('spawn', () => {
      child.unref()
      resolve()
    })
  })
}
