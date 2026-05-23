import { flushSettingsPersist } from '@/app/lib/flush-settings-persist'
import { isElectronApp } from '@/shared/lib/lingo'

export async function finishWelcomeWindow(): Promise<void> {
  if (!isElectronApp()) return
  await flushSettingsPersist()
  const finish = window.lingo?.welcome?.finish
  if (!finish) return
  await finish()
}
