import type { StateStorage } from 'zustand/middleware'

export const CHAT_PERSIST_KEY = 'lingo-chats-v3'

const LEGACY_KEYS = ['lingo-chats', 'lingo-chats-v2']

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

export const chatPersistStorage: StateStorage = {
  getItem: (name) => readRaw(name),
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, stripHeavyPayloads(value))
    } catch (e) {
      console.warn('[lingo] Could not persist chats:', e)
    }
  },
  removeItem: (name) => {
    for (const key of [name, ...LEGACY_KEYS]) {
      localStorage.removeItem(key)
    }
  }
}
