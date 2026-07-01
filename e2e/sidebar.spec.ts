import { test, expect } from '@playwright/test'
import { seedWebAppState, gotoMainChat } from './fixtures/app-state'

test.describe('Sidebar chat list', () => {
  test.beforeEach(async ({ page }) => {
    await seedWebAppState(page)
    await gotoMainChat(page)
  })

  test('creates a new chat from the sidebar', async ({ page }) => {
    await page.getByRole('button', { name: 'New chat' }).click()
    await expect(page).toHaveURL(/\/c\//)
    await expect(page.getByTestId('chat-composer-input')).toBeVisible()
  })

  test('shows seeded chat title in the list', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'E2E Chat' })).toBeVisible()
  })
})
