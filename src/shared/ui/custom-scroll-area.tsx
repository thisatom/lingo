import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode
} from 'react'
import { cn } from '@/shared/lib/utils'

const THUMB_MIN_HEIGHT_PX = 32
const HIDE_DELAY_MS = 500
const AT_BOTTOM_THRESHOLD_PX = 80
const EDGE_FADE_THRESHOLD_PX = 6
const EDGE_FADE_HEIGHT_PX = 28

type ScrollVariant = 'chat' | 'sidebar' | 'menu'

const VARIANT_CONFIG: Record<
  ScrollVariant,
  {
    zIndex: number
    thumbIdleOpacity: number
    thumbHoverOpacity: number
    scrollbarWidth: number
    scrollbarRight: number
    edgeFades: boolean
  }
> = {
  chat: {
    zIndex: 40,
    thumbIdleOpacity: 1,
    thumbHoverOpacity: 1,
    scrollbarWidth: 8,
    scrollbarRight: 3,
    edgeFades: false
  },
  sidebar: {
    zIndex: 30,
    thumbIdleOpacity: 0.38,
    thumbHoverOpacity: 0.82,
    scrollbarWidth: 8,
    scrollbarRight: 3,
    edgeFades: true
  },
  menu: {
    zIndex: 50,
    thumbIdleOpacity: 0.38,
    thumbHoverOpacity: 0.82,
    scrollbarWidth: 5,
    scrollbarRight: 2,
    edgeFades: false
  }
}

function readCssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

function scrollThumbColor(hover: boolean): string {
  return readCssVar(
    hover ? '--scrollbar-thumb-hover' : '--scrollbar-thumb',
    hover ? '#424242' : '#313131'
  )
}

type ThumbMetrics = {
  thumbHeight: number
  thumbTop: number
  canScroll: boolean
}

function measureThumb(viewport: HTMLDivElement): ThumbMetrics {
  const { scrollTop, scrollHeight, clientHeight } = viewport
  const maxScroll = Math.max(0, scrollHeight - clientHeight)

  if (maxScroll <= 0) {
    return { thumbHeight: clientHeight, thumbTop: 0, canScroll: false }
  }

  const thumbHeight = Math.max(
    THUMB_MIN_HEIGHT_PX,
    (clientHeight / scrollHeight) * clientHeight
  )
  const thumbTop = (scrollTop / maxScroll) * (clientHeight - thumbHeight)

  return { thumbHeight, thumbTop, canScroll: true }
}

function isViewportAtBottom(viewport: HTMLDivElement): boolean {
  return (
    viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <
    AT_BOTTOM_THRESHOLD_PX
  )
}

export interface CustomScrollAreaProps {
  children: ReactNode
  className?: string
  variant?: ScrollVariant
  onAtBottomChange?: (atBottom: boolean) => void
  onShowScrollToLatestChange?: (show: boolean) => void
  onViewportRef?: (viewport: HTMLDivElement | null) => void
  onViewportScroll?: (viewport: HTMLDivElement) => void
}

