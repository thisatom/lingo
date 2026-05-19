import { Volume2, VolumeX } from 'lucide-react'
import { useSettingsStore } from '@/entities/settings/model/store'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

export function TtsToggleButton() {
  const ttsEnabled = useSettingsStore((s) => s.ttsEnabled)
  const setTtsEnabled = useSettingsStore((s) => s.setTtsEnabled)

  return (
    <Button
      type="button"
      variant={ttsEnabled ? 'secondary' : 'ghost'}
      size="icon"
      className={cn(
        'h-6 min-h-6 w-auto shrink-0 gap-1 rounded-md px-2 text-[11px] leading-none',
        ttsEnabled && 'bg-muted text-foreground'
      )}
      onClick={() => setTtsEnabled(!ttsEnabled)}
      title={ttsEnabled ? 'Turn off speech' : 'Turn on speech'}
    >
      {ttsEnabled ? <Volume2 className="size-3" /> : <VolumeX className="size-3" />}
      <span className="hidden sm:inline">Speak aloud</span>
    </Button>
  )
}
