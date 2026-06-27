import { test, expect } from '@playwright/test'
import { seedWebAppState, gotoMainChat } from './fixtures/app-state'

test.describe('Chat composer', () => {
  test.beforeEach(async ({ page }) => {
    await seedWebAppState(page)
    await gotoMainChat(page)
  })

  test('send stays disabled until text is entered', async ({ page }) => {
    const composer = page.getByTestId('chat-composer-input')
    await expect(composer).toBeVisible()
    await expect(page.getByTestId('chat-send')).toHaveCount(0)

    await composer.fill('Hello from e2e')
    await expect(page.getByTestId('chat-send')).toBeEnabled()
  })

  test('sends a message with mocked OpenRouter stream', async ({ page }) => {
    await page.route('**/chat/completions', async (route) => {
      const sse = [
        'data: {"id":"e2e","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"content":"E2E reply"},"finish_reason":null}]}\n\n',
        'data: {"id":"e2e","object":"chat.completion.chunk","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\n',
        'data: [DONE]\n\n'
      ].join('')
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache'
        },
        body: sse
      })
    })

    const message = `e2e-${Date.now()}`
    await page.getByTestId('chat-composer-input').fill(message)
    await page.getByTestId('chat-send').click()

    await expect(page.getByText(message)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('E2E reply')).toBeVisible({ timeout: 30_000 })
  })
})
