import { expect, type Locator, type Page } from '@playwright/test'

export class StudentSwitcherPage {
  readonly page: Page
  readonly switcher: Locator
  readonly viewingAsLabel: Locator

  constructor(page: Page) {
    this.page = page
    this.switcher = page.getByLabel('Select student')
    this.viewingAsLabel = page.getByText('Viewing as')
  }

  async goto() {
    // Use legacy route which redirects to nested /students/:studentId/week/:weekStart
    await this.page.goto('/week')
    await this.page.waitForURL(/\/students\/[^/]+\/week\/\d{4}-\d{2}-\d{2}/)
    await this.page.waitForLoadState('networkidle')
  }

  getStudentIdFromUrl(): string | null {
    const match = this.page.url().match(/\/students\/([^/]+)\//)
    return match ? match[1] : null
  }

  async expectSwitcherVisible() {
    await expect(this.viewingAsLabel).toBeVisible()
    await expect(this.switcher).toBeVisible()
  }

  async expectSwitcherNotVisible() {
    await expect(this.switcher).not.toBeVisible()
  }

  async expectSingleStudentDisplay(studentName: string) {
    await expect(this.page.getByText(studentName)).toBeVisible()
    await expect(this.switcher).not.toBeVisible()
  }

  async getSelectedStudent(): Promise<string> {
    return await this.switcher.inputValue()
  }

  async getStudentOptions(): Promise<string[]> {
    const options = await this.switcher.locator('option').allTextContents()
    return options
  }

  async selectStudent(studentName: string) {
    // Student selection now uses nested routes - selecting navigates to /students/:newStudentId/...
    // The URL pattern is replaced while staying on the same page type (week, narrations, etc.)
    const currentUrl = this.page.url()
    await this.switcher.selectOption({ label: studentName })
    // Wait for URL to change (studentId in path will change)
    await expect(async () => {
      expect(this.page.url()).not.toBe(currentUrl)
    }).toPass({ timeout: 10000 })
    await this.page.waitForLoadState('networkidle')
  }

  async expectStudentSelected(studentName: string) {
    // Wait for the dropdown to have an option with the expected student name selected
    await expect(async () => {
      const selectedOption = await this.switcher.inputValue()
      const optionText = await this.switcher.locator(`option[value="${selectedOption}"]`).textContent()
      expect(optionText).toBe(studentName)
    }).toPass({ timeout: 5000 })
  }

  async expectHeadingContains(studentName: string) {
    // The UI shows "Viewing as" label with a dropdown that shows the student name
    // Verify the student is selected in the dropdown
    await this.expectStudentSelected(studentName)
  }
}
