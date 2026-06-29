import type { AppUpdatePhase } from '@/shared/types/ipc'

export const APP_UPDATE_ACTIVE_PHASES = [
  { id: 'checking' as const, label: 'Check' },
  { id: 'downloading' as const, label: 'Download' },
  { id: 'installing' as const, label: 'Install' },
  { id: 'restarting' as const, label: 'Restart' }
]

export type AppUpdateActivePhase = (typeof APP_UPDATE_ACTIVE_PHASES)[number]['id']

export function appUpdatePhaseIndex(phase: AppUpdatePhase): number {
  return APP_UPDATE_ACTIVE_PHASES.findIndex((step) => step.id === phase)
}

export function isAppUpdateStepComplete(
  step: AppUpdateActivePhase,
  current: AppUpdatePhase
): boolean {
  const stepIndex = appUpdatePhaseIndex(step)
  const currentIndex = appUpdatePhaseIndex(current)
  if (stepIndex < 0 || currentIndex < 0) return false
  return currentIndex > stepIndex
}

export function isAppUpdateStepCurrent(
  step: AppUpdateActivePhase,
  current: AppUpdatePhase
): boolean {
  return step === current
}
