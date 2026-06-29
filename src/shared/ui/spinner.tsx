import type { SVGProps } from 'react'
import { cn } from '@/shared/lib/utils'

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg'

const spinnerSizeClass: Record<SpinnerSize, string> = {
  xs: 'size-3',
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-5'
}

type SpinnerProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  size?: SpinnerSize
}

/** SVG arc spinner — stays crisp at 12–20px (codicon loading does not). */
function Spinner({ className, size = 'md', ...props }: SpinnerProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      role="status"
      aria-label="Loading"
      className={cn('shrink-0 animate-spin', spinnerSizeClass[size], className)}
      {...props}
    >
      <circle
        cx="8"
        cy="8"
        r="6.25"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeOpacity="0.22"
      />
      <path
        d="M14.25 8a6.25 6.25 0 0 0-6.25-6.25"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
    </svg>
  )
}

export { Spinner }
