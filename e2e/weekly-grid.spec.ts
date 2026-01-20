import { test, expect } from './base-test'
import { WeeklyGridPage } from './pages/weekly-grid.page'

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
    const weeklyGrid = new WeeklyGridPage(page)
    await weeklyGrid.goto()
    await expect(page).toHaveURL(/\/week\/\d{4}-\d{2}-\d{2}/)
  })

  test('displays weekly schedule header', async ({ page }) => {
    const weeklyGrid = new WeeklyGridPage(page)
    await weeklyGrid.goto()
    await expect(page).toHaveTitle(/Weekly Schedule/)
    await weeklyGrid.expectLoaded()
  })

  test('shows week navigation with prev/next controls', async ({ page }) => {
    const weeklyGrid = new WeeklyGridPage(page)
    await weeklyGrid.goto()
    await expect(weeklyGrid.prevWeekLink).toBeVisible()
    await expect(weeklyGrid.weekOfText).toBeVisible()
  })

  test('displays subjects from seed data', async ({ page }) => {
    const weeklyGrid = new WeeklyGridPage(page)
    await weeklyGrid.goto()
    await weeklyGrid.expectLoaded()
    await expect(weeklyGrid.getVisibleSubject('Math')).toBeVisible()
    await expect(weeklyGrid.getVisibleSubject('Handwriting')).toBeVisible()
    await expect(weeklyGrid.getVisibleSubject('Reading')).toBeVisible()
  })
})

test.describe('Weekly grid - Subject types', () => {
  test('shows fixed subjects with daily checkboxes', async ({ page }) => {
    const weeklyGrid = new WeeklyGridPage(page)
    await weeklyGrid.goto()
    const mathRow = weeklyGrid.getSubjectRow('📐Math')
    await expect(mathRow).toBeVisible()
    const checkboxes = mathRow.getByRole('button', { name: /Mark/i })
    await expect(checkboxes.first()).toBeVisible()
  })

  test('shows Pick1 subjects with option buttons', async ({ page }) => {
    const weeklyGrid = new WeeklyGridPage(page)
    await weeklyGrid.goto()
    await expect(weeklyGrid.getPick1Button('Safar Book')).toBeVisible()
    await expect(weeklyGrid.getPick1Button('Quran Recitation')).toBeVisible()
  })

  test('can select Pick1 option', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for form submission')
    const weeklyGrid = new WeeklyGridPage(page)
    await weeklyGrid.goto()
    const safarButton = weeklyGrid.getPick1Button('Safar Book')
    await safarButton.click()
    await expect(safarButton).toHaveClass(/bg-coral/)
  })
})

test.describe('Weekly grid - Completion toggle', () => {
  test('can toggle subject completion for a day', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for form submission')
    const weeklyGrid = new WeeklyGridPage(page)
    await weeklyGrid.goto()
    
    const mathRow = weeklyGrid.getVisibleSubjectRow('📐')
    const firstButton = mathRow.getByRole('button', { name: /Mark/ }).first()
    const initiallyComplete = await firstButton.getAttribute('aria-label') === 'Mark incomplete'
    
    await firstButton.click()
    
    if (initiallyComplete) {
      await expect(mathRow.getByRole('button', { name: 'Mark complete' }).first()).toBeVisible()
    } else {
      await expect(mathRow.getByRole('button', { name: 'Mark incomplete' }).first()).toBeVisible()
    }
    
    const toggledButton = mathRow.getByRole('button', { name: /Mark/ }).first()
    await toggledButton.click()
    
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
    const weeklyGrid = new WeeklyGridPage(page)
    await weeklyGrid.goto()
    await weeklyGrid.expectLoaded()
    const currentUrl = page.url()

    await weeklyGrid.navigateToPreviousWeek()

    expect(page.url()).not.toBe(currentUrl)
    await expect(weeklyGrid.todayLink).toBeVisible()
  })

  test('Today link navigates back to current week', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for client-side navigation')
    const weeklyGrid = new WeeklyGridPage(page)
    await weeklyGrid.goto()
    await weeklyGrid.expectLoaded()
    
    await weeklyGrid.navigateToPreviousWeek()
    await weeklyGrid.navigateToToday()
  })
})

test.describe('Weekly grid - Mobile layout', () => {
  test.use({
    viewport: { width: 375, height: 667 },
  })

  test('shows mobile layout with day labels', async ({ page, noscript }) => {
    test.skip(noscript, 'Mobile layout requires JavaScript for hydration')
    const weeklyGrid = new WeeklyGridPage(page)
    await weeklyGrid.goto()
    await expect(weeklyGrid.getVisibleSubject('Math')).toBeVisible()
    await expect(weeklyGrid.getDayLabel('Mon')).toBeVisible()
    await expect(weeklyGrid.getDayLabel('Tue')).toBeVisible()
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
    const weeklyGrid = new WeeklyGridPage(page)
    await weeklyGrid.goto()
    await expect(weeklyGrid.getVisibleSubject('Math')).toBeVisible()
    await expect(weeklyGrid.getDesktopRow('Math')).toBeVisible()
  })
})
