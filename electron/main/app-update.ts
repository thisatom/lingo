import { app, shell } from 'electron'
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  unlinkSync
} from 'node:fs'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import type { AppUpdateCheckResult, AppUpdateInfo } from '../../src/shared/types/ipc'
import { pickAssetForPlatform } from './app-update-assets'
import { installDownloadedUpdate } from './app-update-install'
import { emitAppUpdateProgress } from './app-update-progress'
import { flushThenExitForUpdate } from './app-update-quit'
import {
  cleanupStagingAfterInstallStarted,
  clearUpdateState,
  consumePendingUpdateNotice,
  ensureUpdateStagingDir,
  markUpdateDownloadReady,
  markUpdateInstalling,
  readUpdateState,
  recoverIncompleteUpdateOnStartup,
  verifyDownloadedFile,
  writeUpdateState
} from './app-update-staging'
import type { GitHubRelease } from './app-update-types'

export { consumePendingUpdateNotice, recoverIncompleteUpdateOnStartup }

const GITHUB_OWNER = 'thisatom'
const GITHUB_REPO = 'lingo'
const RELEASES_PAGE = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`
const API_BASE = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Lingo-Desktop-Updater'
  }
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN
  if (token?.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`
  }
  return headers
}

let cachedCheck: AppUpdateCheckResult | null = null
let installInFlight = false

function parseVersion(version: string): number[] {
  const cleaned = version.replace(/^v/i, '').split('-')[0] ?? ''
  return cleaned.split('.').map((part) => {
    const n = parseInt(part, 10)
    return Number.isFinite(n) ? n : 0
  })
}

export function isVersionNewer(latest: string, current: string): boolean {
  const a = parseVersion(latest)
  const b = parseVersion(current)
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0
    const y = b[i] ?? 0
    if (x > y) return true
    if (x < y) return false
  }
  return false
}

async function githubFetch<T>(url: string): Promise<T | null> {
  const response = await fetch(url, { headers: githubHeaders() })
  if (response.status === 404) return null
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text ? `GitHub API error (${response.status})` : `GitHub API error (${response.status})`)
  }
  return (await response.json()) as T
}

async function fetchLatestRelease(): Promise<GitHubRelease | null> {
  const latest = await githubFetch<GitHubRelease>(`${API_BASE}/releases/latest`)
  if (latest && !latest.draft && !latest.prerelease) return latest

  const releases = await githubFetch<GitHubRelease[]>(`${API_BASE}/releases?per_page=10`)
  if (!releases?.length) return null

  return (
    releases.find((release) => !release.draft && !release.prerelease) ??
    releases.find((release) => !release.draft) ??
    null
  )
}

function toUpdateInfo(release: GitHubRelease): AppUpdateInfo {
  const version = release.tag_name.replace(/^v/i, '')
  const asset = pickAssetForPlatform(release.assets)

  return {
    version,
    tag: release.tag_name,
    name: release.name || release.tag_name,
    body: release.body?.trim() || '',
    htmlUrl: release.html_url,
    publishedAt: release.published_at,
    downloadUrl: asset?.browser_download_url ?? null,
    downloadName: asset?.name ?? null,
    downloadSize: asset?.size ?? null
  }
}

export function getCurrentAppVersion(): string {
  return app.getVersion()
}

export async function checkForAppUpdate(): Promise<AppUpdateCheckResult> {
  const currentVersion = getCurrentAppVersion()

  try {
    const release = await fetchLatestRelease()
    if (!release) {
      const result: AppUpdateCheckResult = {
        currentVersion,
        update: null,
        error: 'No published releases found.'
      }
      cachedCheck = result
      return result
    }

    const update = toUpdateInfo(release)
    const hasUpdate = isVersionNewer(update.version, currentVersion)

    const result: AppUpdateCheckResult = {
      currentVersion,
      update: hasUpdate ? update : null,
      error: null
    }
    cachedCheck = result
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update check failed'
    const result: AppUpdateCheckResult = {
      currentVersion,
      update: null,
      error: message
    }
    cachedCheck = result
    return result
  }
}

