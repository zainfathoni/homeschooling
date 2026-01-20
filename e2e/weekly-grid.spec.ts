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
    // Wait for heading to confirm page loaded, then check subjects exist
    await expect(page.getByRole('heading', { name: /Weekly Schedule/i })).toBeVisible()
    // Use locator with visible filter since both mobile/desktop layouts render (CSS hidden/shown)
    await expect(page.getByText('Math').locator('visible=true').first()).toBeVisible()
    await expect(page.getByText('Handwriting').locator('visible=true').first()).toBeVisible()
    await expect(page.getByText('Reading').locator('visible=true').first()).toBeVisible()
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

  test('can select Pick1 option', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for form submission')
    await page.goto('/week')
    const safarButton = page.getByRole('button', { name: 'Safar Book' })
    await safarButton.click()
    await expect(safarButton).toHaveClass(/bg-coral/)
  })
})

test.describe('Weekly grid - Completion toggle', () => {
  test('can toggle subject completion for a day', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for form submission')
    await page.goto('/week')
    
    // Get visible Math row (mobile or desktop, whichever is shown)
    const mathRow = page.locator('div').filter({ hasText: /📐/ }).locator('visible=true').first()
    
    // Get the first day's button (Mon) - we'll toggle it regardless of current state
    const firstButton = mathRow.getByRole('button', { name: /Mark/ }).first()
    
    // Get initial state
    const initiallyComplete = await firstButton.getAttribute('aria-label') === 'Mark incomplete'
    
    // Click to toggle
    await firstButton.click()
    
    // After toggle, verify state changed
    if (initiallyComplete) {
      // Was complete -> now should be incomplete
      await expect(mathRow.getByRole('button', { name: 'Mark complete' }).first()).toBeVisible()
    } else {
      // Was incomplete -> now should be complete
      await expect(mathRow.getByRole('button', { name: 'Mark incomplete' }).first()).toBeVisible()
    }
    
    // Toggle back
    const toggledButton = mathRow.getByRole('button', { name: /Mark/ }).first()
    await toggledButton.click()
    
    // Verify returned to original state
    if (initiallyComplete) {
      await expect(mathRow.getByRole('button', { name: 'Mark incomplete' }).first()).toBeVisible()
    } else {
      await expect(mathRow.getByRole('button', { name: 'Mark complete' }).first()).toBeVisible()
    }
  })
})

test.describe('Weekly grid - Navigation', () => {
  test('can navigate to previous week', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for client-side navigation')
    await page.goto('/week')
    
    // Wait for page to be fully loaded
    await expect(page.getByRole('heading', { name: /Weekly Schedule/i })).toBeVisible()
    const currentUrl = page.url()

    // Get the previous week link and its href
    const prevLink = page.getByRole('link', { name: /Previous week/i })
    const prevHref = await prevLink.getAttribute('href')
    
    await prevLink.click()
    
    // Wait for navigation to complete (URL should contain the previous week date)
    if (prevHref) {
      await page.waitForURL(new RegExp(prevHref.replace(/\//g, '\\/')))
    }

    expect(page.url()).not.toBe(currentUrl)
    await expect(page.getByRole('link', { name: 'Today' })).toBeVisible()
  })

  test('Today link navigates back to current week', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for client-side navigation')
    await page.goto('/week')
    await expect(page.getByRole('heading', { name: /Weekly Schedule/i })).toBeVisible()
    
    const prevLink = page.getByRole('link', { name: /Previous week/i })
    const prevHref = await prevLink.getAttribute('href')
    
    await prevLink.click()
    if (prevHref) {
      await page.waitForURL(new RegExp(prevHref.replace(/\//g, '\\/')))
    }

    await page.getByRole('link', { name: 'Today' }).click()
    
    // Wait for navigation back to current week
    await expect(page.getByRole('link', { name: 'Today' })).toBeHidden()
  })
})

test.describe('Weekly grid - Mobile layout', () => {
  test.use({
    viewport: { width: 375, height: 667 },
  })

  test('shows mobile layout with day labels', async ({ page, noscript }) => {
    test.skip(noscript, 'Mobile layout requires JavaScript for hydration')
    await page.goto('/week')
    await expect(page.getByText('Math').locator('visible=true').first()).toBeVisible()
    await expect(page.getByText('Mon').locator('visible=true').first()).toBeVisible()
    await expect(page.getByText('Tue').locator('visible=true').first()).toBeVisible()
  })

  test('bottom navigation is visible on mobile', async ({ page, noscript }) => {
    test.skip(noscript, 'Mobile layout requires JavaScript for hydration')
    await page.goto('/week')
    await expect(page.getByRole('navigation').first()).toBeVisible()
  })
})

test.describe('Weekly grid - Tablet/Desktop layout', () => {
  test.use({
    viewport: { width: 1024, height: 768 },
  })

  test('shows desktop row layout', async ({ page, noscript }) => {
    test.skip(noscript, 'Desktop layout requires JavaScript for hydration')
    await page.goto('/week')
    await expect(page.getByText('Math').locator('visible=true').first()).toBeVisible()
    const mathRow = page.locator('.hidden.md\\:flex').filter({ hasText: 'Math' }).first()
    await expect(mathRow).toBeVisible()
  })
})
