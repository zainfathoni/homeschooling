import { test, expect } from './base-test'

/**
 * E2E tests for responsive layout behavior across different breakpoints.
 * Tests navigation visibility, layout structure, touch targets, and design tokens.
 *
 * Breakpoints:
 * - Mobile (< 768px): bottom nav, single column, mobile header
 * - Tablet (>= 768px): side nav, duet view
 *
 * Usage:
 *   npm run test:e2e -- responsive-layout.spec.ts
 */

const isMobileProject = (testInfo: { project: { name: string } }) =>
  ['Pixel 4', 'iPhone 11'].includes(testInfo.project.name)

test.describe('Mobile layout (< 768px)', () => {
  test.use({
    storageState: 'e2e/fixtures/auth/parent.local.json',
  })

  test('mobile shows bottom navigation', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for component rendering')
    test.skip(!isMobileProject(testInfo), 'This test is for mobile viewports')
    await page.goto('/week')
    await page.waitForLoadState('networkidle')

    // Bottom nav should be visible on mobile
    const bottomNav = page.locator('nav.md\\:hidden.fixed.bottom-0')
    await expect(bottomNav).toBeVisible()

    // Side nav should be hidden on mobile
    const sideNav = page.locator('aside.hidden.md\\:flex')
    await expect(sideNav).toBeHidden()
  })

  test('mobile shows mobile header', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for component rendering')
    test.skip(!isMobileProject(testInfo), 'This test is for mobile viewports')
    await page.goto('/week')
    await page.waitForLoadState('networkidle')

    // Mobile header should be visible
    const mobileHeader = page.locator('header.md\\:hidden')
    await expect(mobileHeader).toBeVisible()
    await expect(mobileHeader.getByText('Homeschool Planner')).toBeVisible()
  })

  test('mobile bottom nav has all navigation items', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for component rendering')
    test.skip(!isMobileProject(testInfo), 'This test is for mobile viewports')
    await page.goto('/week')
    await page.waitForLoadState('networkidle')

    const bottomNav = page.locator('nav.md\\:hidden.fixed.bottom-0')
    await expect(bottomNav.getByText('Schedule')).toBeVisible()
    await expect(bottomNav.getByText('Narrations')).toBeVisible()
    await expect(bottomNav.getByText('Settings')).toBeVisible()
  })

  test('mobile shows single column layout', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for component rendering')
    test.skip(!isMobileProject(testInfo), 'This test is for mobile viewports')
    await page.goto('/week')
    await page.waitForLoadState('networkidle')

    // Duet view should be hidden on mobile
    const duetView = page.locator('.hidden.md\\:grid.md\\:grid-cols-2')
    await expect(duetView).toBeHidden()

    // Mobile weekly schedule section should be visible
    await expect(page.getByRole('heading', { name: /Weekly Schedule/i })).toBeVisible()
  })
})

