import type { StateStorage } from 'zustand/middleware'

export const CHAT_PERSIST_KEY = 'lingo-chats-v3'

const LEGACY_KEYS = ['lingo-chats', 'lingo-chats-v2']

const CHAT_PERSIST_DEBOUNCE_MS = 450

let pendingWrite: { name: string; value: string } | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null

/** Remove huge base64 blobs from raw JSON before parse (fixes slow startup). */
function stripHeavyPayloads(raw: string): string {
  return raw
    .replace(/"payload":"data:[^"]{400,}"/g, '"payload":""')
    .replace(/"attachments":\[[^\]]{50000,}\]/g, '"attachments":[]')
}

function readRaw(name: string): string | null {
  let raw = localStorage.getItem(name)
  if (raw) return stripHeavyPayloads(raw)

  for (const legacy of LEGACY_KEYS) {
    if (legacy === name) continue
    const prev = localStorage.getItem(legacy)
    if (!prev) continue
    raw = stripHeavyPayloads(prev)
    try {
      localStorage.setItem(name, raw)
      localStorage.removeItem(legacy)
    } catch {
      // quota — still return trimmed for this session
    }
    return raw
  }

  return null
}

function safeGetItem(name: string): string | null {
  const raw = readRaw(name)
  if (!raw) return null

  try {
    JSON.parse(raw)
    return raw
  } catch (error) {
    console.warn('[lingo] Corrupt chat storage, resetting:', name, error)
    try {
      localStorage.removeItem(name)
      for (const legacy of LEGACY_KEYS) {
        localStorage.removeItem(legacy)
      }
    } catch {
      // ignore quota errors while clearing
    }
    return null
  }
}

function writeNow(name: string, value: string): void {
  try {
    localStorage.setItem(name, value)
  } catch (e) {
    console.warn('[lingo] Could not persist chats:', e)
  }
}

function flushPendingWrite(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  if (!pendingWrite) return
  const { name, value } = pendingWrite
  pendingWrite = null
  writeNow(name, value)
}

/** Flush debounced chat persist before shutdown or explicit save. */
export function flushChatPersistDebounce(): void {
  flushPendingWrite()
}

/** Write immediately (bypass debounce) for shutdown snapshots. */
export function writeChatPersistSnapshotNow(name: string, value: string): void {
  pendingWrite = { name, value }
  flushPendingWrite()
}

export const chatPersistStorage: StateStorage = {
  getItem: (name) => safeGetItem(name),
  setItem: (name, value) => {
    pendingWrite = { name, value }
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debounceTimer = null
      flushPendingWrite()
    }, CHAT_PERSIST_DEBOUNCE_MS)
  },
  removeItem: (name) => {
    flushPendingWrite()
    for (const key of [name, ...LEGACY_KEYS]) {
      localStorage.removeItem(key)
    }
  }
}
