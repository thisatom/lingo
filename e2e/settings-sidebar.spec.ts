import { test, expect } from '@playwright/test'
import { seedWebAppState, gotoMainChat } from './fixtures/app-state'

test.describe('Settings sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await seedWebAppState(page)
    await gotoMainChat(page)
    await page.getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL(/\/settings\/general/)
  })

  test('nav labels are fully readable (no text fade mask)', async ({ page }) => {
    const labels = ['General', 'Appearance', 'Devices', 'Speech', 'Agent', 'API']

    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible()

    for (const label of labels) {
      const link = page.getByRole('link', { name: label })
      await expect(link).toBeVisible()
      await expect(link).toHaveText(label)
    }
  })

  test('switches settings sections from sidebar', async ({ page }) => {
    await page.getByRole('link', { name: 'Agent' }).click()
    await expect(page).toHaveURL(/\/settings\/agent/)
    await expect(page.getByRole('heading', { name: 'Agent' })).toBeVisible()

    await page.getByRole('link', { name: 'API' }).click()
    await expect(page).toHaveURL(/\/settings\/api/)
    await expect(page.getByRole('heading', { name: 'API' })).toBeVisible()
  })
})