test.describe('Tablet layout (>= 768px)', () => {
  test.use({
    storageState: 'e2e/fixtures/auth/parent.local.json',
    viewport: { width: 1024, height: 768 },
  })

  test('tablet shows side navigation', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for component rendering')
    test.skip(isMobileProject(testInfo), 'This test is for tablet/desktop viewports')
    await page.goto('/week')
    await page.waitForLoadState('networkidle')

    // Side nav should be visible on tablet
    const sideNav = page.locator('aside.hidden.md\\:flex')
    await expect(sideNav).toBeVisible()

    // Bottom nav should be hidden on tablet
    const bottomNav = page.locator('nav.md\\:hidden')
    await expect(bottomNav).toBeHidden()
  })

  test('tablet hides mobile header', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for component rendering')
    test.skip(isMobileProject(testInfo), 'This test is for tablet/desktop viewports')
    await page.goto('/week')
    await page.waitForLoadState('networkidle')

    // Mobile header should be hidden on tablet
    const mobileHeader = page.locator('header.md\\:hidden')
    await expect(mobileHeader).toBeHidden()
  })

  test('tablet side nav has all navigation items', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for component rendering')
    test.skip(isMobileProject(testInfo), 'This test is for tablet/desktop viewports')
    await page.goto('/week')
    await page.waitForLoadState('networkidle')

    const sideNav = page.locator('aside.hidden.md\\:flex')
    await expect(sideNav.getByText('Schedule')).toBeVisible()
    await expect(sideNav.getByText('Narrations')).toBeVisible()
    await expect(sideNav.getByText('Settings')).toBeVisible()
  })

  test('tablet shows duet view layout', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for component rendering')
    test.skip(isMobileProject(testInfo), 'This test is for tablet/desktop viewports')
    await page.goto('/week')
    await page.waitForLoadState('networkidle')

    // Duet view should be visible on tablet
    const duetView = page.locator('.hidden.md\\:grid.md\\:grid-cols-2')
    await expect(duetView).toBeVisible()
  })

  test('tablet side nav shows app title', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for component rendering')
    test.skip(isMobileProject(testInfo), 'This test is for tablet/desktop viewports')
    await page.goto('/week')
    await page.waitForLoadState('networkidle')

    const sideNav = page.locator('aside.hidden.md\\:flex')
    await expect(sideNav.getByText('Homeschool Planner')).toBeVisible()
  })
})

test.describe('Touch targets - Mobile (>= 44px)', () => {
  test.use({
    storageState: 'e2e/fixtures/auth/parent.local.json',
  })

  test('mobile bottom nav items meet minimum touch target size', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for component rendering')
    test.skip(!isMobileProject(testInfo), 'This test is for mobile viewports')
    await page.goto('/week')
    await page.waitForLoadState('networkidle')

    // Bottom nav links have min-h-[56px] class
    const navLinks = page.locator('nav.md\\:hidden.fixed.bottom-0 a')
    const count = await navLinks.count()

    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i)
      const box = await link.boundingBox()
      expect(box).not.toBeNull()
      // Touch target should be at least 44px
      expect(box!.height).toBeGreaterThanOrEqual(44)
    }
  })

  test('mobile header button meets minimum touch target size', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for component rendering')
    test.skip(!isMobileProject(testInfo), 'This test is for mobile viewports')
    await page.goto('/week')
    await page.waitForLoadState('networkidle')

    // Mobile header button (student switcher) has min-h-[44px] class
    const headerButton = page.locator('header.md\\:hidden button').first()
    if (await headerButton.isVisible()) {
      const box = await headerButton.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.height).toBeGreaterThanOrEqual(44)
    }
  })
})

test.describe('Touch targets - Tablet (>= 44px)', () => {
  test.use({
    storageState: 'e2e/fixtures/auth/parent.local.json',
    viewport: { width: 1024, height: 768 },
  })

  test('tablet side nav items meet minimum touch target size', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for component rendering')
    test.skip(isMobileProject(testInfo), 'This test is for tablet/desktop viewports')
    await page.goto('/week')
    await page.waitForLoadState('networkidle')

    // Side nav links have min-h-[44px] class
    const sideNav = page.locator('aside.hidden.md\\:flex')
    const navLinks = sideNav.locator('nav a')
    const count = await navLinks.count()

    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i)
      const box = await link.boundingBox()
      expect(box).not.toBeNull()
      // Touch target should be at least 44px
      expect(box!.height).toBeGreaterThanOrEqual(44)
    }
  })
})

test.describe('Design tokens - Mobile', () => {
  test.use({
    storageState: 'e2e/fixtures/auth/parent.local.json',
  })

  test('app has lavender background class', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for component rendering')
    test.skip(!isMobileProject(testInfo), 'This test is for mobile viewports')
    await page.goto('/week')
    await page.waitForLoadState('networkidle')

    // Main container has bg-lavender class
    const appContainer = page.locator('div.min-h-screen.bg-lavender')
    await expect(appContainer).toBeVisible()
  })

  test('active mobile nav item has coral text class', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for component rendering')
    test.skip(!isMobileProject(testInfo), 'This test is for mobile viewports')
    await page.goto('/week')
    await page.waitForLoadState('networkidle')

    // Find the active Schedule link in bottom nav (it should be active on /week)
    const bottomNav = page.locator('nav.md\\:hidden.fixed.bottom-0')
    const activeScheduleLink = bottomNav.locator('a.text-coral')
    await expect(activeScheduleLink).toBeVisible()
    await expect(activeScheduleLink).toContainText('Schedule')
  })
})

