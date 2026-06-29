import { cn } from '@/shared/lib/utils'
import { commandPaletteFooterClass } from '@/shared/lib/command-palette-styles'

const HINTS = [
  { keys: '↑↓', label: 'Navigate' },
  { keys: '↵', label: 'Open' },
  { keys: 'Esc', label: 'Close' }
] as const

export function CommandPaletteFooter({ className }: { className?: string }) {
  return (
    <div className={cn(commandPaletteFooterClass, className)}>
      {HINTS.map((hint) => (
        <span key={hint.label} className="inline-flex items-center gap-1.5">
          <kbd className="rounded border border-[var(--command-palette-border)] bg-[var(--command-palette-item-hover)] px-1.5 py-0.5 font-mono text-[10px] leading-none text-muted-foreground">
            {hint.keys}
          </kbd>
          <span>{hint.label}</span>
        </span>
      ))}
    </div>
  )
}
