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

const isMobileProject = (testInfo: { project: { name: string } }) =>
  ['Pixel 4', 'iPhone 11'].includes(testInfo.project.name)

test.describe('Weekly grid - Subject types', () => {
  // SubjectRow with checkboxes is only visible on mobile (inside md:hidden container)
  // On tablet/desktop, TabletDuetView is shown instead
  test('shows fixed subjects with daily checkboxes', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Mobile layout requires JavaScript for hydration')
    test.skip(!isMobileProject(testInfo), 'SubjectRow is only visible on mobile')
    const weeklyGrid = new WeeklyGridPage(page)
    await weeklyGrid.goto()
    // On mobile, find subject in the mobile container
    const mobileContainer = page.locator('.md\\:hidden')
    const mathRow = mobileContainer.locator('div').filter({ hasText: /📐.*Math/ }).first()
    await expect(mathRow).toBeVisible()
    const checkboxes = mathRow.getByRole('button', { name: /Mark/i })
    await expect(checkboxes.first()).toBeVisible()
  })

  // Pick1Selector is only rendered in mobile section (md:hidden)
  test('shows Pick1 subjects with option buttons', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Mobile layout requires JavaScript for hydration')
    test.skip(!isMobileProject(testInfo), 'Pick1Selector is only visible on mobile')
    const weeklyGrid = new WeeklyGridPage(page)
    await weeklyGrid.goto()
    await expect(weeklyGrid.getPick1Button('Safar Book')).toBeVisible()
    await expect(weeklyGrid.getPick1Button('Quran Recitation')).toBeVisible()
  })

  test('can select Pick1 option', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for form submission')
    test.skip(!isMobileProject(testInfo), 'Pick1Selector is only visible on mobile')
    const weeklyGrid = new WeeklyGridPage(page)
    await weeklyGrid.goto()
    // Wait for hydration before interacting with fetcher forms
    await page.waitForLoadState('networkidle')
    const safarButton = weeklyGrid.getPick1Button('Safar Book')
    await safarButton.click()
    await expect(safarButton).toHaveClass(/bg-coral/, { timeout: 10000 })
  })
})

test.describe('Weekly grid - Completion toggle', () => {
  test('can toggle subject completion for a day', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for form submission')
    const weeklyGrid = new WeeklyGridPage(page)
    await weeklyGrid.goto()
    // Wait for hydration to complete before interacting with fetcher forms
    await page.waitForLoadState('networkidle')

    const mathRow = weeklyGrid.getVisibleSubjectRow('📐')
    const firstButton = mathRow.getByRole('button', { name: /Mark/ }).first()
    await expect(firstButton).toBeEnabled()
    const initialAriaLabel = await firstButton.getAttribute('aria-label')
    const initiallyComplete = initialAriaLabel === 'Mark incomplete'

    // Toggle and wait for state change using explicit attribute assertion
    await firstButton.click()
    const expectedLabel = initiallyComplete ? 'Mark complete' : 'Mark incomplete'
    await expect(mathRow.getByRole('button', { name: /Mark/ }).first())
      .toHaveAttribute('aria-label', expectedLabel, { timeout: 10000 })

    // Toggle back to restore original state
    await mathRow.getByRole('button', { name: /Mark/ }).first().click()
    await expect(mathRow.getByRole('button', { name: /Mark/ }).first())
      .toHaveAttribute('aria-label', initialAriaLabel!, { timeout: 10000 })
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

  test('shows tablet duet view layout', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Desktop layout requires JavaScript for hydration')
    test.skip(isMobileProject(testInfo), 'Tablet layout not visible on mobile projects')
    const weeklyGrid = new WeeklyGridPage(page)
    await weeklyGrid.goto()
    // TabletDuetView shows Weekly Overview and DailyFocus panels
    await expect(page.getByRole('heading', { name: 'Weekly Overview' })).toBeVisible()
    // DailyFocus panel shows subjects with Math
    await expect(page.getByText('Math').first()).toBeVisible()
  })
})
