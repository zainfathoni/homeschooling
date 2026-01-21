import { test, expect } from './base-test'
import { DailyFocusPage } from './pages/daily-focus.page'

/**
 * E2E tests for tablet duet view with daily focus panel.
 * Tests the split-screen layout on tablet: weekly grid + daily focus.
 *
 * The duet view is only visible on md+ viewports (≥768px).
 * Mobile viewports show the standard weekly grid layout.
 *
 * Usage:
 *   npm run test:e2e -- daily-focus.spec.ts
 */

const isMobileProject = (testInfo: { project: { name: string } }) =>
  ['Pixel 4', 'iPhone 11'].includes(testInfo.project.name)

test.describe('Duet view - Tablet layout', () => {
  test.use({
    storageState: 'e2e/fixtures/auth/parent.local.json',
    viewport: { width: 1024, height: 768 },
  })

  test('tablet viewport shows duet layout', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for component rendering')
    test.skip(isMobileProject(testInfo), 'Duet view only visible on tablet/desktop')
    const dailyFocus = new DailyFocusPage(page)
    await dailyFocus.goto()
    await dailyFocus.expectDuetViewVisible()
  })

  test('duet view shows weekly overview panel', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for component rendering')
    test.skip(isMobileProject(testInfo), 'Duet view only visible on tablet/desktop')
    const dailyFocus = new DailyFocusPage(page)
    await dailyFocus.goto()
    await expect(page.getByRole('heading', { name: 'Weekly Overview' })).toBeVisible()
  })

  test('duet view shows daily focus panel with progress ring', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for component rendering')
    test.skip(isMobileProject(testInfo), 'Duet view only visible on tablet/desktop')
    const dailyFocus = new DailyFocusPage(page)
    await dailyFocus.goto()
    await dailyFocus.expectProgressRingVisible()
    await expect(dailyFocus.tasksCompleteText).toBeVisible()
  })
})

test.describe('Duet view - Day selection', () => {
  test.use({
    storageState: 'e2e/fixtures/auth/parent.local.json',
    viewport: { width: 1024, height: 768 },
  })

  test('can select different days in weekly overview', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for day selection')
    test.skip(isMobileProject(testInfo), 'Duet view only visible on tablet/desktop')
    const dailyFocus = new DailyFocusPage(page)
    await dailyFocus.goto()
    await dailyFocus.expectDuetViewVisible()

    // Select Monday
    await dailyFocus.selectDay('Mon')
    await dailyFocus.expectDaySelected('Mon')
    await dailyFocus.expectDailyFocusHeading('Monday')

    // Select Tuesday
    await dailyFocus.selectDay('Tue')
    await dailyFocus.expectDaySelected('Tue')
    await dailyFocus.expectDailyFocusHeading('Tuesday')
  })

  test('day selection updates daily focus panel', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for day selection')
    test.skip(isMobileProject(testInfo), 'Duet view only visible on tablet/desktop')
    const dailyFocus = new DailyFocusPage(page)
    await dailyFocus.goto()
    await dailyFocus.expectDuetViewVisible()

    // Select Tuesday
    await dailyFocus.selectDay('Tue')
    await dailyFocus.expectDailyFocusHeading('Tuesday')

    // Select Monday
    await dailyFocus.selectDay('Mon')
    await dailyFocus.expectDailyFocusHeading('Monday')
  })

  test('off days are visually distinguished (disabled)', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for day selection')
    test.skip(isMobileProject(testInfo), 'Duet view only visible on tablet/desktop')
    const dailyFocus = new DailyFocusPage(page)
    await dailyFocus.goto()
    await dailyFocus.expectDuetViewVisible()

    // Find at least one disabled day button (off days vary by schedule settings)
    const dayButtons = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    let foundDisabled = false
    for (const day of dayButtons) {
      const button = dailyFocus.getDayButton(day)
      const isDisabled = await button.isDisabled()
      if (isDisabled) {
        foundDisabled = true
        // Disabled buttons should have cursor-not-allowed styling
        await expect(button).toHaveClass(/cursor-not-allowed/)
        break
      }
    }
    expect(foundDisabled).toBe(true)
  })
})

