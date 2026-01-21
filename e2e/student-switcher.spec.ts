import { test, expect } from './base-test'
import { StudentSwitcherPage } from './pages/student-switcher.page'

/**
 * E2E tests for student switcher component (multi-student flow).
 * Tests parent can see dropdown, switch students, and verify persistence.
 * Tests student user sees no switcher.
 *
 * Usage:
 *   npm run test:e2e -- student-switcher.spec.ts
 */

test.describe('Student switcher - Parent access', () => {
  test.use({
    storageState: 'e2e/fixtures/auth/parent.local.json',
    viewport: { width: 1024, height: 768 },
  })

  test('parent sees student dropdown in sidebar', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for page rendering')
    const switcherPage = new StudentSwitcherPage(page)
    await switcherPage.goto()
    await switcherPage.expectSwitcherVisible()
  })

  test('dropdown shows multiple students', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for page rendering')
    const switcherPage = new StudentSwitcherPage(page)
    await switcherPage.goto()
    await switcherPage.expectSwitcherVisible()

    const options = await switcherPage.getStudentOptions()
    expect(options.length).toBeGreaterThanOrEqual(2)
    expect(options).toContain('Najmi')
    expect(options).toContain('Isa')
  })

  test('can switch between students', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for form submission')
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

  test('switching student updates displayed content', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for form submission')
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
    viewport: { width: 1024, height: 768 },
  })

  test('selection persists across page navigation', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for form submission')
    const switcherPage = new StudentSwitcherPage(page)
    await switcherPage.goto()
    await switcherPage.expectSwitcherVisible()

    // Select Isa
    await switcherPage.selectStudent('Isa')
    await switcherPage.expectStudentSelected('Isa')

    // Navigate to narrations and back
    await page.getByRole('link', { name: /narrations/i }).click()
    await page.waitForLoadState('networkidle')

    // Navigate back to week
    await page.getByRole('link', { name: /week/i }).click()
    await page.waitForLoadState('networkidle')

    // Verify Isa is still selected
    await switcherPage.expectStudentSelected('Isa')

    // Restore to Najmi for other tests
    await switcherPage.selectStudent('Najmi')
  })

  test('selection persists after page refresh', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for form submission')
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
    viewport: { width: 1024, height: 768 },
  })

  test('student sees no switcher dropdown', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for page rendering')
    const switcherPage = new StudentSwitcherPage(page)
    await switcherPage.goto()

    // Student should not see the switcher or "Viewing as" label
    await switcherPage.expectSwitcherNotVisible()
  })
})

test.describe('Student switcher - Mobile layout', () => {
  test.use({
    storageState: 'e2e/fixtures/auth/parent.local.json',
    viewport: { width: 375, height: 667 },
  })

  test('switcher not visible in mobile sidebar (sidebar hidden)', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for page rendering')
    const switcherPage = new StudentSwitcherPage(page)
    await switcherPage.goto()

    // On mobile, sidebar is hidden, so switcher should not be visible
    await switcherPage.expectSwitcherNotVisible()
  })
})
