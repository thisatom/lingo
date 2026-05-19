import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode
} from 'react'
import { cn } from '@/shared/lib/utils'

const SCROLLBAR_WIDTH_PX = 8
const SCROLLBAR_RIGHT_PX = 3
const THUMB_COLOR = '#313131'
const THUMB_HOVER_COLOR = '#424242'
const THUMB_MIN_HEIGHT_PX = 32
const HIDE_DELAY_MS = 500

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

interface AgentChatScrollAreaProps {
  children: ReactNode
  className?: string
}

export function AgentChatScrollArea({ children, className }: AgentChatScrollAreaProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragRef = useRef<{ startY: number; startScrollTop: number } | null>(null)

  const [metrics, setMetrics] = useState<ThumbMetrics>({
    thumbHeight: 0,
    thumbTop: 0,
    canScroll: false
  })
  const [scrollbarVisible, setScrollbarVisible] = useState(false)
  const [thumbHovered, setThumbHovered] = useState(false)

  const syncMetrics = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    setMetrics(measureThumb(viewport))
  }, [])

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

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    syncMetrics()

    const observer = new ResizeObserver(syncMetrics)
    observer.observe(viewport)
    if (viewport.firstElementChild) observer.observe(viewport.firstElementChild)

    return () => observer.disconnect()
  }, [syncMetrics, children])

  const onViewportScroll = useCallback(() => {
    revealScrollbar()
    syncMetrics()
    scheduleHideScrollbar()
  }, [revealScrollbar, scheduleHideScrollbar, syncMetrics])

  const scrollToThumbPosition = useCallback((clientY: number) => {
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
    viewport.scrollTop = (nextThumbTop / maxThumbTop) * maxScroll
  }, [metrics.canScroll, metrics.thumbHeight])

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
      const scrollDelta = (deltaY / maxThumbTop) * maxScroll
      viewport.scrollTop = drag.startScrollTop + scrollDelta
    },
    [metrics.canScroll, metrics.thumbHeight]
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
    [revealScrollbar, scheduleHideScrollbar, scrollToThumbPosition]
  )

  const thumbStyle: CSSProperties = {
    height: metrics.thumbHeight,
    transform: `translateY(${metrics.thumbTop}px)`,
    width: SCROLLBAR_WIDTH_PX,
    backgroundColor: thumbHovered ? THUMB_HOVER_COLOR : THUMB_COLOR
  }

  const trackStyle: CSSProperties = {
    right: SCROLLBAR_RIGHT_PX,
    width: SCROLLBAR_WIDTH_PX
  }

  return (
    <div
      ref={rootRef}
      className={cn('relative h-full min-h-0', className)}
      onMouseEnter={revealScrollbar}
      onMouseLeave={scheduleHideScrollbar}
    >
      <div
        ref={viewportRef}
        className="h-full min-h-0 overflow-x-hidden overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={onViewportScroll}
      >
        {children}
      </div>

      {metrics.canScroll ? (
        <div
          role="scrollbar"
          aria-orientation="vertical"
          aria-hidden={!scrollbarVisible}
          className={cn(
            'absolute top-0 bottom-0 z-[5] transition-opacity duration-200',
            scrollbarVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
          )}
          style={trackStyle}
          onPointerDown={onTrackPointerDown}
        >
          <div
            role="presentation"
            className="absolute left-0 top-0 rounded-full transition-[background-color] duration-150"
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
    </div>
  )
}
