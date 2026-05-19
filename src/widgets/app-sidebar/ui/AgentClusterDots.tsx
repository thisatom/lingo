import { useEffect, useRef, useState } from 'react'
import { cn } from '@/shared/lib/utils'
import {
  sidebarAgentDotClass,
  sidebarAgentDotSizePx
} from '@/widgets/app-sidebar/lib/sidebar-chat-styles'

const GRID = 3
const CELL_COUNT = GRID * GRID
const MIN_CLUSTER = 4
const MAX_CLUSTER = 6
const STEP_MS = 140
const GRID_GAP_PX = 2

function cellIndex(row: number, col: number): number {
  return row * GRID + col
}

function neighbors(index: number): number[] {
  const row = Math.floor(index / GRID)
  const col = index % GRID
  const out: number[] = []
  if (row > 0) out.push(cellIndex(row - 1, col))
  if (row < GRID - 1) out.push(cellIndex(row + 1, col))
  if (col > 0) out.push(cellIndex(row, col - 1))
  if (col < GRID - 1) out.push(cellIndex(row, col + 1))
  return out
}

function randomSeed(): Set<number> {
  return new Set([Math.floor(Math.random() * CELL_COUNT)])
}

function growOnce(filled: Set<number>): Set<number> {
  const frontier = [...filled].flatMap((i) => neighbors(i)).filter((i) => !filled.has(i))
  if (frontier.length === 0) return filled
  const next = new Set(filled)
  next.add(frontier[Math.floor(Math.random() * frontier.length)]!)
  return next
}

function shrinkOnce(filled: Set<number>): Set<number> {
  if (filled.size <= 1) return filled
  const leaves = [...filled].filter((i) => neighbors(i).filter((n) => filled.has(n)).length === 1)
  const pool = leaves.length > 0 ? leaves : [...filled]
  const next = new Set(filled)
  next.delete(pool[Math.floor(Math.random() * pool.length)]!)
  return next
}

function targetSize(): number {
  return MIN_CLUSTER + Math.floor(Math.random() * (MAX_CLUSTER - MIN_CLUSTER + 1))
}

const gridPx = GRID * sidebarAgentDotSizePx + (GRID - 1) * GRID_GAP_PX

export function AgentClusterDots({ className }: { className?: string }) {
  const [filled, setFilled] = useState<Set<number>>(() => randomSeed())
  const filledRef = useRef(filled)
  const phaseRef = useRef<'grow' | 'shrink'>('grow')
  const targetRef = useRef(targetSize())

  filledRef.current = filled

  useEffect(() => {
    const id = window.setInterval(() => {
      const current = filledRef.current

      if (phaseRef.current === 'grow') {
        if (current.size >= targetRef.current) {
          phaseRef.current = 'shrink'
          return
        }
        const next = growOnce(current)
        filledRef.current = next
        setFilled(next)
        return
      }

      if (current.size <= 1) {
        phaseRef.current = 'grow'
        targetRef.current = targetSize()
        return
      }

      const next = shrinkOnce(current)
      filledRef.current = next
      setFilled(next)
    }, STEP_MS)

    return () => window.clearInterval(id)
  }, [])

  return (
    <span
      className={cn('grid grid-cols-3', className)}
      style={{
        width: gridPx,
        height: gridPx,
        gap: GRID_GAP_PX
      }}
      aria-hidden
    >
      {Array.from({ length: CELL_COUNT }, (_, i) => (
        <span
          key={i}
          className={cn(
            'rounded-full transition-opacity duration-75',
            sidebarAgentDotClass,
            filled.has(i) ? 'opacity-100' : 'opacity-0'
          )}
          style={{ width: sidebarAgentDotSizePx, height: sidebarAgentDotSizePx }}
        />
      ))}
    </span>
  )
}
