import { useEffect, useMemo, useState } from 'react'
import { useSettingsStore } from '@/entities/settings/model/store'
import {
  PRACTICE_LANGUAGE_AUTO,
  practiceLanguageOptionsForSelect,
  translationTargetOptionsForSelect
} from '@/shared/config/practice-languages'
import { copyToClipboard } from '@/shared/lib/copy-to-clipboard'
import { getLingo, isLingoAvailable } from '@/shared/lib/lingo'
import {
  settingsSelectContentClass,
  settingsSelectItemClass,
  settingsSelectTriggerClass
} from '@/shared/lib/settings-control'
import { stripTextForSpeech } from '@/shared/lib/strip-text-for-speech'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Check, Copy, Globe, Loader2Icon } from '@/shared/ui/icons'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger
} from '@/shared/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/ui/select'
import { messageActionButtonClass } from '@/widgets/conversation-panel/ui/agent-layout'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'

type Props = {
  content: string
}

const SOURCE_OPTIONS = practiceLanguageOptionsForSelect(PRACTICE_LANGUAGE_AUTO)

export function ReplyTranslatePopover({ content }: Props) {
  const translationSourceLanguage = useSettingsStore((s) => s.translationSourceLanguage)
  const translationTargetLanguage = useSettingsStore((s) => s.translationTargetLanguage)
  const setTranslationSourceLanguage = useSettingsStore((s) => s.setTranslationSourceLanguage)
  const setTranslationTargetLanguage = useSettingsStore((s) => s.setTranslationTargetLanguage)

  const [open, setOpen] = useState(false)
  const [fromLang, setFromLang] = useState(translationSourceLanguage)
  const [toLang, setToLang] = useState(translationTargetLanguage)
  const [translated, setTranslated] = useState('')
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const targetOptions = useMemo(
    () => translationTargetOptionsForSelect(translationTargetLanguage),
    [translationTargetLanguage]
  )

  useEffect(() => {
    if (!open) return
    setFromLang(translationSourceLanguage)
    setToLang(translationTargetLanguage)
    setTranslated('')
    setDetectedLanguage(null)
    setError(null)
    setCopied(false)
  }, [open, translationSourceLanguage, translationTargetLanguage])

  const plainSource = useMemo(() => stripTextForSpeech(content).trim(), [content])

  const runTranslate = async () => {
    if (!plainSource) return
    if (!isLingoAvailable() || !getLingo().translate) {
      setError('Translation is unavailable in this build.')
      return
    }

    setLoading(true)
    setError(null)
    setCopied(false)
    try {
      const result = await getLingo().translate!.text({
        text: plainSource,
        from: fromLang,
        to: toLang
      })
      setTranslated(result.text)
      setDetectedLanguage(result.detectedLanguage ?? null)
      setTranslationSourceLanguage(fromLang)
      setTranslationTargetLanguage(toLang)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Translation failed'
      setError(
        msg.includes('TRANSLATE_FAILED')
          ? 'Could not translate this reply. Try again in a moment.'
          : msg
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCopyTranslation = async () => {
    if (!translated.trim()) return
    const ok = await copyToClipboard(translated)
    if (!ok) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <TooltipIconButton
          type="button"
          variant="ghost"
          size="iconSm"
          className={messageActionButtonClass}
          tooltip="Translate"
          aria-label="Translate reply"
        >
          <Globe className="size-3.5" />
        </TooltipIconButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(92vw,420px)] p-3">
        <PopoverHeader className="gap-1.5">
          <PopoverTitle className="text-[13px]">Translate reply</PopoverTitle>
          <PopoverDescription className="text-[11px] leading-snug">
            Uses Google Translate (free, via google-translate-api-x). Defaults are saved in
            Settings.
          </PopoverDescription>
        </PopoverHeader>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-[11px] text-muted-foreground">From</span>
            <Select value={fromLang} onValueChange={setFromLang}>
              <SelectTrigger size="sm" className={cn(settingsSelectTriggerClass, 'w-full')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className={settingsSelectContentClass}>
                {SOURCE_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className={settingsSelectItemClass}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="grid gap-1">
            <span className="text-[11px] text-muted-foreground">To</span>
            <Select value={toLang} onValueChange={setToLang}>
              <SelectTrigger size="sm" className={cn(settingsSelectTriggerClass, 'w-full')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className={settingsSelectContentClass}>
                {targetOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className={settingsSelectItemClass}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Button
            type="button"
            size="xs"
            variant="outline"
            className="h-7 px-2.5 text-[11px]"
            disabled={loading || !plainSource}
            onClick={() => void runTranslate()}
          >
            {loading ? (
              <>
                <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />
                Translating…
              </>
            ) : (
              'Translate'
            )}
          </Button>
          {detectedLanguage ? (
            <span className="text-[11px] text-muted-foreground">
              Detected: {detectedLanguage.toUpperCase()}
            </span>
          ) : null}
        </div>

        {error ? <p className="mt-2 text-[11px] text-destructive">{error}</p> : null}

        {translated ? (
          <div className="mt-3 rounded-md border bg-muted/20 p-2.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-muted-foreground">Translation</span>
              <Button
                type="button"
                size="xs"
                variant="ghost"
                className="h-6 px-2 text-[11px]"
                onClick={() => void handleCopyTranslation()}
              >
                {copied ? (
                  <>
                    <Check className="mr-1 size-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 size-3.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="max-h-48 overflow-y-auto whitespace-pre-wrap text-[13px] leading-relaxed">
              {translated}
            </p>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
