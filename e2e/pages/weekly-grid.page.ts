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
    const path = weekDate ? `/week/${weekDate}` : '/week'
    await this.page.goto(path)
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
    const prevHref = await this.prevWeekLink.getAttribute('href')
    await this.prevWeekLink.click()
    if (prevHref) {
      await this.page.waitForURL(new RegExp(prevHref.replace(/\//g, '\\/')))
    }
  }

  async navigateToToday() {
    await this.todayLink.click()
    await expect(this.todayLink).toBeHidden()
  }
}
