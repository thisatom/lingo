import type { TtsSynthesizeRequest } from '../../src/shared/types/ipc'
import { formatEdgeTtsRate } from '../../src/shared/lib/tts-rate'

export function resolveTtsProsody(request: TtsSynthesizeRequest): {
  rate: string
  pitch: string
  volume: string
} {
  const rate = request.rate?.trim() || formatEdgeTtsRate(request.locale, 'normal')

  return {
    rate,
    pitch: '+0Hz',
    volume: '+0%'
  }
}