export function CustomScrollArea({
  children,
  className,
  variant = 'chat',
  onAtBottomChange,
  onShowScrollToLatestChange,
  onViewportRef,
  onViewportScroll
}: CustomScrollAreaProps) {
  const config = VARIANT_CONFIG[variant]
  const rootRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const metricsRafRef = useRef<number | null>(null)
  const atBottomRef = useRef(true)
  const showScrollToLatestRef = useRef(false)
  const dragRef = useRef<{ startY: number; startScrollTop: number } | null>(null)

  const [metrics, setMetrics] = useState<ThumbMetrics>({
    thumbHeight: 0,
    thumbTop: 0,
    canScroll: false
  })
  const [scrollbarVisible, setScrollbarVisible] = useState(false)
  const [thumbHovered, setThumbHovered] = useState(false)
  const [edgeFade, setEdgeFade] = useState({ top: false, bottom: false })

  const isMenu = variant === 'menu'
  const isChat = variant === 'chat'

  const thumbOpacity =
    !metrics.canScroll || (!scrollbarVisible && !thumbHovered)
      ? 0
      : thumbHovered
        ? config.thumbHoverOpacity
        : isMenu && !scrollbarVisible
          ? 0.35
          : config.thumbIdleOpacity

  const syncEdgeFade = useCallback(() => {
    if (!config.edgeFades) return
    const viewport = viewportRef.current
    if (!viewport) return

    const maxScroll = viewport.scrollHeight - viewport.clientHeight
    if (maxScroll <= EDGE_FADE_THRESHOLD_PX) {
      setEdgeFade({ top: false, bottom: false })
      return
    }

    setEdgeFade({
      top: viewport.scrollTop > EDGE_FADE_THRESHOLD_PX,
      bottom:
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight >
        EDGE_FADE_THRESHOLD_PX
    })
  }, [config.edgeFades])

  const syncMetrics = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const next = measureThumb(viewport)
    setMetrics((prev) =>
      prev.thumbHeight === next.thumbHeight &&
      prev.thumbTop === next.thumbTop &&
      prev.canScroll === next.canScroll
        ? prev
        : next
    )
    if (isMenu && next.canScroll) {
      setScrollbarVisible(true)
    }
    syncEdgeFade()
  }, [isMenu, syncEdgeFade])

  const scheduleSyncMetrics = useCallback(() => {
    if (metricsRafRef.current != null) return
    metricsRafRef.current = requestAnimationFrame(() => {
      metricsRafRef.current = null
      syncMetrics()
    })
  }, [syncMetrics])

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const revealScrollbar = useCallback(() => {
    clearHideTimer()
    setScrollbarVisible(true)
  }, [clearHideTimer])

  const scheduleHideScrollbar = useCallback(() => {
    clearHideTimer()
    hideTimerRef.current = setTimeout(() => {
      if (!dragRef.current) setScrollbarVisible(false)
    }, HIDE_DELAY_MS)
  }, [clearHideTimer])

  const clearScrollIdleTimer = useCallback(() => {
    if (scrollIdleTimerRef.current) {
      clearTimeout(scrollIdleTimerRef.current)
      scrollIdleTimerRef.current = null
    }
  }, [])

  const reportAtBottom = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport || !onAtBottomChange) return

    const next = isViewportAtBottom(viewport)
    if (next === atBottomRef.current) return
    atBottomRef.current = next
    onAtBottomChange(next)
  }, [onAtBottomChange])

  const updateScrollToLatestVisibility = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport || !onShowScrollToLatestChange) return

    if (isViewportAtBottom(viewport)) {
      clearScrollIdleTimer()
      if (!showScrollToLatestRef.current) return
      showScrollToLatestRef.current = false
      onShowScrollToLatestChange(false)
      return
    }

    if (!showScrollToLatestRef.current) {
      showScrollToLatestRef.current = true
      onShowScrollToLatestChange(true)
    }
  }, [clearScrollIdleTimer, onShowScrollToLatestChange])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    syncMetrics()

    const observer = new ResizeObserver(() => {
      syncMetrics()
      reportAtBottom()
      updateScrollToLatestVisibility()
    })
    observer.observe(viewport)
    const scrollContent = viewport.querySelector('[data-chat-scroll-content]')
    if (scrollContent) {
      observer.observe(scrollContent)
    } else if (viewport.firstElementChild) {
      observer.observe(viewport.firstElementChild)
    }

    reportAtBottom()
    updateScrollToLatestVisibility()

    return () => {
      observer.disconnect()
      clearScrollIdleTimer()
      if (metricsRafRef.current != null) {
        cancelAnimationFrame(metricsRafRef.current)
      }
    }
  }, [syncMetrics, children, reportAtBottom, updateScrollToLatestVisibility, clearScrollIdleTimer])

  const handleViewportScroll = useCallback(() => {
    const viewport = viewportRef.current
    revealScrollbar()
    if (variant === 'chat') {
      syncMetrics()
    } else {
      scheduleSyncMetrics()
    }
    scheduleHideScrollbar()
    reportAtBottom()
    updateScrollToLatestVisibility()
    if (config.edgeFades) syncEdgeFade()
    if (viewport) onViewportScroll?.(viewport)
  }, [
    variant,
    revealScrollbar,
    scheduleHideScrollbar,
    scheduleSyncMetrics,
    syncMetrics,
    reportAtBottom,
    updateScrollToLatestVisibility,
    config.edgeFades,
    syncEdgeFade,
    onViewportScroll
  ])

  const onViewportRefRef = useRef(onViewportRef)
  onViewportRefRef.current = onViewportRef

  useLayoutEffect(() => {
    onViewportRefRef.current?.(viewportRef.current)
  })

  useEffect(() => {
    return () => onViewportRefRef.current?.(null)
  }, [])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const observer = new ResizeObserver(() => {
      syncMetrics()
    })
    observer.observe(viewport)
    const scrollContent = viewport.querySelector('[data-chat-scroll-content]')
    if (scrollContent) {
      observer.observe(scrollContent)
    } else {
      const inner = viewport.firstElementChild
      if (inner) observer.observe(inner)
    }

    syncMetrics()
    const frame = requestAnimationFrame(syncMetrics)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [syncMetrics, children])

  const scrollToThumbPosition = useCallback(
    (clientY: number) => {
      const viewport = viewportRef.current
      const root = rootRef.current
      if (!viewport || !root || !metrics.canScroll) return

      const trackTop = root.getBoundingClientRect().top
      const trackHeight = viewport.clientHeight
      const maxThumbTop = trackHeight - metrics.thumbHeight
      const nextThumbTop = Math.min(
        Math.max(clientY - trackTop - metrics.thumbHeight / 2, 0),
        maxThumbTop
      )
      const maxScroll = viewport.scrollHeight - viewport.clientHeight
      viewport.scrollTop =
        maxThumbTop > 0 ? (nextThumbTop / maxThumbTop) * maxScroll : 0
      syncMetrics()
    },
    [metrics.canScroll, metrics.thumbHeight, syncMetrics]
  )

  const onThumbPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const viewport = viewportRef.current
      if (!viewport || !metrics.canScroll) return

      event.preventDefault()
      event.stopPropagation()
      revealScrollbar()
      dragRef.current = {
        startY: event.clientY,
        startScrollTop: viewport.scrollTop
      }
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [metrics.canScroll, revealScrollbar]
  )

  const onThumbPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const viewport = viewportRef.current
      const drag = dragRef.current
      if (!viewport || !drag || !metrics.canScroll) return

      const trackHeight = viewport.clientHeight
      const maxScroll = viewport.scrollHeight - viewport.clientHeight
      const maxThumbTop = trackHeight - metrics.thumbHeight
      const deltaY = event.clientY - drag.startY
      const scrollDelta = maxThumbTop > 0 ? (deltaY / maxThumbTop) * maxScroll : 0
      viewport.scrollTop = Math.min(
        maxScroll,
        Math.max(0, drag.startScrollTop + scrollDelta)
      )
      syncMetrics()
    },
    [metrics.canScroll, metrics.thumbHeight, syncMetrics]
  )

  const onThumbPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      dragRef.current = null
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      scheduleHideScrollbar()
    },
    [scheduleHideScrollbar]
  )

  const onTrackPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return
      scrollToThumbPosition(event.clientY)
      revealScrollbar()
      scheduleHideScrollbar()
    },
    [revealScrollbar, scheduleHideScrollbar, scrollToThumbPosition, syncMetrics]
  )

  const thumbStyle: CSSProperties = {
    height: metrics.thumbHeight,
    transform: `translateY(${metrics.thumbTop}px)`,
    width: config.scrollbarWidth,
    backgroundColor: scrollThumbColor(thumbHovered),
    opacity: thumbOpacity
  }

  const trackStyle: CSSProperties = {
    right: config.scrollbarRight,
    width: config.scrollbarWidth
  }

  return (
    <div
      ref={rootRef}
      className={cn(
        'relative min-h-0',
        isMenu ? cn('overflow-hidden', className) : cn('h-full min-h-0', className)
      )}
      onMouseEnter={revealScrollbar}
      onMouseLeave={isMenu ? undefined : scheduleHideScrollbar}
    >
      <div
        ref={viewportRef}
        className={cn(
          'min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          isMenu ? cn(className) : 'h-full min-h-0'
        )}
        onScroll={handleViewportScroll}
      >
        {children}
      </div>

      {metrics.canScroll ? (
        <div
          role="scrollbar"
          aria-orientation="vertical"
          aria-hidden={!scrollbarVisible}
          className={cn(
            'absolute top-0 bottom-0 transition-opacity duration-200',
            scrollbarVisible
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0'
          )}
          style={{ ...trackStyle, zIndex: config.zIndex }}
          onPointerDown={onTrackPointerDown}
        >
          <div
            role="presentation"
            className="absolute left-0 top-0 rounded-full transition-[background-color,opacity] duration-150"
            style={thumbStyle}
            onPointerDown={onThumbPointerDown}
            onPointerMove={onThumbPointerMove}
            onPointerUp={onThumbPointerUp}
            onPointerCancel={onThumbPointerUp}
            onMouseEnter={() => setThumbHovered(true)}
            onMouseLeave={() => setThumbHovered(false)}
          />
        </div>
      ) : null}

      {config.edgeFades && edgeFade.top ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-[28] bg-gradient-to-b from-sidebar via-sidebar/70 to-transparent"
          style={{ height: EDGE_FADE_HEIGHT_PX }}
        />
      ) : null}
      {config.edgeFades && edgeFade.bottom ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[28] bg-gradient-to-t from-sidebar via-sidebar/70 to-transparent"
          style={{ height: EDGE_FADE_HEIGHT_PX }}
        />
      ) : null}

      {isChat ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[41] h-24 bg-gradient-to-t from-background to-transparent"
        />
      ) : null}
    </div>
  )
}
