import { test, expect } from './base-test'

/**
 * E2E tests for Pick1 subject functionality.
 * Tests option selection, persistence, and completion toggle.
 *
 * Pick1 subjects allow selecting one sub-item per category
 * (e.g., Islamic Study → Safar Book or Quran Recitation)
 *
 * Usage:
 *   npm run test:e2e -- pick1-subjects.spec.ts
 */

test.describe.configure({ mode: 'serial' })

test.use({
  storageState: 'e2e/fixtures/auth/parent.local.json',
})

test.describe('Pick1 subjects - Option selection', () => {
  test('displays Pick1 subject with option buttons', async ({ page }) => {
    await page.goto('/week')
    await page.waitForURL(/\/students\/[^/]+\/week\/\d{4}-\d{2}-\d{2}/)
    await page.waitForLoadState('networkidle')

    // Islamic Study is a Pick1 subject - find visible one (mobile/tablet views overlap in DOM)
    const islamicStudySection = page.locator('text=Islamic Study').locator('visible=true').first()
    await expect(islamicStudySection).toBeVisible()

    // Should see option buttons - find visible one
    const safarBookOption = page.getByTestId('pick1-option-safar-book').locator('visible=true').first()
    await expect(safarBookOption).toBeVisible()
  })

  test('can select an option from Pick1 subject', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for form submission')
    await page.goto('/week')
    await page.waitForURL(/\/students\/[^/]+\/week\/\d{4}-\d{2}-\d{2}/)
    await page.waitForLoadState('networkidle')

    // Click on an option - find visible one (mobile/tablet views overlap in DOM)
    const quranOption = page.getByTestId('pick1-option-quran-recitation').locator('visible=true').first()
    await expect(quranOption).toBeVisible()

    // Wait for API response when clicking
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/api/select-option') &&
          response.status() === 200
      ),
      quranOption.click(),
    ])

    // Option should now be selected (coral background)
    await expect(quranOption).toHaveClass(/bg-coral/)
  })

  test('selected option persists after page reload', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for form submission')
    await page.goto('/week')
    await page.waitForURL(/\/students\/[^/]+\/week\/\d{4}-\d{2}-\d{2}/)
    await page.waitForLoadState('networkidle')

    // Select Hadith Study - find visible one
    const hadithOption = page.getByTestId('pick1-option-hadith-study').locator('visible=true').first()
    await expect(hadithOption).toBeVisible()

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/api/select-option') &&
          response.status() === 200
      ),
      hadithOption.click(),
    ])

    // Verify selected
    await expect(hadithOption).toHaveClass(/bg-coral/)

    // Reload
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Should still be selected - find visible one
    const hadithOptionAfterReload = page.getByTestId('pick1-option-hadith-study').locator('visible=true').first()
    await expect(hadithOptionAfterReload).toHaveClass(/bg-coral/)
  })

  test('shows completion checkboxes after option is selected', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for form submission')
    await page.goto('/week')
    await page.waitForURL(/\/students\/[^/]+\/week\/\d{4}-\d{2}-\d{2}/)
    await page.waitForLoadState('networkidle')

    // Find the Islamic Study section container
    const islamicStudyContainer = page.locator('.bg-white.rounded-lg').filter({ hasText: 'Islamic Study' }).first()

    // Select an option if not already selected
    const safarOption = islamicStudyContainer.getByTestId('pick1-option-safar-book').first()
    if (!(await safarOption.evaluate((el) => el.classList.contains('bg-coral')))) {
      await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().includes('/api/select-option') &&
            response.status() === 200
        ),
        safarOption.click(),
      ])
    }

    // Should now show day completion checkboxes (Mon, Tue, etc.)
    await expect(islamicStudyContainer.getByText('Mon')).toBeVisible()
    await expect(islamicStudyContainer.getByRole('button', { name: /Mark/ }).first()).toBeVisible()
  })

  test('can toggle completion for Pick1 subject after option is selected', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for form submission')
    await page.goto('/week')
    await page.waitForURL(/\/students\/[^/]+\/week\/\d{4}-\d{2}-\d{2}/)
    await page.waitForLoadState('networkidle')

    // Find the Science section (another Pick1)
    const scienceContainer = page.locator('.bg-white.rounded-lg').filter({ hasText: 'Science' }).first()

    // Select Biology option
    const biologyOption = scienceContainer.getByTestId('pick1-option-biology').first()
    await expect(biologyOption).toBeVisible()

    if (!(await biologyOption.evaluate((el) => el.classList.contains('bg-coral')))) {
      await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().includes('/api/select-option') &&
            response.status() === 200
        ),
        biologyOption.click(),
      ])
    }

    // Now toggle completion
    const toggleButton = scienceContainer.getByRole('button', { name: /Mark/ }).first()
    const wasComplete = (await toggleButton.getAttribute('aria-label')) === 'Mark incomplete'

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/api/toggle-completion') &&
          response.status() === 200
      ),
      toggleButton.click(),
    ])

    const expectedLabel = wasComplete ? 'Mark complete' : 'Mark incomplete'
    await expect(scienceContainer.getByRole('button', { name: expectedLabel }).first()).toBeVisible()
  })
})
