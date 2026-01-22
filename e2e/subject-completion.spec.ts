import { test, expect } from './base-test'
import { WeeklyGridPage } from './pages/weekly-grid.page'

/**
 * E2E tests for subject completion flow.
 * Tests completion toggle, persistence, and behavior across subject types.
 *
 * These tests run serially to avoid shared state conflicts in the completion database.
 *
 * Usage:
 *   npm run test:e2e -- subject-completion.spec.ts
 */

test.describe.configure({ mode: 'serial' })

test.use({
  storageState: 'e2e/fixtures/auth/parent.local.json',
})

test.describe('Subject completion - Toggle behavior', () => {
  test('can toggle fixed subject completion', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for form submission')
    const weeklyGrid = new WeeklyGridPage(page)
    await weeklyGrid.goto()
    await weeklyGrid.expectLoaded()

    const mathRow = weeklyGrid.getVisibleSubjectRow('📐')
    const toggleButton = mathRow.getByRole('button', { name: /Mark/ }).first()
    const wasComplete = (await toggleButton.getAttribute('aria-label')) === 'Mark incomplete'

    await toggleButton.click()

    const expectedLabel = wasComplete ? 'Mark complete' : 'Mark incomplete'
    await expect(mathRow.getByRole('button', { name: expectedLabel }).first()).toBeVisible()
  })

  test('toggle updates button state immediately (optimistic UI)', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for optimistic UI')
    const weeklyGrid = new WeeklyGridPage(page)
    await weeklyGrid.goto()
    await weeklyGrid.expectLoaded()

    const mathRow = weeklyGrid.getVisibleSubjectRow('📐')
    const toggleButton = mathRow.getByRole('button', { name: /Mark/ }).first()
    const wasComplete = (await toggleButton.getAttribute('aria-label')) === 'Mark incomplete'

    await toggleButton.click()

    const expectedLabel = wasComplete ? 'Mark complete' : 'Mark incomplete'
    await expect(mathRow.getByRole('button', { name: expectedLabel }).first()).toBeVisible({ timeout: 500 })
  })
})

test.describe('Subject completion - Persistence', () => {
  test('completion state persists after page reload', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for form submission')
    const weeklyGrid = new WeeklyGridPage(page)
    await weeklyGrid.goto()
    await weeklyGrid.expectLoaded()

    const mathRow = weeklyGrid.getVisibleSubjectRow('📐')
    const toggleButton = mathRow.getByRole('button', { name: /Mark/ }).first()
    const wasComplete = (await toggleButton.getAttribute('aria-label')) === 'Mark incomplete'

    await toggleButton.click()
    const expectedLabel = wasComplete ? 'Mark complete' : 'Mark incomplete'
    await expect(mathRow.getByRole('button', { name: expectedLabel }).first()).toBeVisible()

    await page.waitForTimeout(500)
    await page.reload()
    await weeklyGrid.expectLoaded()

    const mathRowAfterReload = weeklyGrid.getVisibleSubjectRow('📐')
    await expect(mathRowAfterReload.getByRole('button', { name: expectedLabel }).first()).toBeVisible()
  })

  test('toggling back and forth persists final state', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for form submission')
    const weeklyGrid = new WeeklyGridPage(page)
    await weeklyGrid.goto()
    await weeklyGrid.expectLoaded()
    await page.waitForLoadState('networkidle')

    const mathRow = weeklyGrid.getVisibleSubjectRow('📐')
    const toggleButton = mathRow.getByRole('button', { name: /Mark/ }).first()
    const initialLabel = await toggleButton.getAttribute('aria-label')

    // First toggle - wait for API response
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/api/toggle-completion') &&
          response.status() === 200
      ),
      toggleButton.click(),
    ])

    // Wait for UI to update after first toggle
    const expectedAfterFirst = initialLabel === 'Mark complete' ? 'Mark incomplete' : 'Mark complete'
    await expect(mathRow.getByRole('button', { name: expectedAfterFirst }).first()).toBeVisible()

    // Second toggle - wait for API response
    const buttonAfterFirst = mathRow.getByRole('button', { name: /Mark/ }).first()
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/api/toggle-completion') &&
          response.status() === 200
      ),
      buttonAfterFirst.click(),
    ])

    // Wait for UI to update after second toggle - should be back to initial state
    await expect(mathRow.getByRole('button', { name: initialLabel! }).first()).toBeVisible()

    // Wait for network to settle before reload to ensure data is persisted
    await page.waitForLoadState('networkidle')

    await page.reload()
    await weeklyGrid.expectLoaded()

    // After reload, should match the final state (which is back to initial)
    const mathRowAfterReload = weeklyGrid.getVisibleSubjectRow('📐')
    await expect(mathRowAfterReload.getByRole('button', { name: initialLabel! }).first()).toBeVisible()
  })
})

test.describe('Subject completion - Multiple days', () => {
  test('can toggle completion for different days independently', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for form submission')
    const weeklyGrid = new WeeklyGridPage(page)
    await weeklyGrid.goto()
    await weeklyGrid.expectLoaded()
    // Wait for hydration before interacting with fetcher forms
    await page.waitForLoadState('networkidle')

    const mathRow = weeklyGrid.getVisibleSubjectRow('📐')
    const buttons = mathRow.getByRole('button', { name: /Mark/ })

    // Capture initial state of first button before any action
    const firstLabel = await buttons.first().getAttribute('aria-label')
    const secondButton = buttons.nth(1)
    const secondLabel = await secondButton.getAttribute('aria-label')

    // Click second button and wait for API response to complete
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/api/toggle-completion') &&
          response.status() === 200
      ),
      secondButton.click(),
    ])

    // Wait for the toggle to complete - check second button changed state
    const expectedSecondLabel = secondLabel === 'Mark incomplete' ? 'Mark complete' : 'Mark incomplete'
    await expect(secondButton).toHaveAttribute('aria-label', expectedSecondLabel, { timeout: 10000 })

    // First button should remain unchanged - verify using aria-label expectation
    await expect(buttons.first()).toHaveAttribute('aria-label', firstLabel!, { timeout: 5000 })
  })
})

test.describe('Subject completion - Handwriting subject', () => {
  test('can toggle handwriting completion', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for form submission')
    const weeklyGrid = new WeeklyGridPage(page)
    await weeklyGrid.goto()
    await weeklyGrid.expectLoaded()

    const handwritingRow = weeklyGrid.getVisibleSubjectRow('✍️')
    const toggleButton = handwritingRow.getByRole('button', { name: /Mark/ }).first()
    const wasComplete = (await toggleButton.getAttribute('aria-label')) === 'Mark incomplete'

    await toggleButton.click()

    const expectedLabel = wasComplete ? 'Mark complete' : 'Mark incomplete'
    await expect(handwritingRow.getByRole('button', { name: expectedLabel }).first()).toBeVisible()
  })
})
