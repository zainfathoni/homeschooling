import { test, expect } from './base-test'

/**
 * Tracer Bullet E2E Test
 *
 * This is the core E2E test for the simplified weekly schedule view.
 * It tests the complete user flow through all layers:
 *
 * 1. Authentication (via fixture)
 * 2. Navigation (home -> student week view)
 * 3. UI rendering (subject rows visible)
 * 4. Interaction (toggle completion)
 * 5. Persistence (state survives reload)
 *
 * This test must pass consistently before adding more features.
 *
 * Usage:
 *   npm run test:e2e -- tracer-bullet.spec.ts
 */

test.describe.configure({ mode: 'serial' })

test.use({
  storageState: 'e2e/fixtures/auth/parent.local.json',
})

test.describe('Tracer Bullet - Mobile Weekly View Flow', () => {
  test.use({ viewport: { width: 375, height: 812 } }) // iPhone X dimensions

  test('complete mobile weekly view flow', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for form submission')

    // 1. Navigate to home (redirects to student's weekly schedule)
    await page.goto('/')
    await page.waitForURL(/\/students\/[^/]+\/week\/\d{4}-\d{2}-\d{2}/)
    await page.waitForLoadState('networkidle')

    // 2. Verify weekly schedule heading is visible
    const heading = page.getByRole('heading', { name: /Weekly Schedule/i })
    await expect(heading).toBeVisible()

    // 3. Find a subject row (Math uses 📐 emoji)
    const mathRow = page.locator('div').filter({ hasText: /📐/ }).locator('visible=true').first()
    await expect(mathRow).toBeVisible()

    // 4. Get the first toggle button and its current state
    const toggleButton = mathRow.getByRole('button', { name: /Mark/ }).first()
    await expect(toggleButton).toBeVisible()
    const wasComplete = (await toggleButton.getAttribute('aria-label')) === 'Mark incomplete'

    // 5. Toggle completion and wait for API response
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/api/toggle-completion') &&
          response.status() === 200
      ),
      toggleButton.click(),
    ])

    // 6. Verify visual feedback (button state changed)
    const expectedLabel = wasComplete ? 'Mark complete' : 'Mark incomplete'
    await expect(mathRow.getByRole('button', { name: expectedLabel }).first()).toBeVisible()

    // 7. Reload and verify persistence
    await page.waitForLoadState('networkidle')
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Verify heading is visible after reload
    await expect(heading).toBeVisible()

    // Verify state persisted
    const mathRowAfterReload = page.locator('div').filter({ hasText: /📐/ }).locator('visible=true').first()
    await expect(mathRowAfterReload.getByRole('button', { name: expectedLabel }).first()).toBeVisible()
  })

  test('checkboxes meet minimum touch target size (44x44pt)', async ({ page }) => {
    // Navigate to weekly schedule
    await page.goto('/')
    await page.waitForURL(/\/students\/[^/]+\/week\/\d{4}-\d{2}-\d{2}/)
    await page.waitForLoadState('networkidle')

    // Find a toggle button
    const toggleButton = page.getByRole('button', { name: /Mark/ }).first()
    await expect(toggleButton).toBeVisible()

    // Verify minimum touch target size (44px = w-11 in Tailwind)
    const box = await toggleButton.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)
  })
})

test.describe('Tracer Bullet - Desktop Weekly View', () => {
  test.use({ viewport: { width: 1024, height: 768 } })

  test('weekly schedule displays on desktop viewport with duet view', async ({ page }) => {
    // Navigate to weekly schedule
    await page.goto('/')
    await page.waitForURL(/\/students\/[^/]+\/week\/\d{4}-\d{2}-\d{2}/)
    await page.waitForLoadState('networkidle')

    // Verify duet view is visible (tablet/desktop shows split view)
    const duetView = page.locator('.hidden.md\\:grid.md\\:grid-cols-2')
    await expect(duetView).toBeVisible()

    // Verify Weekly Overview heading in duet view
    const weeklyOverview = page.getByRole('heading', { name: /Weekly Overview/i })
    await expect(weeklyOverview).toBeVisible()

    // Verify day selector buttons are visible
    const dayButton = page.locator('button').filter({ hasText: /Mon|Tue|Wed|Thu|Fri/i }).first()
    await expect(dayButton).toBeVisible()
  })
})
