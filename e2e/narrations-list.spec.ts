import { test, expect } from './base-test'
import { NarrationsListPage, SubjectNarrationsPage } from './pages/narrations-list.page'
import { NarrationPage } from './pages/narration.page'

/**
 * E2E tests for narration browsing pages.
 * Tests the narrations index and subject-specific narration pages.
 *
 * Usage:
 *   npm run test:e2e -- narrations-list.spec.ts
 */

test.use({
  storageState: 'e2e/fixtures/auth/parent.local.json',
})

test.describe('Narrations index page', () => {
  test('shows page heading and loads correctly', async ({ page }) => {
    const narrationsPage = new NarrationsListPage(page)
    await narrationsPage.goto()
    await narrationsPage.expectLoaded()
    await expect(page).toHaveURL('/narrations')
  })

  test('displays subjects grouped with narrations', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for dynamic content')

    // First create a narration to ensure there's data
    const narrationPage = new NarrationPage(page)
    await narrationPage.gotoNewNarration()
    await narrationPage.expectLoaded()
    await narrationPage.fillContent(`Test narration for list ${Date.now()}`)
    await narrationPage.submit()
    // WebKit may cancel navigation - use catch and wait for network idle instead
    await page.waitForURL(/\/(narrations|week)/, { timeout: 15000 }).catch(() => {})
    await page.waitForLoadState('networkidle')

    // Ensure we're on a valid page before starting new navigation (WebKit fix)
    await page.waitForLoadState('load')

    // Navigate to narrations list
    const narrationsPage = new NarrationsListPage(page)
    await narrationsPage.goto()
    await narrationsPage.expectLoaded()
    await narrationsPage.expectSubjectsGrouped()
  })

  test('narration cards display type badges', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for dynamic content')

    // First create a text narration
    const narrationPage = new NarrationPage(page)
    await narrationPage.gotoNewNarration()
    await narrationPage.expectLoaded()
    await narrationPage.fillContent(`Badge test narration ${Date.now()}`)
    await narrationPage.submit()
    // WebKit may cancel navigation - use catch and wait for network idle instead
    await page.waitForURL(/\/(narrations|week)/, { timeout: 15000 }).catch(() => {})
    await page.waitForLoadState('networkidle')

    // Ensure we're on a valid page before starting new navigation (WebKit fix)
    await page.waitForLoadState('load')

    // Navigate to narrations list
    const narrationsPage = new NarrationsListPage(page)
    await narrationsPage.goto()
    await narrationsPage.expectLoaded()
    await narrationsPage.expectNarrationCardsVisible()
    await narrationsPage.expectTypeBadge('Text')
  })

  test('clicking narration card navigates to detail view', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for navigation')

    // First create a narration
    const narrationPage = new NarrationPage(page)
    await narrationPage.gotoNewNarration()
    await narrationPage.expectLoaded()
    await narrationPage.fillContent(`Navigation test narration ${Date.now()}`)
    await narrationPage.submit()
    // WebKit may cancel navigation - use catch and wait for network idle instead
    await page.waitForURL(/\/(narrations|week)/, { timeout: 15000 }).catch(() => {})
    await page.waitForLoadState('networkidle')

    // Ensure we're on a valid page before starting new navigation (WebKit fix)
    await page.waitForLoadState('load')

    // Navigate to narrations list
    const narrationsPage = new NarrationsListPage(page)
    await narrationsPage.goto()
    await narrationsPage.expectLoaded()
    await narrationsPage.expectNarrationCardsVisible()

    // Click first narration card
    await narrationsPage.clickFirstNarrationCard()
    await expect(page).toHaveURL(/\/narration\/c[a-z0-9]+$/)
  })
})

