import { useRef, type ComponentProps } from 'react'
import { FieldContextMenu } from '@/features/chat-composer/ui/FieldContextMenu'
import { settingsInputClass } from '@/shared/lib/settings-control'
import { cn } from '@/shared/lib/utils'
import { Input } from '@/shared/ui/input'

type SettingsInputProps = Omit<ComponentProps<typeof Input>, 'onChange' | 'value'> & {
  value: string
  onValueChange: (value: string) => void
}

/** Settings text input with cut / copy / paste context menu. */
export function SettingsInput({ value, onValueChange, className, ...props }: SettingsInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <FieldContextMenu
      fieldRef={inputRef}
      onValueChange={onValueChange}
      triggerClassName="w-fit shrink-0 min-w-0"
    >
      <Input
        ref={inputRef}
        className={cn(settingsInputClass, className)}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        {...props}
      />
    </FieldContextMenu>
  )
}
