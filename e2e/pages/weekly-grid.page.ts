import { expect, type Locator, type Page } from '@playwright/test'

export class WeeklyGridPage {
  readonly page: Page
  readonly heading: Locator
  readonly prevWeekLink: Locator
  readonly nextWeekLink: Locator
  readonly todayLink: Locator
  readonly weekOfText: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /Weekly Schedule/i })
    this.prevWeekLink = page.getByRole('link', { name: /Previous week/i })
    this.nextWeekLink = page.getByRole('link', { name: /Next week/i })
    this.todayLink = page.getByRole('link', { name: 'Today' })
    this.weekOfText = page.getByText(/Week of/i)
  }

  async goto(weekDate?: string) {
    // Use legacy route which redirects to nested /students/:studentId/week/:weekStart
    const path = weekDate ? `/week/${weekDate}` : '/week'
    await this.page.goto(path)
    // Wait for redirect to complete
    await this.page.waitForURL(/\/students\/[^/]+\/week\/\d{4}-\d{2}-\d{2}/)
    await this.page.waitForLoadState('networkidle')
  }

  async gotoWithStudentId(studentId: string, weekDate?: string) {
    const path = weekDate
      ? `/students/${studentId}/week/${weekDate}`
      : `/students/${studentId}/week`
    await this.page.goto(path)
    // If no weekDate, it redirects to current week
    if (!weekDate) {
      await this.page.waitForURL(/\/students\/[^/]+\/week\/\d{4}-\d{2}-\d{2}/)
    }
  }

  getStudentIdFromUrl(): string | null {
    const match = this.page.url().match(/\/students\/([^/]+)\//)
    return match ? match[1] : null
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible()
  }

  getVisibleSubject(name: string): Locator {
    return this.page.getByText(name).locator('visible=true').first()
  }

  getSubjectRow(subjectText: string): Locator {
    return this.page.locator('div').filter({ hasText: new RegExp(`^${subjectText}`) }).first()
  }

  getVisibleSubjectRow(emojiPattern: string): Locator {
    return this.page.locator('div').filter({ hasText: new RegExp(emojiPattern) }).locator('visible=true').first()
  }

  getPick1Button(optionName: string): Locator {
    return this.page.getByRole('button', { name: optionName })
  }

  getDesktopRow(subjectName: string): Locator {
    return this.page.locator('.hidden.md\\:flex').filter({ hasText: subjectName }).first()
  }

  getDayLabel(day: string): Locator {
    return this.page.getByText(day).locator('visible=true').first()
  }

  async navigateToPreviousWeek() {
    await this.prevWeekLink.click()
    // Wait for navigation to any nested student week route
    await this.page.waitForURL(/\/students\/[^/]+\/week\/\d{4}-\d{2}-\d{2}/)
    await this.page.waitForLoadState('networkidle')
  }

  async navigateToToday() {
    await this.todayLink.click()
    await expect(this.todayLink).toBeHidden()
  }
}
