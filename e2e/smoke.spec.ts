import { test, expect } from './base-test'
import { LoginPage } from './pages/login.page'

/**
 * Smoke tests for public pages - no authentication required.
 * These verify basic page availability and rendering.
 *
 * Usage:
 *   npm run test:e2e -- smoke.spec.ts
 */

test.describe('Public pages smoke tests', () => {
  test('login page loads and shows content', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await expect(page.locator('body')).toBeVisible()
    await loginPage.expectLoaded()
  })

  test('login page has email input', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await expect(loginPage.emailInput).toBeVisible()
  })

  test('returns 200 for login route', async ({ request }) => {
    const response = await request.get('/login')
    expect(response.status(), '/login should return 200').toBe(200)
  })
})
