import { isWebPlatform } from '@/shared/lib/lingo-bridge'
import { cn } from '@/shared/lib/utils'

/**
 * Visible only in `npm run dev:web` — API keys are stored in browser localStorage (not secure).
 */
export function WebDevSecretsNotice({ className }: { className?: string }) {
  if (!isWebPlatform()) return null

  return (
    <div
      role="alert"
      className={cn(
        'mb-4 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100',
        className
      )}
    >
      <p className="font-medium">Browser dev build — not for real API keys</p>
      <p className="mt-1 text-xs leading-relaxed text-amber-900/90 dark:text-amber-100/85">
        This preview stores keys in{' '}
        <code className="rounded bg-amber-500/15 px-1 py-0.5 text-[11px]">localStorage</code> as
        plain text. Use the desktop app (<code className="text-[11px]">npm run dev</code>) with OS
        keychain storage for production. Do not enter secrets you would not paste into a web demo.
      </p>
    </div>
  )
}
