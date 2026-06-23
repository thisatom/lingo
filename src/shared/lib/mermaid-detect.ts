/** Heuristic: mermaid diagram source (with or without ```mermaid fence). */
export function looksLikeMermaidSource(source: string): boolean {
  const trimmed = unwrapMermaidFence(source.trim())
  if (!trimmed) return false

  const firstLine = trimmed.split('\n').find((line) => line.trim().length > 0)?.trim() ?? ''
  const normalized = firstLine.replace(/;+\s*$/, '').toLowerCase()

  if (/^%%\{init/i.test(normalized)) return true

  return /^(graph|flowchart|sequencediagram|classdiagram|statediagram-v2|statediagram|erdiagram|journey|gantt|pie|gitgraph|mindmap|timeline|quadrantchart|xychart-beta|block-beta|sankey-beta|c4context|c4container|c4component|c4dynamic|c4deployment|kanban|architecture-beta|packet-beta)\b/i.test(
    normalized
  )
}

/** Strip optional markdown fence wrapper from a code segment. */
export function unwrapMermaidFence(content: string): string {
  const match = /^```(?:mermaid)?[^\n]*\n([\s\S]*?)```$/i.exec(content.trim())
  return match?.[1]?.trim() ?? content.trim()
}