async function downloadAsset(
  url: string,
  destination: string,
  onProgress?: (percent: number) => void,
  knownTotal?: number | null
): Promise<void> {
  const response = await fetch(url, { headers: githubHeaders(), redirect: 'follow' })
  if (!response.ok) {
    throw new Error(`Download failed (${response.status})`)
  }
  if (!response.body) {
    throw new Error('Download failed (empty response)')
  }

  const headerTotal = Number(response.headers.get('content-length') ?? 0)
  const total = headerTotal > 0 ? headerTotal : (knownTotal ?? 0)
  let received = 0
  const reader = response.body.getReader()

  await pipeline(
    Readable.from(
      (async function* () {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          received += value.byteLength
          if (total > 0 && onProgress) {
            onProgress(Math.min(100, Math.round((received / total) * 100)))
          }
          yield Buffer.from(value)
        }
      })()
    ),
    createWriteStream(destination)
  )

  verifyDownloadedFile(destination, total > 0 ? total : (knownTotal ?? null))
}

function removeInstallerAt(path: string): void {
  try {
    if (existsSync(path)) unlinkSync(path)
  } catch {
    // ignore cleanup errors
  }
}

export async function downloadAndInstallUpdate(): Promise<{ ok: boolean; error?: string }> {
  if (installInFlight) {
    return { ok: false, error: 'Update already in progress' }
  }

  installInFlight = true

  try {
    emitAppUpdateProgress({ phase: 'checking' })

    if (!cachedCheck?.update) {
      const check = await checkForAppUpdate()
      if (!check.update) {
        const message = check.error ?? 'No update available'
        emitAppUpdateProgress({ phase: 'failed', message })
        return { ok: false, error: message }
      }
    }

    const update = cachedCheck?.update
    if (!update) {
      const message = 'No update available'
      emitAppUpdateProgress({ phase: 'failed', message })
      return { ok: false, error: message }
    }

    if (!app.isPackaged) {
      await shell.openExternal(update.htmlUrl || RELEASES_PAGE)
      const message = 'Install updates from a packaged build of Lingo.'
      emitAppUpdateProgress({ phase: 'failed', message })
      return { ok: false, error: message }
    }

    if (!update.downloadUrl) {
      emitAppUpdateProgress({ phase: 'failed', message: 'No installer for this platform.' })
      return { ok: false, error: 'No installer for this platform.' }
    }

    const fileName = update.downloadName ?? `lingo-update-${update.version}`
    const stagingDir = ensureUpdateStagingDir()
    const installerPath = join(stagingDir, fileName)

    writeUpdateState({
      phase: 'downloading',
      version: update.version,
      installerPath,
      fileName,
      expectedSize: update.downloadSize,
      updatedAt: new Date().toISOString()
    })

    emitAppUpdateProgress({ phase: 'downloading', version: update.version, percent: 0 })

    try {
      await downloadAsset(
        update.downloadUrl,
        installerPath,
        (percent) => {
          emitAppUpdateProgress({ phase: 'downloading', version: update.version, percent })
        },
        update.downloadSize
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Download failed'
      emitAppUpdateProgress({ phase: 'failed', message })
      clearUpdateState()
      removeInstallerAt(installerPath)
      return { ok: false, error: message }
    }

    markUpdateDownloadReady({
      version: update.version,
      installerPath,
      fileName,
      expectedSize: update.downloadSize
    })

    emitAppUpdateProgress({ phase: 'installing', version: update.version })

    const persisted = readUpdateState()
    if (persisted) {
      markUpdateInstalling(persisted)
    }

    try {
      const installResult = await installDownloadedUpdate(installerPath, fileName)
      cleanupStagingAfterInstallStarted(installerPath)

      if (installResult.manualHandoff) {
        await shell.openPath(stagingDir)
        const message =
          'Update downloaded to the Lingo updates folder. Install the package from there, then restart Lingo.'
        emitAppUpdateProgress({ phase: 'failed', message })
        return { ok: false, error: message }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not install update'
      emitAppUpdateProgress({ phase: 'failed', message })
      return { ok: false, error: message }
    }

    emitAppUpdateProgress({ phase: 'restarting', version: update.version })
    await flushThenExitForUpdate()
    return { ok: true }
  } finally {
    installInFlight = false
  }
}

export async function openReleasesPage(): Promise<void> {
  await shell.openExternal(RELEASES_PAGE)
}

export async function backgroundUpdateCheck(
  sendAvailable: (info: AppUpdateInfo) => void
): Promise<void> {
  if (!app.isPackaged) return
  const result = await checkForAppUpdate()
  if (result.update) sendAvailable(result.update)
}