test.describe('Design tokens - Tablet', () => {
  test.use({
    storageState: 'e2e/fixtures/auth/parent.local.json',
    viewport: { width: 1024, height: 768 },
  })

  test('app has lavender background class', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for component rendering')
    test.skip(isMobileProject(testInfo), 'This test is for tablet/desktop viewports')
    await page.goto('/week')
    await page.waitForLoadState('networkidle')

    // Main container has bg-lavender class
    const appContainer = page.locator('div.min-h-screen.bg-lavender')
    await expect(appContainer).toBeVisible()
  })

  test('active tablet side nav item has coral background class', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for component rendering')
    test.skip(isMobileProject(testInfo), 'This test is for tablet/desktop viewports')
    await page.goto('/week')
    await page.waitForLoadState('networkidle')

    // Find the active Schedule link in side nav (it should be active on /week with bg-coral class)
    const sideNav = page.locator('aside.hidden.md\\:flex')
    const activeScheduleLink = sideNav.locator('a.bg-coral')
    await expect(activeScheduleLink).toBeVisible()
    await expect(activeScheduleLink).toContainText('Schedule')
  })

  test('cards have white background class', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for component rendering')
    test.skip(isMobileProject(testInfo), 'This test is for tablet/desktop viewports')
    await page.goto('/week')
    await page.waitForLoadState('networkidle')

    // Cards in duet view have bg-white class
    const card = page.locator('.md\\:grid.md\\:grid-cols-2 .bg-white').first()
    await expect(card).toBeVisible()
  })
})

test.describe('Navigation functionality - Mobile', () => {
  test.use({
    storageState: 'e2e/fixtures/auth/parent.local.json',
  })

  test('mobile bottom nav navigates to narrations', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for navigation')
    test.skip(!isMobileProject(testInfo), 'This test is for mobile viewports')
    await page.goto('/week')
    await page.waitForLoadState('networkidle')

    const bottomNav = page.locator('nav.md\\:hidden.fixed.bottom-0')
    await bottomNav.getByRole('link', { name: /narrations/i }).click()
    await page.waitForURL(/\/narrations/)
  })

  test('mobile bottom nav navigates to settings', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for navigation')
    test.skip(!isMobileProject(testInfo), 'This test is for mobile viewports')
    await page.goto('/week')
    await page.waitForLoadState('networkidle')

    const bottomNav = page.locator('nav.md\\:hidden.fixed.bottom-0')
    await bottomNav.getByRole('link', { name: /settings/i }).click()
    await page.waitForURL(/\/settings/)
  })
})

test.describe('Navigation functionality - Tablet', () => {
  test.use({
    storageState: 'e2e/fixtures/auth/parent.local.json',
    viewport: { width: 1024, height: 768 },
  })

  test('tablet side nav navigates to narrations', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for navigation')
    test.skip(isMobileProject(testInfo), 'This test is for tablet/desktop viewports')
    await page.goto('/week')
    await page.waitForLoadState('networkidle')

    const sideNav = page.locator('aside.hidden.md\\:flex')
    await sideNav.getByRole('link', { name: /narrations/i }).click()
    await page.waitForURL(/\/narrations/)
  })

  test('tablet side nav navigates to settings', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for navigation')
    test.skip(isMobileProject(testInfo), 'This test is for tablet/desktop viewports')
    await page.goto('/week')
    await page.waitForLoadState('networkidle')

    const sideNav = page.locator('aside.hidden.md\\:flex')
    await sideNav.getByRole('link', { name: /settings/i }).click()
    await page.waitForURL(/\/settings/)
  })
})
