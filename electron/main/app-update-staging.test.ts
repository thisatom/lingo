import { describe, expect, it } from 'vitest'
import { verifyDownloadedFile } from './app-update-staging'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

describe('verifyDownloadedFile', () => {
  it('accepts file matching expected size', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lingo-update-'))
    const filePath = join(dir, 'installer.exe')
    writeFileSync(filePath, Buffer.alloc(1024))

    expect(() => verifyDownloadedFile(filePath, 1024)).not.toThrow()
    rmSync(dir, { recursive: true, force: true })
  })

  it('rejects incomplete downloads', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lingo-update-'))
    const filePath = join(dir, 'installer.exe')
    writeFileSync(filePath, Buffer.alloc(100))

    expect(() => verifyDownloadedFile(filePath, 1024)).toThrow(/incomplete/)
    rmSync(dir, { recursive: true, force: true })
  })

  it('rejects empty files', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lingo-update-'))
    const filePath = join(dir, 'installer.exe')
    writeFileSync(filePath, '')

    expect(() => verifyDownloadedFile(filePath, null)).toThrow(/empty/)
    rmSync(dir, { recursive: true, force: true })
  })
})
