import { useEffect, useState } from 'react'
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon
} from 'lucide-react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

function useDocumentTheme(): 'light' | 'dark' {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  )

  useEffect(() => {
    const root = document.documentElement
    const sync = () => {
      setTheme(root.classList.contains('dark') ? 'dark' : 'light')
    }
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return theme
}

const toastClassNames = {
  toast:
    'lingo-sonner-toast group toast !rounded-lg !bg-popover !text-popover-foreground !shadow-md !ring-1 !ring-foreground/10',
  title: 'group-[.toast]:text-sm group-[.toast]:font-medium group-[.toast]:leading-snug',
  description: 'group-[.toast]:text-xs group-[.toast]:text-muted-foreground',
  actionButton:
    'group-[.toast]:mt-2 group-[.toast]:h-8 group-[.toast]:rounded-md group-[.toast]:border group-[.toast]:border-border/60 group-[.toast]:bg-secondary group-[.toast]:px-3 group-[.toast]:text-xs group-[.toast]:font-medium group-[.toast]:text-secondary-foreground hover:group-[.toast]:bg-secondary/80',
  cancelButton:
    'group-[.toast]:mt-2 group-[.toast]:h-8 group-[.toast]:rounded-md group-[.toast]:border-0 group-[.toast]:bg-transparent group-[.toast]:px-3 group-[.toast]:text-xs group-[.toast]:font-medium group-[.toast]:text-muted-foreground hover:group-[.toast]:bg-transparent hover:group-[.toast]:text-foreground',
  closeButton:
    'group-[.toast]:left-auto group-[.toast]:right-2 group-[.toast]:top-2 group-[.toast]:border group-[.toast]:border-border/60 group-[.toast]:bg-muted/40 group-[.toast]:text-muted-foreground hover:group-[.toast]:bg-muted hover:group-[.toast]:text-foreground'
} as const

function Toaster({ ...props }: ToasterProps) {
  const theme = useDocumentTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />
      }}
      toastOptions={{
        classNames: toastClassNames
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--menu-border)',
          '--border-radius': 'var(--radius)'
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
