import { test, expect } from '@playwright/test'
import { seedWebAppState, gotoMainChat } from './fixtures/app-state'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await seedWebAppState(page)
    await gotoMainChat(page)
  })

  test('opens settings and returns to chat', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL(/#\/settings\/general/)
    await expect(page.getByRole('heading', { name: 'General' })).toBeVisible()

    await page.getByRole('link', { name: 'Appearance' }).click()
    await expect(page).toHaveURL(/#\/settings\/appearance/)
    await expect(page.getByRole('heading', { name: 'Appearance' })).toBeVisible()

    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page.getByTestId('chat-composer-input')).toBeVisible()
  })
})
