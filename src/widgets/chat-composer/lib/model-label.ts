import { isVisionCapableModel } from '@/shared/lib/vision-models'

export function shortOpenRouterModelLabel(modelId: string, options?: { vision?: boolean }): string {
  const id = modelId.trim()
  if (!id) return 'Model'
  if (id.toLowerCase() === 'openrouter/free') return 'Free router'
  if (id.toLowerCase() === 'openrouter/auto') return 'Free router'
  const slash = id.lastIndexOf('/')
  const base = slash >= 0 ? id.slice(slash + 1) : id
  const showVision = options?.vision ?? isVisionCapableModel(id)
  return showVision ? `${base} · vision` : base
}
