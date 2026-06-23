import { useCallback, useEffect, useId, useRef, useState, type RefObject } from 'react'
import { Check, Copy } from '@/shared/ui/icons'
import { Download, Maximize2 } from 'lucide-react'
import { copyToClipboard } from '@/shared/lib/copy-to-clipboard'
import { cn } from '@/shared/lib/utils'
import { typography } from '@/shared/ui/typography'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/shared/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/shared/ui/dropdown-menu'
import { sidebarMenuItemClass, sidebarMenuSurfaceClass } from '@/shared/lib/sidebar-filter-menu-styles'
import { Spinner } from '@/shared/ui/spinner'
import { Button } from '@/shared/ui/button'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'

type MermaidModule = typeof import('mermaid')
type MermaidTab = 'diagram' | 'code'

let mermaidModule: MermaidModule['default'] | null = null
let mermaidTheme: 'dark' | 'default' | null = null

async function loadMermaid(theme: 'dark' | 'default'): Promise<MermaidModule['default']> {
  if (!mermaidModule) {
    mermaidModule = (await import('mermaid')).default
  }
  if (mermaidTheme !== theme) {
    mermaidModule.initialize({
      startOnLoad: false,
      theme,
      securityLevel: 'strict',
      fontFamily: 'inherit'
    })
    mermaidTheme = theme
  }
  return mermaidModule
}

function resolvedMermaidTheme(): 'dark' | 'default' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'default'
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function svgMarkupFromContainer(container: HTMLElement | null): string {
  const svg = container?.querySelector('svg')
  if (!svg) return ''
  return new XMLSerializer().serializeToString(svg)
}

async function downloadSvgPng(svgMarkup: string, filename: string): Promise<void> {
  if (!svgMarkup) return
  const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = url
    })
    const width = img.naturalWidth || img.width || 960
    const height = img.naturalHeight || img.height || 540
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--background') || '#fff'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)
    const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (pngBlob) downloadBlob(pngBlob, filename)
  } finally {
    URL.revokeObjectURL(url)
  }
}

type Props = {
  source: string
  className?: string
}

function MermaidTabButton({
  active,
  label,
  onClick
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={cn(
        'rounded-md px-2 py-0.5 text-[11px] font-medium normal-case tracking-normal transition-colors',
        active
          ? 'bg-accent text-foreground'
          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
      )}
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

function MermaidCanvas({
  source,
  containerRef,
  onSvgChange,
  centered = false,
  showLoadingSpinner = false
}: {
  source: string
  containerRef: RefObject<HTMLDivElement | null>
  onSvgChange: (svg: string) => void
  centered?: boolean
  showLoadingSpinner?: boolean
}) {
  const reactId = useId().replace(/:/g, '')
  const lastSvgRef = useRef('')
  const renderSeqRef = useRef(0)
  const [renderError, setRenderError] = useState(false)
  const [loading, setLoading] = useState(() => source.trim().length > 0)

  useEffect(() => {
    const trimmed = source.trim()
    if (!trimmed) {
      if (containerRef.current) containerRef.current.innerHTML = ''
      lastSvgRef.current = ''
      onSvgChange('')
      setRenderError(false)
      setLoading(false)
      return
    }

    let cancelled = false
    const seq = ++renderSeqRef.current
    setLoading(true)

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const mermaid = await loadMermaid(resolvedMermaidTheme())
          const { svg } = await mermaid.render(`lingo-mermaid-${reactId}-${seq}`, trimmed)
          if (cancelled || seq !== renderSeqRef.current || !containerRef.current) return
          lastSvgRef.current = svg
          containerRef.current.innerHTML = svg
          onSvgChange(svg)
          setRenderError(false)
          setLoading(false)
        } catch {
          if (cancelled || seq !== renderSeqRef.current) return
          if (lastSvgRef.current && containerRef.current) {
            containerRef.current.innerHTML = lastSvgRef.current
            onSvgChange(lastSvgRef.current)
            setRenderError(false)
            setLoading(false)
            return
          }
          setRenderError(true)
          setLoading(false)
        }
      })()
    }, 180)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [containerRef, onSvgChange, reactId, source])

  if (renderError) {
    return (
      <p className="px-3 pb-2 text-xs text-muted-foreground">
        Diagram preview unavailable while streaming.
      </p>
    )
  }

  const showSpinner = showLoadingSpinner && loading

  return (
    <div
      className={cn(
        'relative',
        centered && 'flex min-h-[min(70vh,640px)] w-full flex-1 items-center justify-center'
      )}
    >
      {showSpinner ? (
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
          <Spinner className="size-6 text-muted-foreground" />
        </div>
      ) : null}
      <div
        ref={containerRef}
        className={cn(
          'mermaid-diagram__canvas overflow-x-auto py-2',
          centered && 'flex w-full items-center justify-center overflow-visible py-0',
          showSpinner && 'invisible'
        )}
        aria-label="Mermaid diagram"
        aria-busy={loading || undefined}
      />
    </div>
  )
}

