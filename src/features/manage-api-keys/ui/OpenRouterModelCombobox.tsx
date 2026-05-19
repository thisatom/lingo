import { Check, ChevronsUpDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { openRouterSuggestedModels } from '@/shared/config/openrouter'
import { settingsInputClass } from '@/shared/lib/settings-control'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'

type OpenRouterModelComboboxProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  className?: string
}

export function OpenRouterModelCombobox({ id, value, onChange, className }: OpenRouterModelComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const q = search.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!q) return [...openRouterSuggestedModels]
    return openRouterSuggestedModels.filter((m) => m.toLowerCase().includes(q))
  }, [q])

  const exactInSuggestions = openRouterSuggestedModels.some((m) => m.toLowerCase() === q)
  const showApplyCustom = q.length > 0 && !exactInSuggestions

  const close = () => {
    setOpen(false)
    setSearch('')
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setSearch('')
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            settingsInputClass,
            'w-full justify-start font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <span className="min-w-0 flex-1 truncate text-left">{value || 'Choose or type a model id…'}</span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search models…" value={search} onValueChange={setSearch} />
          <CommandList>
            {filtered.length === 0 && !showApplyCustom ? (
              <div className="py-6 text-center text-sm text-muted-foreground">No matches.</div>
            ) : null}
            <CommandGroup heading="Suggestions">
              {filtered.map((m) => (
                <CommandItem
                  key={m}
                  value={m}
                  keywords={[m.replace(/\//g, ' ')]}
                  onSelect={() => {
                    onChange(m)
                    close()
                  }}
                >
                  <Check className={cn('mr-2 size-4 shrink-0', value === m ? 'opacity-100' : 'opacity-0')} />
                  <span className="truncate">{m}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {showApplyCustom && (
              <CommandGroup>
                <CommandItem
                  value={`__apply__:${search.trim()}`}
                  onSelect={() => {
                    onChange(search.trim())
                    close()
                  }}
                >
                  Use &quot;{search.trim()}&quot;
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
