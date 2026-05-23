import { flushChatScrollPositions } from '@/app/lib/chat-scroll-registry'
import { flushPersistedStore, type PersistCapableStore } from '@/app/lib/flush-persisted-store'
import { flushChatPersistDebounce } from '@/entities/chat/lib/chat-persist-storage'
import { useChatsStore } from '@/entities/chat/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'

export type AppSaveStep = 'scroll' | 'chats' | 'settings' | 'done'

const STEP_LABELS: Record<AppSaveStep, string> = {
  scroll: 'Сохранение позиции в чатах…',
  chats: 'Сохранение чатов…',
  settings: 'Сохранение настроек…',
  done: 'Данные сохранены'
}

export function getAppSaveStepLabel(step: AppSaveStep): string {
  return STEP_LABELS[step]
}

function waitNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

let saveInFlight: Promise<void> | null = null

/** Await an in-flight shutdown/page persist (no-op if idle). */
export function waitForPersistAppState(): Promise<void> {
  return saveInFlight ?? Promise.resolve()
}

/** Flush scroll + write all persisted Zustand stores to localStorage. */
export async function persistAppState(
  onStep?: (step: AppSaveStep) => void
): Promise<void> {
  saveInFlight ??= (async () => {
    try {
      onStep?.('scroll')
      flushChatScrollPositions()
      await waitNextFrame()

      onStep?.('chats')
      flushChatPersistDebounce()
      await flushPersistedStore(useChatsStore as PersistCapableStore)

      onStep?.('settings')
      await flushPersistedStore(useSettingsStore as PersistCapableStore)

      onStep?.('done')
      await waitNextFrame()
    } catch (error) {
      console.error('[lingo] Failed to persist app state:', error)
      throw error
    }
  })().finally(() => {
    saveInFlight = null
  })

  return saveInFlight
}
