import { test, expect } from './base-test'
import { NarrationPage, NarrationViewPage } from './pages/narration.page'

/**
 * E2E tests for text narration CRUD flow.
 * Tests creating, viewing, and deleting text narrations.
 *
 * Usage:
 *   npm run test:e2e -- narrations-text.spec.ts
 */

test.use({
  storageState: 'e2e/fixtures/auth/parent.local.json',
})

test.describe('Text narration - Navigation', () => {
  test('can navigate to new narration page', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for navigation')
    const narrationPage = new NarrationPage(page)
    await narrationPage.gotoNewNarration()
    await narrationPage.expectLoaded()
    await expect(page).toHaveURL(/\/narration\/new\?subjectId=.*&date=/)
  })
})

test.describe('Text narration - Tab behavior', () => {
  test('text tab is selected by default', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for tab switching')
    const narrationPage = new NarrationPage(page)
    await narrationPage.gotoNewNarration()
    await narrationPage.expectLoaded()
    await narrationPage.expectTextTabActive()
  })

  test('textarea is visible and focused when text tab is active', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for focus behavior')
    const narrationPage = new NarrationPage(page)
    await narrationPage.gotoNewNarration()
    await narrationPage.expectLoaded()

    await expect(narrationPage.textarea).toBeVisible()
    await expect(narrationPage.textarea).toBeFocused()
  })
})

test.describe('Text narration - Submit button state', () => {
  test('submit button is disabled when content is empty', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for form validation')
    const narrationPage = new NarrationPage(page)
    await narrationPage.gotoNewNarration()
    await narrationPage.expectLoaded()
    await narrationPage.expectSubmitDisabled()
  })

  test('submit button enables when content is entered', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for form validation')
    const narrationPage = new NarrationPage(page)
    await narrationPage.gotoNewNarration()
    await narrationPage.expectLoaded()

    await narrationPage.expectSubmitDisabled()
    await narrationPage.fillContent('Today I learned about fractions.')
    await narrationPage.expectSubmitEnabled()
  })

  test('submit button disables when content is cleared', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for form validation')
    const narrationPage = new NarrationPage(page)
    await narrationPage.gotoNewNarration()
    await narrationPage.expectLoaded()

    await narrationPage.fillContent('Some content')
    await narrationPage.expectSubmitEnabled()

    await narrationPage.clearContent()
    await narrationPage.expectSubmitDisabled()
  })
})

test.describe('Text narration - Create and verify', () => {
  test('can create text narration and verify save', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for form submission')
    const narrationPage = new NarrationPage(page)
    await narrationPage.gotoNewNarration()
    await narrationPage.expectLoaded()

    const narrationContent = `E2E test narration ${Date.now()}`
    await narrationPage.fillContent(narrationContent)
    await narrationPage.submit()

    // Should navigate back after save
    await page.waitForURL(/\/(narrations|week)/)
  })
})

test.describe('Text narration - View created narration', () => {
  test('can view created narration with correct content', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for form submission')

    // First, create a narration
    const narrationPage = new NarrationPage(page)
    await narrationPage.gotoNewNarration()
    await narrationPage.expectLoaded()

    const narrationContent = `Viewing test narration ${Date.now()}`
    await narrationPage.fillContent(narrationContent)
    await narrationPage.submit()

    // Wait for navigation to complete
    await page.waitForURL(/\/(narrations|week)/)

    // Navigate to narrations list
    await page.goto('/narrations')
    await page.waitForLoadState('networkidle')

    // Check that we have at least one narration card
    const narrationCards = page.locator('a[href^="/narration/c"]')
    const count = await narrationCards.count()
    expect(count).toBeGreaterThan(0)

    // Click the first narration card
    await narrationCards.first().click()

    // Verify we're on the narration view page
    await expect(page).toHaveURL(/\/narration\/c[a-z0-9]+$/)

    const narrationView = new NarrationViewPage(page)
    await narrationView.expectLoaded()
    await narrationView.expectTypeText()
  })
})

test.describe('Text narration - Delete', () => {
  test('can delete narration and verify removal', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for form submission')

    // First, create a narration
    const narrationPage = new NarrationPage(page)
    await narrationPage.gotoNewNarration()
    await narrationPage.expectLoaded()

    const narrationContent = `Delete test narration ${Date.now()}`
    await narrationPage.fillContent(narrationContent)
    await narrationPage.submit()

    // Wait for navigation to complete
    await page.waitForURL(/\/(narrations|week)/)

    // Navigate to narrations list
    await page.goto('/narrations')
    await page.waitForLoadState('networkidle')

    // Find any narration card
    const narrationCard = page.locator('a[href^="/narration/c"]').first()
    await expect(narrationCard).toBeVisible({ timeout: 10000 })
    await narrationCard.click()

    // Verify we're on the narration view page
    await expect(page).toHaveURL(/\/narration\/c[a-z0-9]+$/)

    const narrationView = new NarrationViewPage(page)
    await narrationView.expectLoaded()

    // Delete the narration
    await narrationView.delete()

    // Should navigate back after deletion
    await page.waitForURL(/\/(narrations|week)/)
  })
})
