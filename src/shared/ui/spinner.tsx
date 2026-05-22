import { Loader2Icon } from '@/shared/ui/icons'
import { cn } from '@/shared/lib/utils'

function Spinner({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn('size-4', className)}
      {...props}
    />
  )
}

export { Spinner }
