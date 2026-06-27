import { describe, expect, it } from 'vitest'
import {
  isLinuxAppImage,
  isLinuxDeb,
  isMacZip,
  isWindowsExe,
  isWindowsMsi,
  pickAssetForPlatform,
  pickLinuxAsset,
  pickMacAsset,
  pickWindowsAsset
} from './app-update-assets'
import type { GitHubAsset } from './app-update-types'

const asset = (name: string): GitHubAsset => ({
  name,
  browser_download_url: `https://example.com/${name}`,
  size: 1024
})

describe('pickWindowsAsset', () => {
  it('prefers setup exe over msi', () => {
    const assets = [asset('Lingo-1.0.0.msi'), asset('Lingo-1.0.0-win-setup.exe')]
    expect(pickWindowsAsset(assets)?.name).toBe('Lingo-1.0.0-win-setup.exe')
  })

  it('falls back to msi when no exe exists', () => {
    const assets = [asset('Lingo-1.0.0.msi')]
    expect(pickWindowsAsset(assets)?.name).toBe('Lingo-1.0.0.msi')
  })
})

describe('pickMacAsset', () => {
  it('matches architecture zip', () => {
    const assets = [
      asset('Lingo-1.0.0-mac-x64.zip'),
      asset('Lingo-1.0.0-mac-arm64.zip')
    ]
    expect(pickMacAsset(assets, 'arm64')?.name).toBe('Lingo-1.0.0-mac-arm64.zip')
  })
})

describe('pickLinuxAsset', () => {
  it('prefers AppImage over deb', () => {
    const assets = [asset('Lingo-1.0.0-linux-x64.deb'), asset('Lingo-1.0.0-linux-x64.AppImage')]
    expect(pickLinuxAsset(assets)?.name).toBe('Lingo-1.0.0-linux-x64.AppImage')
  })
})

describe('pickAssetForPlatform', () => {
  it('selects per platform', () => {
    const assets = [
      asset('Lingo-1.0.0-win-setup.exe'),
      asset('Lingo-1.0.0-mac-arm64.zip'),
      asset('Lingo-1.0.0-linux-x64.AppImage')
    ]
    expect(pickAssetForPlatform(assets, 'win32')?.name).toContain('win-setup')
    expect(pickAssetForPlatform(assets, 'darwin')?.name).toContain('mac')
    expect(pickAssetForPlatform(assets, 'linux')?.name).toContain('AppImage')
  })
})

describe('installer type helpers', () => {
  it('detects file extensions', () => {
    expect(isWindowsExe('setup.exe')).toBe(true)
    expect(isWindowsMsi('setup.msi')).toBe(true)
    expect(isMacZip('app.zip')).toBe(true)
    expect(isLinuxAppImage('app.AppImage')).toBe(true)
    expect(isLinuxDeb('app.deb')).toBe(true)
  })
})
