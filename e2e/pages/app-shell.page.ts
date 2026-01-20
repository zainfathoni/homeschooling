import type { Locator, Page } from '@playwright/test'

export class AppShellPage {
  readonly page: Page
  readonly navigation: Locator
  readonly weekLink: Locator
  readonly todayLink: Locator

  constructor(page: Page) {
    this.page = page
    this.navigation = page.getByRole('navigation').first()
    this.weekLink = page.getByRole('link', { name: /week/i })
    this.todayLink = page.getByRole('link', { name: 'Today' })
  }

  async navigateToWeek() {
    await this.weekLink.click()
  }

  async navigateToToday() {
    await this.todayLink.click()
  }
}
