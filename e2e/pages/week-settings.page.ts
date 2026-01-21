import { expect, type Locator, type Page } from '@playwright/test'
import { format, startOfWeek } from 'date-fns'

export class WeekSettingsPage {
  readonly page: Page
  readonly heading: Locator
  readonly backLink: Locator
  readonly schoolDaysSection: Locator
  readonly dayButtons: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /Week Settings/i })
    this.backLink = page.getByRole('link', { name: /Back to week view/i })
    this.schoolDaysSection = page.getByRole('heading', { name: /School Days/i })
    this.dayButtons = page.locator('button[aria-pressed]')
  }

  async goto(weekStart?: Date) {
    const weekDate = weekStart ?? startOfWeek(new Date(), { weekStartsOn: 1 })
    const weekParam = format(weekDate, 'yyyy-MM-dd')
    // First navigate to week to get studentId via redirect
    await this.page.goto('/week')
    await this.page.waitForURL(/\/students\/[^/]+\/week\/\d{4}-\d{2}-\d{2}/)
    const studentId = this.getStudentIdFromUrl()
    if (studentId) {
      await this.page.goto(`/students/${studentId}/week/${weekParam}/settings`)
    } else {
      await this.page.goto(`/week/${weekParam}/settings`)
    }
    await this.page.waitForLoadState('networkidle')
  }

  getStudentIdFromUrl(): string | null {
    const match = this.page.url().match(/\/students\/([^/]+)\//)
    return match ? match[1] : null
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible()
    await expect(this.schoolDaysSection).toBeVisible()
  }

  async expectForbidden() {
    // React Router renders 403 response as a heading
    await expect(this.page.getByRole('heading', { name: '403' })).toBeVisible()
  }

  getDayButton(dayName: string) {
    return this.page.getByRole('button', { name: new RegExp(dayName, 'i') })
  }

  async isDayEnabled(dayName: string): Promise<boolean> {
    const button = this.getDayButton(dayName)
    const pressed = await button.getAttribute('aria-pressed')
    return pressed === 'true'
  }

  async toggleDay(dayName: string) {
    const button = this.getDayButton(dayName)
    await button.click()
    await this.page.waitForTimeout(100)
  }

  async expectDayEnabled(dayName: string) {
    const button = this.getDayButton(dayName)
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await expect(button).toHaveClass(/bg-coral/)
  }

  async expectDayDisabled(dayName: string) {
    const button = this.getDayButton(dayName)
    await expect(button).toHaveAttribute('aria-pressed', 'false')
    await expect(button).toHaveClass(/bg-gray-100/)
  }

  async expectSchoolDayCount(count: number) {
    const countText = count === 1 ? '1 school day' : `${count} school days`
    await expect(this.page.getByText(new RegExp(countText))).toBeVisible()
  }

  async expectDefaultDays() {
    await this.expectDayEnabled('Mon')
    await this.expectDayEnabled('Tue')
    await this.expectDayEnabled('Wed')
    await this.expectDayEnabled('Thu')
    await this.expectDayEnabled('Fri')
    await this.expectDayDisabled('Sat')
    await this.expectDayDisabled('Sun')
  }
}
