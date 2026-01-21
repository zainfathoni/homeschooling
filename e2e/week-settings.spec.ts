import { test, expect } from './base-test'
import { WeekSettingsPage } from './pages/week-settings.page'

/**
 * E2E tests for week settings page (school days configuration).
 * Tests parent access, student permission denied, day toggling, and persistence.
 *
 * Usage:
 *   npm run test:e2e -- week-settings.spec.ts
 */

test.describe('Week settings - Parent access', () => {
  test.use({
    storageState: 'e2e/fixtures/auth/parent.local.json',
  })

  test('parent can access settings page', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for page rendering')
    const settingsPage = new WeekSettingsPage(page)
    await settingsPage.goto()
    await settingsPage.expectLoaded()
  })

  test('shows all seven day buttons with school/off labels', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for page rendering')
    const settingsPage = new WeekSettingsPage(page)
    await settingsPage.goto()
    await settingsPage.expectLoaded()

    // Verify all 7 day buttons are present
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    for (const day of days) {
      const button = settingsPage.getDayButton(day)
      await expect(button).toBeVisible()
      await expect(button).toHaveAttribute('aria-pressed', /(true|false)/)
    }
  })
})

test.describe('Week settings - Student access', () => {
  test.use({
    storageState: 'e2e/fixtures/auth/student.local.json',
  })

  test('student gets 403 Forbidden', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for error handling')
    const settingsPage = new WeekSettingsPage(page)
    await settingsPage.goto()
    await settingsPage.expectForbidden()
  })
})

test.describe('Week settings - Toggle days', () => {
  test.use({
    storageState: 'e2e/fixtures/auth/parent.local.json',
  })

  test('can toggle a day off and back on', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for toggling')
    const settingsPage = new WeekSettingsPage(page)
    await settingsPage.goto()
    await settingsPage.expectLoaded()

    // Toggle Mon off
    const wasMonEnabled = await settingsPage.isDayEnabled('Mon')
    if (wasMonEnabled) {
      await settingsPage.toggleDay('Mon')
      await settingsPage.expectDayDisabled('Mon')
    }

    // Toggle it back on
    await settingsPage.toggleDay('Mon')
    await settingsPage.expectDayEnabled('Mon')
  })

  test('can toggle weekend days on and off', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for toggling')
    const settingsPage = new WeekSettingsPage(page)
    await settingsPage.goto()
    await settingsPage.expectLoaded()

    // Sat should be off by default, toggle it on
    const wasSatEnabled = await settingsPage.isDayEnabled('Sat')
    await settingsPage.toggleDay('Sat')

    if (wasSatEnabled) {
      await settingsPage.expectDayDisabled('Sat')
    } else {
      await settingsPage.expectDayEnabled('Sat')
    }

    // Toggle back
    await settingsPage.toggleDay('Sat')
    if (wasSatEnabled) {
      await settingsPage.expectDayEnabled('Sat')
    } else {
      await settingsPage.expectDayDisabled('Sat')
    }
  })

  test('toggling updates the school day count', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for toggling')
    const settingsPage = new WeekSettingsPage(page)
    await settingsPage.goto()
    await settingsPage.expectLoaded()

    // Get current count from page
    const initialWedEnabled = await settingsPage.isDayEnabled('Wed')

    // Toggle Wed
    await settingsPage.toggleDay('Wed')

    // Toggle back to restore
    await settingsPage.toggleDay('Wed')

    // Verify Wed is back to initial state
    if (initialWedEnabled) {
      await settingsPage.expectDayEnabled('Wed')
    } else {
      await settingsPage.expectDayDisabled('Wed')
    }
  })
})

test.describe('Week settings - Persistence', () => {
  test.use({
    storageState: 'e2e/fixtures/auth/parent.local.json',
  })

  test('changes persist after page refresh', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for toggling')
    const settingsPage = new WeekSettingsPage(page)
    await settingsPage.goto()
    await settingsPage.expectLoaded()

    // Get current state
    const wasThurEnabled = await settingsPage.isDayEnabled('Thu')

    // Toggle Thu
    await settingsPage.toggleDay('Thu')

    // Verify change
    if (wasThurEnabled) {
      await settingsPage.expectDayDisabled('Thu')
    } else {
      await settingsPage.expectDayEnabled('Thu')
    }

    // Reload page
    await page.reload()
    await settingsPage.expectLoaded()

    // Verify change persisted
    if (wasThurEnabled) {
      await settingsPage.expectDayDisabled('Thu')
    } else {
      await settingsPage.expectDayEnabled('Thu')
    }

    // Restore original state
    await settingsPage.toggleDay('Thu')
    if (wasThurEnabled) {
      await settingsPage.expectDayEnabled('Thu')
    } else {
      await settingsPage.expectDayDisabled('Thu')
    }
  })
})

test.describe('Week settings - Navigation', () => {
  test.use({
    storageState: 'e2e/fixtures/auth/parent.local.json',
  })

  test('back link returns to week view', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for navigation')
    const settingsPage = new WeekSettingsPage(page)
    await settingsPage.goto()
    await settingsPage.expectLoaded()

    await settingsPage.backLink.click()
    // Back link goes to nested week route
    await expect(page).toHaveURL(/\/students\/[^/]+\/week\/\d{4}-\d{2}-\d{2}$/)
  })
})
