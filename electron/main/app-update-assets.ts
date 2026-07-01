import type { GitHubAsset } from './app-update-types'

export function pickWindowsAsset(assets: GitHubAsset[]): GitHubAsset | null {
  const exes = assets.filter((asset) => /\.exe$/i.test(asset.name))
  const setupExe =
    exes.find((asset) => /setup|installer|win/i.test(asset.name)) ??
    exes.find((asset) => /Lingo/i.test(asset.name)) ??
    exes[0] ??
    null

  if (setupExe) return setupExe

  return assets.find((asset) => /\.msi$/i.test(asset.name)) ?? null
}

export function pickMacAsset(assets: GitHubAsset[], arch = process.arch): GitHubAsset | null {
  const archHint = arch === 'arm64' ? 'arm64' : 'x64'
  const zips = assets.filter((asset) => /\.zip$/i.test(asset.name))
  const matchArch = (list: GitHubAsset[]) =>
    list.find((asset) => asset.name.includes(archHint)) ?? list[0] ?? null

  return matchArch(zips.filter((asset) => /mac/i.test(asset.name))) ?? matchArch(zips)
}

export type LinuxInstallFormat = 'appimage' | 'deb' | 'unknown'

export function detectLinuxInstallFormat(): LinuxInstallFormat {
  if (process.env.APPIMAGE) return 'appimage'
  if (/\.AppImage$/i.test(process.execPath)) return 'appimage'

  const execPath = process.execPath
  if (
    execPath.startsWith('/usr/') ||
    execPath.startsWith('/opt/') ||
    execPath.includes('/snap/')
  ) {
    return 'deb'
  }

  return 'unknown'
}

function pickLinuxAppImageAsset(assets: GitHubAsset[]): GitHubAsset | null {
  const appImages = assets.filter((asset) => /\.AppImage$/i.test(asset.name))
  return appImages.find((asset) => /linux|x64/i.test(asset.name)) ?? appImages[0] ?? null
}

function pickLinuxDebAsset(assets: GitHubAsset[]): GitHubAsset | null {
  const debs = assets.filter((asset) => /\.deb$/i.test(asset.name))
  return debs.find((asset) => /linux|x64/i.test(asset.name)) ?? debs[0] ?? null
}

export function pickLinuxAsset(assets: GitHubAsset[]): GitHubAsset | null {
  const format = detectLinuxInstallFormat()
  if (format === 'deb') {
    return pickLinuxDebAsset(assets) ?? pickLinuxAppImageAsset(assets)
  }

  return pickLinuxAppImageAsset(assets) ?? pickLinuxDebAsset(assets)
}

export function pickAssetForPlatform(
  assets: GitHubAsset[],
  platform: NodeJS.Platform = process.platform
): GitHubAsset | null {
  if (platform === 'win32') return pickWindowsAsset(assets)
  if (platform === 'darwin') return pickMacAsset(assets)
  if (platform === 'linux') return pickLinuxAsset(assets)
  return null
}

export function isWindowsMsi(fileName: string): boolean {
  return /\.msi$/i.test(fileName)
}

export function isWindowsExe(fileName: string): boolean {
  return /\.exe$/i.test(fileName)
}

export function isMacZip(fileName: string): boolean {
  return /\.zip$/i.test(fileName)
}

export function isLinuxAppImage(fileName: string): boolean {
  return /\.AppImage$/i.test(fileName)
}

export function isLinuxDeb(fileName: string): boolean {
  return /\.deb$/i.test(fileName)
}
