import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  SETTINGS_NAV_GROUPS,
  type SettingsSectionId
} from '@/entities/settings/config/sections'
import { filterSettingsSections } from '@/features/settings-search/lib/filter-settings-sections'
import { commandPaletteEmptyClass, commandPaletteItemIconClass } from '@/shared/lib/command-palette-styles'
import { useDeferredResetOnClose } from '@/shared/lib/use-deferred-reset-on-close'
import {
  ArrowLeft,
  ColorMode,
  Cpu,
  Mic,
  Settings,
  Volume2,
  WandSparkles
} from '@/shared/ui/icons'
import { Kbd, KbdGroup } from '@/shared/ui/kbd'
import {
  CommandDialog,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandPaletteFooter,
  CommandPaletteInput,
  CommandSeparator,
  CommandShortcut
} from '@/shared/ui/command'

interface SettingsSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const navIconClass = 'size-4 shrink-0 !translate-y-0'

const iconBySection: Record<SettingsSectionId, ReactNode> = {
  general: <Settings className={navIconClass} />,
  appearance: <ColorMode className={navIconClass} />,
  devices: <Mic className={navIconClass} />,
  speech: <Volume2 className={navIconClass} />,
  agent: <WandSparkles className={navIconClass} />,
  api: <Cpu className={navIconClass} />
}

export function SettingsSearchDialog({ open, onOpenChange }: SettingsSearchDialogProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')

  const resetPaletteState = useCallback(() => {
    setSearch('')
    setSelectedSectionId('')
  }, [])

  useDeferredResetOnClose(open, resetPaletteState)

  const visibleSections = useMemo(() => filterSettingsSections(search), [search])
  const visibleById = useMemo(
    () => new Map(visibleSections.map((section) => [section.id, section])),
    [visibleSections]
  )

  const pickSection = (path: string, id: string) => {
    navigate(path)
    setSelectedSectionId(id)
    onOpenChange(false)
  }

  const backToChats = () => {
    navigate('/')
    onOpenChange(false)
  }

  const groupedSections = SETTINGS_NAV_GROUPS.map((group) =>
    group.map((id) => visibleById.get(id)).filter((section) => section != null)
  ).filter((group) => group.length > 0)

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search settings"
      description="Jump to a settings section or return to chat"
      commandValue={selectedSectionId}
      onCommandValueChange={setSelectedSectionId}
      shouldFilter={false}
    >
      <CommandPaletteInput
        placeholder="Search settings by name or topic…"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList variant="palette">
        <CommandGroup variant="palette" heading="Actions">
          <CommandItem variant="palette" value="__action_back" onSelect={backToChats}>
            <span className={commandPaletteItemIconClass}>
              <ArrowLeft className="size-4" />
            </span>
            <span className="min-w-0 flex-1">Back to chats</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator variant="palette" />

        {search.trim() && groupedSections.length === 0 ? (
          <p className={commandPaletteEmptyClass}>No settings found</p>
        ) : null}

        {groupedSections.map((group, groupIndex) => (
          <div key={group.map((section) => section.id).join('-')}>
            {groupIndex > 0 ? <CommandSeparator variant="palette" /> : null}
            <CommandGroup variant="palette" heading={groupIndex === 0 ? 'Settings' : 'More'}>
              {group.map((section) => (
                <CommandItem
                  variant="palette"
                  key={section.id}
                  value={section.id}
                  onSelect={() => pickSection(section.path, section.id)}
                >
                  <span className={commandPaletteItemIconClass}>{iconBySection[section.id]}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{section.label}</div>
                    <div className="truncate text-xs text-muted-foreground">{section.description}</div>
                  </div>
                  <CommandShortcut>
                    <KbdGroup className="opacity-90" aria-hidden>
                      <Kbd>↵</Kbd>
                    </KbdGroup>
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
      <CommandPaletteFooter />
    </CommandDialog>
  )
}
