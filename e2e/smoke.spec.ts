import { test, expect } from './base-test'

/**
 * Smoke tests for public pages - no authentication required.
 * These verify basic page availability and rendering.
 *
 * Usage:
 *   npm run test:e2e -- smoke.spec.ts
 */

test.describe('Public pages smoke tests', () => {
  test('login page loads and shows content', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/Homeschool Planner/)
    await expect(page.locator('body')).toBeVisible()
    await expect(page.getByText('Welcome to Homeschool Planner')).toBeVisible()
    await expect(
      page.getByRole('button', { name: /send magic link/i })
    ).toBeVisible()
  })

  test('login page has email input', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })

  test('returns 200 for login route', async ({ request }) => {
    const response = await request.get('/login')
    expect(response.status(), '/login should return 200').toBe(200)
  })
})
