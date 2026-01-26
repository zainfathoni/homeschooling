import { expect, test } from './base-test'
import { StudentSwitcherPage } from './pages/student-switcher.page'

/**
 * E2E tests for student switcher component (multi-student flow).
 * Tests parent can see dropdown, switch students, and verify persistence.
 * Tests student user sees no switcher.
 *
 * Note: Student switcher is only visible in desktop sidebar (hidden on mobile).
 * These tests skip mobile viewports.
 *
 * Usage:
 *   npm run test:e2e -- student-switcher.spec.ts
 */

const isMobileProject = (testInfo: { project: { name: string } }) =>
  ['Pixel 4', 'iPhone 11'].includes(testInfo.project.name)

test.describe('Student switcher - Parent access', () => {
  test.use({
    storageState: 'e2e/fixtures/auth/parent.local.json',
  })

  test('parent sees student dropdown in sidebar', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for page rendering')
    test.skip(isMobileProject(testInfo), 'Switcher only visible on desktop sidebar')
    const switcherPage = new StudentSwitcherPage(page)
    await switcherPage.goto()
    await switcherPage.expectSwitcherVisible()
  })

  test('dropdown shows multiple students', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for page rendering')
    test.skip(isMobileProject(testInfo), 'Switcher only visible on desktop sidebar')
    const switcherPage = new StudentSwitcherPage(page)
    await switcherPage.goto()
    await switcherPage.expectSwitcherVisible()

    const options = await switcherPage.getStudentOptions()
    expect(options.length).toBeGreaterThanOrEqual(2)
    expect(options).toContain('Najmi')
    expect(options).toContain('Isa')
  })

  test('can switch between students', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for form submission')
    test.skip(isMobileProject(testInfo), 'Switcher only visible on desktop sidebar')
    const switcherPage = new StudentSwitcherPage(page)
    await switcherPage.goto()
    await switcherPage.expectSwitcherVisible()

    // Get initial student
    const initialOptions = await switcherPage.getStudentOptions()
    expect(initialOptions.length).toBeGreaterThanOrEqual(2)

    // Switch to a different student
    await switcherPage.selectStudent('Isa')
    await switcherPage.expectStudentSelected('Isa')

    // Switch back
    await switcherPage.selectStudent('Najmi')
    await switcherPage.expectStudentSelected('Najmi')
  })

  test('switching student updates displayed content', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for form submission')
    test.skip(isMobileProject(testInfo), 'Switcher only visible on desktop sidebar')
    const switcherPage = new StudentSwitcherPage(page)
    await switcherPage.goto()
    await switcherPage.expectSwitcherVisible()

    // Select Isa and verify heading shows Isa
    await switcherPage.selectStudent('Isa')
    await switcherPage.expectHeadingContains('Isa')

    // Select Najmi and verify heading shows Najmi
    await switcherPage.selectStudent('Najmi')
    await switcherPage.expectHeadingContains('Najmi')
  })
})

test.describe('Student switcher - Selection persistence', () => {
  test.use({
    storageState: 'e2e/fixtures/auth/parent.local.json',
  })

  test('selection persists across page navigation', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for form submission')
    test.skip(isMobileProject(testInfo), 'Switcher only visible on desktop sidebar')
    const switcherPage = new StudentSwitcherPage(page)
    await switcherPage.goto()
    await switcherPage.expectSwitcherVisible()

    // Select Isa
    await switcherPage.selectStudent('Isa')
    await switcherPage.expectStudentSelected('Isa')

    // Navigate to narrations and back
    await page.getByRole('link', { name: /narrations/i }).click()
    await page.waitForLoadState('networkidle')

    // Navigate back to week using sidebar navigation
    await page.getByRole('link', { name: /schedule/i }).click()
    await page.waitForLoadState('networkidle')

    // Verify Isa is still selected
    await switcherPage.expectStudentSelected('Isa')

    // Restore to Najmi for other tests
    await switcherPage.selectStudent('Najmi')
  })

  test('selection persists after page refresh', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for form submission')
    test.skip(isMobileProject(testInfo), 'Switcher only visible on desktop sidebar')
    const switcherPage = new StudentSwitcherPage(page)
    await switcherPage.goto()
    await switcherPage.expectSwitcherVisible()

    // Select Isa
    await switcherPage.selectStudent('Isa')
    await switcherPage.expectStudentSelected('Isa')

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Verify Isa is still selected
    await switcherPage.expectStudentSelected('Isa')

    // Restore to Najmi for other tests
    await switcherPage.selectStudent('Najmi')
  })
})

test.describe('Student switcher - Student access', () => {
  test.use({
    storageState: 'e2e/fixtures/auth/student.local.json',
  })

  test('student sees no switcher dropdown', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for page rendering')
    test.skip(isMobileProject(testInfo), 'Switcher only visible on desktop sidebar')
    const switcherPage = new StudentSwitcherPage(page)
    await switcherPage.goto()

    // Student should not see the switcher or "Viewing as" label
    await switcherPage.expectSwitcherNotVisible()
  })
})

test.describe('Student switcher - Mobile layout', () => {
  test.use({
    storageState: 'e2e/fixtures/auth/parent.local.json',
  })

  test('switcher visible in mobile header', async ({ page, noscript }, testInfo) => {
    test.skip(noscript, 'Requires JavaScript for page rendering')
    test.skip(!isMobileProject(testInfo), 'This test is specifically for mobile viewports')
    const switcherPage = new StudentSwitcherPage(page)
    await switcherPage.goto()

    // On mobile, switcher is in the header (not sidebar which is hidden)
    const mobileHeaderSwitcher = page.locator('header').getByLabel('Select student')
    await expect(mobileHeaderSwitcher).toBeVisible()
  })
})
