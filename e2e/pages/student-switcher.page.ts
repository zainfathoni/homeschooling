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
    await this.switcher.selectOption({ label: studentName })
    // Wait for URL to update with new studentId in path
    await this.page.waitForURL(/\/students\/[^/]+\/week\/\d{4}-\d{2}-\d{2}/)
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

  async expectHeadingContains(text: string) {
    // The UI shows "Viewing: {studentName}" in a span, not in a heading
    await expect(this.page.getByText(new RegExp(`Viewing:\\s*${text}`, 'i'))).toBeVisible()
  }
}
