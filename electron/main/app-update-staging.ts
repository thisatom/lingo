import { app } from 'electron'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync
} from 'node:fs'
import { join } from 'node:path'
import type { PendingUpdateNotice } from '../../src/shared/types/ipc'

/** Persisted phases: idle → downloading → downloaded → installing → (app exits) */
export type PersistedUpdatePhase = 'downloading' | 'downloaded' | 'installing'

export interface PersistedUpdateState {
  phase: PersistedUpdatePhase
  version: string
  installerPath: string
  fileName: string
  expectedSize: number | null
  updatedAt: string
}

const STALE_DOWNLOAD_MS = 24 * 60 * 60 * 1000

function updatesRoot(): string {
  return join(app.getPath('userData'), 'updates')
}

export function getUpdateStagingDir(): string {
  return join(updatesRoot(), 'staging')
}

function statePath(): string {
  return join(updatesRoot(), 'state.json')
}

function pendingNoticePath(): string {
  return join(updatesRoot(), 'pending-notice.json')
}

export function ensureUpdateStagingDir(): string {
  const dir = getUpdateStagingDir()
  mkdirSync(dir, { recursive: true })
  return dir
}

export function readUpdateState(): PersistedUpdateState | null {
  const path = statePath()
  if (!existsSync(path)) return null
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as PersistedUpdateState
    if (!parsed?.phase || !parsed.installerPath || !parsed.fileName) return null
    return parsed
  } catch {
    return null
  }
}

export function writeUpdateState(state: PersistedUpdateState): void {
  mkdirSync(updatesRoot(), { recursive: true })
  writeFileSync(statePath(), JSON.stringify(state, null, 2), 'utf8')
}

export function clearUpdateState(): void {
  const path = statePath()
  if (!existsSync(path)) return
  try {
    unlinkSync(path)
  } catch {
    // ignore
  }
}

function writePendingNotice(notice: PendingUpdateNotice): void {
  mkdirSync(updatesRoot(), { recursive: true })
  writeFileSync(pendingNoticePath(), JSON.stringify(notice, null, 2), 'utf8')
}

function readPendingNotice(): PendingUpdateNotice | null {
  const path = pendingNoticePath()
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as PendingUpdateNotice
  } catch {
    return null
  }
}

function clearPendingNotice(): void {
  const path = pendingNoticePath()
  if (!existsSync(path)) return
  try {
    unlinkSync(path)
  } catch {
    // ignore
  }
}

export function verifyDownloadedFile(installerPath: string, expectedSize: number | null): void {
  if (!existsSync(installerPath)) {
    throw new Error('Download failed (file missing)')
  }

  const size = statSync(installerPath).size
  if (size <= 0) {
    throw new Error('Download failed (empty file)')
  }
  if (expectedSize != null && expectedSize > 0 && size < expectedSize * 0.95) {
    throw new Error('Download failed (incomplete file)')
  }
}

function removePartialDownload(state: PersistedUpdateState): void {
  try {
    if (existsSync(state.installerPath)) unlinkSync(state.installerPath)
  } catch {
    // ignore
  }
}

function isStale(state: PersistedUpdateState): boolean {
  const updatedAt = Date.parse(state.updatedAt)
  if (!Number.isFinite(updatedAt)) return true
  return Date.now() - updatedAt > STALE_DOWNLOAD_MS
}

/**
 * On startup: discard interrupted downloads, surface failed installs, never touch the running binary.
 */
export function recoverIncompleteUpdateOnStartup(): void {
  if (!app.isPackaged) return

  const state = readUpdateState()
  if (!state) return

  if (state.phase === 'downloading' || isStale(state)) {
    removePartialDownload(state)
    clearUpdateState()
    return
  }

  if (state.phase === 'installing') {
    writePendingNotice({
      version: state.version,
      body: 'The previous update was interrupted before installation finished. You can retry from Settings → Software update.',
      name: `Lingo ${state.version}`
    })
    writeUpdateState({ ...state, phase: 'downloaded', updatedAt: new Date().toISOString() })
    return
  }

  if (state.phase === 'downloaded') {
    if (!existsSync(state.installerPath)) {
      clearUpdateState()
    }
  }
}

export function consumePendingUpdateNotice(): PendingUpdateNotice | null {
  const notice = readPendingNotice()
  if (!notice) return null
  clearPendingNotice()
  return notice
}

export function markUpdateDownloadReady(
  state: Omit<PersistedUpdateState, 'phase' | 'updatedAt'>
): void {
  writeUpdateState({
    ...state,
    phase: 'downloaded',
    updatedAt: new Date().toISOString()
  })
}

export function markUpdateInstalling(state: PersistedUpdateState): void {
  writeUpdateState({
    ...state,
    phase: 'installing',
    updatedAt: new Date().toISOString()
  })
}

export function cleanupStagingAfterInstallStarted(installerPath: string): void {
  clearUpdateState()
  // Keep installer on disk until the detached script consumes it — never delete here.
  void installerPath
}
