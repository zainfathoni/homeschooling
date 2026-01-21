import { test, expect } from './base-test'
import { WeeklyGridPage } from './pages/weekly-grid.page'

/**
 * E2E tests for subject completion flow.
 * Tests completion toggle, persistence, and behavior across subject types.
 *
 * Usage:
 *   npm run test:e2e -- subject-completion.spec.ts
 */

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

    const mathRow = weeklyGrid.getVisibleSubjectRow('📐')
    const toggleButton = mathRow.getByRole('button', { name: /Mark/ }).first()

    await toggleButton.click()
    await page.waitForTimeout(200)
    const buttonAfterFirst = mathRow.getByRole('button', { name: /Mark/ }).first()
    await buttonAfterFirst.click()
    await page.waitForTimeout(200)
    const buttonAfterSecond = mathRow.getByRole('button', { name: /Mark/ }).first()
    const finalLabel = await buttonAfterSecond.getAttribute('aria-label')

    await page.reload()
    await weeklyGrid.expectLoaded()

    const mathRowAfterReload = weeklyGrid.getVisibleSubjectRow('📐')
    await expect(mathRowAfterReload.getByRole('button', { name: finalLabel! }).first()).toBeVisible()
  })
})

test.describe('Subject completion - Multiple days', () => {
  test('can toggle completion for different days independently', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for form submission')
    const weeklyGrid = new WeeklyGridPage(page)
    await weeklyGrid.goto()
    await weeklyGrid.expectLoaded()

    const mathRow = weeklyGrid.getVisibleSubjectRow('📐')
    const buttons = mathRow.getByRole('button', { name: /Mark/ })

    const firstButton = buttons.first()
    const firstLabel = await firstButton.getAttribute('aria-label')

    const secondButton = buttons.nth(1)
    const secondLabel = await secondButton.getAttribute('aria-label')

    await secondButton.click()
    
    // Wait for the toggle to complete - check second button changed state
    const expectedSecondLabel = secondLabel === 'Mark incomplete' ? 'Mark complete' : 'Mark incomplete'
    await expect(buttons.nth(1)).toHaveAttribute('aria-label', expectedSecondLabel)

    // First button should remain unchanged
    await expect(buttons.first()).toHaveAttribute('aria-label', firstLabel!)
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