function MermaidDownloadMenu({
  disabled,
  onDownloadPng,
  onDownloadSvg
}: {
  disabled: boolean
  onDownloadPng: () => void
  onDownloadSvg: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          type="button"
          variant="ghost"
          size="iconSm"
          className="size-7 text-muted-foreground hover:text-foreground"
          aria-label="Download diagram"
        >
          <Download className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className={cn('min-w-[7rem]', sidebarMenuSurfaceClass)}
      >
        <DropdownMenuItem className={sidebarMenuItemClass} onSelect={onDownloadPng}>
          PNG
        </DropdownMenuItem>
        <DropdownMenuItem className={sidebarMenuItemClass} onSelect={onDownloadSvg}>
          SVG
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function MermaidDiagram({ source, className }: Props) {
  const [tab, setTab] = useState<MermaidTab>('diagram')
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [svgMarkup, setSvgMarkup] = useState('')
  const canvasRef = useRef<HTMLDivElement>(null)
  const fullscreenCanvasRef = useRef<HTMLDivElement>(null)

  const handleCopySource = useCallback(async () => {
    const ok = await copyToClipboard(source)
    if (!ok) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }, [source])

  const handleDownloadSvg = useCallback(() => {
    const markup = svgMarkup || svgMarkupFromContainer(canvasRef.current)
    if (!markup) return
    downloadBlob(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }), 'diagram.svg')
  }, [svgMarkup])

  const handleDownloadPng = useCallback(async () => {
    const markup = svgMarkup || svgMarkupFromContainer(canvasRef.current)
    await downloadSvgPng(markup, 'diagram.png')
  }, [svgMarkup])

  const headerActions = (
    <div className="flex shrink-0 items-center gap-0.5">
      {tab === 'diagram' ? (
        <>
          <TooltipIconButton
            type="button"
            variant="ghost"
            size="iconSm"
            className="size-7 text-muted-foreground hover:text-foreground"
            tooltip="Fullscreen"
            aria-label="Fullscreen diagram"
            disabled={!svgMarkup}
            onClick={() => setFullscreenOpen(true)}
          >
            <Maximize2 className="size-3.5" />
          </TooltipIconButton>
          <MermaidDownloadMenu
            disabled={!svgMarkup}
            onDownloadPng={() => void handleDownloadPng()}
            onDownloadSvg={handleDownloadSvg}
          />
        </>
      ) : null}
      <button
        type="button"
        className={typography.codeBlockCopyButton}
        aria-label={copied ? 'Copied' : 'Copy diagram source'}
        onClick={() => void handleCopySource()}
      >
        {copied ? (
          <Check className="size-3 shrink-0" aria-hidden />
        ) : (
          <Copy className="size-3 shrink-0" aria-hidden />
        )}
        <span>{copied ? 'Copied' : 'Copy'}</span>
      </button>
    </div>
  )

  return (
    <>
      <div className={cn('mermaid-diagram', typography.codeBlock, className)}>
        <div className={typography.codeBlockHeader}>
          <div className="flex min-w-0 items-center gap-1">
            <MermaidTabButton
              active={tab === 'diagram'}
              label="Diagram"
              onClick={() => setTab('diagram')}
            />
            <MermaidTabButton
              active={tab === 'code'}
              label="Code"
              onClick={() => setTab('code')}
            />
          </div>
          {headerActions}
        </div>

        {tab === 'diagram' ? (
          <MermaidCanvas source={source} containerRef={canvasRef} onSvgChange={setSvgMarkup} />
        ) : (
          <pre className={cn(typography.pre, 'max-h-64 overflow-auto p-3')}>
            <code className={typography.preCode}>{source}</code>
          </pre>
        )}
      </div>

      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent className="flex max-h-[90vh] max-w-[min(96vw,1200px)] flex-col gap-3 overflow-hidden">
          <DialogHeader>
            <DialogTitle>Diagram</DialogTitle>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 overflow-auto rounded-lg border border-border bg-muted/20 p-4">
            <MermaidCanvas
              source={source}
              containerRef={fullscreenCanvasRef}
              onSvgChange={() => undefined}
              centered
              showLoadingSpinner
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
