import { installBootErrorHandlers, showBootError } from '@/app/show-boot-error'

installBootErrorHandlers()

void import('@/main').catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  showBootError(message)
})