test.describe('Duet view - Task cards', () => {
  test.use({
    storageState: 'e2e/fixtures/auth/parent.local.json',
    viewport: { width: 1024, height: 768 },
  })

  test('shows task cards for subjects', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for component rendering')
    test.skip(isMobileProject(testInfo), 'Duet view only visible on tablet/desktop')
    const dailyFocus = new DailyFocusPage(page)
    await dailyFocus.goto()
    await dailyFocus.expectDuetViewVisible()

    // Select a weekday to ensure tasks are shown
    await dailyFocus.selectDay('Mon')

    // Check that Math subject appears (from seed data)
    await expect(dailyFocus.getTaskCard('Math')).toBeVisible()
  })

  test('can toggle task completion', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for form submission')
    test.skip(isMobileProject(testInfo), 'Duet view only visible on tablet/desktop')
    const dailyFocus = new DailyFocusPage(page)
    await dailyFocus.goto()
    await dailyFocus.expectDuetViewVisible()

    // Select Monday
    await dailyFocus.selectDay('Mon')

    // Get initial state
    const mathToggle = dailyFocus.getTaskToggleButton('Math')
    const initiallyComplete = await mathToggle.getAttribute('aria-label') === 'Mark incomplete'

    // Toggle task
    await dailyFocus.toggleTask('Math')

    // Verify state changed
    if (initiallyComplete) {
      await dailyFocus.expectTaskIncomplete('Math')
    } else {
      await dailyFocus.expectTaskComplete('Math')
    }

    // Toggle back to restore original state
    await dailyFocus.toggleTask('Math')
  })
})

test.describe('Duet view - Progress ring', () => {
  test.use({
    storageState: 'e2e/fixtures/auth/parent.local.json',
    viewport: { width: 1024, height: 768 },
  })

  test('progress ring shows completion percentage', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for component rendering')
    test.skip(isMobileProject(testInfo), 'Duet view only visible on tablet/desktop')
    const dailyFocus = new DailyFocusPage(page)
    await dailyFocus.goto()
    await dailyFocus.expectDuetViewVisible()
    await dailyFocus.expectProgressRingVisible()

    // Check that we have task completion text
    await expect(dailyFocus.tasksCompleteText).toBeVisible()
    const percentage = await dailyFocus.getProgressPercentage()
    expect(percentage).toBeGreaterThanOrEqual(0)
    expect(percentage).toBeLessThanOrEqual(100)
  })

  test('progress ring updates when task is toggled', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for form submission')
    test.skip(isMobileProject(testInfo), 'Duet view only visible on tablet/desktop')
    const dailyFocus = new DailyFocusPage(page)
    await dailyFocus.goto()
    await dailyFocus.expectDuetViewVisible()

    // Select Monday
    await dailyFocus.selectDay('Mon')

    // Get initial completion text
    const initialText = await dailyFocus.tasksCompleteText.textContent()
    const initialMatch = initialText?.match(/(\d+) of (\d+)/)
    expect(initialMatch).toBeTruthy()
    const initialCompleted = parseInt(initialMatch![1])

    // Toggle a task
    await dailyFocus.toggleTask('Math')

    // Wait for completion text to update
    await expect(async () => {
      const newText = await dailyFocus.tasksCompleteText.textContent()
      const newMatch = newText?.match(/(\d+) of (\d+)/)
      expect(newMatch).toBeTruthy()
      const newCompleted = parseInt(newMatch![1])
      expect(newCompleted).not.toBe(initialCompleted)
    }).toPass({ timeout: 5000 })

    // Toggle back to restore original state
    await dailyFocus.toggleTask('Math')
  })
})

test.describe('Duet view - Mobile layout', () => {
  test.use({
    storageState: 'e2e/fixtures/auth/parent.local.json',
  })

  test('mobile hides duet view', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for page rendering')
    test.skip(!isMobileProject(testInfo), 'This test is specifically for mobile viewports')
    const dailyFocus = new DailyFocusPage(page)
    await dailyFocus.goto()

    // On mobile, duet view should not be visible
    await dailyFocus.expectDuetViewHidden()
  })

  test('mobile shows standard weekly grid instead', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for page rendering')
    test.skip(!isMobileProject(testInfo), 'This test is specifically for mobile viewports')
    const dailyFocus = new DailyFocusPage(page)
    await dailyFocus.goto()

    // Mobile should still show subjects but in standard layout
    await expect(page.getByRole('heading', { name: /Weekly Schedule/i })).toBeVisible()
    await expect(page.getByText('Math')).toBeVisible()
  })
})
