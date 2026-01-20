import { expect, type Locator, type Page } from '@playwright/test'

export class NarrationsListPage {
  readonly page: Page
  readonly heading: Locator
  readonly subjectSections: Locator
  readonly narrationCards: Locator
  readonly emptyState: Locator
  readonly viewAllLinks: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /Narrations/i }).first()
    this.subjectSections = page.locator('section')
    this.narrationCards = page.locator('a[href^="/narration/c"]')
    this.emptyState = page.getByText(/No narrations yet/i)
    this.viewAllLinks = page.getByRole('link', { name: /View all →/i })
  }

  async goto() {
    await this.page.goto('/narrations')
    await this.page.waitForLoadState('networkidle')
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible()
  }

  async expectSubjectsGrouped() {
    // Check that there are subject sections with headings containing icons and names
    const sectionHeadings = this.page.locator('section h2')
    const count = await sectionHeadings.count()
    expect(count).toBeGreaterThan(0)
  }

  async expectNarrationCardsVisible() {
    const count = await this.narrationCards.count()
    expect(count).toBeGreaterThan(0)
  }

  async expectTypeBadge(type: 'Text' | 'Voice' | 'Photo') {
    // Type badges are displayed on narration cards
    await expect(this.page.locator('.bg-lavender').filter({ hasText: type }).first()).toBeVisible()
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible()
  }

  async clickFirstNarrationCard() {
    await this.narrationCards.first().click()
  }

  async getSubjectSectionCount(): Promise<number> {
    return await this.subjectSections.count()
  }

  async expectViewAllLinkVisible() {
    // View all link appears when subject has > 3 narrations
    await expect(this.viewAllLinks.first()).toBeVisible()
  }

  async clickViewAllForFirstSubject() {
    await this.viewAllLinks.first().click()
  }
}

export class SubjectNarrationsPage {
  readonly page: Page
  readonly heading: Locator
  readonly backLink: Locator
  readonly narrationCount: Locator
  readonly narrationCards: Locator

  constructor(page: Page) {
    this.page = page
    // Use the main content heading which has class text-2xl (not the AppShell header)
    this.heading = page.locator('h1.text-2xl')
    this.backLink = page.getByRole('link', { name: /← Back to all narrations/i })
    this.narrationCount = page.locator('p').filter({ hasText: /\d+ narrations?/i })
    this.narrationCards = page.locator('a[href^="/narration/c"]')
  }

  async goto(subjectId: string) {
    await this.page.goto(`/narrations/${subjectId}`)
    await this.page.waitForLoadState('networkidle')
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible()
    await expect(this.backLink).toBeVisible()
  }

  async expectSubjectName(name: string) {
    await expect(this.heading).toContainText(name)
  }

  async expectNarrationCount(count: number) {
    await expect(this.narrationCount).toContainText(`${count} narration`)
  }

  async clickBackLink() {
    await this.backLink.click()
  }

  async getNarrationCardCount(): Promise<number> {
    return await this.narrationCards.count()
  }
}
