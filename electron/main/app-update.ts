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
import { installDownloadedUpdate } from './app-update-install'
import { emitAppUpdateProgress } from './app-update-progress'

const GITHUB_OWNER = 'thisatom'
const GITHUB_REPO = 'lingo'
const RELEASES_PAGE = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`
const API_BASE = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`

const GITHUB_HEADERS: Record<string, string> = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'Lingo-Desktop-Updater'
}

type GitHubAsset = {
  name: string
  browser_download_url: string
  size: number
}

type GitHubRelease = {
  tag_name: string
  name: string
  body: string | null
  html_url: string
  published_at: string
  draft: boolean
  prerelease: boolean
  assets: GitHubAsset[]
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
  const response = await fetch(url, { headers: GITHUB_HEADERS })
  if (response.status === 404) return null
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      text ? `GitHub API error (${response.status})` : `GitHub API error (${response.status})`
    )
  }
  return (await response.json()) as T
}

async function fetchLatestRelease(): Promise<GitHubRelease | null> {
  const latest = await githubFetch<GitHubRelease>(`${API_BASE}/releases/latest`)
  if (latest && !latest.draft) return latest

  const releases = await githubFetch<GitHubRelease[]>(`${API_BASE}/releases?per_page=10`)
  if (!releases?.length) return null

  return (
    releases.find((release) => !release.draft && !release.prerelease) ??
    releases.find((release) => !release.draft) ??
    null
  )
}

function pickWindowsAsset(assets: GitHubAsset[]): GitHubAsset | null {
  const installers = assets.filter(
    (asset) =>
      asset.browser_download_url.toLowerCase().endsWith('.exe') ||
      asset.browser_download_url.toLowerCase().endsWith('.msi')
  )
  if (!installers.length) return null

  return (
    installers.find((asset) => /setup|installer|win|x64/i.test(asset.name)) ?? installers[0] ?? null
  )
}

function pickMacAsset(assets: GitHubAsset[]): GitHubAsset | null {
  const archHint = process.arch === 'arm64' ? 'arm64' : 'x64'
  const zips = assets.filter((asset) => /\.zip$/i.test(asset.name))
  const matchArch = (list: GitHubAsset[]) =>
    list.find((asset) => asset.name.includes(archHint)) ?? list[0] ?? null

  return matchArch(zips.filter((asset) => /mac/i.test(asset.name))) ?? matchArch(zips)
}

function pickAssetForPlatform(assets: GitHubAsset[]): GitHubAsset | null {
  if (process.platform === 'win32') return pickWindowsAsset(assets)
  if (process.platform === 'darwin') return pickMacAsset(assets)
  return (
    assets.find((asset) => /\.AppImage$/i.test(asset.name)) ??
    assets.find((asset) => /\.deb$/i.test(asset.name)) ??
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
  onProgress?: (percent: number) => void
): Promise<void> {
  const response = await fetch(url, { headers: GITHUB_HEADERS, redirect: 'follow' })
  if (!response.ok) {
    throw new Error(`Download failed (${response.status})`)
  }
  if (!response.body) {
    throw new Error('Download failed (empty response)')
  }

  const total = Number(response.headers.get('content-length') ?? 0)
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
        emitAppUpdateProgress({ phase: 'idle' })
        return { ok: false, error: check.error ?? 'No update available' }
      }
    }

    const update = cachedCheck!.update!

    if (!app.isPackaged) {
      await shell.openExternal(update.htmlUrl || RELEASES_PAGE)
      emitAppUpdateProgress({ phase: 'idle' })
      return { ok: true }
    }

    if (!update.downloadUrl) {
      emitAppUpdateProgress({ phase: 'failed', message: 'No installer for this platform.' })
      return { ok: false, error: 'No installer for this platform.' }
    }

    const fileName = update.downloadName ?? `lingo-update-${update.version}`
    const tempDir = join(app.getPath('temp'), 'lingo-updates')
    mkdirSync(tempDir, { recursive: true })
    const installerPath = join(tempDir, fileName)

    emitAppUpdateProgress({ phase: 'downloading', version: update.version, percent: 0 })

    try {
      await downloadAsset(update.downloadUrl, installerPath, (percent) => {
        emitAppUpdateProgress({ phase: 'downloading', version: update.version, percent })
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Download failed'
      emitAppUpdateProgress({ phase: 'failed', message })
      return { ok: false, error: message }
    }

    emitAppUpdateProgress({ phase: 'installing', version: update.version })

    try {
      await installDownloadedUpdate(installerPath, fileName)
      emitAppUpdateProgress({ phase: 'restarting', version: update.version })
      return { ok: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not install update'
      emitAppUpdateProgress({ phase: 'failed', message })
      return { ok: false, error: message }
    }
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
  const result = await checkForAppUpdate()
  if (result.update) sendAvailable(result.update)
}

/** Cleared after first read — kept for IPC compatibility. */
export function consumePendingUpdateNotice(): null {
  const filePath = join(app.getPath('userData'), 'pending-update.json')
  if (existsSync(filePath)) {
    try {
      unlinkSync(filePath)
    } catch {
      // ignore
    }
  }
  return null
}
