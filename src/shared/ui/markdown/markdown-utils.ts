export function extractCodeLanguage(className?: string): string | null {
  if (!className) return null
  const match = /language-([\w+#.-]+)/i.exec(className)
  return match?.[1] ?? null
}

export function formatCodeLanguageLabel(language: string): string {
  const normalized = language.toLowerCase()
  const labels: Record<string, string> = {
    js: 'JavaScript',
    javascript: 'JavaScript',
    ts: 'TypeScript',
    typescript: 'TypeScript',
    tsx: 'TSX',
    jsx: 'JSX',
    py: 'Python',
    python: 'Python',
    sh: 'Shell',
    bash: 'Bash',
    shell: 'Shell',
    json: 'JSON',
    md: 'Markdown',
    markdown: 'Markdown',
    yml: 'YAML',
    yaml: 'YAML',
    html: 'HTML',
    css: 'CSS',
    cpp: 'C++',
    'c++': 'C++',
    csharp: 'C#',
    rs: 'Rust',
    rust: 'Rust',
    go: 'Go',
    java: 'Java',
    kotlin: 'Kotlin',
    sql: 'SQL'
  }
  return labels[normalized] ?? language
}
