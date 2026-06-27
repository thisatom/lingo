import type { Page } from '@playwright/test'

export function trackConsoleErrors(page: Page): string[] {
  const errors: string[] = []

  page.on('pageerror', (error) => {
    errors.push(error.message)
  })
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })

  return errors
}

export function resizeObserverErrors(errors: readonly string[]): string[] {
  return errors.filter((message) => message.includes('ResizeObserver'))
}
