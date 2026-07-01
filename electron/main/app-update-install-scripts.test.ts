import { describe, expect, it } from 'vitest'
import {
  buildLinuxAppImageUpdateScriptBody,
  buildPosixWaitForPidBlock,
  buildWindowsUpdateScript
} from './app-update-install-scripts'
import { resolveWindowsPowerShellPath } from './app-update-spawn'

describe('buildWindowsUpdateScript', () => {
  it('uses NSIS silent /S for exe installers', () => {
    const script = buildWindowsUpdateScript(false)
    expect(script).toContain('ArgumentList @("/S")')
    expect(script).not.toContain('msiexec.exe')
  })

  it('uses msiexec for msi installers', () => {
    const script = buildWindowsUpdateScript(true)
    expect(script).toContain('msiexec.exe')
    expect(script).toContain('/qn')
  })

  it('waits for target pid before installing', () => {
    const script = buildWindowsUpdateScript(false)
    expect(script).toContain('$TargetPid')
    expect(script).toContain('Start-Sleep')
  })
})

describe('buildLinuxAppImageUpdateScriptBody', () => {
  it('stages via .new and backup instead of overwriting in place', () => {
    const body = buildLinuxAppImageUpdateScriptBody(42, '/staging/Lingo.AppImage', '/home/u/Lingo.AppImage')
    expect(body).toContain('.new')
    expect(body).toContain('.backup')
    expect(body).toContain('wait_for_pid 42')
    expect(body).not.toMatch(/mv "\/staging\/Lingo\.AppImage" "\/home\/u\/Lingo\.AppImage"/)
  })
})

describe('buildPosixWaitForPidBlock', () => {
  it('includes pid in wait call', () => {
    expect(buildPosixWaitForPidBlock(999)).toContain('wait_for_pid 999')
  })
})

describe('resolveWindowsPowerShellPath', () => {
  it('points to System32 WindowsPowerShell', () => {
    expect(resolveWindowsPowerShellPath()).toMatch(/WindowsPowerShell\\v1\.0\\powershell\.exe$/i)
  })
})
