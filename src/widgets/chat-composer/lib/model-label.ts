export function shortOpenRouterModelLabel(modelId: string): string {
  const id = modelId.trim()
  if (!id) return 'Model'
  if (id.toLowerCase() === 'openrouter/auto') return 'Auto'
  const slash = id.lastIndexOf('/')
  return slash >= 0 ? id.slice(slash + 1) : id
}
