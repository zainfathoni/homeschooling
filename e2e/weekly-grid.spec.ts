import { test, expect } from './base-test'

/**
 * Weekly grid E2E tests - authenticated parent user.
 * Tests the weekly schedule view with subjects and completion toggles.
 *
 * Usage:
 *   npm run test:e2e -- weekly-grid.spec.ts
 */

test.use({
  storageState: 'e2e/fixtures/auth/parent.local.json',
})

test.describe('Weekly grid - Page load', () => {
  test('redirects /week to current week', async ({ page }) => {
    await page.goto('/week')
    await expect(page).toHaveURL(/\/week\/\d{4}-\d{2}-\d{2}/)
  })

  test('displays weekly schedule header', async ({ page }) => {
    await page.goto('/week')
    await expect(page).toHaveTitle(/Weekly Schedule/)
    await expect(page.getByRole('heading', { name: /Weekly Schedule/i })).toBeVisible()
  })

  test('shows week navigation with prev/next controls', async ({ page }) => {
    await page.goto('/week')
    await expect(page.getByRole('link', { name: /Previous week/i })).toBeVisible()
    await expect(page.getByText(/Week of/i)).toBeVisible()
  })

  test('displays subjects from seed data', async ({ page }) => {
    await page.goto('/week')
    await expect(page.getByText('Math')).toBeVisible()
    await expect(page.getByText('Handwriting')).toBeVisible()
    await expect(page.getByText('Reading')).toBeVisible()
  })
})

test.describe('Weekly grid - Subject types', () => {
  test('shows fixed subjects with daily checkboxes', async ({ page }) => {
    await page.goto('/week')
    const mathRow = page.locator('div').filter({ hasText: /^📐Math/ }).first()
    await expect(mathRow).toBeVisible()
    const checkboxes = mathRow.getByRole('button', { name: /Mark/i })
    await expect(checkboxes.first()).toBeVisible()
  })

  test('shows Pick1 subjects with option buttons', async ({ page }) => {
    await page.goto('/week')
    await expect(page.getByRole('button', { name: 'Safar Book' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Quran Recitation' })).toBeVisible()
  })

  test('can select Pick1 option', async ({ page }) => {
    await page.goto('/week')
    const safarButton = page.getByRole('button', { name: 'Safar Book' })
    await safarButton.click()
    await expect(safarButton).toHaveClass(/bg-coral/)
  })
})

test.describe('Weekly grid - Completion toggle', () => {
  test('can toggle subject completion for a day', async ({ page }) => {
    await page.goto('/week')
    const checkbox = page
      .locator('div')
      .filter({ hasText: /^📐Math/ })
      .first()
      .getByRole('button', { name: /Mark/i })
      .first()

    await checkbox.click()
    await expect(checkbox).toHaveClass(/bg-coral/)

    await checkbox.click()
    await expect(checkbox).not.toHaveClass(/bg-coral/)
  })
})

test.describe('Weekly grid - Navigation', () => {
  test('can navigate to previous week', async ({ page }) => {
    await page.goto('/week')
    const currentUrl = page.url()

    await page.getByRole('link', { name: /Previous week/i }).click()
    await page.waitForURL(/\/week\/\d{4}-\d{2}-\d{2}/)

    expect(page.url()).not.toBe(currentUrl)
    await expect(page.getByRole('link', { name: 'Today' })).toBeVisible()
  })

  test('Today link navigates back to current week', async ({ page }) => {
    await page.goto('/week')
    await page.getByRole('link', { name: /Previous week/i }).click()
    await page.waitForURL(/\/week\/\d{4}-\d{2}-\d{2}/)

    await page.getByRole('link', { name: 'Today' }).click()
    await page.waitForURL(/\/week\/\d{4}-\d{2}-\d{2}/)

    await expect(page.getByRole('link', { name: 'Today' })).toBeHidden()
  })
})

test.describe('Weekly grid - Mobile layout', () => {
  test.use({
    viewport: { width: 375, height: 667 },
  })

  test('shows mobile layout with day labels', async ({ page }) => {
    await page.goto('/week')
    await expect(page.getByText('Math')).toBeVisible()
    await expect(page.getByText('Mon').first()).toBeVisible()
    await expect(page.getByText('Tue').first()).toBeVisible()
  })

  test('bottom navigation is visible on mobile', async ({ page }) => {
    await page.goto('/week')
    await expect(page.getByRole('navigation')).toBeVisible()
  })
})

test.describe('Weekly grid - Tablet/Desktop layout', () => {
  test.use({
    viewport: { width: 1024, height: 768 },
  })

  test('shows desktop row layout', async ({ page }) => {
    await page.goto('/week')
    await expect(page.getByText('Math')).toBeVisible()
    const mathRow = page.locator('.hidden.md\\:flex').filter({ hasText: 'Math' }).first()
    await expect(mathRow).toBeVisible()
  })
})
