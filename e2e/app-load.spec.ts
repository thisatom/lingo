import { test, expect } from '@playwright/test'
import { seedWebAppState, gotoMainChat } from './fixtures/app-state'
import { resizeObserverErrors, trackConsoleErrors } from './helpers/console-errors'

test.describe('App load', () => {
  test('main chat view loads with composer and sidebar', async ({ page }) => {
    await seedWebAppState(page)
    const errors = trackConsoleErrors(page)
    await gotoMainChat(page)

    await expect(page.getByTestId('chat-composer-input')).toBeVisible()
    await expect(page.getByRole('button', { name: 'New chat' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'E2E Chat' })).toBeVisible()

    expect(resizeObserverErrors(errors)).toEqual([])
  })
})
