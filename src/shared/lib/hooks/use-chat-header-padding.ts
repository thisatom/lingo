import { useEffect, useState } from 'react'

/** Matches {@link CHAT_HORIZONTAL_PADDING_CLASS} pixel values. */
export function useChatHeaderPaddingPx(): number {
  const [paddingPx, setPaddingPx] = useState(8)

  useEffect(() => {
    const mqSm = window.matchMedia('(min-width: 640px)')
    const mqMd = window.matchMedia('(min-width: 768px)')

    const sync = () => {
      if (mqMd.matches) setPaddingPx(16)
      else if (mqSm.matches) setPaddingPx(12)
      else setPaddingPx(8)
    }

    sync()
    mqSm.addEventListener('change', sync)
    mqMd.addEventListener('change', sync)
    return () => {
      mqSm.removeEventListener('change', sync)
      mqMd.removeEventListener('change', sync)
    }
  }, [])

  return paddingPx
}