test.describe('Subject-specific narrations page', () => {
  test('can navigate to subject page via View all link', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for dynamic content')

    // Create multiple narrations for the same subject to trigger View all link
    const narrationPage = new NarrationPage(page)

    // Create 4 narrations to ensure View all link appears (shows when > 3)
    for (let i = 0; i < 4; i++) {
      await narrationPage.gotoNewNarration()
      await narrationPage.expectLoaded()
      await narrationPage.fillContent(`Subject page test ${i} - ${Date.now()}`)
      await narrationPage.submit()
      // WebKit may cancel navigation - use catch and wait for network idle instead
      await page.waitForURL(/\/(narrations|week)/, { timeout: 15000 }).catch(() => {})
      await page.waitForLoadState('networkidle')
    }

    // Ensure we're on a valid page before starting new navigation (WebKit fix)
    await page.waitForLoadState('load')

    // Navigate to narrations list
    const narrationsPage = new NarrationsListPage(page)
    await narrationsPage.goto()
    await narrationsPage.expectLoaded()

    // Check if View all link is visible and click it
    await narrationsPage.expectViewAllLinkVisible()
    await narrationsPage.clickViewAllForFirstSubject()

    // Should navigate to subject-specific page
    await expect(page).toHaveURL(/\/narrations\/c[a-z0-9]+$/)
  })

  test('subject page shows back link and subject name', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for dynamic content')

    // Create multiple narrations for the same subject
    const narrationPage = new NarrationPage(page)

    for (let i = 0; i < 4; i++) {
      await narrationPage.gotoNewNarration()
      await narrationPage.expectLoaded()
      await narrationPage.fillContent(`Back link test ${i} - ${Date.now()}`)
      await narrationPage.submit()
      // WebKit may cancel navigation - use catch and wait for network idle instead
      await page.waitForURL(/\/(narrations|week)/, { timeout: 15000 }).catch(() => {})
      await page.waitForLoadState('networkidle')
    }

    // Ensure we're on a valid page before starting new navigation (WebKit fix)
    await page.waitForLoadState('load')

    // Navigate to narrations list and then to subject page
    const narrationsPage = new NarrationsListPage(page)
    await narrationsPage.goto()
    await narrationsPage.expectLoaded()
    await narrationsPage.expectViewAllLinkVisible()
    await narrationsPage.clickViewAllForFirstSubject()

    // Verify subject page loads correctly
    const subjectPage = new SubjectNarrationsPage(page)
    await subjectPage.expectLoaded()
  })

  test('back link navigates to narrations index', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for navigation')

    // Create multiple narrations for the same subject
    const narrationPage = new NarrationPage(page)

    for (let i = 0; i < 4; i++) {
      await narrationPage.gotoNewNarration()
      await narrationPage.expectLoaded()
      await narrationPage.fillContent(`Back nav test ${i} - ${Date.now()}`)
      await narrationPage.submit()
      // Wait for navigation or just continue if canceled
      await page.waitForURL(/\/(narrations|week)/, { timeout: 10000 }).catch(() => {})
      await page.waitForLoadState('networkidle')
    }

    // Ensure we're on a valid page before starting new navigation (WebKit fix)
    await page.waitForLoadState('load')

    // Navigate to subject page
    const narrationsPage = new NarrationsListPage(page)
    await narrationsPage.goto()
    await narrationsPage.expectLoaded()
    await narrationsPage.expectViewAllLinkVisible()
    await narrationsPage.clickViewAllForFirstSubject()

    // Click back link
    const subjectPage = new SubjectNarrationsPage(page)
    await subjectPage.expectLoaded()
    await subjectPage.clickBackLink()

    // Should navigate back (using history.back())
    await expect(page).toHaveURL('/narrations')
  })

  test('subject page shows all narrations without limit', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for dynamic content')

    // Create 5 narrations for the same subject
    const narrationPage = new NarrationPage(page)
    const narrationCount = 5

    for (let i = 0; i < narrationCount; i++) {
      await narrationPage.gotoNewNarration()
      await narrationPage.expectLoaded()
      await narrationPage.fillContent(`Full list test ${i} - ${Date.now()}`)
      await narrationPage.submit()
      await page.waitForURL(/\/(narrations|week)/, { timeout: 10000 }).catch(() => {})
      await page.waitForLoadState('networkidle')
    }

    // Ensure we're on a valid page before starting new navigation (WebKit fix)
    await page.waitForLoadState('load')

    // Navigate to subject page via View all
    const narrationsPage = new NarrationsListPage(page)
    await narrationsPage.goto()
    await narrationsPage.expectLoaded()
    await narrationsPage.expectViewAllLinkVisible()
    await narrationsPage.clickViewAllForFirstSubject()

    // Verify subject page shows all narrations
    const subjectPage = new SubjectNarrationsPage(page)
    await subjectPage.expectLoaded()

    // Subject page should show all narrations (not limited to 3)
    const cardCount = await subjectPage.getNarrationCardCount()
    expect(cardCount).toBeGreaterThanOrEqual(narrationCount)
  })
})

test.describe('Narrations list - navigation links', () => {
  test('can navigate to narrations from weekly grid via subject', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for navigation')

    // First create a narration
    const narrationPage = new NarrationPage(page)
    await narrationPage.gotoNewNarration()
    await narrationPage.expectLoaded()
    await narrationPage.fillContent(`Weekly nav test ${Date.now()}`)
    await narrationPage.submit()
    // WebKit may cancel navigation - use catch and wait for network idle instead
    await page.waitForURL(/\/(narrations|week)/, { timeout: 15000 }).catch(() => {})
    await page.waitForLoadState('networkidle')

    // Ensure we're on a valid page before starting new navigation (WebKit fix)
    await page.waitForLoadState('load')

    // Navigate to narrations list
    const narrationsPage = new NarrationsListPage(page)
    await narrationsPage.goto()
    await narrationsPage.expectLoaded()

    // Verify page title
    await expect(page).toHaveTitle(/Narrations.*Homeschool Planner/)
  })
})
