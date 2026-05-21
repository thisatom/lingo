const DB_NAME = 'lingo-attachments'
const DB_VERSION = 1
const STORE = 'blobs'

type BlobRecord = { id: string; payload: string }

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
  })
  return dbPromise
}

export async function saveAttachmentBlob(id: string, payload: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const req = store.put({ id, payload } satisfies BlobRecord)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error ?? new Error('save attachment failed'))
  })
}

export async function loadAttachmentBlob(id: string): Promise<string | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(id)
    req.onsuccess = () => {
      const row = req.result as BlobRecord | undefined
      resolve(row?.payload ?? null)
    }
    req.onerror = () => reject(req.error ?? new Error('load attachment failed'))
  })
}

export async function deleteAttachmentBlob(id: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const req = tx.objectStore(STORE).delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error ?? new Error('delete attachment failed'))
  })
}
